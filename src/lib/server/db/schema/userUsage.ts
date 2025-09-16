import { pgTable, text, integer, timestamp, index, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

// Track monthly usage for ALL users (free and paid) - Industry standard
// This enables conversion analytics, limit enforcement, and growth metrics
export const userUsage = pgTable(
	'user_usage',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		// Monthly period (YYYY-MM format)
		period: text('period').notNull(), // e.g., '2025-01'

		// Core usage tracking
		conversationsUsed: integer('conversations_used').default(0),
		secondsUsed: integer('seconds_used').default(0),
		realtimeSessionsUsed: integer('realtime_sessions_used').default(0),

		// Banking (rollover from previous month - Plus/Premium only)
		bankedSeconds: integer('banked_seconds').default(0),
		bankedSecondsUsed: integer('banked_seconds_used').default(0),

		// Feature usage (based on tier configs)
		ankiExportsUsed: integer('anki_exports_used').default(0), // ankiExportLimit from tiers
		sessionExtensionsUsed: integer('session_extensions_used').default(0), // maxExtensions from tiers
		advancedVoiceSeconds: integer('advanced_voice_seconds').default(0), // hasAdvancedVoices feature
		analysesUsed: integer('analyses_used').default(0), // AI conversation analyses used

		// Quality & engagement metrics
		completedSessions: integer('completed_sessions').default(0), // Sessions that weren't abandoned early
		longestSessionSeconds: integer('longest_session_seconds').default(0), // Longest single session
		averageSessionSeconds: integer('average_session_seconds').default(0), // Running average

		// Business analytics
		overageSeconds: integer('overage_seconds').default(0), // Used beyond monthly limit
		tierWhenUsed: text('tier_when_used').default('free'), // Tier during this month for analytics

		// Activity timestamps (for engagement tracking)
		lastConversationAt: timestamp('last_conversation_at'),
		lastRealtimeAt: timestamp('last_realtime_at'),
		firstActivityAt: timestamp('first_activity_at'), // First activity this month

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
