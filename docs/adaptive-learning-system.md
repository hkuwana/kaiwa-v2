# Adaptive Learning System - Implementation Guide

> **Status**: Schema complete, services pending
> **Last Updated**: 2025-11-30
> **Branch**: `claude/simplify-learning-path-01Y83GQiFTHLqN4cQCmkeNy6`

## Overview

This document describes the adaptive learning path system that replaces the rigid 28-day schedule with flexible weekly themes. The goal is to make language learning feel like **5-10 minute conversations**, not a march through days.

### Design Philosophy

**Johnny Ive would say:** Remove everything until only the essential remains.

**A great teacher would say:** Meet the student where they are. Let the conversation guide the curriculum.

```
┌─────────────────────────────────────────────────────────────┐
│  OLD: "Day 5 of 28: Present vs past tense"                  │
│                                                             │
│  NEW: "Week 1: My Day"                                      │
│       Pick a session: ☕ Quick Check-in (5 min)             │
│       3 conversations this week ✓                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Database Schema (Completed ✅)

```
learning_paths (updated)
    └── mode: 'adaptive' (we're all-in on adaptive)
    └── durationWeeks: 4

adaptive_weeks
    └── weekNumber: 1-4
    └── theme: "My Day"
    └── conversationSeeds: [...pool of conversation ideas]
    └── focusAreas: [...from analysis]
    └── leverageAreas: [...strengths to build on]

session_types
    └── id: 'quick-checkin' | 'story-moment' | etc.
    └── durationMinutesMin/Max: 3-5, 5-8, etc.
    └── promptHints: {tone, structure, userRole, aiRole}

week_progress
    └── sessionsCompleted: number
    └── totalMinutes: decimal
    └── sessions: SessionRecord[]
    └── topicsThatSparkedJoy: string[]
    └── topicsThatWereChallenging: string[]

weekly_analysis
    └── strengths: IdentifiedStrength[]
    └── challenges: IdentifiedChallenge[]
    └── recommendations: NextWeekRecommendation[]
    └── generatedSeeds: GeneratedSeed[]
```

### The Adaptive Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. USER ENROLLS IN PATH                                    │
│     └── Create assignment                                   │
│     └── Generate Week 1 (Anchor Week) with default seeds    │
│     └── Create empty week_progress record                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. USER PRACTICES (repeat throughout week)                 │
│     └── User picks session type (☕📖❓🎭🔄🌊)              │
│     └── Optionally picks conversation seed                  │
│     └── Has conversation (5-10 min)                         │
│     └── Update week_progress                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. WEEK ENDS (7 days or user advances)                     │
│     └── Create weekly_analysis record (status: pending)     │
│     └── Queue analysis job                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  4. AI ANALYZES WEEK                                        │
│     └── Review all conversations from week_progress         │
│     └── Identify strengths and challenges                   │
│     └── Notice topic affinities                             │
│     └── Generate recommendations                            │
│     └── Generate conversation seeds for next week           │
│     └── Update weekly_analysis (status: completed)          │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  5. GENERATE NEXT WEEK                                      │
│     └── Create new adaptive_week with generated seeds       │
│     └── Apply focus areas from analysis                     │
│     └── Set week status to 'active'                         │
│     └── Update assignment.currentWeekNumber                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    (Repeat steps 2-5)
```

---

## Services to Implement

### 1. AdaptivePathService

**File**: `src/lib/features/learning-path/services/AdaptivePathService.server.ts`

**Purpose**: Creates and manages adaptive learning paths

```typescript
interface AdaptivePathService {
  // Create a new adaptive path with Week 1
  createPath(params: {
    userId: string;
    targetLanguage: string;
    title: string;
    description: string;
    weekThemeTemplate: 'meet-family' | 'daily-life' | 'professional';
    cefrLevel: string;
  }): Promise<{ path: LearningPath; week1: AdaptiveWeek }>;

  // Get user's current week with progress
  getCurrentWeek(assignmentId: string): Promise<{
    week: AdaptiveWeek;
    progress: WeekProgress;
    sessionTypes: SessionType[];
  }>;

  // Advance to next week (triggers analysis if not done)
  advanceToNextWeek(assignmentId: string): Promise<AdaptiveWeek>;
}
```

### 2. SessionService

**File**: `src/lib/features/learning-path/services/SessionService.server.ts`

**Purpose**: Handles session lifecycle within a week

```typescript
interface SessionService {
  // Start a new session
  startSession(params: {
    weekProgressId: string;
    sessionTypeId: string;
    conversationSeedId?: string;
  }): Promise<{ session: WeekSession; conversation: Conversation }>;

  // Complete a session and update progress
  completeSession(params: {
    sessionId: string;
    comfortRating?: number;
    mood?: 'great' | 'good' | 'okay' | 'struggling';
    userReflection?: string;
  }): Promise<WeekProgress>;

  // Get available session types
  getSessionTypes(): Promise<SessionType[]>;
}
```

### 3. WeeklyAnalysisService

**File**: `src/lib/features/learning-path/services/WeeklyAnalysisService.server.ts`

**Purpose**: AI analysis of weekly progress

```typescript
interface WeeklyAnalysisService {
  // Queue analysis for a completed week
  queueAnalysis(weekProgressId: string): Promise<WeeklyAnalysis>;

  // Process pending analysis (called by job runner)
  processAnalysis(analysisId: string): Promise<WeeklyAnalysis>;

  // Generate next week from analysis
  generateNextWeek(analysisId: string): Promise<AdaptiveWeek>;
}
```

---

## Unit Tests

### Test File: `AdaptivePathService.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdaptivePathService } from './AdaptivePathService.server';

describe('AdaptivePathService', () => {
  describe('createPath', () => {
    it('should create a path with mode=adaptive', async () => {
      const service = new AdaptivePathService(mockDb);

      const result = await service.createPath({
        userId: 'user-123',
        targetLanguage: 'nl',
        title: 'Dutch for Meeting Family',
        description: 'Prepare to meet your partner\'s parents',
        weekThemeTemplate: 'meet-family',
        cefrLevel: 'A2'
      });

      expect(result.path.mode).toBe('adaptive');
      expect(result.path.durationWeeks).toBe(4);
    });

    it('should create Week 1 as anchor week', async () => {
      const service = new AdaptivePathService(mockDb);

      const result = await service.createPath({
        userId: 'user-123',
        targetLanguage: 'nl',
        title: 'Dutch for Meeting Family',
        description: 'Prepare to meet your partner\'s parents',
        weekThemeTemplate: 'meet-family',
        cefrLevel: 'A2'
      });

      expect(result.week1.isAnchorWeek).toBe(true);
      expect(result.week1.weekNumber).toBe(1);
      expect(result.week1.status).toBe('active');
    });

    it('should populate Week 1 with conversation seeds from template', async () => {
      const service = new AdaptivePathService(mockDb);

      const result = await service.createPath({
        userId: 'user-123',
        targetLanguage: 'nl',
        title: 'Dutch for Meeting Family',
        description: 'Prepare to meet your partner\'s parents',
        weekThemeTemplate: 'meet-family',
        cefrLevel: 'A2'
      });

      expect(result.week1.conversationSeeds.length).toBeGreaterThan(0);
      expect(result.week1.theme).toBe('Introducing Myself');
    });

    it('should create empty week_progress record', async () => {
      const service = new AdaptivePathService(mockDb);

      const result = await service.createPath({
        userId: 'user-123',
        targetLanguage: 'nl',
        title: 'Test Path',
        description: 'Test',
        weekThemeTemplate: 'daily-life',
        cefrLevel: 'A1'
      });

      const progress = await mockDb.query.weekProgress.findFirst({
        where: eq(weekProgress.weekId, result.week1.id)
      });

      expect(progress).toBeDefined();
      expect(progress?.sessionsCompleted).toBe(0);
      expect(progress?.totalMinutes).toBe('0');
    });
  });

  describe('getCurrentWeek', () => {
    it('should return active week with progress', async () => {
      // Setup: Create path and complete 2 sessions
      const service = new AdaptivePathService(mockDb);
      const { assignment } = await setupPathWithSessions(mockDb, 2);

      const result = await service.getCurrentWeek(assignment.id);

      expect(result.week.status).toBe('active');
      expect(result.progress.sessionsCompleted).toBe(2);
    });

    it('should include all active session types', async () => {
      const service = new AdaptivePathService(mockDb);
      const { assignment } = await setupPath(mockDb);

      const result = await service.getCurrentWeek(assignment.id);

      expect(result.sessionTypes.length).toBe(6);
      expect(result.sessionTypes.map(s => s.id)).toContain('quick-checkin');
      expect(result.sessionTypes.map(s => s.id)).toContain('story-moment');
    });
  });
});
```

### Test File: `SessionService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SessionService } from './SessionService.server';

