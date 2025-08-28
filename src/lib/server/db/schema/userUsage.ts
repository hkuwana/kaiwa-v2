import { pgTable, text, integer, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

// Track monthly usage for each user
// Simplified: tier info can be derived from user's active subscription
export const userUsage = pgTable(
	'user_usage',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		// Monthly period (YYYY-MM format)
		period: text('period').notNull(), // e.g., '2025-01'

		// Usage tracking
		conversationsUsed: integer('conversations_used').default(0),
		secondsUsed: integer('seconds_used').default(0), // Changed from minutes_used
		realtimeSessionsUsed: integer('realtime_sessions_used').default(0),

		// Banking (rollover from previous month)
		bankedSeconds: integer('banked_seconds').default(0), // Changed from banked_minutes
		bankedSecondsUsed: integer('banked_seconds_used').default(0), // Changed from banked_minutes_used

		// Tracking
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		// Composite primary key: user + period
		primaryKey({ columns: [table.userId, table.period] }),

		// Indexes for efficient queries
		index('user_usage_user_idx').on(table.userId),
		index('user_usage_period_idx').on(table.period),
		index('user_usage_user_period_idx').on(table.userId, table.period)
	]
);
