import type { Tier, UserUsage } from '$lib/server/db/types';
import type { UsageLimits } from '$lib/stores/conversation-timer.store.svelte';

type UsageStatusResponse = {
	tier: Tier;
	usage: UserUsage;
	canStartConversation: boolean;
	canUseRealtime: boolean;
	resetDate: string | Date;
};

export type UsageContext = {
	tier: Tier;
	usage: UserUsage;
	canStartConversation: boolean;
	canUseRealtime: boolean;
	resetDate: Date;
	timerLimits: UsageLimits;
};

type RecordConversationParams = {
	userId: string;
	conversationId: string;
	sessionId?: string;
	durationSeconds: number;
	audioSeconds?: number;
	wasExtended?: boolean;
	extensionsUsed?: number;
};

const normalizeDate = (value: string | Date | null | undefined) => {
	if (!value) return null;
	return value instanceof Date ? value : new Date(value);
};

const normalizeTier = (tier: Tier): Tier => {
	return {
		...tier,
		createdAt: normalizeDate(tier.createdAt) ?? new Date(),
		updatedAt: normalizeDate(tier.updatedAt) ?? new Date()
	};
};

const normalizeUsage = (usage: UserUsage): UserUsage => {
	return {
		...usage,
		lastConversationAt: normalizeDate(usage.lastConversationAt),
		lastRealtimeAt: normalizeDate(usage.lastRealtimeAt),
		firstActivityAt: normalizeDate(usage.firstActivityAt),
		createdAt: normalizeDate(usage.createdAt) ?? new Date(),
		updatedAt: normalizeDate(usage.updatedAt) ?? new Date()
	};
};

const computeTimerLimits = (tier: Tier, usage: UserUsage): UsageLimits => {
	const baseMonthlySeconds = tier.monthlySeconds ?? 0;
	const bankedSeconds = usage.bankedSeconds ?? 0;
	const totalAllowance = baseMonthlySeconds + bankedSeconds;

	const monthlyUsed = usage.secondsUsed ?? 0;
	const bankedUsed = usage.bankedSecondsUsed ?? 0;
	const totalUsed = monthlyUsed + bankedUsed;

	const remaining = Math.max(0, totalAllowance - totalUsed);

	return {
		monthlySeconds: totalAllowance,
		maxSessionLengthSeconds: tier.maxSessionLengthSeconds ?? 0,
		usedSeconds: totalUsed,
		remainingSeconds: remaining
	};
};

const fetchUsageStatus = async (userId: string): Promise<UsageStatusResponse> => {
	const response = await fetch(`/api/users/${userId}/usage?action=status`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'same-origin'
	});

	if (!response.ok) {
		throw new Error(`Failed to load usage status (HTTP ${response.status})`);
	}

	return (await response.json()) as UsageStatusResponse;
};

export const usageTracker = {
	async refreshUsageContext(userId: string | null | undefined): Promise<UsageContext | null> {
		if (typeof window === 'undefined') {
			return null;
		}

		if (!userId || userId === 'guest') {
			return null;
		}

		try {
			const rawStatus = await fetchUsageStatus(userId);
			const tier = normalizeTier(rawStatus.tier);
			const usage = normalizeUsage(rawStatus.usage);

			return {
				tier,
				usage,
				canStartConversation: rawStatus.canStartConversation,
				canUseRealtime: rawStatus.canUseRealtime,
				resetDate: normalizeDate(rawStatus.resetDate) ?? new Date(),
				timerLimits: computeTimerLimits(tier, usage)
			};
		} catch (error) {
			console.error('usageTracker.refreshUsageContext error', error);
			return null;
		}
	},

	async recordConversationUsage(params: RecordConversationParams): Promise<UsageContext | null> {
		if (typeof window === 'undefined') {
			return null;
		}

		const { userId, conversationId, sessionId, durationSeconds } = params;

		if (!userId || userId === 'guest' || !conversationId) {
			return null;
		}

		try {
			const payload = {
				durationSeconds,
				audioSeconds: params.audioSeconds ?? durationSeconds,
				sessionId: sessionId ?? conversationId,
				wasExtended: params.wasExtended ?? false,
				extensionsUsed: params.extensionsUsed ?? 0
			};

			const response = await fetch(`/api/conversations/${conversationId}/end`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const errorBody = await response.json().catch(() => ({}));
				throw new Error(
					`Failed to record conversation usage (HTTP ${response.status}) ${
						errorBody?.error ? `- ${errorBody.error}` : ''
					}`.trim()
				);
			}

			return await this.refreshUsageContext(userId);
		} catch (error) {
			console.error('usageTracker.recordConversationUsage error', error);
			return null;
		}
	}
};

export type UsageTracker = typeof usageTracker;