describe('SessionService', () => {
  describe('startSession', () => {
    it('should create a conversation linked to session type', async () => {
      const service = new SessionService(mockDb);
      const { weekProgress } = await setupPath(mockDb);

      const result = await service.startSession({
        weekProgressId: weekProgress.id,
        sessionTypeId: 'quick-checkin'
      });

      expect(result.conversation).toBeDefined();
      expect(result.session.sessionTypeId).toBe('quick-checkin');
      expect(result.session.startedAt).toBeDefined();
    });

    it('should link to conversation seed if provided', async () => {
      const service = new SessionService(mockDb);
      const { weekProgress, week } = await setupPath(mockDb);
      const seedId = week.conversationSeeds[0].id;

      const result = await service.startSession({
        weekProgressId: weekProgress.id,
        sessionTypeId: 'story-moment',
        conversationSeedId: seedId
      });

      expect(result.session.conversationSeedId).toBe(seedId);
    });
  });

  describe('completeSession', () => {
    it('should increment sessionsCompleted', async () => {
      const service = new SessionService(mockDb);
      const { session, weekProgress } = await setupActiveSession(mockDb);

      expect(weekProgress.sessionsCompleted).toBe(0);

      await service.completeSession({
        sessionId: session.id,
        comfortRating: 4,
        mood: 'good'
      });

      const updated = await mockDb.query.weekProgress.findFirst({
        where: eq(weekProgress.id, weekProgress.id)
      });

      expect(updated?.sessionsCompleted).toBe(1);
    });

    it('should update totalMinutes based on session duration', async () => {
      const service = new SessionService(mockDb);
      const { session, weekProgress } = await setupActiveSession(mockDb, {
        startedAt: new Date(Date.now() - 7 * 60 * 1000) // 7 minutes ago
      });

      await service.completeSession({ sessionId: session.id });

      const updated = await mockDb.query.weekProgress.findFirst({
        where: eq(weekProgress.id, weekProgress.id)
      });

      expect(parseFloat(updated?.totalMinutes ?? '0')).toBeCloseTo(7, 0);
    });

    it('should track session type variety', async () => {
      const service = new SessionService(mockDb);
      const { weekProgress } = await setupPath(mockDb);

      // Complete two different session types
      await completeSessionOfType(service, weekProgress.id, 'quick-checkin');
      await completeSessionOfType(service, weekProgress.id, 'story-moment');

      const updated = await mockDb.query.weekProgress.findFirst({
        where: eq(weekProgress.id, weekProgress.id)
      });

      expect(updated?.sessionTypesUsed).toBe(2);
      expect(updated?.sessionTypeIdsUsed).toContain('quick-checkin');
      expect(updated?.sessionTypeIdsUsed).toContain('story-moment');
    });

    it('should update comfort rating average', async () => {
      const service = new SessionService(mockDb);
      const { weekProgress } = await setupPath(mockDb);

      await completeSessionWithRating(service, weekProgress.id, 3);
      await completeSessionWithRating(service, weekProgress.id, 5);
      await completeSessionWithRating(service, weekProgress.id, 4);

      const updated = await mockDb.query.weekProgress.findFirst({
        where: eq(weekProgress.id, weekProgress.id)
      });

      expect(parseFloat(updated?.averageComfortRating ?? '0')).toBe(4); // (3+5+4)/3
    });
  });
});
```

### Test File: `WeeklyAnalysisService.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { WeeklyAnalysisService } from './WeeklyAnalysisService.server';

