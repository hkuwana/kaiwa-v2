import { logger } from '$lib/logger';
// 📊 Clean Usage Service (Pure Functions)
// Wraps UserUsageRepository with tier-aware business logic

import { userUsageRepository } from '../repositories';
import { getUserCurrentTier } from './payment.service';
import { serverTierConfigs } from '../tiers';
// Clean usage service - no extra imports needed

// =============================================================================
// PURE FUNCTIONS - NO SIDE EFFECTS
// =============================================================================

/**
 * Get current month usage for user (with defaults)
 */
export async function getCurrentUsage(userId: string) {
	const usage = await userUsageRepository.getCurrentMonthUsage(userId);

	// Return with safe defaults
	return {
		userId,
		period: getCurrentPeriod(),
		conversationsUsed: usage?.conversationsUsed ?? 0,
		secondsUsed: usage?.secondsUsed ?? 0,
		realtimeSessionsUsed: usage?.realtimeSessionsUsed ?? 0,
		bankedSeconds: usage?.bankedSeconds ?? 0,
		bankedSecondsUsed: usage?.bankedSecondsUsed ?? 0,

		// Feature usage
		ankiExportsUsed: usage?.ankiExportsUsed ?? 0,
		sessionExtensionsUsed: usage?.sessionExtensionsUsed ?? 0,
		advancedVoiceSeconds: usage?.advancedVoiceSeconds ?? 0,
		analysesUsed: usage?.analysesUsed ?? 0,

		// Analysis usage by type (MVP approach)
		basicAnalysesUsed: usage?.basicAnalysesUsed ?? 0,
		advancedGrammarUsed: usage?.advancedGrammarUsed ?? 0,
		fluencyAnalysisUsed: usage?.fluencyAnalysisUsed ?? 0,
		onboardingProfileUsed: usage?.onboardingProfileUsed ?? 0,
		pronunciationAnalysisUsed: usage?.pronunciationAnalysisUsed ?? 0,
		speechRhythmUsed: usage?.speechRhythmUsed ?? 0,

		// Quality metrics
		completedSessions: usage?.completedSessions ?? 0,
		longestSessionSeconds: usage?.longestSessionSeconds ?? 0,
		averageSessionSeconds: usage?.averageSessionSeconds ?? 0,

		// Business analytics
		overageSeconds: usage?.overageSeconds ?? 0,
		tierWhenUsed: usage?.tierWhenUsed ?? 'free',

		// Activity timestamps
		lastConversationAt: usage?.lastConversationAt,
		lastRealtimeAt: usage?.lastRealtimeAt,
		firstActivityAt: usage?.firstActivityAt,

		createdAt: usage?.createdAt ?? new Date(),
		updatedAt: usage?.updatedAt ?? new Date()
	};
}

/**
 * Check if user can use a specific feature
 */
