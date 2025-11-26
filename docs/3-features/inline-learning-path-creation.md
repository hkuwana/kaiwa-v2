# 🎓 Inline Learning Path Creation

> **Feature**: Intent-driven learning path creation with instant preview and refinement, integrated directly into the dashboard

---

## 🎯 Overview

Transform the dashboard from passive (viewing paths) to active (creating paths) with a Jony Ive-inspired design philosophy: **show intent, generate instantly, refine elegantly**.

### Key Principles

- **No "create" abstraction**: Users don't create "learning paths" - they state what they want to learn
- **Instant preview**: Generate syllabus + 3 sample scenarios in 8-12 seconds
- **Inline refinement**: Natural language adjustments without complex forms
- **Elegant forking**: Create custom versions of any path without losing progress

### Design Philosophy

```
User Intent → Instant Preview → Optional Refinement → Start Learning
     ↓              ↓                    ↓                  ↓
  "Learn      30-day journey     "Make it more      Day 1 begins
 Japanese"    with scenarios      casual"
```

---

## 📋 User Personas

### Persona 1: Simple User (80% of users)
- Types: "Learn Spanish for travel"
- Sees preview
- Clicks "Start Learning"
- Never needs editing

### Persona 2: Intermediate User (15%)
- Types: "Business Japanese"
- Reviews preview
- Adjusts: "Make week 1 more casual"
- Regenerates Day 3
- Starts learning

### Persona 3: Power User (5%)
- Creates structured path
- Gets to Day 10
- Forks to customize
- Reorders days 11-30
- Continues on custom path

### Persona 4: Admin (You)
- Still uses full admin interface
- Creates templates from scratch
- Manages all scenarios
- Publishes public templates

---

## 🏗️ Architecture

### Three-Layer System

```
┌─────────────────────────────────────────────────────┐
│ UI Layer (Dashboard)                                 │
│ ├── LearningIntentInput.svelte                      │
│ ├── PathPreview.svelte                              │
│ ├── ScenarioPreviewCard.svelte                      │
│ └── RefinementDialog.svelte                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Service Layer                                        │
│ ├── PreviewGeneratorService (NEW)                   │
│ │   ├── generatePreview()                           │
│ │   ├── refinePreview()                             │
│ │   └── commitPreview()                             │
│ ├── PathGeneratorService (EXISTING)                 │
│ └── QueueProcessorService (ENHANCED)                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Data Layer                                           │
│ ├── learning_path_previews (NEW)                    │
│ ├── learning_paths (EXISTING)                       │
│ ├── scenarios (EXISTING)                            │
│ └── scenario_generation_queue (EXISTING)            │
└─────────────────────────────────────────────────────┘
```

### Route Structure

```
src/routes/
├── dashboard/
│   ├── +page.svelte                # Enhanced with creation
│   └── +page.server.ts             # Load paths + previews
│
└── api/learning-paths/
    ├── generate-preview/
    │   └── +server.ts              # POST: Create preview
    ├── preview/
    │   └── [sessionId]/
    │       ├── commit/
    │       │   └── +server.ts      # POST: Save preview
    │       ├── refine/
    │       │   └── +server.ts      # POST: Adjust preview
    │       └── regenerate/
    │           └── +server.ts      # POST: Regenerate day
    └── [pathId]/
        └── fork/
            └── +server.ts          # POST: Fork active path
```

---

## 💾 Database Schema

### New Table: `learning_path_previews`

Temporary storage for previews (auto-delete after 24h)

```sql
CREATE TABLE learning_path_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id TEXT UNIQUE NOT NULL,          -- Short ID: "abc123"

  -- User intent
  intent TEXT NOT NULL,                     -- "Learn Japanese for business"

  -- Generated content (same as learning_paths)
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_language TEXT NOT NULL,
  source_language TEXT NOT NULL,
  schedule JSONB NOT NULL,                  -- 30-day schedule

  -- Preview scenarios (embedded, not saved yet)
  preview_scenarios JSONB NOT NULL,         -- { "1": {...}, "2": {...}, "3": {...} }

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,            -- created_at + 24h
  committed_path_id UUID,                   -- If saved
  status TEXT DEFAULT 'generating'          -- generating | ready | committed
);

-- Index for cleanup
CREATE INDEX idx_preview_expires ON learning_path_previews(expires_at);

-- Index for session lookup
CREATE INDEX idx_preview_session ON learning_path_previews(session_id);
```