describe('WeeklyAnalysisService', () => {
  describe('queueAnalysis', () => {
    it('should create analysis record with pending status', async () => {
      const service = new WeeklyAnalysisService(mockDb, mockAI);
      const { weekProgress } = await setupCompletedWeek(mockDb);

      const analysis = await service.queueAnalysis(weekProgress.id);

      expect(analysis.status).toBe('pending');
      expect(analysis.weekProgressId).toBe(weekProgress.id);
    });
  });

  describe('processAnalysis', () => {
    it('should identify strengths from conversation data', async () => {
      const service = new WeeklyAnalysisService(mockDb, mockAI);
      const { analysis } = await setupPendingAnalysis(mockDb, {
        // Mock conversation data showing user is good at present tense
        conversations: [
          { content: 'Ik werk vandaag', wasCorrect: true },
          { content: 'Ik eet nu', wasCorrect: true },
          { content: 'Ik ging gisteren', wasCorrect: false } // past tense error
        ]
      });

      mockAI.analyze.mockResolvedValue({
        strengths: [
          { area: 'grammar', description: 'Confident with present tense' }
        ],
        challenges: [
          { area: 'grammar', description: 'Past tense verb forms' }
        ]
      });

      const result = await service.processAnalysis(analysis.id);

      expect(result.status).toBe('completed');
      expect(result.strengths).toHaveLength(1);
      expect(result.strengths[0].description).toContain('present tense');
    });

    it('should generate conversation seeds for next week', async () => {
      const service = new WeeklyAnalysisService(mockDb, mockAI);
      const { analysis, weekProgress } = await setupPendingAnalysis(mockDb);

      // User enjoyed food topics
      await mockDb.update(weekProgress).set({
        topicsThatSparkedJoy: ['food', 'cooking']
      });

      mockAI.generateSeeds.mockResolvedValue([
        {
          id: 'seed-1',
          title: 'What did you eat yesterday?',
          description: 'Practice past tense with food vocabulary',
          vocabularyHints: ['eten', 'drinken', 'koken'],
          grammarHints: ['past tense']
        }
      ]);

      const result = await service.processAnalysis(analysis.id);

      expect(result.generatedSeeds.length).toBeGreaterThan(0);
      expect(result.generatedSeeds[0].vocabularyHints).toContain('eten');
    });

    it('should generate encouraging summary message', async () => {
      const service = new WeeklyAnalysisService(mockDb, mockAI);
      const { analysis } = await setupPendingAnalysis(mockDb, {
        sessionsCompleted: 5,
        totalMinutes: 35
      });

      mockAI.generateSummary.mockResolvedValue({
        weekSummary: 'Great week! You completed 5 conversations...',
        encouragementMessage: 'You are building real confidence...',
        nextWeekPreview: 'Next week we will build on your strength with...'
      });

      const result = await service.processAnalysis(analysis.id);

      expect(result.weekSummary).toBeDefined();
      expect(result.encouragementMessage).toBeDefined();
    });
  });

  describe('generateNextWeek', () => {
    it('should create new week with seeds from analysis', async () => {
      const service = new WeeklyAnalysisService(mockDb, mockAI);
      const { analysis } = await setupCompletedAnalysis(mockDb, {
        generatedSeeds: [
          { id: 'seed-1', title: 'Weekend plans' },
          { id: 'seed-2', title: 'Favorite foods' }
        ]
      });

      const nextWeek = await service.generateNextWeek(analysis.id);

      expect(nextWeek.weekNumber).toBe(2);
      expect(nextWeek.conversationSeeds).toHaveLength(2);
      expect(nextWeek.status).toBe('active');
    });

    it('should apply focus areas from analysis', async () => {
      const service = new WeeklyAnalysisService(mockDb, mockAI);
      const { analysis } = await setupCompletedAnalysis(mockDb, {
        recommendations: [
          { type: 'focus', area: 'past tense', priority: 'high' }
        ]
      });

      const nextWeek = await service.generateNextWeek(analysis.id);

      expect(nextWeek.focusAreas).toContainEqual(
        expect.objectContaining({ description: expect.stringContaining('past') })
      );
    });

    it('should increment difficulty if user did well', async () => {
      const service = new WeeklyAnalysisService(mockDb, mockAI);
      const { analysis, week } = await setupCompletedAnalysis(mockDb, {
        suggestedDifficultyAdjustment: 'increase'
      });

      expect(week.difficultyMax).toBe('A2');

      const nextWeek = await service.generateNextWeek(analysis.id);

      expect(nextWeek.difficultyMin).toBe('A2');
      expect(nextWeek.difficultyMax).toBe('B1');
    });

    it('should mark previous week as completed', async () => {
      const service = new WeeklyAnalysisService(mockDb, mockAI);
      const { analysis, week } = await setupCompletedAnalysis(mockDb);

      expect(week.status).toBe('active');

      await service.generateNextWeek(analysis.id);

      const updatedWeek = await mockDb.query.adaptiveWeeks.findFirst({
        where: eq(adaptiveWeeks.id, week.id)
      });

      expect(updatedWeek?.status).toBe('completed');
    });
  });
});
```

---

## API Endpoints to Implement

### GET `/api/learning-paths/[pathId]/current-week`

Returns the current week with progress and available session types.

```typescript
// Response
{
  week: {
    id: string;
    weekNumber: number;
    theme: string;
    themeDescription: string;
    conversationSeeds: ConversationSeed[];
    focusAreas: FocusArea[];
  };
  progress: {
    sessionsCompleted: number;
    totalMinutes: number;
    suggestedSessionCount: number;
    minimumSessionCount: number;
    sessionTypeIdsUsed: string[];
  };
  sessionTypes: SessionType[];
}
```

### POST `/api/learning-paths/[pathId]/sessions`

Start a new session.

```typescript
// Request
{
  sessionTypeId: string;
  conversationSeedId?: string;
}

