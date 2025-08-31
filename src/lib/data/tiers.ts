// tier.ts
export type UserTier = 'free' | 'plus' | 'premium';

// This interface matches your database schema exactly
export interface TierConfig {
	id: string;
	name: string;
	description: string | null;

	// Monthly limits
	monthlyConversations: number | null;
	monthlySeconds: number | null; // Changed from monthlyMinutes
	monthlyRealtimeSessions: number | null;

	// Session limits
	maxSessionLengthSeconds: number | null; // Changed from maxSessionLengthMinutes
	sessionBankingEnabled: boolean;
	maxBankedSeconds: number | null; // Changed from maxBankedMinutes

	// Feature access
	hasRealtimeAccess: boolean;
	hasAdvancedVoices: boolean;
	hasAnalytics: boolean;
	hasCustomPhrases: boolean;
	hasConversationMemory: boolean;
	hasAnkiExport: boolean;

	// Pricing
	monthlyPriceUsd: string | null; // Decimal from DB comes as string
	annualPriceUsd: string | null;
	stripeProductId: string | null;
	stripePriceIdMonthly: string | null;
	stripePriceIdAnnual: string | null;

	// Timer settings
	conversationTimeoutMs: number | null;
	warningThresholdMs: number | null;
	canExtend: boolean;
	maxExtensions: number;
	extensionDurationMs: number;

	// Additional fields for overage (not in DB, calculated)
	overagePricePerMinute?: number;
	feedbackSessionsPerMonth?: number | 'unlimited';
	customizedPhrasesFrequency?: 'weekly' | 'daily';
	conversationMemoryLevel?: 'basic' | 'human-like' | 'elephant-like';
	ankiExportLimit?: number | 'unlimited';
}

// Default tier configurations - these would typically come from your database
// but having defaults helps with type safety and initial setup
export const defaultTierConfigs: Record<UserTier, TierConfig> = {
	free: {
		id: 'free',
		name: 'Basic',
		description: 'Perfect for trying out Kaiwa',

		// Monthly limits (from pricing page)
		monthlyConversations: null, // Unlimited conversations
		monthlySeconds: 1800, // 30 minutes = 1800 seconds
		monthlyRealtimeSessions: null, // Unlimited sessions

		// Session limits
		maxSessionLengthSeconds: 180, // 3 minutes = 180 seconds
		sessionBankingEnabled: false,
		maxBankedSeconds: 0,

		// Feature access
		hasRealtimeAccess: true,
		hasAdvancedVoices: false,
		hasAnalytics: false,
		hasCustomPhrases: false,
		hasConversationMemory: true, // Basic level
		hasAnkiExport: false, // Limited to first 100 words

		// Pricing
		monthlyPriceUsd: '0',
		annualPriceUsd: '0',
		stripeProductId: null,
		stripePriceIdMonthly: null,
		stripePriceIdAnnual: null,

		// Timer settings
		conversationTimeoutMs: 3 * 60 * 1000, // 3 minutes
		warningThresholdMs: 30 * 1000, // 30 seconds
		canExtend: false,
		maxExtensions: 0,
		extensionDurationMs: 0,

		// Additional calculated fields
		overagePricePerMinute: 0.1,
		feedbackSessionsPerMonth: 5,
		customizedPhrasesFrequency: 'weekly',
		conversationMemoryLevel: 'basic',
		ankiExportLimit: 100
	},

	plus: {
		id: 'plus',
		name: 'Plus',
		description: 'For serious language learners',

		// Monthly limits
		monthlyConversations: null, // Unlimited
		monthlySeconds: 18000, // 300 minutes = 18000 seconds
		monthlyRealtimeSessions: null, // Unlimited

		// Session limits
		maxSessionLengthSeconds: 600, // 10 minutes = 600 seconds
		sessionBankingEnabled: true,
		maxBankedSeconds: 6000, // 100 minutes = 6000 seconds

		// Feature access
		hasRealtimeAccess: true,
		hasAdvancedVoices: true,
		hasAnalytics: true,
		hasCustomPhrases: true,
		hasConversationMemory: true,
		hasAnkiExport: true,

		// Pricing
		monthlyPriceUsd: '15.00',
		annualPriceUsd: '144.00', // 20% discount
		stripeProductId: null, // Will be populated from environment
		stripePriceIdMonthly: null, // Will be populated from environment
		stripePriceIdAnnual: null, // Will be populated from environment

		// Timer settings
		conversationTimeoutMs: 10 * 60 * 1000, // 10 minutes
		warningThresholdMs: 60 * 1000, // 1 minute
		canExtend: true,
		maxExtensions: 3,
		extensionDurationMs: 5 * 60 * 1000, // 5 minutes per extension

		// Additional calculated fields
		overagePricePerMinute: 0.08,
		feedbackSessionsPerMonth: 'unlimited',
		customizedPhrasesFrequency: 'daily',
		conversationMemoryLevel: 'human-like',
		ankiExportLimit: 'unlimited'
	},

	premium: {
		id: 'premium',
		name: 'Premium',
		description: 'For power users who want more practice time',

		// Monthly limits
		monthlyConversations: null, // Unlimited
		monthlySeconds: 36000, // 600 minutes = 36000 seconds
		monthlyRealtimeSessions: null, // Unlimited

		// Session limits
		maxSessionLengthSeconds: 600, // 10 minutes = 600 seconds
		sessionBankingEnabled: true,
		maxBankedSeconds: 12000, // 200 minutes = 12000 seconds

		// Feature access
		hasRealtimeAccess: true,
		hasAdvancedVoices: true,
		hasAnalytics: true,
		hasCustomPhrases: true,
		hasConversationMemory: true,
		hasAnkiExport: true,

		// Pricing
		monthlyPriceUsd: '25.00',
		annualPriceUsd: '240.00', // 20% discount
		stripeProductId: null, // Will be populated from environment
		stripePriceIdMonthly: null, // Will be populated from environment
		stripePriceIdAnnual: null, // Will be populated from environment

		// Timer settings
		conversationTimeoutMs: 10 * 60 * 1000, // 10 minutes
		warningThresholdMs: 60 * 1000, // 1 minute
		canExtend: true,
		maxExtensions: 5,
		extensionDurationMs: 5 * 60 * 1000, // 5 minutes per extension

		// Additional calculated fields
		overagePricePerMinute: 0.05,
		feedbackSessionsPerMonth: 'unlimited',
		customizedPhrasesFrequency: 'daily',
		conversationMemoryLevel: 'elephant-like',
		ankiExportLimit: 'unlimited'
	}
};

