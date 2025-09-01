import type { Tier, UserTier } from '$lib/server/db/types';
// DEPRECATED: This file is being replaced by the database schema
// Use the Tier type from $lib/server/db/types instead
// tier.ts

// Re-export UserTier for compatibility
export type { UserTier };

// Default tier configurations - these would typically come from your database
// but having defaults helps with type safety and initial setup
export const defaultTierConfigs: Record<UserTier, Tier> = {
	free: {
		id: 'free',
		name: 'Basic',
		description: 'Perfect for trying out Kaiwa',

		// Monthly limits (from pricing page)
		monthlyConversations: 100, // Unlimited conversations
		monthlySeconds: 1800, // 30 minutes = 1800 seconds
		monthlyRealtimeSessions: 100, // Unlimited sessions

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
		conversationTimeoutSeconds: 3 * 60, // 3 minutes
		warningThresholdSeconds: 30, // 30 seconds
		canExtend: false,
		maxExtensions: 0,
		extensionDurationSeconds: 0,

		// Additional calculated fields
		overagePricePerMinuteInCents: 10,
		customizedPhrasesFrequency: 'weekly',
		conversationMemoryLevel: 'basic',
		ankiExportLimit: 100,
		feedbackSessionsPerMonth: '100',
		isActive: false,
		createdAt: new Date(),
		updatedAt: new Date()
	},

	plus: {
		id: 'plus',
		name: 'Plus',
		description: 'For serious language learners',

		// Monthly limits
		monthlyConversations: 100, // Unlimited
		monthlySeconds: 18000, // 300 minutes = 18000 seconds
		monthlyRealtimeSessions: 100, // Unlimited

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
		conversationTimeoutSeconds: 10 * 60, // 10 minutes
		warningThresholdSeconds: 60, // 1 minute
		canExtend: true,
		maxExtensions: 3,
		extensionDurationSeconds: 5 * 60, // 5 minutes per extension

		// Additional calculated fields
		overagePricePerMinuteInCents: 8,
		feedbackSessionsPerMonth: 'unlimited',
		customizedPhrasesFrequency: 'daily',
		conversationMemoryLevel: 'human-like',
		ankiExportLimit: -1,
		isActive: false,
		createdAt: new Date(),
		updatedAt: new Date()
	},

	premium: {
		id: 'premium',
		name: 'Premium',
		description: 'For power users who want more practice time',

		// Monthly limits
		monthlyConversations: 100, // Unlimited
		monthlySeconds: 36000, // 600 minutes = 36000 seconds
		monthlyRealtimeSessions: 100, // Unlimited

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
		conversationTimeoutSeconds: 10 * 60, // 10 minutes
		warningThresholdSeconds: 60, // 1 minute
		canExtend: true,
		maxExtensions: 5,
		extensionDurationSeconds: 5 * 60, // 5 minutes per extension

		// Additional calculated fields
		overagePricePerMinuteInCents: 5,
		feedbackSessionsPerMonth: 'unlimited',
		customizedPhrasesFrequency: 'daily',
		conversationMemoryLevel: 'elephant-like',
		ankiExportLimit: -1,
		isActive: false,
		createdAt: new Date(),
		updatedAt: new Date()
	}
};

// Helper functions to work with tier configurations
export function getTierConfig(tierId: UserTier): Tier {
	return defaultTierConfigs[tierId];
}

export function getTimerSettings(tierId: UserTier) {
	const config = defaultTierConfigs[tierId];
	if (!config) return null;

	return {
		timeoutMs: config.conversationTimeoutSeconds || 3 * 60,
		warningThresholdMs: config.warningThresholdSeconds || 30,
		extendable: config.canExtend || false,
		maxExtensions: config.maxExtensions || 0,
		extensionDurationMs: config.extensionDurationSeconds || 0
	};
}

export function canExtendConversation(tierId: UserTier): boolean {
	return defaultTierConfigs[tierId]?.canExtend || false;
}

export function getConversationTimeout(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.conversationTimeoutSeconds || 3 * 60 * 1000;
}

export function getWarningThreshold(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.warningThresholdSeconds || 30 * 1000;
}

export function getMaxSessionLength(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.maxSessionLengthSeconds || 180; // default 3 minutes = 180 seconds
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
	tiers: Tier[],
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

export function getTierByStripeProductId(tiers: Tier[], productId: string): UserTier | null {
	const tier = tiers.find((t) => t.stripeProductId === productId);
	return tier ? (tier.id as UserTier) : null;
}
