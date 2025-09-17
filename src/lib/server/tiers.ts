// 🏆 Server-side Tier Configurations
// This file contains tier configurations that should only be accessible server-side

import type { Tier, UserTier } from './db/types';
import { env } from '$env/dynamic/private';
import { SERVER_STRIPE_PRICE_IDS, isStripeDevServer } from './stripe-config';

// Default tier configurations - server-side only
export const serverTierConfigs: Record<UserTier, Tier> = {
	free: {
		id: 'free',
		name: 'Basic',
		description: 'For trying out Kaiwa',

		// Monthly limits (from pricing page)
		monthlyConversations: 100, // Unlimited conversations
		monthlySeconds: 900, // 15 minutes (5 conversations)
		monthlyRealtimeSessions: 100, // Unlimited sessions

		// Daily limits for free users (encourages daily engagement + upgrades)
		dailyConversations: 1, // 1 conversation per day
		dailySeconds: 180, // 3 minutes per day
		dailyAnalyses: 1, // 1 analysis per day

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
		maxMemories: 10, // 10 memory items for basic tier
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

		// No daily limits for plus users
		dailyConversations: null,
		dailySeconds: null,
		dailyAnalyses: null,

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

		// Pricing - using environment-aware price IDs
		monthlyPriceUsd: '19.00',
		annualPriceUsd: '144.00', // 20% discount
		stripeProductId: null, // Will be fetched from Stripe API when needed
		stripePriceIdMonthly: isStripeDevServer
			? SERVER_STRIPE_PRICE_IDS.plus_monthly.dev
			: SERVER_STRIPE_PRICE_IDS.plus_monthly.prod,
		stripePriceIdAnnual: isStripeDevServer
			? SERVER_STRIPE_PRICE_IDS.plus_annual.dev
			: SERVER_STRIPE_PRICE_IDS.plus_annual.prod,

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
		maxMemories: 50, // 50 memory items for plus tier
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

		// No daily limits for premium users
		dailyConversations: null,
		dailySeconds: null,
		dailyAnalyses: null,

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

		// Pricing - using environment-aware price IDs
		monthlyPriceUsd: '29.00',
		annualPriceUsd: '240.00', // 30% discount
		stripeProductId: null, // Will be fetched from Stripe API when needed
		stripePriceIdMonthly: isStripeDevServer
			? SERVER_STRIPE_PRICE_IDS.premium_monthly.dev
			: SERVER_STRIPE_PRICE_IDS.premium_monthly.prod,
		stripePriceIdAnnual: isStripeDevServer
			? SERVER_STRIPE_PRICE_IDS.premium_annual.dev
			: SERVER_STRIPE_PRICE_IDS.premium_annual.prod,
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
		maxMemories: 200, // 200 memory items for premium tier
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

// Helper to get all available Stripe price IDs for current environment
export function getAllStripePriceIds(): string[] {
	const priceIds: string[] = [];

	// Get current environment price IDs from tier configs
	Object.values(serverTierConfigs).forEach((tier) => {
		if (tier.stripePriceIdMonthly) priceIds.push(tier.stripePriceIdMonthly);
		if (tier.stripePriceIdAnnual) priceIds.push(tier.stripePriceIdAnnual);
	});

	// Include optional Early‑Backer price ID via env
	if (env.STRIPE_EARLY_BACKER_PRICE_ID) {
		priceIds.push(env.STRIPE_EARLY_BACKER_PRICE_ID);
	}

	// Filter out placeholder values
	return priceIds.filter((id) => id && !id.includes('placeholder'));
}

// Get environment info for debugging
export function getTierEnvironmentInfo() {
	return {
		isStripeDev: isStripeDevServer,
		currentTierConfigs: serverTierConfigs,
		availablePriceIds: getAllStripePriceIds(),
		stripeDevMode: env.STRIPE_DEV_MODE
	};
}

// Helper to get max memories for a tier
export function getMaxMemories(tierId: UserTier): number {
	return serverTierConfigs[tierId]?.maxMemories || 10;
}

// Re-export all helper functions for backward compatibility
export function getTierConfig(tierId: UserTier): Tier {
	return serverTierConfigs[tierId];
}

export function getTimerSettings(tierId: UserTier) {
	const config = serverTierConfigs[tierId];
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
	return serverTierConfigs[tierId]?.canExtend || false;
}

export function getConversationTimeout(tierId: UserTier): number {
	return serverTierConfigs[tierId]?.conversationTimeoutSeconds || 3 * 60 * 1000;
}

export function getWarningThreshold(tierId: UserTier): number {
	return serverTierConfigs[tierId]?.warningThresholdSeconds || 30 * 1000;
}

export function getMaxSessionLength(tierId: UserTier): number {
    return serverTierConfigs[tierId]?.maxSessionLengthSeconds || 180;
}

// Alias for clarity when consumers expect `sessionSeconds`
export function getSessionSeconds(tierId: UserTier): number {
    return serverTierConfigs[tierId]?.maxSessionLengthSeconds || 0;
}

export function getMonthlySeconds(tierId: UserTier): number {
	return serverTierConfigs[tierId]?.monthlySeconds || 1800;
}

export function hasSessionBanking(tierId: UserTier): boolean {
	return serverTierConfigs[tierId]?.sessionBankingEnabled || false;
}

export function getMaxBankedSeconds(tierId: UserTier): number {
	return serverTierConfigs[tierId]?.maxBankedSeconds || 0;
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
