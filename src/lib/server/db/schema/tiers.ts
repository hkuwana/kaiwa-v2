import { pgTable, text, integer, boolean, decimal, index } from 'drizzle-orm/pg-core';

// Tier definitions and limits
export const tiers = pgTable(
	'tiers',
	{
		id: text('id').primaryKey(), // 'free', 'pro', 'premium'
		name: text('name').notNull(),
		description: text('description'),

		// Monthly limits
		monthlyConversations: integer('monthly_conversations'),
		monthlyMinutes: integer('monthly_minutes'),
		monthlyRealtimeSessions: integer('monthly_realtime_sessions'),

		// Feature access
		hasRealtimeAccess: boolean('has_realtime_access').default(false),
		hasAdvancedVoices: boolean('has_advanced_voices').default(false),
		hasAnalytics: boolean('has_analytics').default(false),

		// Pricing
		monthlyPriceUsd: decimal('monthly_price_usd', { precision: 10, scale: 2 }),

		isActive: boolean('is_active').default(true)
	},
	(table) => [
		// Performance index for active tiers
		index('tiers_is_active_idx').on(table.isActive)
	]
);