// Response
{
  session: WeekSession;
  conversationId: string;
  // Redirect to conversation UI
}
```

### PATCH `/api/learning-paths/sessions/[sessionId]/complete`

Complete a session.

```typescript
// Request
{
  comfortRating?: number; // 1-5
  mood?: 'great' | 'good' | 'okay' | 'struggling';
  userReflection?: string;
}

// Response
{
  progress: WeekProgress;
  encouragement?: string; // "Nice! 3 sessions this week!"
}
```

### POST `/api/learning-paths/[pathId]/advance-week`

Advance to next week (triggers analysis if needed).

```typescript
// Response
{
  previousWeek: {
    summary: string;
    encouragementMessage: string;
  };
  nextWeek: AdaptiveWeek;
}
```

---

## UI Components to Build

### 1. Week Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Week 1: My Day                                             │
│  "Talk about your daily life, routines, and simple plans"   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Progress this week                                  │   │
│  │  ████████░░░░░░░░░░░░  3 of 5 suggested sessions    │   │
│  │  28 minutes practiced                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Pick a session:                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ ☕        │ │ 📖        │ │ ❓        │ │ 🎭        │      │
│  │ Quick    │ │ Story    │ │ Question │ │ Mini     │      │
│  │ Check-in │ │ Moment   │ │ Game     │ │ Roleplay │      │
│  │ 3-5 min  │ │ 5-8 min  │ │ 5-7 min  │ │ 8-10 min │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  Or choose a conversation topic:                            │
│  • "How was your morning?"                                  │
│  • "What are you doing today?"                              │
│  • "Tell me about yesterday"                                │
│  • "What do you usually do on weekends?"                    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Session Type Picker

Modal or inline selector showing session types with:
- Icon and name
- Duration range
- Description
- "Start" button

### 3. Week Summary (shown at week end)

```
┌─────────────────────────────────────────────────────────────┐
│  Week 1 Complete! 🎉                                        │
│                                                             │
│  You practiced 5 times this week (42 minutes total)         │
│                                                             │
│  What went well:                                            │
│  ✓ Confident with present tense verbs                       │
│  ✓ You loved talking about food!                            │
│                                                             │
│  For next week:                                             │
│  → We'll gently add more past tense                         │
│  → More food conversations (since you enjoyed them!)        │
│                                                             │
│  [Continue to Week 2 →]                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Seeding Session Types