**Why separate table?**
- Previews are temporary (24h TTL)
- Don't pollute main `learning_paths` with uncommitted drafts
- Users can generate multiple previews without saving
- Easy to clean up with cron job

---

## 🔄 User Flows

### Flow 1: Instant Creation (Simple User)

```
1. Dashboard → Input: "Learn Japanese for travel"
                ↓
2. System: Generates preview (8-12s)
   - Parse intent with LLM
   - Generate 30-day syllabus
   - Create first 3 scenarios
                ↓
3. User sees:
   ┌────────────────────────────────────┐
   │ Your 30-Day Japanese Journey        │
   │                                     │
   │ Week 1: First Conversations         │
   │ ✓ Day 1: Ordering coffee            │
   │   [Scenario preview card]           │
   │ ✓ Day 2: Introducing yourself       │
   │   [Scenario preview card]           │
   │ ✓ Day 3: Asking directions          │
   │   [Scenario preview card]           │
   │                                     │
   │ Week 2-4: [Collapsed summaries]     │
   │                                     │
   │ [Start Your First Lesson]           │
   └────────────────────────────────────┘
                ↓
4. Click "Start Your First Lesson"
                ↓
5. System commits preview:
   - Move to learning_paths table
   - Save scenarios
   - Create assignment
   - Background: Generate days 4-30
                ↓
6. Redirect to Day 1 conversation
```

**Time to start**: ~15 seconds

---

### Flow 2: Refined Creation (Intermediate User)

```
1. User types: "Learn Spanish for business"
                ↓
2. Preview generated (8-12s)
                ↓
3. User reviews → "Too formal for Day 1"
                ↓
4. User clicks "Adjust Journey"
                ↓
5. Dialog appears:
   ┌────────────────────────────────────┐
   │ Adjust Your Journey                 │
   │                                     │
   │ ┌──────────────────────────────┐   │
   │ │ Make week 1 more casual and  │   │
   │ │ conversational               │   │
   │ └──────────────────────────────┘   │
   │                                     │
   │ Quick suggestions:                  │
   │ • More casual and conversational    │
   │ • Slower pace for beginners         │
   │ • Focus on vocabulary building      │
   │                                     │
   │ [Refine Journey]                    │
   └────────────────────────────────────┘
                ↓
6. System refines (5s):
   - Send refinement prompt to LLM
   - Update week 1 syllabus
   - Regenerate affected scenarios
                ↓
7. Preview updates with changes highlighted:
   "Week 1 updated: More casual tone"
                ↓
8. User: "Perfect!" → Starts learning
```

**Time to start**: ~25 seconds

---

### Flow 3: Individual Day Regeneration

```
1. User reviewing preview
                ↓
2. Day 5: "Negotiating contracts" ← Too advanced!
                ↓
3. Click "↻ Regenerate this day"
                ↓
4. System generates new scenario (3s)
                ↓
5. New Day 5: "Casual business lunch"
                ↓
6. User: "Better!" → Continues reviewing
```

---

### Flow 4: Fork Active Path (Power User)

```
1. User on Day 10 of "Spanish for Travel"
                ↓
2. Realizes: "Need more restaurant scenarios"
                ↓
3. Clicks "Create Custom Version"
                ↓
4. System forks path:
   - Duplicate learning_path
   - Copy all scenarios
   - Create new assignment
   - Redirect to editor
                ↓
5. Editor shows:
   ┌────────────────────────────────────┐
   │ Spanish for Travel (Custom)         │
   │                                     │
   │ Days 1-10: Completed ✓ [Locked]     │
   │                                     │
   │ Days 11-30: Editable               │
   │ • Day 11: [Drag to reorder]        │
   │ • Day 12: [Remove] [Edit]          │
   │ • [Add Day]                        │
   └────────────────────────────────────┘
                ↓
6. User customizes days 11-30
                ↓
7. Continues on custom path
```

