import { pgTable, uuid, text, integer, timestamp, json } from 'drizzle-orm/pg-core';
import { users } from './users';
import { scenarios } from './scenarios';

// 🔄 SCENARIO ATTEMPTS - Track multiple attempts at the same scenario
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
