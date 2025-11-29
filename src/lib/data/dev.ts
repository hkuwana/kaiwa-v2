// 🧪 Dev-only helpers and mock data
// Central place for demo usage status and other development-only data.
//
// NOTE: This file should only be imported from dev routes and stories,
// never from production user-facing code.

import type { Tier, UserUsage } from '$lib/server/db/types';
import type { UsageStatus } from '$lib/server/tier.service';
import { defaultTierConfigs, type UserTier } from '$lib/data/tiers';

function createDevUserUsage(tierId: UserTier, tier: Tier): UserUsage {
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

export function createDevUsageStatus(tierId: UserTier): UsageStatus {
	const tier = defaultTierConfigs[tierId];
	const usage = createDevUserUsage(tierId, tier);

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
