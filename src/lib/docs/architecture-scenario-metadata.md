# Scenario Metadata Architecture

## Overview

This document explains the decision to split scenario data into three focused tables:

1. **scenarios** - Core content & instruction data
2. **scenario_metadata** - App-wide aggregate metrics
3. **user_scenario_progress** - Individual user progress & engagement

This replaces the previous `scenario_attempts` and `scenario_outcomes` tables with a cleaner, more flexible model.

---

## Current Problem with scenario_attempts & scenario_outcomes

### Issues:

- ❌ **Monolithic**: Every attempt and outcome creates a new row (bloat for active users)
- ❌ **Denormalization needed**: To get "total saves" or "usage count", you need aggregation queries
- ❌ **Conflates concerns**: User progress mixed with app-wide metrics
- ❌ **Hard to query**: Finding "most used scenarios" requires complex joins
- ❌ **Not flexible**: Hard to add new metrics without schema changes

### Example Problem:

```sql
-- Current: Need complex aggregation to get "most saved scenarios"
SELECT
  s.id,
  s.title,
  COUNT(DISTINCT so.userId) as total_saves
FROM scenarios s
LEFT JOIN scenario_outcomes so ON s.id = so.scenarioId
WHERE so.saved = true
GROUP BY s.id
ORDER BY total_saves DESC;
```

---

## Proposed Solution: Three-Table Model

### 1. **scenarios** (Core Content)