---

## 🎨 UI Components

### 1. LearningIntentInput.svelte

**Purpose**: The hero input that captures user intent

```svelte
<script lang="ts">
  export let value = '';
  export let loading = false;
  export let onSubmit: (intent: string) => void;

  const suggestions = [
    "Learn Spanish for travel",
    "Business Japanese for professionals",
    "French conversation practice",
    "Korean for K-drama fans",
  ];
</script>

<div class="intent-input-container">
  <input
    type="text"
    class="intent-input"
    placeholder="What would you like to learn?"
    bind:value
    on:keydown={(e) => e.key === 'Enter' && onSubmit(value)}
    disabled={loading}
  />

  {#if !value && !loading}
    <div class="suggestions">
      {#each suggestions as suggestion}
        <button
          class="suggestion-chip"
          on:click={() => {
            value = suggestion;
            onSubmit(suggestion);
          }}
        >
          {suggestion}
        </button>
      {/each}
    </div>
  {/if}

  {#if loading}
    <div class="loading-state">
      <div class="spinner" />
      <p>Creating your personalized journey...</p>
    </div>
  {/if}
</div>
```

---

### 2. PathPreview.svelte

**Purpose**: Display generated journey with refinement controls

```svelte
<script lang="ts">
  export let preview: PreviewSession;
  export let onStart: () => void;
  export let onBack: () => void;
  export let onRefine: (prompt: string) => void;
  export let onRegenerate: (dayNumber: number) => void;

  let showRefinement = false;
  let regeneratingDay: number | null = null;

  const weeklySchedule = groupByWeek(preview.schedule);
</script>

<div class="preview-container">
  <header class="preview-header">
    <button class="back-button" on:click={onBack}>← Start Over</button>
    <div class="preview-title">
      <h1>{preview.title}</h1>
      <p>{preview.description}</p>
    </div>
    <button class="adjust-button" on:click={() => showRefinement = true}>
      ✨ Adjust Journey
    </button>
  </header>

  <div class="preview-content">
    <!-- Week 1: Expanded with scenarios -->
    <WeekSection week={weeklySchedule[0]} expanded={true}>
      {#each weeklySchedule[0].days as day}
        <DayDetail
          {day}
          scenario={preview.scenarios[day.number]}
          isRegenerating={regeneratingDay === day.number}
          on:regenerate={() => {
            regeneratingDay = day.number;
            onRegenerate(day.number);
          }}
        />
      {/each}
    </WeekSection>

    <!-- Weeks 2-4: Collapsed summaries -->
    {#each weeklySchedule.slice(1) as week}
      <WeekSection {week} expanded={false} />
    {/each}
  </div>

  <footer class="preview-footer">
    <button class="btn-primary" on:click={onStart}>
      Start Your First Lesson
    </button>
  </footer>
</div>

{#if showRefinement}
  <RefinementDialog
    on:refine={(e) => onRefine(e.detail.prompt)}
    on:close={() => showRefinement = false}
  />
{/if}
```

---

### 3. ScenarioPreviewCard.svelte

**Purpose**: Preview individual scenario with regeneration option

```svelte
<script lang="ts">
  export let scenario: Scenario;
  export let dayNumber: number;
  export let isRegenerating = false;
  export let onRegenerate: () => void;
</script>

<div class="scenario-card">
  <div class="scenario-header">
    <h3>{scenario.title}</h3>
    <span class="difficulty-badge" data-level={scenario.difficulty}>
      {scenario.difficulty}
    </span>
  </div>

  <p class="scenario-description">{scenario.description}</p>

  <!-- Sample dialogue preview -->
  <div class="dialogue-preview">
    <div class="message ai">
      <span class="speaker">AI Tutor:</span>
      {scenario.sampleDialogue?.ai || "こんにちは！何か飲みますか？"}
    </div>
    <div class="message user-hint">
      <span class="hint-label">You'll practice:</span>
      {scenario.objectives?.slice(0, 2).join(', ')}
    </div>
  </div>

  <div class="scenario-objectives">
    <h4>Learning Objectives:</h4>
    <ul>
      {#each scenario.objectives || [] as objective}
        <li>{objective}</li>
      {/each}
    </ul>
  </div>

  <div class="scenario-actions">
    <button
      class="regenerate-btn"
      on:click={onRegenerate}
      disabled={isRegenerating}
    >
      {#if isRegenerating}
        <span class="spinner-small" />
        Regenerating...
      {:else}
        ↻ Try different scenario
      {/if}
    </button>
  </div>
</div>
```

