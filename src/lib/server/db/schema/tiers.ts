import { pgTable, text, integer, boolean, decimal, index, timestamp } from 'drizzle-orm/pg-core';

// Tier definitions and limits
export const tiers = pgTable(
	'tiers',
	{
		id: text('id').primaryKey().notNull(), // 'free', 'plus', 'premium'
		name: text('name').notNull(),
		description: text('description').notNull(),

		// Monthly limits
		monthlyConversations: integer('monthly_conversations').notNull(),
		monthlySeconds: integer('monthly_seconds').notNull(), // Changed from monthly_minutes
		monthlyRealtimeSessions: integer('monthly_realtime_sessions').notNull(),

		// Daily limits (mainly for free tier)
		dailyConversations: integer('daily_conversations').default(1), // null = no daily limit
		dailySeconds: integer('daily_seconds').default(180), // null = no daily limit
		dailyAnalyses: integer('daily_analyses').default(1), // null = no daily limit

		// Session limits
		maxSessionLengthSeconds: integer('max_session_length_seconds').notNull(), // Changed from max_session_length_minutes
		sessionBankingEnabled: boolean('session_banking_enabled').default(false).notNull(),
		maxBankedSeconds: integer('max_banked_seconds').notNull(), // Changed from max_banked_minutes

		// Feature access
		hasRealtimeAccess: boolean('has_realtime_access').default(false).notNull(),
		hasAdvancedVoices: boolean('has_advanced_voices').default(false).notNull(),
		hasAnalytics: boolean('has_analytics').default(false).notNull(),
		hasDeepAnalysis: boolean('has_deep_analysis').default(false).notNull(),
		hasCustomPhrases: boolean('has_custom_phrases').default(false).notNull(),
		hasConversationMemory: boolean('has_conversation_memory').default(false).notNull(),
		hasAnkiExport: boolean('has_anki_export').default(false).notNull(),

		// Pricing
		monthlyPriceUsd: decimal('monthly_price_usd', { precision: 10, scale: 2 }).notNull(),
		annualPriceUsd: decimal('annual_price_usd', { precision: 10, scale: 2 }).notNull(),
		stripeProductId: text('stripe_product_id'), // null for free tier
		stripePriceIdMonthly: text('stripe_price_id_monthly'),
		stripePriceIdAnnual: text('stripe_price_id_annual'),
		overagePricePerMinuteInCents: integer('overage_price_per_minute_in_cents')
			.default(10)
			.notNull(),

		// Timer settings
		conversationTimeoutSeconds: integer('conversation_timeout_seconds').notNull(),
		warningThresholdSeconds: integer('warning_threshold_seconds').notNull(),
		canExtend: boolean('can_extend').default(false).notNull(),
		maxExtensions: integer('max_extensions').default(0).notNull(),
		extensionDurationSeconds: integer('extension_duration_seconds').default(0).notNull(),

		// Additional calculated fields (
		feedbackSessionsPerMonth: text('feedback_sessions_per_month').default('unlimited').notNull(), // 'unlimited' or number
		customizedPhrasesFrequency: text('customized_phrases_frequency').default('weekly').notNull(), // 'weekly' | 'daily'
		conversationMemoryLevel: text('conversation_memory_level').default('basic').notNull(), // 'basic' | 'human-like' | 'elephant-like'
		ankiExportLimit: integer('anki_export_limit').default(-1).notNull(), // 'unlimited' or number
		maxMemories: integer('max_memories').default(10).notNull(), // Maximum number of memory items

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