export async function canUseFeature(
	userId: string,
	feature: {
		type:
			| 'conversation'
			| 'seconds'
			| 'realtime_session'
			| 'anki_export'
			| 'session_extension'
			| 'advanced_voice';
		amount?: number;
	}
): Promise<{
	canUse: boolean;
	reason: string;
	current: number;
	limit: number;
	available: number;
	unlimited: boolean;
}> {
	const [usage, userTier] = await Promise.all([
		getCurrentUsage(userId),
		getUserCurrentTier(userId)
	]);

	const tierConfig = serverTierConfigs[userTier];

	switch (feature.type) {
		case 'conversation': {
			const limit = tierConfig.monthlyConversations;
			const unlimited = limit === 100; // 100 = unlimited in your config
			const available = unlimited ? 999999 : limit - usage.conversationsUsed;

			return {
				canUse: unlimited || usage.conversationsUsed < limit,
				reason: unlimited
					? 'Unlimited conversations'
					: available > 0
						? `${available} conversations remaining`
						: 'Monthly conversation limit reached',
				current: usage.conversationsUsed,
				limit,
				available: Math.max(0, available),
				unlimited
			};
		}

		case 'seconds': {
			const requestedSeconds = feature.amount ?? 0;
			const monthlyLimit = tierConfig.monthlySeconds;
			const totalAvailable = monthlyLimit + usage.bankedSeconds;
			const totalUsed = usage.secondsUsed + usage.bankedSecondsUsed;
			const available = totalAvailable - totalUsed;

			return {
				canUse: available >= requestedSeconds,
				reason:
					available >= requestedSeconds
						? `${available} seconds available (${Math.floor(available / 60)}min)`
						: `Not enough time (need ${requestedSeconds}s, have ${available}s)`,
				current: totalUsed,
				limit: totalAvailable,
				available: Math.max(0, available),
				unlimited: false
			};
		}

		case 'realtime_session': {
			const limit = tierConfig.monthlyRealtimeSessions;
			const unlimited = limit === 100; // 100 = unlimited
			const available = unlimited ? 999999 : limit - usage.realtimeSessionsUsed;

			return {
				canUse: unlimited || usage.realtimeSessionsUsed < limit,
				reason: unlimited
					? 'Unlimited realtime sessions'
					: available > 0
						? `${available} realtime sessions remaining`
						: 'Monthly realtime session limit reached',
				current: usage.realtimeSessionsUsed,
				limit,
				available: Math.max(0, available),
				unlimited
			};
		}

		case 'anki_export': {
			const limit = tierConfig.ankiExportLimit;
			const unlimited = limit === -1; // -1 = unlimited
			const hasFeature = tierConfig.hasAnkiExport;
			const available = unlimited ? 999999 : Math.max(0, limit - usage.ankiExportsUsed);

			return {
				canUse: hasFeature && (unlimited || usage.ankiExportsUsed < limit),
				reason: !hasFeature
					? 'Anki export not available on your plan'
					: unlimited
						? 'Unlimited Anki exports'
						: available > 0
							? `${available} Anki exports remaining`
							: 'Monthly Anki export limit reached',
				current: usage.ankiExportsUsed,
				limit: unlimited ? 999999 : limit,
				available,
				unlimited: unlimited && hasFeature
			};
		}

		case 'session_extension': {
			const limit = tierConfig.maxExtensions;
			const canExtend = tierConfig.canExtend;
			const available = Math.max(0, limit - usage.sessionExtensionsUsed);

			return {
				canUse: canExtend && usage.sessionExtensionsUsed < limit,
				reason: !canExtend
					? 'Session extensions not available on your plan'
					: available > 0
						? `${available} session extensions remaining`
						: 'Session extension limit reached',
				current: usage.sessionExtensionsUsed,
				limit,
				available,
				unlimited: false
			};
		}

		case 'advanced_voice': {
			const hasFeature = tierConfig.hasAdvancedVoices;

			return {
				canUse: hasFeature,
				reason: hasFeature
					? 'Advanced voices available'
					: 'Advanced voices not available on your plan',
				current: usage.advancedVoiceSeconds,
				limit: 999999, // No limit on advanced voice usage, just feature access
				available: 999999,
				unlimited: hasFeature
			};
		}

		default:
			return {
				canUse: false,
				reason: 'Unknown feature type',
				current: 0,
				limit: 0,
				available: 0,
				unlimited: false
			};
	}
}

/**
 * Get comprehensive usage summary with tier limits
 */
