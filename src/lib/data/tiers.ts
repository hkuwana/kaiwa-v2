// 🏆 Client-side Tier Access (safe subset)
// This file provides a client-safe mirror of tier configurations.
// DO NOT import server modules here. Only expose non-sensitive fields.
//
// BILLING CYCLE: All subscriptions use calendar months (not 28-day cycles).
// See $lib/server/tiers.ts for detailed billing documentation.

import type { Tier, UserUsage } from '$lib/server/db/types';
import type { UsageStatus } from '$lib/server/tier.service';

export type UserTier = 'free' | 'plus' | 'premium';

// Client-safe defaults (mirrors server values, without Stripe IDs)
export const defaultTierConfigs: Record<UserTier, Tier> = {
	free: {
		id: 'free',
		name: 'Basic',
		description: 'Perfect for trying out Kaiwa',
		monthlyConversations: 100,
		monthlySeconds: 900,
		monthlyRealtimeSessions: 100,
		dailyConversations: 1,
		dailySeconds: 240,
		dailyAnalyses: 1,
		maxSessionLengthSeconds: 240,
		sessionBankingEnabled: false,
		maxBankedSeconds: 0,
		hasRealtimeAccess: true,
		hasAdvancedVoices: false,
		hasAnalytics: false,
		hasCustomPhrases: false,
		hasConversationMemory: true,
		hasAnkiExport: true,
		monthlyPriceUsd: '0',
		annualPriceUsd: '0',
		conversationTimeoutSeconds: 5 * 60,
		warningThresholdSeconds: 30,
		canExtend: false,
		maxExtensions: 0,
		extensionDurationSeconds: 0,
		overagePricePerMinuteInCents: 10,
		feedbackSessionsPerMonth: '100',
		customizedPhrasesFrequency: 'weekly',
		conversationMemoryLevel: 'basic',
		stripeProductId: null,
		stripePriceIdMonthly: null,
		stripePriceIdAnnual: null,
		ankiExportLimit: 0,
		maxMemories: 0,
		isActive: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		hasDeepAnalysis: false,
		maxCustomScenarios: 0,
		maxPrivateCustomScenarios: 0
	},
	plus: {
		id: 'plus',
		name: 'Plus',
		description: '10 hours of AI practice + automated 28-day learning paths',
		monthlyConversations: 300,
		monthlySeconds: 36000, // 600 minutes = 10 hours
		monthlyRealtimeSessions: 300,
		dailyConversations: null,
		dailySeconds: null,
		dailyAnalyses: null,
		maxSessionLengthSeconds: 900, // 15 minutes per session
		sessionBankingEnabled: true,
		maxBankedSeconds: 18000, // 5 hours rollover
		hasRealtimeAccess: true,
		hasAdvancedVoices: true,
		hasAnalytics: true,
		hasCustomPhrases: true,
		hasConversationMemory: true,
		hasAnkiExport: true,
		monthlyPriceUsd: '29.00',
		annualPriceUsd: '232.00', // ~33% discount
		conversationTimeoutSeconds: 15 * 60,
		warningThresholdSeconds: 60,
		canExtend: true,
		maxExtensions: 3,
		extensionDurationSeconds: 5 * 60,
		overagePricePerMinuteInCents: 8,
		feedbackSessionsPerMonth: 'unlimited',
		customizedPhrasesFrequency: 'daily',
		conversationMemoryLevel: 'human-like',
		stripeProductId: null,
		stripePriceIdMonthly: null,
		stripePriceIdAnnual: null,
		ankiExportLimit: 0,
		maxMemories: 0,
		isActive: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		hasDeepAnalysis: false,
		maxCustomScenarios: 0,
		maxPrivateCustomScenarios: 0
	},
	premium: {
		id: 'premium',
		name: 'Premium',
		description: 'Everything in Plus + 1-on-1 with Founder, direct support, and custom paths',
		monthlyConversations: 300,
		monthlySeconds: 36000, // 600 minutes = 10 hours
		monthlyRealtimeSessions: 300,
		dailyConversations: null,
		dailySeconds: null,
		dailyAnalyses: null,
		maxSessionLengthSeconds: 900, // 15 minutes per session
		sessionBankingEnabled: true,
		maxBankedSeconds: 36000, // 10 hours rollover (more generous)
		hasRealtimeAccess: true,
		hasAdvancedVoices: true,
		hasAnalytics: true,
		hasCustomPhrases: true,
		hasConversationMemory: true,
		hasAnkiExport: true,
		monthlyPriceUsd: '99.00',
		annualPriceUsd: '948.00', // $79/month billed annually (~20% discount)
		conversationTimeoutSeconds: 15 * 60,
		warningThresholdSeconds: 60,
		canExtend: true,
		maxExtensions: 5,
		extensionDurationSeconds: 5 * 60,
		overagePricePerMinuteInCents: 5,
		feedbackSessionsPerMonth: 'unlimited',
		customizedPhrasesFrequency: 'daily',
		conversationMemoryLevel: 'elephant-like',
		stripeProductId: null,
		stripePriceIdMonthly: null,
		stripePriceIdAnnual: null,
		ankiExportLimit: 0,
		maxMemories: 0,
		isActive: false,
		createdAt: new Date(),
		updatedAt: new Date(),
		hasDeepAnalysis: false,
		maxCustomScenarios: 0,
		maxPrivateCustomScenarios: 0
	}
};

