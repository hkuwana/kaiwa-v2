import { pgTable, text, integer, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';
import { tiers } from './tiers';

// Track monthly usage for each user
export const userUsage = pgTable(
	'user_usage',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		tierId: text('tier_id')
			.notNull()
			.references(() => tiers.id),

		// Monthly period (YYYY-MM format)
		period: text('period').notNull(), // e.g., '2025-01'

		// Usage tracking
		conversationsUsed: integer('conversations_used').default(0),
		secondsUsed: integer('seconds_used').default(0), // Changed from minutes_used
		realtimeSessionsUsed: integer('realtime_sessions_used').default(0),

		// Banking (rollover from previous month)
		bankedSeconds: integer('banked_seconds').default(0), // Changed from banked_minutes
		bankedSecondsUsed: integer('banked_seconds_used').default(0), // Changed from banked_minutes_used

		// Limits (copied from tier for historical accuracy)
		monthlyConversations: integer('monthly_conversations'),
		monthlySeconds: integer('monthly_seconds'), // Changed from monthly_minutes
		monthlyRealtimeSessions: integer('monthly_realtime_sessions'),
		maxBankedSeconds: integer('max_banked_seconds'), // Changed from max_banked_minutes

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
