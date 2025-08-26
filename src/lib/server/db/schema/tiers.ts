import { pgTable, text, integer, boolean, decimal, index, timestamp } from 'drizzle-orm/pg-core';

// Tier definitions and limits
export const tiers = pgTable(
	'tiers',
	{
		id: text('id').primaryKey(), // 'free', 'plus', 'premium'
		name: text('name').notNull(),
		description: text('description').notNull(),

		// Monthly limits
		monthlyConversations: integer('monthly_conversations').notNull(),
		monthlySeconds: integer('monthly_seconds').notNull(), // Changed from monthly_minutes
		monthlyRealtimeSessions: integer('monthly_realtime_sessions').notNull(),

		// Session limits
		maxSessionLengthSeconds: integer('max_session_length_seconds'), // Changed from max_session_length_minutes
		sessionBankingEnabled: boolean('session_banking_enabled').default(false),
		maxBankedSeconds: integer('max_banked_seconds'), // Changed from max_banked_minutes

		// Feature access
		hasRealtimeAccess: boolean('has_realtime_access').default(false),
		hasAdvancedVoices: boolean('has_advanced_voices').default(false),
		hasAnalytics: boolean('has_analytics').default(false),
		hasCustomPhrases: boolean('has_custom_phrases').default(false),
		hasConversationMemory: boolean('has_conversation_memory').default(false),
		hasAnkiExport: boolean('has_anki_export').default(false),

		// Pricing
		monthlyPriceUsd: decimal('monthly_price_usd', { precision: 10, scale: 2 }),
		annualPriceUsd: decimal('annual_price_usd', { precision: 10, scale: 2 }),
		stripeProductId: text('stripe_product_id'), // null for free tier
		stripePriceIdMonthly: text('stripe_price_id_monthly'),
		stripePriceIdAnnual: text('stripe_price_id_annual'),

		// Timer settings
		conversationTimeoutMs: integer('conversation_timeout_ms'),
		warningThresholdMs: integer('warning_threshold_ms'),
		canExtend: boolean('can_extend').default(false),
		maxExtensions: integer('max_extensions').default(0),
		extensionDurationMs: integer('extension_duration_ms').default(0),

		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		// Performance index for active tiers
		index('tiers_is_active_idx').on(table.isActive),
		index('tiers_stripe_product_idx').on(table.stripeProductId)
	]
);
