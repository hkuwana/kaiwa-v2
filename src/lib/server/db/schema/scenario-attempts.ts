import { pgTable, uuid, text, integer, timestamp, json, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { scenarios } from './scenarios';

/**
 * 🎯 Scenario Attempts table - Tracks user attempts at specific learning scenarios
 *
 * This table records each time a user attempts a learning scenario, allowing
 * for multiple tries at the same scenario to track improvement over time.
 * It captures completion status, progress through scenario steps, time spent,
 * learning aids used (hints, translations), and where users might have
 * abandoned the scenario. Used for learning analytics and progress tracking.
 *
 * **Key Features:**
 * - ✅ Multiple attempts per scenario supported
 * - 📊 Detailed progress tracking through scenario steps
 * - 🕒 Time-based analytics for learning efficiency
 * - 🆘 Learning aid usage tracking (hints, translations)
 * - 📈 Improvement tracking over multiple attempts
 *
 * @example
 * ```typescript
 * // Track a user's first attempt at a scenario
 * await db.insert(scenarioAttempts).values({
 *   userId: 'user-123',
 *   scenarioId: 'restaurant-ordering',
 *   attemptNumber: 1,
 *   timeSpentSeconds: 300,
 *   hintsUsed: 2,
 *   translationsUsed: 1
 * });
 * ```
 */
export const scenarioAttempts = pgTable(
	'scenario_attempts',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		scenarioId: text('scenario_id')
			.notNull()
			.references(() => scenarios.id, { onDelete: 'cascade' }),

		attemptNumber: integer('attempt_number').notNull(),

		startedAt: timestamp('started_at').defaultNow().notNull(),

		completedAt: timestamp('completed_at'),

		completedSteps: json('completed_steps').$type<string[]>(),

		abandonedAt: text('abandoned_at'),

		timeSpentSeconds: integer('time_spent_seconds'),

		hintsUsed: integer('hints_used').default(0).notNull(),

		translationsUsed: integer('translations_used').default(0).notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		// Performance indexes for scenario attempt queries
		index('scenario_attempts_user_id_idx').on(table.userId),
		index('scenario_attempts_scenario_id_idx').on(table.scenarioId),
		index('scenario_attempts_started_at_idx').on(table.startedAt),
		index('scenario_attempts_completed_at_idx').on(table.completedAt),
		// Composite index for user scenario progress
		index('scenario_attempts_user_scenario_idx').on(table.userId, table.scenarioId),
		// Index for attempt number queries
		index('scenario_attempts_attempt_number_idx').on(table.attemptNumber)
	]
);