```typescript
export const scenarios = pgTable('scenarios', {
	// Immutable content
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description').notNull(),
	role: scenarioRoleEnum('role').notNull(),
	difficulty: scenarioDifficultyEnum('difficulty').notNull(),

	// Detailed content
	instructions: text('instructions').notNull(),
	context: text('context').notNull(),
	expectedOutcome: text('expected_outcome'),
	learningGoal: text('learning_goal'),
	learningObjectives: json('learning_objectives').$type<string[]>(),
	persona: json('persona'),
	comfortIndicators: json('comfort_indicators'),

	// Metadata about the scenario itself
	difficultyRating: integer('difficulty_rating'),
	cefrLevel: text('cefr_level'),
	cefrRecommendation: text('cefr_recommendation'),

	// Ownership & visibility
	createdByUserId: uuid('created_by_user_id'), // null for built-in, userId for user-created
	visibility: scenarioVisibilityEnum('visibility').notNull(),
	isActive: boolean('is_active').notNull(),

	// Timestamps
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

**Purpose**: Pure content. No metrics, no user data. Can be cached/pre-loaded.

---

### 2. **scenario_metadata** (App-Wide Metrics)

```typescript
export const scenarioMetadata = pgTable('scenario_metadata', {
	// One row per scenario
	scenarioId: text('scenario_id')
		.primaryKey()
		.references(() => scenarios.id, { onDelete: 'cascade' }),

	// Aggregate engagement metrics
	amountSavedCount: integer('amount_saved_count').default(0).notNull(), // sum of all user saves
	totalTimesUsed: integer('total_times_used').default(0).notNull(), // sum of all user completions
	totalAttempts: integer('total_attempts').default(0).notNull(), // sum of all attempts

	// Quality metrics
	averageRating: real('average_rating'), // 1-5 stars, null if no ratings
	ratingsCount: integer('ratings_count').default(0).notNull(),

	// Computed efficiency
	completionRate: real('completion_rate'), // percentage: completed / attempted
	averageTimeSpent: integer('average_time_spent'), // seconds

	// Timestamps
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

**Purpose**: Fast queries for "trending scenarios", "most saved", "top rated". Denormalized for performance.

**Updates**: Incremented whenever:

- User completes a scenario → `totalTimesUsed++`
- User saves/unsaves → `amountSavedCount++` or `--`
- User rates scenario → update `averageRating` & `ratingsCount`

---

### 3. **user_scenario_progress** (User-Specific Data)

```typescript
export const userScenarioProgress = pgTable(
	'user_scenario_progress',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		scenarioId: text('scenario_id')
			.notNull()
			.references(() => scenarios.id, { onDelete: 'cascade' }),

		// User engagement
		isSaved: boolean('is_saved').default(false).notNull(),
		savedAt: timestamp('saved_at'),

		// User progress
		timesCompleted: integer('times_completed').default(0).notNull(),
		timesAttempted: integer('times_attempted').default(0).notNull(),
		lastAttemptAt: timestamp('last_attempt_at'),
		lastCompletedAt: timestamp('last_completed_at'),

		// User feedback
		userRating: integer('user_rating'), // 1-5 stars, nullable if not rated
		userNotes: text('user_notes'), // private notes

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.scenarioId] }),
		index('user_progress_idx').on(table.userId),
		index('scenario_progress_idx').on(table.scenarioId),
		index('saved_scenarios_idx').on(table.userId, table.isSaved)
	]
);
```

**Purpose**: Individual user journeys. "User X has done this 3 times, saved it, rated it 4 stars."

---

### 4. **user_saved_scenarios** (Denormalized Audit Trail - Optional)

```typescript
// Optional: If you want to see WHEN each user saved each scenario
export const userSavedScenarios = pgTable(
	'user_saved_scenarios',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		scenarioId: text('scenario_id')
			.notNull()
			.references(() => scenarios.id, { onDelete: 'cascade' }),

		savedAt: timestamp('saved_at').defaultNow().notNull()
	},
	(table) => [
		primaryKey({ columns: [table.userId, table.scenarioId] }),
		index('user_saved_idx').on(table.userId),
		index('scenario_saved_idx').on(table.scenarioId)
	]
);
```

**Purpose**: Optional. Use only if you need to query "all users who saved this" for notifications/features. Otherwise, query `user_scenario_progress WHERE isSaved = true`.

---

## Comparison: Old vs. New

| Operation                       | Old Model                     | New Model                                                                  |
| ------------------------------- | ----------------------------- | -------------------------------------------------------------------------- |
| Get scenario content            | `SELECT * FROM scenarios`     | `SELECT * FROM scenarios`                                                  |
| "Most saved scenarios"          | Complex aggregation join      | `SELECT * FROM scenario_metadata ORDER BY amountSavedCount DESC`           |
| "User's saved scenarios"        | Join with scenario_outcomes   | `SELECT * FROM user_scenario_progress WHERE userId = ? AND isSaved = true` |
| "User's progress on scenario X" | Multiple rows to aggregate    | `SELECT * FROM user_scenario_progress WHERE userId = ? AND scenarioId = ?` |
| Add new metric                  | Alter scenario_outcomes       | Alter scenario_metadata (non-blocking)                                     |
| User saves scenario             | Insert into scenario_outcomes | Update user_scenario_progress, increment scenario_metadata                 |

---

## Data Flow & Updates

### When User Completes a Scenario:

```typescript
// 1. Record in user_scenario_progress
await db
	.update(userScenarioProgress)
	.set({
		timesCompleted: sql`times_completed + 1`,
		timesAttempted: sql`times_attempted + 1`,
		lastCompletedAt: new Date(),
		lastAttemptAt: new Date(),
		updatedAt: new Date()
	})
	.where(
		and(eq(userScenarioProgress.userId, userId), eq(userScenarioProgress.scenarioId, scenarioId))
	);

// 2. Increment app-wide metrics
await db
	.update(scenarioMetadata)
	.set({
		totalTimesUsed: sql`total_times_used + 1`,
		totalAttempts: sql`total_attempts + 1`,
		updatedAt: new Date()
	})
	.where(eq(scenarioMetadata.scenarioId, scenarioId));
```

### When User Saves/Unsaves:

```typescript
// 1. Update user_scenario_progress
await db
	.update(userScenarioProgress)
	.set({
		isSaved: true, // or false
		savedAt: true ? new Date() : null,
		updatedAt: new Date()
	})
	.where(
		and(eq(userScenarioProgress.userId, userId), eq(userScenarioProgress.scenarioId, scenarioId))
	);

// 2. Update scenario_metadata count
const isSaving = true; // or false
await db
	.update(scenarioMetadata)
	.set({
		amountSavedCount: sql`amount_saved_count + ${isSaving ? 1 : -1}`,
		updatedAt: new Date()
	})
	.where(eq(scenarioMetadata.scenarioId, scenarioId));
```

---

## Benefits of This Structure

✅ **Single Responsibility**

- `scenarios` = content only
- `scenario_metadata` = app metrics
- `user_scenario_progress` = user data

✅ **Performance**

- Metadata denormalized for O(1) "top scenarios" queries
- No complex aggregation joins
- Indexed for fast user lookups

✅ **Flexibility**

- Add new metrics to metadata without affecting user data
- Add new user fields without affecting app metrics
- Easy to archive old user progress without losing metadata

✅ **Scalability**

- User progress isolated per (userId, scenarioId)
- App metrics stay small (one row per scenario)
- Can partition user_scenario_progress by date if needed

✅ **Clarity**

- Clear what belongs where
- Easy to understand data flow
- Easier to write correct queries

---

## Schema Location & Files

```
src/lib/server/db/schema/
├── scenarios.ts                 (core content) - UNCHANGED except remove old fields
├── scenario-metadata.ts         (NEW - app metrics)
├── user-scenario-progress.ts    (NEW - user data)
└── [REMOVE] scenario-attempts.ts
└── [REMOVE] scenario-outcomes.ts
```

---

## Migration Path

If you have existing `scenario_attempts` and `scenario_outcomes` data:

1. **Aggregate** old data into `scenario_metadata`
2. **Migrate** user data into `user_scenario_progress`
3. **Drop** old tables

```sql
-- Example aggregation
INSERT INTO scenario_metadata (scenarioId, amountSavedCount, totalTimesUsed, totalAttempts)
SELECT
  scenarioId,
  COUNT(CASE WHEN saved THEN 1 END),
  COUNT(CASE WHEN completed THEN 1 END),
  COUNT(*)
FROM scenario_outcomes
GROUP BY scenarioId;
```

---

## Future Extensions

This model scales to support:

- **AI-Generated Analytics**: "This scenario is trending" based on metadata
- **Recommendations**: "Users like you also saved these scenarios"
- **Achievements**: "Master 5 scenarios" - query user_scenario_progress
- **Leaderboards**: "Most attempts on Japanese scenarios" - join scenario_metadata + metadata
- **A/B Testing**: Add `variantId` to user_scenario_progress for experiment tracking

---

## Summary

**Should app-wide metadata stay with scenarios.ts or be separate?**

→ **Keep separate**. It's a different concern and updates frequently.

**user_scenario_progress or user_scenario_metadata?**

→ **user_scenario_progress** - emphasizes it's tracking user journey through the content, not metadata about the content.
