# Conversational Improvements Architecture

**Date**: November 19, 2025
**Goal**: Fix AI verbosity, add personalized scenarios, prevent scenario drift

---

## Problem Statement

### 1. AI Responses Too Long (Critical Issue #2)
- Users report agent talks too long (3+ sentences when 1 is enough)
- Feels like interview, not conversation
- Affects: Timothy, Martin, Thomas Clarke, Mark, Justin Kim

### 2. AI Persona Lost in Compact Mode
- Compact mode reduces prompt length but loses personality nuance
- Missing: regional dialect emphasis, casual tone examples, relationship building

### 3. Scenario Drift (Critical Issue #4)
- AI asks generic questions instead of staying in scenario context
- Affects: Martin, Timothy, Mark
- Example: User practices "ordering food" but AI asks "what's your favorite book?"

### 4. No Personalized Scenarios
- Generic scenarios don't match user's ACTUAL high-stakes conversation
- ICP analysis shows users need specific, personal practice (Sofia meeting Yuto's parents)

---

## Solution Architecture

### Phase 1: Enhanced Compact Mode (Preserves Personality)

**Current Problem**: `buildCompactPersonalityTone()` is too brief and loses examples

**Fix**: Create hybrid mode that's concise BUT preserves:
- Casual conversation examples (GOOD vs BAD)
- Regional personality
- Natural speech patterns
- Tier system with concrete examples

**Implementation**:
```typescript
// New mode: 'conversational' (between compact and full)
// - Drops verbose sections (safety, pronunciations)
// - KEEPS personality examples and tier system
// - Total: ~800 words (vs 1600 full, 500 compact)

interface InstructionComposerOptions {
  mode?: 'full' | 'conversational' | 'compact';
}
```

**Files to modify**:
- `src/lib/services/instructions/composer.ts` - Add conversational mode
- `src/lib/services/instructions.service.ts` - Use conversational mode by default

---

### Phase 2: Personalized Scenario Generation

**User Flow**:
```
1. Onboarding: "Who do you most want to talk to in Japanese?"
   → User: "My boyfriend's parents in Tokyo"

2. Follow-up: "When are you meeting them?"
   → User: "In 3 weeks"

3. AI generates custom scenario:
   {
     title: "Meeting Yuto's Parents - First Dinner",
     context: "You're at Yuto's family home in Setagaya. His mother serves tea...",
     learningObjectives: [
       "Introduce yourself politely",
       "Express gratitude for the invitation",
       "Talk about your relationship with Yuto"
     ],
     personalizedPhrases: [
       "Yutoと2年間付き合っています (I've been dating Yuto for 2 years)",
       "ご家族にお会いできて嬉しいです (I'm happy to meet your family)"
     ]
   }
```

**Architecture**:

#### A. Database Schema
```sql
-- Store user's high-stakes conversation goal
ALTER TABLE user_preferences ADD COLUMN conversation_goal TEXT;
ALTER TABLE user_preferences ADD COLUMN conversation_timeline TEXT; -- "3 weeks", "next month"
ALTER TABLE user_preferences ADD COLUMN conversation_participants TEXT; -- "boyfriend's parents"

-- Store generated personalized scenarios
CREATE TABLE user_personalized_scenarios (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  scenario_id TEXT, -- links to scenarios table if we save it there
  title TEXT NOT NULL,
  context TEXT NOT NULL,
  learning_objectives JSONB,
  personalized_phrases JSONB,
  generated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

#### B. Scenario Generation Service
```typescript
// src/lib/server/services/personalized-scenario-generator.service.ts

interface PersonalizedScenarioRequest {
  userId: string;
  language: string;
  goal: string; // "meeting boyfriend's parents"
  timeline: string; // "3 weeks"
  participants: string; // "Yuto's parents in Tokyo"
  userContext: {
    relationshipDuration?: string;
    occupation?: string;
    interests?: string[];
  };
}

interface GeneratedScenario {
  title: string;
  context: string;
  learningObjectives: string[];
  personalizedPhrases: { japanese: string; english: string }[];
  suggestedPracticeFrequency: string;
  estimatedSessions: number;
}

class PersonalizedScenarioGenerator {
  async generateScenario(request: PersonalizedScenarioRequest): Promise<GeneratedScenario>
  async saveToDatabase(scenario: GeneratedScenario, userId: string): Promise<string>
  async getUserPersonalizedScenarios(userId: string): Promise<GeneratedScenario[]>
}
```

#### C. OpenAI Scenario Generation Prompt
```
You are a language learning scenario designer.

Create a personalized practice scenario for:
- Language: Japanese
- User goal: "Meet my boyfriend Yuto's parents for the first time"
- Timeline: "In 3 weeks"
- User context: Dating for 2 years, works as product designer, lives in New York

Generate a realistic scenario that:
1. Matches the high-stakes moment they're preparing for
2. Includes culturally appropriate context (Japanese family dinner customs)
3. Provides 5-7 learning objectives (specific phrases/patterns to master)
4. Includes 8-10 personalized phrases they'll actually need

Format as JSON:
{
  "title": "...",
  "context": "...",
  "learningObjectives": [...],
  "personalizedPhrases": [
    {"japanese": "...", "english": "...", "usage": "when..."}
  ]
}
```

#### D. UI Integration Points
1. **Onboarding** (`/src/routes/(authenticated)/onboarding/+page.svelte`)
   - Add step: "What's your high-stakes conversation?"
   - Capture: goal, timeline, participants

2. **Scenario List** (`/src/routes/(authenticated)/scenarios/+page.svelte`)
   - New section at top: "Your Personalized Scenario"
   - Card with user's goal, countdown ("18 days until you meet Yuto's parents!")

3. **Dashboard** (`/src/routes/(authenticated)/dashboard/+page.svelte`)
   - Suggested practice: "Ready to practice meeting Yuto's parents? (5 sessions recommended)"

---

### Phase 3: Scenario Drift Prevention

**Problem**: AI doesn't stay in scenario context, asks unrelated questions

**Solution**: Multi-layer enforcement

#### Layer 1: System Prompt Enhancement
```typescript
// Add to EVERY scenario in buildCompactFlow()
## SCENARIO LOCK (CRITICAL - HIGHEST PRIORITY)
You MUST stay within "${scenarioTitle}" context for EVERY response.

Scenario setting: "${scenarioContext}"

BEFORE every response, ask yourself:
- "Does this question relate to ${scenarioTitle}?"
- "Am I staying in the scenario setting?"

If the answer is NO, DO NOT say it. Redirect back to scenario.

Examples for "${scenarioTitle}":
✅ GOOD (stays in scenario):
  ${generateScenarioSpecificExamples(scenario)}

❌ BAD (drifts off-topic):
  - "What's your favorite book?" [WRONG - not related to scenario]
  - "Do you like movies?" [WRONG - generic question]
  - "Tell me about your job" [WRONG - unless scenario is about work]
```

#### Layer 2: Runtime Validation (Server-side)
```typescript
// src/lib/services/scenario-context-validator.service.ts

interface ValidationResult {
  isValid: boolean;
  driftDetected: boolean;
  suggestion?: string;
}

class ScenarioContextValidator {
  /**
   * Validate AI response stays in scenario context
   * Uses lightweight LLM call to check relevance
   */
  async validateResponse(
    aiResponse: string,
    scenarioContext: string,
    scenarioTitle: string
  ): Promise<ValidationResult> {
    // Quick OpenAI call with gpt-4o-mini
    const prompt = `
    Scenario: "${scenarioTitle}"
    Context: "${scenarioContext}"

    AI said: "${aiResponse}"

    Does this response stay within the scenario context?
    Answer: YES or NO (with reason)
    `;

    // If NO, inject correction
  }
}
```

#### Layer 3: Client-side Guardrails
```typescript
// src/lib/stores/conversation.store.svelte.ts

// After AI responds, check if response is scenario-relevant
if (scenario && aiMessage) {
  const validation = await validateScenarioRelevance(aiMessage, scenario);

  if (validation.driftDetected) {
    // Log drift event
    logger.warn('Scenario drift detected', { scenario: scenario.title, message: aiMessage });

    // Inject correction instruction to AI
    await injectCorrectionPrompt(
      `You drifted off-topic. Stay focused on "${scenario.title}". ${validation.suggestion}`
    );
  }
}
```

#### Layer 4: Scenario Adherence Scoring
Track how well AI stays in context:
```typescript
interface ScenarioSession {
  scenarioId: string;
  totalTurns: number;
  onTopicTurns: number;
  adherenceScore: number; // 0-100
  driftEvents: Array<{
    turn: number;
    message: string;
    corrected: boolean;
  }>;
}

// Store in conversation metadata
// Show to user: "Lily stayed focused 95% of the time"
```

---

## Implementation Plan

### Week 1: Core Improvements (Nov 19-22)

**Day 1: Enhanced Conversational Mode**
- [ ] Create `buildConversationalMode()` in composer.ts
- [ ] Preserve personality examples from full mode
- [ ] Preserve TIER system with examples
- [ ] Keep casual vs formal conversation examples
- [ ] Total length target: 700-900 words
- [ ] Test with 5 different scenarios

**Day 2: Scenario Drift Prevention - System Prompt**
- [ ] Add SCENARIO LOCK section to all scenario types
- [ ] Generate scenario-specific GOOD/BAD examples
- [ ] Add self-check questions before each response
- [ ] Test drift detection with off-topic questions

**Day 3: Scenario Drift Prevention - Validation Layer**
- [ ] Create `scenario-context-validator.service.ts`
- [ ] Implement lightweight validation using gpt-4o-mini
- [ ] Add drift detection logging
- [ ] Test validation accuracy (should catch 80%+ drift)

### Week 2: Personalized Scenarios (Nov 25-29)

**Day 4: Database & Schema**
- [ ] Create migration for user_personalized_scenarios table
- [ ] Add conversation_goal fields to user_preferences
- [ ] Test schema with sample data

**Day 5: Scenario Generation Service**
- [ ] Create `personalized-scenario-generator.service.ts`
- [ ] Implement OpenAI-based generation
- [ ] Add ICP-specific templates (Sofia, David, Jamie patterns)
- [ ] Test generation quality with 10 sample user goals

**Day 6: Onboarding Integration**
- [ ] Add onboarding step: "What's your high-stakes conversation?"
- [ ] Capture timeline, participants, context
- [ ] Trigger scenario generation on completion
- [ ] Store in user_preferences

**Day 7: UI Integration**
- [ ] Add "Your Personalized Scenario" to scenarios page
- [ ] Add countdown/timeline display
- [ ] Add practice frequency suggestion
- [ ] Test full user flow from onboarding → practice

**Day 8: Testing & Validation**
- [ ] Test with Product Advisory Board
- [ ] Measure response length (target: 60% reduction)
- [ ] Measure scenario adherence (target: 90%+)
- [ ] Measure personalized scenario usage (target: 70%+ engagement)

---

## Success Metrics

### Response Length
- **Before**: Average 25-40 words per response
- **Target**: Average 8-15 words per response (60% reduction)
- **Measurement**: Track token count per AI turn

### Scenario Adherence
- **Before**: ~50% of conversations drift off-topic
- **Target**: 90%+ responses stay in scenario context
- **Measurement**: Validation service drift detection rate

### Personalized Scenario Engagement
- **Target**: 70%+ of new users complete personalized scenario setup
- **Target**: 50%+ of users practice their personalized scenario first
- **Measurement**: Track scenario_id used in first 3 conversations

### Paid Conversion Impact
- **Current**: 1% paid conversion
- **Target**: 3-5% paid conversion (if personalized scenarios create "aha moment")
- **Hypothesis**: Users convert when they see progress on THEIR specific goal

---

## Technical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ONBOARDING                          │
│  "Who do you want to talk to?" → Goal + Timeline + Participants │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              PERSONALIZED SCENARIO GENERATOR                     │
│  - Uses OpenAI GPT-4 to create custom scenario                  │
│  - ICP-aware templates (Sofia/David/Jamie patterns)             │
│  - Stores in user_personalized_scenarios table                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONVERSATION SESSION                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ENHANCED CONVERSATIONAL MODE (System Prompt)              │  │
│  │ - Concise but personality-rich (~800 words)               │  │
│  │ - SCENARIO LOCK with specific examples                    │  │
│  │ - Tier system with brevity enforcement                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ AI RESPONSE                                               │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ SCENARIO DRIFT VALIDATOR                                  │  │
│  │ - Checks response relevance to scenario                   │  │
│  │ - Logs drift events                                       │  │
│  │ - Injects correction if needed                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

### New Files
1. `src/lib/server/services/personalized-scenario-generator.service.ts`
2. `src/lib/server/services/scenario-context-validator.service.ts`
3. `src/lib/server/db/migrations/XXXX_add_personalized_scenarios.sql`
4. `src/routes/api/scenarios/generate-personalized/+server.ts`
5. `docs/3-features/conversational-improvements-architecture.md` (this file)

### Modified Files
1. `src/lib/services/instructions/composer.ts`
   - Add `buildConversationalMode()`
   - Enhance `buildCompactFlow()` with SCENARIO LOCK

2. `src/lib/services/instructions.service.ts`
   - Change default from `compact: false` to `mode: 'conversational'`

3. `src/lib/server/db/schema/user-preferences.ts`
   - Add conversation_goal, conversation_timeline fields

4. `src/routes/(authenticated)/onboarding/+page.svelte`
   - Add personalized scenario capture step

5. `src/routes/(authenticated)/scenarios/+page.svelte`
   - Add "Your Personalized Scenario" section at top

6. `src/lib/stores/conversation.store.svelte.ts`
   - Add drift detection after AI response

---

## Open Questions & Decisions Needed

1. **Scenario Generation Trigger**:
   - Generate during onboarding? ✅ (immediate value)
   - Generate on-demand when user clicks "Create Custom"? (future feature)
   - Both? (start with onboarding)

2. **Drift Validation Performance**:
   - Validate every response? (adds latency)
   - Sample validation (every 3rd response)? (saves cost)
   - **Decision**: Sample validation initially, full validation if drift rate > 20%

3. **Compact vs Conversational Mode**:
   - Keep both modes? (user can choose)
   - Replace compact with conversational? ✅ (simpler, better default)
   - **Decision**: Make conversational the default, keep compact for advanced users

4. **Personalized Scenario Limits**:
   - Free tier: 1 personalized scenario
   - Paid tier: Unlimited personalized scenarios
   - **Aligns with paid conversion goal** ✅

---

## Next Steps

1. ✅ Review this architecture document
2. [ ] Get approval to proceed
3. [ ] Start Day 1: Enhanced Conversational Mode
4. [ ] Ship to staging for testing
5. [ ] Test with Product Advisory Board
6. [ ] Iterate based on feedback
7. [ ] Ship to production

---

**Questions? Feedback?**
This is the blueprint. Ready to build! 🚀
