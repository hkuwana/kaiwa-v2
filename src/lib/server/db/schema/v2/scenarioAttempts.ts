import { pgTable, uuid, text, integer, timestamp, json, index } from 'drizzle-orm/pg-core';
import { users } from '../users';
import { scenarios } from '../scenarios';

// 🔄 SCENARIO ATTEMPTS - Track multiple attempts at the same scenario
export const scenarioAttempts = pgTable(
	'scenario_attempts',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').references(() => users.id),
		scenarioId: text('scenario_id')
			.notNull()
			.references(() => scenarios.id),

		// Attempt tracking
		attemptNumber: integer('attempt_number').notNull(), // 1st, 2nd, 3rd attempt
		startedAt: timestamp('started_at').defaultNow(),
		completedAt: timestamp('completed_at'),

		// Progress tracking
		completedSteps: json('completed_steps').$type<string[]>(), // Which parts they completed
		abandonedAt: text('abandoned_at'), // Where they gave up if applicable

		// Learning analytics
		timeSpentSeconds: integer('time_spent_seconds'),
		hintsUsed: integer('hints_used').default(0),
		translationsUsed: integer('translations_used').default(0),

		// Metadata
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [
		// Performance indexes for scenario attempt queries
		index('scenario_attempts_user_id_idx').on(table.userId),
		index('scenario_attempts_scenario_id_idx').on(table.scenarioId),
		index('scenario_attempts_attempt_number_idx').on(table.attemptNumber),
		index('scenario_attempts_started_at_idx').on(table.startedAt),
		index('scenario_attempts_completed_at_idx').on(table.completedAt),
		// Composite index for user + scenario queries
		index('scenario_attempts_user_scenario_idx').on(table.userId, table.scenarioId),
		// Composite index for scenario + attempt number queries
		index('scenario_attempts_scenario_attempt_idx').on(table.scenarioId, table.attemptNumber),
		// Index for user progress tracking
		index('scenario_attempts_user_created_idx').on(table.userId, table.createdAt)
	]
);