Run this to populate the `session_types` table:

```typescript
// src/lib/server/db/seed/seed-session-types.ts
import { db } from '$lib/server/db';
import { sessionTypes, DEFAULT_SESSION_TYPES } from '$lib/server/db/schema';

export async function seedSessionTypes() {
  await db.insert(sessionTypes).values(DEFAULT_SESSION_TYPES).onConflictDoNothing();
  console.log('✅ Session types seeded');
}
```

---

## Migration Notes

Since we're going all-in on adaptive mode:

1. **New paths**: Always create with `mode: 'adaptive'`
2. **Legacy paths**: Can remain with `mode: 'classic'` but won't get new features
3. **Default**: The `learningPathModeEnum` defaults to `'classic'` for backwards compatibility, but all new code should explicitly set `'adaptive'`

---

## AI Prompts

### Weekly Analysis Prompt

```typescript
const ANALYSIS_SYSTEM_PROMPT = `
You are analyzing a language learner's week of practice.
Be encouraging - this is about growth, not judgment.

Given the conversation transcripts and progress data, identify:

1. STRENGTHS (what they do well)
   - Grammar patterns used correctly
   - Vocabulary they're comfortable with
   - Topics where they spoke freely

2. CHALLENGES (gentle areas for growth)
   - Grammar that caused hesitation
   - Vocabulary gaps
   - Topics that felt uncomfortable