// Client helpers (safe)
export function getTierConfig(tierId: UserTier): Tier {
	return defaultTierConfigs[tierId];
}

export function getTimerSettings(tierId: UserTier) {
	const t = defaultTierConfigs[tierId];
	if (!t) return null;
	return {
		timeoutMs: t.conversationTimeoutSeconds,
		warningThresholdMs: t.warningThresholdSeconds,
		extendable: t.canExtend,
		maxExtensions: t.maxExtensions,
		extensionDurationMs: t.extensionDurationSeconds
	};
}

export function canExtendConversation(tierId: UserTier): boolean {
	return !!defaultTierConfigs[tierId]?.canExtend;
}

export function getConversationTimeout(tierId: UserTier): number {
	return (defaultTierConfigs[tierId]?.conversationTimeoutSeconds || 0) * 1000;
}

export function getWarningThreshold(tierId: UserTier): number {
	return (defaultTierConfigs[tierId]?.warningThresholdSeconds || 0) * 1000;
}

export function getMaxSessionLength(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.maxSessionLengthSeconds || 0;
}

// Alias for clarity when consumers expect `sessionSeconds`
export function getSessionSeconds(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.maxSessionLengthSeconds || 0;
}

export function getMonthlySeconds(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.monthlySeconds || 0;
}

export function hasSessionBanking(tierId: UserTier): boolean {
	return !!defaultTierConfigs[tierId]?.sessionBankingEnabled;
}

export function getMaxBankedSeconds(tierId: UserTier): number {
	return defaultTierConfigs[tierId]?.maxBankedSeconds || 0;
}

// NOTE: Stripe product/price IDs and any sensitive mapping SHOULD come from the backend.
// For Stripe price IDs, use `$lib/data/stripe` or fetch `/api/billing/pricing` and Stripe endpoints.
// Intentionally not exposing getTierByStripePriceId / getTierByStripeProductId on the client.

// ---------------------------------------------------------------------------
// Demo / mock usage helpers for dev components
// ---------------------------------------------------------------------------

function createDemoUserUsage(tierId: UserTier, tier: Tier): UserUsage {
	const now = new Date();

	// Use tier limits to derive realistic demo usage (around 60–70% of quota).
	const monthlyConversations = tier.monthlyConversations ?? 100;
	const monthlySeconds = tier.monthlySeconds ?? 60 * 60; // 1 hour default
	const monthlyRealtimeSessions = tier.monthlyRealtimeSessions ?? 50;

	const conversationsUsed = Math.max(
		1,
		Math.min(monthlyConversations - 1, Math.floor(monthlyConversations * 0.6))
	);
	const secondsUsed = Math.max(60, Math.min(monthlySeconds - 60, Math.floor(monthlySeconds * 0.7)));
	const realtimeSessionsUsed = Math.max(
		1,
		Math.min(monthlyRealtimeSessions - 1, Math.floor(monthlyRealtimeSessions * 0.4))
	);

	const base: UserUsage = {
		userId: 'demo-user',
		period: 'demo-period',
		conversationsUsed,
		secondsUsed,
		realtimeSessionsUsed,
		bankedSeconds: tier.sessionBankingEnabled ? Math.floor((tier.maxBankedSeconds ?? 0) * 0.3) : 0,
		bankedSecondsUsed: 0,
		ankiExportsUsed: 0,
		sessionExtensionsUsed: 0,
		advancedVoiceSeconds: 0,
		analysesUsed: 0,
		basicAnalysesUsed: 0,
		quickStatsUsed: 0,
		grammarSuggestionsUsed: 0,
		advancedGrammarUsed: 0,
		fluencyAnalysisUsed: 0,
		phraseSuggestionsUsed: 0,
		onboardingProfileUsed: 0,
		pronunciationAnalysisUsed: 0,
		speechRhythmUsed: 0,
		audioSuggestionUsed: 0,
		dailyUsage: {},
		completedSessions: 0,
		longestSessionSeconds: tier.maxSessionLengthSeconds ?? 0,
		averageSessionSeconds: tier.maxSessionLengthSeconds
			? Math.floor(tier.maxSessionLengthSeconds / 2)
			: 0,
		overageSeconds: 0,
		tierWhenUsed: tierId,
		lastConversationAt: now,
		lastRealtimeAt: now,
		lastAnalysisAt: null,
		firstActivityAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
		createdAt: now,
		updatedAt: now
	};

	return base;
}

export function createDemoUsageStatus(tierId: UserTier): UsageStatus {
	const tier = defaultTierConfigs[tierId];
	const usage = createDemoUserUsage(tierId, tier);

	const conversationsUsed = usage.conversationsUsed || 0;
	const realtimeSessionsUsed = usage.realtimeSessionsUsed || 0;

	const canStartConversation =
		tier.monthlyConversations === null || conversationsUsed < (tier.monthlyConversations ?? 0);

	const canUseRealtime =
		tier.monthlyRealtimeSessions === null ||
		realtimeSessionsUsed < (tier.monthlyRealtimeSessions ?? 0);

	return {
		tier,
		usage,
		canStartConversation,
		canUseRealtime,
		resetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
	};
}
