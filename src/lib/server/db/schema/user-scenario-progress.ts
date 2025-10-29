import {
	pgTable,
	uuid,
	text,
	integer,
	boolean,
	timestamp,
	index,
	primaryKey
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { scenarios } from './scenarios';

/**
 * 👤 User Scenario Progress table - Individual user progress & engagement with scenarios
 *
 * This table tracks each user's journey through scenarios. One row per (userId, scenarioId) pair.
 * It records whether the user has saved the scenario, how many times they've completed/attempted it,
 * when they last used it, and their personal rating/notes about it.
 *
 * **Key Features:**
 * - ✅ One row per user-scenario pair (deduped, efficient)
 * - 💾 User save status and timestamp
 * - 📈 User progress (attempts, completions, last used)
 * - ⭐ User rating and personal notes
 * - 🔍 Indexed for fast "user's saved scenarios" queries
 *
 * **Queries**:
 * - "Show me my saved scenarios" → WHERE userId = ? AND isSaved = true
 * - "User's progress on scenario X" → WHERE userId = ? AND scenarioId = ?
 * - "My top-rated scenarios" → WHERE userId = ? ORDER BY userRating DESC
 *
 * @example
 * ```typescript
 * // User saves a scenario
 * await db
 *   .insert(userScenarioProgress)
 *   .values({
 *     userId: 'user-123',
 *     scenarioId: 'family-dinner',
 *     isSaved: true,
 *     savedAt: new Date()
 *   })
 *   .onConflictDoUpdate({
 *     target: [userScenarioProgress.userId, userScenarioProgress.scenarioId],
 *     set: {
 *       isSaved: true,
 *       savedAt: new Date()
 *     }
 *   });
 * ```
 */
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

		// User progress through the scenario
		timesCompleted: integer('times_completed').default(0).notNull(),
		timesAttempted: integer('times_attempted').default(0).notNull(),
		lastAttemptAt: timestamp('last_attempt_at'),
		lastCompletedAt: timestamp('last_completed_at'),

		// Cumulative metrics from all attempts
		totalTimeSpentSeconds: integer('total_time_spent_seconds').default(0).notNull(),

		// User feedback
		userRating: integer('user_rating'), // 1-5 stars, nullable if not rated
		userNotes: text('user_notes'), // private notes/thoughts about the scenario

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		// Composite primary key: one row per user-scenario pair
		primaryKey({ columns: [table.userId, table.scenarioId] }),

		// Fast lookups of user's progress
		index('user_progress_user_idx').on(table.userId),
		index('user_progress_scenario_idx').on(table.scenarioId),

		// Find user's saved scenarios
		index('user_saved_scenarios_idx').on(table.userId, table.isSaved),

		// Find user's completed scenarios
		index('user_completed_idx').on(table.userId, table.lastCompletedAt),

		// Find all users who saved a scenario (for notifications)
		index('scenario_saved_users_idx').on(table.scenarioId, table.isSaved)
	]
);