3. TOPIC AFFINITIES
   - What topics engaged them?
   - Where did conversation flow naturally?

4. RECOMMENDATIONS for next week
   - What to build on (leverage strengths)
   - What to gently introduce (address challenges)
   - What topics to include (spark joy)

5. CONVERSATION SEEDS for next week
   Generate 4-6 conversation prompts that:
   - Build on this week's theme
   - Include topics they enjoyed
   - Gently weave in growth areas
   - Feel fresh but familiar

Output as JSON matching the WeeklyAnalysis schema.
`;
```

---

## Checklist for Implementation

### Phase 1: Core Services
- [ ] `AdaptivePathService.server.ts`
- [ ] `SessionService.server.ts`
- [ ] `WeeklyAnalysisService.server.ts`
- [ ] Unit tests for all services

### Phase 2: API Endpoints
- [ ] GET `/api/learning-paths/[pathId]/current-week`
- [ ] POST `/api/learning-paths/[pathId]/sessions`
- [ ] PATCH `/api/learning-paths/sessions/[sessionId]/complete`
- [ ] POST `/api/learning-paths/[pathId]/advance-week`

### Phase 3: Database Seeding
- [ ] Seed session types
- [ ] Create week theme templates for common use cases

### Phase 4: UI Components
- [ ] Week dashboard component
- [ ] Session type picker
- [ ] Week summary/transition view
- [ ] Progress indicators