export async function getUsageSummary(userId: string) {
	const [usage, userTier] = await Promise.all([
		getCurrentUsage(userId),
		getUserCurrentTier(userId)
	]);

	const tierConfig = serverTierConfigs[userTier];

	// Check each feature
	const [
		conversationCheck,
		secondsCheck,
		realtimeCheck,
		ankiCheck,
		extensionCheck,
		advancedVoiceCheck
	] = await Promise.all([
		canUseFeature(userId, { type: 'conversation' }),
		canUseFeature(userId, { type: 'seconds', amount: 0 }),
		canUseFeature(userId, { type: 'realtime_session' }),
		canUseFeature(userId, { type: 'anki_export' }),
		canUseFeature(userId, { type: 'session_extension' }),
		canUseFeature(userId, { type: 'advanced_voice' })
	]);

	return {
		userId,
		period: usage.period,
		tier: userTier,

		conversations: {
			used: usage.conversationsUsed,
			limit: conversationCheck.limit,
			available: conversationCheck.available,
			unlimited: conversationCheck.unlimited,
			canUse: conversationCheck.canUse
		},

		seconds: {
			// Raw usage
			monthlyUsed: usage.secondsUsed,
			bankedUsed: usage.bankedSecondsUsed,
			totalUsed: usage.secondsUsed + usage.bankedSecondsUsed,

			// Limits
			monthlyLimit: tierConfig.monthlySeconds,
			bankedAvailable: usage.bankedSeconds,
			totalLimit: tierConfig.monthlySeconds + usage.bankedSeconds,

			// Available
			available: secondsCheck.available,
			canUse: secondsCheck.canUse,

			// Formatted
			availableMinutes: Math.floor(secondsCheck.available / 60),
			usedMinutes: Math.floor((usage.secondsUsed + usage.bankedSecondsUsed) / 60)
		},

		realtimeSessions: {
			used: usage.realtimeSessionsUsed,
			limit: realtimeCheck.limit,
			available: realtimeCheck.available,
			unlimited: realtimeCheck.unlimited,
			canUse: realtimeCheck.canUse
		},

		// Feature usage
		ankiExports: {
			used: usage.ankiExportsUsed,
			limit: ankiCheck.limit,
			available: ankiCheck.available,
			unlimited: ankiCheck.unlimited,
			canUse: ankiCheck.canUse
		},

		sessionExtensions: {
			used: usage.sessionExtensionsUsed,
			limit: extensionCheck.limit,
			available: extensionCheck.available,
			canUse: extensionCheck.canUse
		},

		advancedVoice: {
			secondsUsed: usage.advancedVoiceSeconds,
			hasAccess: advancedVoiceCheck.canUse
		},

		// Quality metrics
		engagement: {
			completedSessions: usage.completedSessions,
			longestSessionSeconds: usage.longestSessionSeconds,
			averageSessionSeconds: usage.averageSessionSeconds,
			firstActivityAt: usage.firstActivityAt,
			lastConversationAt: usage.lastConversationAt,
			lastRealtimeAt: usage.lastRealtimeAt
		},

		// Business metrics
		business: {
			overageSeconds: usage.overageSeconds,
			tierWhenUsed: usage.tierWhenUsed,
			overageMinutes: Math.floor(usage.overageSeconds / 60)
		},

		// Feature access
		features: {
			hasAdvancedVoices: tierConfig.hasAdvancedVoices,
			hasAnalytics: tierConfig.hasAnalytics,
			hasCustomPhrases: tierConfig.hasCustomPhrases,
			hasAnkiExport: tierConfig.hasAnkiExport,
			sessionBankingEnabled: tierConfig.sessionBankingEnabled,
			maxBankedSeconds: tierConfig.maxBankedSeconds
		},

		// Overall status
		status: {
			hasAnyLimits:
				!conversationCheck.unlimited || !realtimeCheck.unlimited || secondsCheck.available < 3600,
			nearLimits:
				secondsCheck.available < 600 ||
				(!conversationCheck.unlimited && conversationCheck.available < 5),
			atLimits: !conversationCheck.canUse || !secondsCheck.canUse || !realtimeCheck.canUse
		}
	};
}

// =============================================================================
// USAGE RECORDING FUNCTIONS (PURE - RETURN PROMISES)
// =============================================================================

/**
 * Record conversation usage
 */
export async function recordConversation(
	userId: string,
	options?: {
		seconds?: number;
	}
) {
	const userTier = await getUserCurrentTier(userId);
	const now = new Date();

	return await userUsageRepository.incrementUsage(userId, {
		conversationsUsed: 1,
		...(options?.seconds !== undefined ? { secondsUsed: options.seconds } : {}),
		lastConversationAt: now,
		firstActivityAt: now,
		tierWhenUsed: userTier
	});
}

/**
 * Record seconds used
 */
export async function recordSeconds(userId: string, seconds: number) {
	const userTier = await getUserCurrentTier(userId);
	const now = new Date();

	return await userUsageRepository.incrementUsage(userId, {
		secondsUsed: seconds,
		firstActivityAt: now,
		tierWhenUsed: userTier
	});
}

/**
 * Record realtime session usage
 */
export async function recordRealtimeSession(userId: string) {
	const userTier = await getUserCurrentTier(userId);
	const now = new Date();

	return await userUsageRepository.incrementUsage(userId, {
		realtimeSessionsUsed: 1,
		lastRealtimeAt: now,
		firstActivityAt: now,
		tierWhenUsed: userTier
	});
}

