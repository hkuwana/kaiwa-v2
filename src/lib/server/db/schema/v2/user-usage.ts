import { pgTable, uuid, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { users } from '../users';

// Usage tracking for tier limits
export const userUsage = pgTable(
	'user_usage',
	{
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
	},
	(table) => [
		// Performance indexes for usage tracking
		index('user_usage_user_id_idx').on(table.userId),
		index('user_usage_period_start_idx').on(table.periodStart),
		index('user_usage_period_end_idx').on(table.periodEnd),
		// Composite index for user + period queries
		index('user_usage_user_period_idx').on(table.userId, table.periodStart),
		// Index for cleanup queries
		index('user_usage_updated_at_idx').on(table.updatedAt)
	]
);