### Phase 5: Integration
- [ ] Connect conversation flow to session tracking
- [ ] Wire up analysis job queue
- [ ] Add email notifications for week transitions

---

## Questions for Product

1. **Week duration**: Fixed 7 days, or flexible (advance when ready)?
2. **Minimum sessions**: Is 3 the right minimum, or should it be configurable?
3. **Skip week**: Can users skip a week? What happens to analysis?
4. **Repeat sessions**: Can users repeat the same conversation seed? (Currently yes)
5. **Manual seed selection**: Required or optional? (Currently optional)

---

## Engagement Design (Without Gamification)

> "The best interface is no interface." — Golden Krishna
> "Design is not just what it looks like. Design is how it works." — Steve Jobs

### The Anti-Gamification Philosophy

Gamification (streaks, badges, leaderboards) creates **external motivation** that fades. We want **intrinsic motivation** — the user returns because the experience itself is valuable.

Johnny Ive would ask: "What can we remove?" Not "What rewards can we add?"

### 7 Principles for Natural Daily Engagement

#### 1. **Micro-Closure**
Every session, no matter how short, feels complete.

```
BAD:  "Day 5 of 28" (implies incompleteness)
GOOD: "A nice conversation about your morning" (complete in itself)
```

The user should close the app feeling *satisfied*, not *obligated to return*.

**Implementation:**
- Each session has a clear arc: warm-up → moment → closure
- End with a gentle reflection: "That felt good. Tot morgen."
- Never show "X days until goal" — that's anxiety, not motivation

#### 2. **Ritual Anchoring**
Attach to existing daily rituals, don't create new obligations.

```
"Your morning check-in is ready" (ties to existing habit)
vs
"Don't break your streak!" (creates new obligation)
```

**Implementation:**
- Let users set their preferred practice time (morning/lunch/evening)
- Frame as "your moment" not "your task"
- Gentle reminder at chosen time: "Coffee time? 5 minutes of Dutch?"

#### 3. **Variable Depth**
Match the user's energy, not a fixed requirement.

```
Tired? ☕ 3-minute check-in
Energized? 🌊 15-minute deep dive
Both are equally valid.
```

**Implementation:**
- Session picker shows duration clearly
- No judgment for short sessions
- "Quick Check-in" is genuinely quick (3-5 minutes)
- Progress counts minutes, not sessions (20 min = 20 min, whether 2 sessions or 4)

#### 4. **Purposeful Context**
Constantly reconnect to the user's real goal.

```
Generic: "Practice Dutch today"
Purposeful: "One step closer to chatting with Lisa's parents"
```

**Implementation:**
- Show the goal in the UI: "For: Meeting partner's family"
- Conversation seeds relate to the goal: "What will you say when they ask about your work?"
- Week themes build toward the goal: Week 4 = "Family Dinner Rehearsal"

#### 5. **Felt Progress (Not Metrics)**
The user should *feel* more fluent, not just see a number go up.

```
Gamified: "You've earned 150 XP!"
Felt: "Remember when 'Hoe gaat het?' felt impossible? Now you're telling stories."
```