/**
 * Record multiple usage types at once
 */
export async function recordUsage(
	userId: string,
	usage: {
		conversations?: number;
		seconds?: number;
		realtimeSessions?: number;
		ankiExports?: number;
		sessionExtensions?: number;
		advancedVoiceSeconds?: number;
		completedSessions?: number;
		overageSeconds?: number;
	}
) {
	const updates: Parameters<typeof userUsageRepository.incrementUsage>[1] = {};
	const now = new Date();

	if (usage.conversations) {
		updates.conversationsUsed = usage.conversations;
		updates.lastConversationAt = now;
	}
	if (usage.seconds) updates.secondsUsed = usage.seconds;
	if (usage.realtimeSessions) {
		updates.realtimeSessionsUsed = usage.realtimeSessions;
		updates.lastRealtimeAt = now;
	}
	if (usage.ankiExports) updates.ankiExportsUsed = usage.ankiExports;
	if (usage.sessionExtensions) updates.sessionExtensionsUsed = usage.sessionExtensions;
	if (usage.advancedVoiceSeconds) updates.advancedVoiceSeconds = usage.advancedVoiceSeconds;
	if (usage.completedSessions) updates.completedSessions = usage.completedSessions;
	if (usage.overageSeconds) updates.overageSeconds = usage.overageSeconds;

	if (Object.keys(updates).length === 0) {
		return null;
	}

	const userTier = await getUserCurrentTier(userId);
	updates.tierWhenUsed = userTier;
	updates.firstActivityAt = now;

	return await userUsageRepository.incrementUsage(userId, updates);
}

/**
 * Record Anki export usage
 */
export async function recordAnkiExport(userId: string) {
	return await userUsageRepository.incrementUsage(userId, {
		ankiExportsUsed: 1
	});
}

/**
 * Record session extension usage
 */
export async function recordSessionExtension(userId: string) {
	return await userUsageRepository.incrementUsage(userId, {
		sessionExtensionsUsed: 1
	});
}

/**
 * Record advanced voice usage
 */
export async function recordAdvancedVoice(userId: string, seconds: number) {
	return await userUsageRepository.incrementUsage(userId, {
		advancedVoiceSeconds: seconds
	});
}

/**
 * Record completed session
 */
export async function recordCompletedSession(userId: string, sessionLength: number) {
	const current = await getCurrentUsage(userId);
	const newTotal = current.completedSessions + 1;
	const totalSeconds = current.averageSessionSeconds * current.completedSessions + sessionLength;
	const newAverage = Math.floor(totalSeconds / newTotal);
	const newLongest = Math.max(current.longestSessionSeconds, sessionLength);

	return await userUsageRepository.incrementUsage(userId, {
		completedSessions: 1,
		averageSessionSeconds: newAverage - current.averageSessionSeconds, // Increment by difference
		longestSessionSeconds: newLongest - current.longestSessionSeconds // Increment by difference
	});
}

/**
 * Set banked seconds for user (typically done monthly)
 */
export async function setBankedSeconds(userId: string, bankedSeconds: number) {
	return await userUsageRepository.upsertCurrentMonthUsage(userId, {
		bankedSeconds
	});
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getCurrentPeriod(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	return `${year}-${month}`;
}

/**
 * Get usage history for debugging
 */
export async function getUsageHistory(userId: string, months: number = 3) {
	try {
		return await userUsageRepository.getUsageHistory(userId, months);
	} catch (error) {
		logger.error('Error getting usage history:', error);
		return []; // Return empty array on error
	}
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export everything under a namespace for clean imports
export const usageService = {
	// Read functions
	getCurrentUsage,
	canUseFeature,
	getUsageSummary,
	getUsageHistory,

	// Core usage recording
	recordConversation,
	recordSeconds,
	recordRealtimeSession,
	recordUsage,

	// Feature usage recording
	recordAnkiExport,
	recordSessionExtension,
	recordAdvancedVoice,
	recordCompletedSession,

	// Banking & settings
	setBankedSeconds,

	// Utilities
	getCurrentPeriod: () => getCurrentPeriod()
};