---

### 4. RefinementDialog.svelte

**Purpose**: Natural language refinement interface

```svelte
<script lang="ts">
  export let onRefine: (prompt: string) => void;
  export let onClose: () => void;

  let refinementPrompt = '';
  let isRefining = false;

  const suggestions = [
    "Make it more conversational and casual",
    "Focus more on business vocabulary",
    "Slower pace, I'm a complete beginner",
    "Add more cultural context to scenarios",
    "More emphasis on listening comprehension",
  ];

  async function handleRefine() {
    if (!refinementPrompt.trim()) return;

    isRefining = true;
    await onRefine(refinementPrompt);
    isRefining = false;
    onClose();
  }
</script>

<div class="dialog-overlay" on:click={onClose}>
  <dialog open on:click|stopPropagation>
    <header>
      <h2>Adjust Your Journey</h2>
      <button class="close-btn" on:click={onClose}>×</button>
    </header>

    <div class="dialog-content">
      <label for="refinement">
        How would you like to adjust this learning path?
      </label>

      <textarea
        id="refinement"
        bind:value={refinementPrompt}
        placeholder="E.g., Make week 1 more casual and beginner-friendly"
        rows={4}
      />

      <div class="suggestions">
        <p class="suggestions-label">Quick suggestions:</p>
        {#each suggestions as suggestion}
          <button
            class="suggestion-chip"
            on:click={() => refinementPrompt = suggestion}
          >
            {suggestion}
          </button>
        {/each}
      </div>
    </div>

    <footer>
      <button class="btn-secondary" on:click={onClose}>
        Cancel
      </button>
      <button
        class="btn-primary"
        on:click={handleRefine}
        disabled={!refinementPrompt.trim() || isRefining}
      >
        {#if isRefining}
          <span class="spinner-small" />
          Refining...
        {:else}
          Refine Journey
        {/if}
      </button>
    </footer>
  </dialog>
</div>
```

---

## 🔧 Backend Services

### PreviewGeneratorService

**Location**: `src/lib/features/learning-path/services/PreviewGeneratorService.server.ts`