**Implementation:**
- Weekly summary highlights *what they can do now*
- Show early conversations vs. recent ones (look how far you've come)
- AI notes specific improvements: "You used 3 past tense verbs naturally this week"
- No points, no XP, no arbitrary numbers

#### 6. **Warm Continuity**
Create the feeling of a continuing relationship, not isolated sessions.

```
Cold: "Start a new conversation"
Warm: "Last time you told me about your weekend. How was Monday?"
```

**Implementation:**
- AI remembers previous conversations within the week
- Opening acknowledges what came before: "You mentioned cooking yesterday..."
- Week-to-week continuity: "Last week you practiced introductions. Now let's go deeper."

#### 7. **Gentle Presence**
Be present without being pushy.

```
Pushy: "You haven't practiced today! Don't lose your streak!"
Gentle: "Whenever you're ready. Your week: 2 conversations so far."
```

**Implementation:**
- No streak counters (streaks create anxiety when broken)
- No "you missed X days" guilt
- Dashboard shows soft progress: "3 conversations this week" (not "3 of 7")
- Reminders are optional and never use fear of loss

---

### The Daily Rhythm

Instead of "daily engagement metrics," design for **natural return**.

```
┌─────────────────────────────────────────────────────────────┐
│  MORNING                                                    │
│  Brief notification at user's chosen time                   │
│  "Good morning. 5 minutes of Dutch with your coffee?"       │
│  ↓                                                          │
│  User opens app                                             │
│  Sees: Week theme, soft progress, session options           │
│  Picks: ☕ Quick Check-in (3-5 min)                         │
│  ↓                                                          │
│  Conversation                                               │
│  AI: "Goedemorgen! Hoe gaat het vandaag?"                   │
│  Natural, warm, short                                       │
│  ↓                                                          │
│  Closure                                                    │
│  AI: "Fijn om even te praten. Tot later!"                   │
│  App shows: "Nice. 3 conversations this week."              │
│  User closes app feeling good                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  EVENING (optional)                                         │
│  User thinks: "I have 10 minutes before dinner"             │
│  Opens app by choice (not notification)                     │
│  Picks: 📖 Story Moment (5-8 min)                           │
│  ↓                                                          │
│  Conversation                                               │
│  AI: "Vertel me over je dag vandaag"                        │
│  User tells story about their day                           │
│  AI asks follow-ups, gently corrects                        │
│  ↓                                                          │
│  Closure                                                    │
│  AI: "Wat een leuke dag! Slaap lekker."                     │
│  User feels: "I actually described my day in Dutch!"        │
└─────────────────────────────────────────────────────────────┘
```

---

### What We DON'T Do

| Gamification Pattern | Why We Avoid It |
|---------------------|-----------------|
| Streaks | Creates anxiety; one missed day = motivation collapse |
| Points/XP | Arbitrary; doesn't reflect real progress |
| Leaderboards | Comparison kills intrinsic motivation |
| Badges | Extrinsic reward; fades quickly |
| Daily goals | Feels like obligation, not desire |
| Loss aversion | "Don't lose your streak!" is manipulation |
| Push notifications | Interruption; creates resentment |

---

### What We DO

| Natural Pattern | How It Creates Return |
|----------------|----------------------|
| Micro-closure | "That felt complete" → satisfaction → want more |
| Ritual anchoring | "Coffee time = Dutch time" → habit |
| Variable depth | "I can always fit something" → low barrier |
| Purposeful context | "I'm getting closer to my goal" → meaning |
| Felt progress | "I can actually do this now" → confidence |
| Warm continuity | "The AI remembers me" → relationship |
| Gentle presence | "No pressure" → no guilt → sustainable |

---

### Implementation Checklist: Engagement Design

- [ ] Remove all streak language from UI
- [ ] Remove all "X of Y" progress framing
- [ ] Add user's goal prominently on dashboard
- [ ] Session durations are honest and varied (3-15 min)
- [ ] Post-session closure message feels warm and complete
- [ ] Reminders are time-based (user's chosen time), not action-based
- [ ] Reminder copy is inviting, not urgent
- [ ] Weekly summary highlights felt progress, not metrics
- [ ] AI references previous conversations for continuity
- [ ] No notification if user practiced today (don't nag)

---

### Measuring Success (Without Gamification)

Instead of tracking "daily active users" or "streak length," measure:

1. **Return rate by choice**: % of users who open app without notification
2. **Session completion**: Do users finish sessions they start?
3. **Week completion**: Do users complete 3+ sessions per week?
4. **Self-reported confidence**: "How confident do you feel speaking Dutch?"
5. **Goal achievement**: Did they actually have the conversation they wanted?

The ultimate metric: **Did the user have the real-world conversation they were preparing for?**

---

## Contact

For questions about this system, see the original implementation branch or the PR discussion.
