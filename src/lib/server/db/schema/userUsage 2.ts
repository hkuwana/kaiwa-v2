import { pgTable, uuid, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

// Usage tracking for tier limits
export const userUsage = pgTable('user_usage', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),

	// Usage period (monthly reset)
	periodStart: timestamp('period_start').notNull(),
	periodEnd: timestamp('period_end').notNull(),

	// Usage counters
	conversationsUsed: integer('conversations_used').default(0),
	minutesUsed: integer('minutes_used').default(0),
	realtimeSessionsUsed: integer('realtime_sessions_used').default(0),

	// Metadata
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});