```typescript
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db';
import { learningPathPreviews } from '$lib/server/db/schema/learning-path-previews';
import type { PreviewSession, DayEntry, Scenario } from '$lib/types';

export class PreviewGeneratorService {
  /**
   * Generate instant preview from user intent
   * - Parse intent
   * - Generate 30-day syllabus
   * - Create first 3 scenarios synchronously
   * - Queue remaining 27 scenarios
   */
  async generatePreview(
    userId: string,
    intent: string,
    sourceLanguage?: string
  ): Promise<PreviewSession> {
    // 1. Parse intent using LLM
    const parsedIntent = await this.parseIntent(intent, sourceLanguage);

    // 2. Generate 30-day syllabus
    const syllabus = await this.generateSyllabus(parsedIntent);

    // 3. Generate first 3 scenarios in parallel (5-7s)
    const [scenario1, scenario2, scenario3] = await Promise.all([
      this.generateScenarioFast(syllabus.schedule[0], parsedIntent),
      this.generateScenarioFast(syllabus.schedule[1], parsedIntent),
      this.generateScenarioFast(syllabus.schedule[2], parsedIntent),
    ]);

    // 4. Create preview session
    const sessionId = nanoid(10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const [preview] = await db.insert(learningPathPreviews).values({
      userId,
      sessionId,
      intent,
      title: syllabus.title,
      description: syllabus.description,
      targetLanguage: parsedIntent.targetLanguage,
      sourceLanguage: parsedIntent.sourceLanguage,
      schedule: syllabus.schedule,
      previewScenarios: {
        1: scenario1,
        2: scenario2,
        3: scenario3,
      },
      status: 'ready',
      expiresAt,
    }).returning();

    // 5. Queue remaining scenarios (background)
    await this.queueRemainingScenarios(
      sessionId,
      syllabus.schedule.slice(3),
      parsedIntent
    );

    return preview;
  }

  /**
   * Parse natural language intent
   */
  private async parseIntent(intent: string, sourceLanguage?: string) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Parse the user's learning intent and extract:
            - target language
            - source language (or detect from context)
            - learning goal (travel, business, conversation, etc.)
            - proficiency level (beginner, intermediate, advanced)
            - any specific preferences`,
        },
        {
          role: 'user',
          content: intent,
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Generate 30-day syllabus
   */
  private async generateSyllabus(parsedIntent: ParsedIntent) {
    // Use existing PromptEngineeringService logic
    // Returns: { title, description, schedule: DayEntry[] }
  }

  /**
   * Generate single scenario quickly (gpt-4o-mini)
   */
  private async generateScenarioFast(
    day: DayEntry,
    context: ParsedIntent
  ): Promise<Scenario> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Create a conversation scenario for language learning...`,
        },
        {
          role: 'user',
          content: JSON.stringify({ day, context }),
        },
      ],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Refine preview based on user feedback
   */
  async refinePreview(
    sessionId: string,
    refinementPrompt: string,
    scope: 'full' | 'week' | 'day' = 'full',
    target?: number
  ): Promise<PreviewSession> {
    // 1. Load existing preview
    const [preview] = await db
      .select()
      .from(learningPathPreviews)
      .where(eq(learningPathPreviews.sessionId, sessionId));

    // 2. Regenerate with refinement context
    const updated = await this.regenerateWithRefinement(
      preview,
      refinementPrompt,
      scope,
      target
    );

    // 3. Update preview
    await db
      .update(learningPathPreviews)
      .set({
        schedule: updated.schedule,
        previewScenarios: updated.scenarios,
      })
      .where(eq(learningPathPreviews.sessionId, sessionId));

    return updated;
  }

  /**
   * Commit preview to real learning path
   */
  async commitPreview(sessionId: string): Promise<string> {
    const [preview] = await db
      .select()
      .from(learningPathPreviews)
      .where(eq(learningPathPreviews.sessionId, sessionId));

    // 1. Create learning_path
    const [path] = await db.insert(learningPaths).values({
      userId: preview.userId,
      title: preview.title,
      description: preview.description,
      targetLanguage: preview.targetLanguage,
      sourceLanguage: preview.sourceLanguage,
      schedule: preview.schedule,
      status: 'active',
      isTemplate: false,
      isPublic: false,
    }).returning();

    // 2. Save preview scenarios to scenarios table
    const scenarioIds = await this.saveScenarios(preview.previewScenarios);

    // 3. Update schedule with scenario IDs
    await this.linkScenariosToSchedule(path.id, scenarioIds);

    // 4. Create assignment
    await db.insert(learningPathAssignments).values({
      userId: preview.userId,
      learningPathId: path.id,
      currentDay: 1,
      status: 'active',
    });

    // 5. Mark preview as committed
    await db
      .update(learningPathPreviews)
      .set({
        committedPathId: path.id,
        status: 'committed',
      })
      .where(eq(learningPathPreviews.sessionId, sessionId));

    return path.id;
  }
}
```

---

## 📡 API Endpoints

### POST `/api/learning-paths/generate-preview`

**Purpose**: Generate instant preview from user intent

**Request**:
```typescript
{
  intent: string;           // "Learn Japanese for business"
  sourceLanguage?: string;  // Optional, auto-detect if not provided
}
```

**Response**:
```typescript
{
  sessionId: string;        // "abc123"
  preview: {
    title: string;
    description: string;
    targetLanguage: string;
    sourceLanguage: string;
    schedule: DayEntry[];   // 30 days
    scenarios: {
      1: Scenario,
      2: Scenario,
      3: Scenario,
    };
  };
  status: 'ready';
}
```

**Performance**: 8-12 seconds

---

### POST `/api/learning-paths/preview/{sessionId}/refine`

**Purpose**: Refine preview with natural language feedback

**Request**:
```typescript
{
  refinementPrompt: string;  // "Make week 1 more casual"
  scope: 'full' | 'week' | 'day';
  target?: number;           // Week or day number if scoped
}
```

**Response**:
```typescript
{
  updatedSchedule: DayEntry[];
  updatedScenarios: { [day: string]: Scenario };
  changesPreview: {
    modified: number[];      // [1, 2, 3, 4, 5, 6, 7]
    summary: string;         // "Made week 1 more casual and conversational"
  };
}
```

**Performance**: 5-8 seconds

---

### POST `/api/learning-paths/preview/{sessionId}/regenerate`

**Purpose**: Regenerate single day's scenario

**Request**:
```typescript
{
  dayNumber: number;
  feedback?: string;  // Optional: "Make it more casual"
}
```

**Response**:
```typescript
{
  dayNumber: number;
  scenario: Scenario;
}
```

**Performance**: 3-5 seconds

---

### POST `/api/learning-paths/preview/{sessionId}/commit`

**Purpose**: Save preview as real learning path

**Request**:
```typescript
{
  sessionId: string;
}
```

**Response**:
```typescript
{
  pathId: string;
  assignmentId: string;
  redirectUrl: string;  // "/dashboard" or first scenario
}
```

**Performance**: < 1 second

---

### POST `/api/learning-paths/{pathId}/fork`

**Purpose**: Create editable copy of active path

**Request**:
```typescript
{
  pathId: string;
  forkName?: string;  // Optional custom name
}
```

**Response**:
```typescript
{
  forkedPathId: string;
  redirectUrl: string;  // Editor for forked path
}
```

---

## 📊 Success Metrics

### Speed Metrics

- **Preview generation**: < 15 seconds (target: 8-12s)
- **Refinement**: < 8 seconds (target: 5-7s)
- **Day regeneration**: < 5 seconds (target: 3s)
- **Commit**: < 1 second

### Engagement Metrics

- **Preview → Commit conversion**: Target 60%+
- **Refinement usage**: Target 20-30%
- **Day regeneration**: Target 10-15%
- **Fork usage**: Target 5%

### Quality Metrics

- **Scenarios regenerated**: < 20% (lower is better)
- **Preview abandonment**: < 40%
- **User satisfaction**: Track via feedback

---

## 🚀 Implementation Plan

### Phase 1: Backend Foundation (Days 1-2)

**Database**:
- [ ] Create `learning_path_previews` schema
- [ ] Add migration
- [ ] Add indexes

**Services**:
- [ ] Create `PreviewGeneratorService`
- [ ] Implement `generatePreview()`
- [ ] Implement `refinePreview()`
- [ ] Implement `commitPreview()`
- [ ] Implement `generateScenarioFast()`

**API Routes**:
- [ ] POST `/api/learning-paths/generate-preview`
- [ ] POST `/api/learning-paths/preview/[sessionId]/commit`
- [ ] POST `/api/learning-paths/preview/[sessionId]/refine`
- [ ] POST `/api/learning-paths/preview/[sessionId]/regenerate`

**Testing**:
- [ ] Test preview generation end-to-end
- [ ] Test refinement
- [ ] Test commit flow
- [ ] Verify performance targets

---

### Phase 2: Frontend Components (Days 2-3)

**Components**:
- [ ] Create `LearningIntentInput.svelte`
- [ ] Create `PathPreview.svelte`
- [ ] Create `ScenarioPreviewCard.svelte`
- [ ] Create `WeekSection.svelte`
- [ ] Create `DayDetail.svelte`
- [ ] Create `RefinementDialog.svelte`

**Styling**:
- [ ] Design input component
- [ ] Design preview layout
- [ ] Design scenario cards
- [ ] Add animations and transitions
- [ ] Mobile responsive design

**Testing**:
- [ ] Component unit tests
- [ ] Visual regression tests
- [ ] Accessibility testing

---

### Phase 3: Dashboard Integration (Days 3-4)

**Dashboard Updates**:
- [ ] Update `dashboard/+page.svelte` with creation flow
- [ ] Add state management for preview
- [ ] Integrate with API endpoints
- [ ] Add error handling
- [ ] Add loading states

**User Flow**:
- [ ] Test complete creation flow
- [ ] Test refinement flow
- [ ] Test regeneration flow
- [ ] Test commit flow
- [ ] Polish transitions

---

### Phase 4: Fork & Edit (Days 4-5)

**Backend**:
- [ ] Implement fork endpoint
- [ ] Create path duplication logic
- [ ] Preserve progress (lock completed days)

**Frontend**:
- [ ] Add "Create Custom Version" button to paths
- [ ] Create admin-lite editor for custom paths
- [ ] Implement day reordering
- [ ] Add/remove days functionality

---

### Phase 5: Polish & Launch (Day 6)

**Optimization**:
- [ ] Optimize LLM prompts for speed
- [ ] Add optimistic UI updates
- [ ] Implement retry logic
- [ ] Add rate limiting

**Cleanup**:
- [ ] Add preview cleanup cron job (delete expired)
- [ ] Add monitoring and logging
- [ ] Add analytics events
- [ ] Update documentation

**Launch**:
- [ ] Create demo video
- [ ] Write announcement
- [ ] Deploy to production
- [ ] Monitor metrics

---

## 🐛 Common Issues & Solutions

### Issue: Preview generation too slow

**Solution**:
- Use `gpt-4o-mini` instead of `gpt-4o` for speed
- Generate only 3 scenarios upfront, not all 30
- Optimize prompt size
- Consider caching common intents

### Issue: Refinement doesn't capture intent

**Solution**:
- Improve refinement prompt engineering
- Show examples of good refinements
- Allow multiple refinement iterations
- Provide quick-action buttons

### Issue: Users confused by preview vs real path

**Solution**:
- Clear visual distinction
- "Start Learning" makes it clear it's not started yet
- Show "Preview" label prominently
- Add tooltip/help text

### Issue: Preview abandonment high

**Solution**:
- Improve scenario quality
- Better intent parsing
- Faster generation (reduce wait time)
- Better preview UI

---

## 🔗 Related Documentation

- [Learning Path Templates](./learning-path-templates.md) - Original learning path system
- [Architecture](../1-core/architecture.md) - System architecture
- [Database Schema](../1-core/database-schema.md) - Database design
- [API Reference](../2-guides/api-reference.md) - API documentation

---

## 📝 Notes

### Design Decisions

**Why inline instead of separate page?**
- Keeps users in familiar context (dashboard)
- Reduces navigation friction
- Feels more immediate and magical
- Better for mobile (no page transitions)

**Why 3 scenarios instead of all 30?**
- 3 is enough to evaluate quality
- Generates in ~7s instead of ~90s
- Background generation is invisible
- Users want to start quickly, not review 30 days

**Why natural language refinement?**
- More intuitive than form fields
- Captures nuanced feedback
- Feels conversational
- Reduces decision paralysis

**Why fork instead of in-place editing?**
- Preserves original as reference
- No risk of losing work
- Can create multiple variations
- Simpler mental model

---

## ✅ Acceptance Criteria

### Must Have
- [ ] Preview generates in < 15 seconds
- [ ] Shows 3 complete scenario previews
- [ ] Natural language refinement works
- [ ] Individual day regeneration works
- [ ] Commit creates real path + assignment
- [ ] Mobile responsive
- [ ] Error handling

### Should Have
- [ ] Week-level refinement
- [ ] Fork functionality
- [ ] Admin interface preserved
- [ ] Analytics tracking
- [ ] Preview cleanup cron

### Nice to Have
- [ ] Multiple preview sessions saved
- [ ] Compare different previews
- [ ] Share preview URL
- [ ] Export preview as PDF

---

**Last Updated**: 2025-11-26
**Status**: 🎯 Ready for Implementation
**Owner**: Kaiwa Team