// Helper functions to work with tier configurations
export function getTierConfig(tierId: UserTier): TierConfig {
	return defaultTierConfigs[tierId];
}

export function getTimerSettings(tierId: UserTier) {
	const config = defaultTierConfigs[tierId];
	if (!config) return null;

	return {
		timeoutMs: config.conversationTimeoutMs || 3 * 60 * 1000,
		warningThresholdMs: config.warningThresholdMs || 30 * 1000,
		extendable: config.canExtend || false,
		maxExtensions: config.maxExtensions || 0,
		extensionDurationMs: config.extensionDurationMs || 0
	};
}

export function canExtendConversation(tierId: UserTier): boolean {
	return defaultTierConfigs[tierId]?.canExtend || false;
}

export function getConversationTimeout(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.conversationTimeoutMs || 3 * 60 * 1000;
}

export function getWarningThreshold(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.warningThresholdMs || 30 * 1000;
}

export function getMaxSessionLength(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.maxSessionLengthSeconds || 180; // Changed from maxSessionLengthMinutes, default 3 minutes = 180 seconds
}

export function getMonthlySeconds(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.monthlySeconds || 1800; // Changed from getMonthlyMinutes, default 30 minutes = 1800 seconds
}

export function hasSessionBanking(tierId: UserTier): boolean {
	return defaultTierConfigs[tierId]?.sessionBankingEnabled || false;
}

export function getMaxBankedSeconds(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.maxBankedSeconds || 0; // Changed from getMaxBankedMinutes
}

// Helper to find tier by Stripe IDs
export function getTierByStripePriceId(
	tiers: TierConfig[],
	priceId: string
): { tier: UserTier; billingPeriod: 'monthly' | 'annual' } | null {
	for (const tier of tiers) {
		if (tier.stripePriceIdMonthly === priceId) {
			return { tier: tier.id as UserTier, billingPeriod: 'monthly' };
		}
		if (tier.stripePriceIdAnnual === priceId) {
			return { tier: tier.id as UserTier, billingPeriod: 'annual' };
		}
	}
	return null;
}

export function getTierByStripeProductId(tiers: TierConfig[], productId: string): UserTier | null {
	const tier = tiers.find((t) => t.stripeProductId === productId);
	return tier ? (tier.id as UserTier) : null;
}
