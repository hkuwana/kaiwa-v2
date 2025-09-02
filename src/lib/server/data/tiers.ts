// 🏆 Server-side Tier Configurations
// This file contains tier configurations that should only be accessible server-side

import type { Tier, UserTier } from '../db/types';

// Default tier configurations - server-side only
export const serverTierConfigs: Record<UserTier, Tier> = {
	free: {
		id: 'free',
		name: 'Basic',
		description: 'Perfect for trying out Kaiwa',

		// Monthly limits (from pricing page)
		monthlyConversations: 100, // Unlimited conversations
		monthlySeconds: 900, // 15 minutes (5 conversations)
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
		stripeProductId: 'prod_plus_123', // Replace with actual Stripe product ID
		stripePriceIdMonthly: 'price_plus_monthly_123', // Replace with actual Stripe price ID
		stripePriceIdAnnual: 'price_plus_annual_123', // Replace with actual Stripe price ID

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
		stripeProductId: 'prod_premium_456', // Replace with actual Stripe product ID
		stripePriceIdMonthly: 'price_premium_monthly_456', // Replace with actual Stripe price ID
		stripePriceIdAnnual: 'price_premium_annual_456', // Replace with actual Stripe price ID

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
export function getServerTierConfig(tierId: UserTier): Tier {
	return serverTierConfigs[tierId];
}

export function getServerTierConfigs(): Record<UserTier, Tier> {
	return serverTierConfigs;
}

// Helper to get Stripe price ID for a tier and billing cycle
export function getStripePriceId(
	tierId: UserTier,
	billingCycle: 'monthly' | 'annual'
): string | null {
	const tier = serverTierConfigs[tierId];
	if (!tier) return null;

	return billingCycle === 'monthly' ? tier.stripePriceIdMonthly : tier.stripePriceIdAnnual;
}

// Helper to get all available Stripe price IDs
export function getAllStripePriceIds(): string[] {
	const priceIds: string[] = [];

	Object.values(serverTierConfigs).forEach((tier) => {
		if (tier.stripePriceIdMonthly) priceIds.push(tier.stripePriceIdMonthly);
		if (tier.stripePriceIdAnnual) priceIds.push(tier.stripePriceIdAnnual);
	});

	return priceIds;
}
