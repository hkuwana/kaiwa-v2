import {
	pgTable,
	text,
	integer,
	boolean,
	decimal,
	index,
	timestamp,
	pgEnum
} from 'drizzle-orm/pg-core';

/**
 * Memory level enumeration for conversation memory features
 */
export const memoryLevelEnum = pgEnum('memory_level', ['basic', 'human-like', 'elephant-like']);

/**
 * Phrase frequency enumeration for customized phrases
 */
export const phraseFrequencyEnum = pgEnum('phrase_frequency', ['weekly', 'daily']);

/**
 * 💎 Tiers table - Defines subscription tier limits and features
 *
 * This table stores the configuration for each subscription tier (free, plus, premium).
 * It defines usage limits (monthly conversations, seconds, realtime sessions),
 * feature access (advanced voices, analytics, deep analysis), pricing information,
 * session management settings (timeouts, extensions), and tier-specific capabilities
 * like conversation memory levels and Anki export limits.
 *
 * **Key Features:**
 * - 📊 Comprehensive usage limit definitions
 * - 🎯 Feature access control per tier
 * - 💰 Flexible pricing configuration
 * - ⏱️ Session management and timeout settings
 * - 🧠 Memory and learning feature controls
 * - 🔄 Banking/rollover capabilities for paid tiers
 *
 * @example
 * ```typescript
 * // Create a premium tier configuration
 * await db.insert(tiers).values({
 *   id: 'premium',
 *   name: 'Premium',
 *   description: 'Full access to all features',
 *   monthlyConversations: 1000,
 *   monthlySeconds: 36000, // 10 hours
 *   monthlyRealtimeSessions: 100,
 *   hasRealtimeAccess: true,
 *   hasAdvancedVoices: true,
 *   hasAnalytics: true,
 *   hasDeepAnalysis: true,
 *   monthlyPriceUsd: '19.99',
 *   annualPriceUsd: '199.99'
 * });
 * ```
 */
export const tiers = pgTable(
	'tiers',
	{
		id: text('id').primaryKey().notNull(),

		name: text('name').notNull(),

		description: text('description').notNull(),

		monthlyConversations: integer('monthly_conversations').notNull(),

		monthlySeconds: integer('monthly_seconds').notNull(),

		monthlyRealtimeSessions: integer('monthly_realtime_sessions').notNull(),

		dailyConversations: integer('daily_conversations').default(1),

		dailySeconds: integer('daily_seconds').default(180),

		dailyAnalyses: integer('daily_analyses').default(1),

		maxSessionLengthSeconds: integer('max_session_length_seconds').notNull(),

		sessionBankingEnabled: boolean('session_banking_enabled').default(false).notNull(),

		maxBankedSeconds: integer('max_banked_seconds').notNull(),

		hasRealtimeAccess: boolean('has_realtime_access').default(false).notNull(),

		hasAdvancedVoices: boolean('has_advanced_voices').default(false).notNull(),

		hasAnalytics: boolean('has_analytics').default(false).notNull(),

		hasDeepAnalysis: boolean('has_deep_analysis').default(false).notNull(),

		hasCustomPhrases: boolean('has_custom_phrases').default(false).notNull(),

		hasConversationMemory: boolean('has_conversation_memory').default(false).notNull(),

		hasAnkiExport: boolean('has_anki_export').default(false).notNull(),

		monthlyPriceUsd: decimal('monthly_price_usd', { precision: 10, scale: 2 }).notNull(),

		annualPriceUsd: decimal('annual_price_usd', { precision: 10, scale: 2 }).notNull(),

		stripeProductId: text('stripe_product_id'),

		stripePriceIdMonthly: text('stripe_price_id_monthly'),

		stripePriceIdAnnual: text('stripe_price_id_annual'),

		overagePricePerMinuteInCents: integer('overage_price_per_minute_in_cents')
			.default(10)
			.notNull(),

		conversationTimeoutSeconds: integer('conversation_timeout_seconds').notNull(),

		warningThresholdSeconds: integer('warning_threshold_seconds').notNull(),

		canExtend: boolean('can_extend').default(false).notNull(),

		maxExtensions: integer('max_extensions').default(0).notNull(),

		extensionDurationSeconds: integer('extension_duration_seconds').default(0).notNull(),

		feedbackSessionsPerMonth: text('feedback_sessions_per_month').default('unlimited').notNull(),

		customizedPhrasesFrequency: phraseFrequencyEnum('customized_phrases_frequency')
			.default('weekly')
			.notNull(),

		conversationMemoryLevel: memoryLevelEnum('conversation_memory_level')
			.default('basic')
			.notNull(),

		ankiExportLimit: integer('anki_export_limit').default(-1).notNull(),

		maxMemories: integer('max_memories').default(10).notNull(),

		maxCustomScenarios: integer('max_custom_scenarios').default(3).notNull(),

		maxPrivateCustomScenarios: integer('max_private_custom_scenarios').default(0).notNull(),

		isActive: boolean('is_active').default(true).notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull(),

		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		// Performance indexes for tier queries
		index('tiers_is_active_idx').on(table.isActive),
		index('tiers_stripe_product_idx').on(table.stripeProductId),
		index('tiers_monthly_price_idx').on(table.monthlyPriceUsd),
		// Composite index for active tier lookups
		index('tiers_active_pricing_idx').on(table.isActive, table.monthlyPriceUsd)
	]
);
