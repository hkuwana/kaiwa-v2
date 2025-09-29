import { pgTable, uuid, text, integer, timestamp, json } from 'drizzle-orm/pg-core';
import { users } from './users';
import { scenarios } from './scenarios';

/**
 * Scenario Attempts table - Tracks user attempts at specific learning scenarios
 *
 * This table records each time a user attempts a learning scenario, allowing
 * for multiple tries at the same scenario to track improvement over time.
 * It captures completion status, progress through scenario steps, time spent,
 * learning aids used (hints, translations), and where users might have
 * abandoned the scenario. Used for learning analytics and progress tracking.
 */
export const scenarioAttempts = pgTable('scenario_attempts', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	scenarioId: text('scenario_id')
		.notNull()
		.references(() => scenarios.id),

	// Attempt tracking
	attemptNumber: integer('attempt_number').notNull(), // 1st, 2nd, 3rd attempt
	startedAt: timestamp('started_at').defaultNow().notNull(),
	completedAt: timestamp('completed_at'),

	// Progress tracking
	completedSteps: json('completed_steps').$type<string[]>(), // Which parts they completed
	abandonedAt: text('abandoned_at'), // Where they gave up if applicable

	// Learning analytics
	timeSpentSeconds: integer('time_spent_seconds'),
	hintsUsed: integer('hints_used').default(0).notNull(),
	translationsUsed: integer('translations_used').default(0).notNull(),

	// Metadata
	createdAt: timestamp('created_at').defaultNow().notNull()
});
