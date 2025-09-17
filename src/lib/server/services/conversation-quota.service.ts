import type { UserTier } from '../db/types';
import { userUsageRepository } from '../repositories/userUsage.repository';
import { tierRepository } from '../repositories/tier.repository';
import { TierService } from '../tierService';

export interface ConversationQuotaStatus {
	canStartConversation: boolean;
	remainingConversations: number;
	remainingSeconds: number;
	resetTime: Date;
	resetType: 'daily' | 'monthly';
	tier: UserTier;
	quotaExceeded: boolean;
	upgradeRequired: boolean;
	dailyLimitReached?: boolean;
	monthlyLimitReached?: boolean;
}

export class ConversationQuotaService {
	private tierService: TierService;

	constructor() {
		this.tierService = new TierService();
	}

	/**
	 * Check if user can start a conversation and get quota status
	 */
	

	async getConversationQuotaStatus(userId: string): Promise<ConversationQuotaStatus> {
		const userTier = await this.tierService.getUserTier(userId);
		const monthlyStatus = await this.checkMonthlyLimits(userId, userTier);
		return {
			...monthlyStatus,
			tier: userTier,
			dailyLimitReached: false
		};
	}

	async recordConversationUsage(userId: string, durationSeconds: number): Promise<void> {
		const userTier = await this.tierService.getUserTier(userId);
		const tierConfig = await tierRepository.getTierById(userTier);

		await userUsageRepository.incrementUsage(userId, {
			conversationsUsed: 1,
			secondsUsed: durationSeconds
		});
	}

	async canUserStartConversation(userId: string): Promise<boolean> {
		const status = await this.getConversationQuotaStatus(userId);
		return status.canStartConversation;
	}

	// Daily limits removed for MVP

	private async checkMonthlyLimits(userId: string, tier: UserTier): Promise<ConversationQuotaStatus> {
		const tierConfig = await tierRepository.getTierById(tier);
		if (!tierConfig) {
			throw new Error(`Tier configuration not found for tier: ${tier}`);
		}

		const usage = await userUsageRepository.getCurrentMonthUsage(userId);

		const conversationsUsed = usage?.conversationsUsed || 0;
		const secondsUsed = usage?.secondsUsed || 0;

		const conversationLimitReached = tierConfig.monthlyConversations !== null &&
			conversationsUsed >= tierConfig.monthlyConversations;

		const timeLimitReached = secondsUsed >= tierConfig.monthlySeconds;

		const quotaExceeded = conversationLimitReached || timeLimitReached;

		return {
			canStartConversation: !quotaExceeded,
			remainingConversations: tierConfig.monthlyConversations !== null
				? Math.max(0, tierConfig.monthlyConversations - conversationsUsed)
				: -1,
			remainingSeconds: Math.max(0, tierConfig.monthlySeconds - secondsUsed),
			resetTime: this.getNextMonthResetTime(),
			resetType: 'monthly',
			tier,
			quotaExceeded,
			upgradeRequired: false,
			monthlyLimitReached: quotaExceeded
		};
	}

	private getTodayString(): string {
		return new Date().toISOString().split('T')[0];
	}

	private getTomorrowResetTime(): Date {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);
		return tomorrow;
	}

	private getNextMonthResetTime(): Date {
		const nextMonth = new Date();
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		nextMonth.setDate(1);
		nextMonth.setHours(0, 0, 0, 0);
		return nextMonth;
	}
}

export const conversationQuotaService = new ConversationQuotaService();


	/**
	 * Record conversation usage
	 */
	async recordConversationUsage(userId: string, durationSeconds: number): Promise<void> {
		const userTier = await this.tierService.getUserTier(userId);
		const tierConfig = getServerTierConfig(userTier);

		// Record monthly usage only
		await userUsageRepository.incrementUsage(userId, {
			conversationsUsed: 1,
			secondsUsed: durationSeconds
		});
	}

	/**
	 * Check if user can start a conversation (quick check)
	 */
	async canUserStartConversation(userId: string): Promise<boolean> {
		const status = await this.getConversationQuotaStatus(userId);
		return status.canStartConversation;
	}

	/**
	 * Check daily limits for users with daily quotas
	 */
	// Daily limits removed for MVP

	/**
	 * Check monthly limits
	 */
	private async checkMonthlyLimits(userId: string, tier: UserTier): Promise<ConversationQuotaStatus> {
		const tierConfig = getServerTierConfig(tier);
		const usage = await userUsageRepository.getCurrentMonthUsage(userId);

		const conversationsUsed = usage?.conversationsUsed || 0;
		const secondsUsed = usage?.secondsUsed || 0;

		// Check conversation limit (usually unlimited for all tiers)
		const conversationLimitReached = tierConfig.monthlyConversations !== null &&
			conversationsUsed >= tierConfig.monthlyConversations;

		// Check time limit
		const timeLimitReached = secondsUsed >= tierConfig.monthlySeconds;

		const quotaExceeded = conversationLimitReached || timeLimitReached;

		return {
			canStartConversation: !quotaExceeded,
			remainingConversations: tierConfig.monthlyConversations !== null
				? Math.max(0, tierConfig.monthlyConversations - conversationsUsed)
				: -1,
			remainingSeconds: Math.max(0, tierConfig.monthlySeconds - secondsUsed),
			resetTime: this.getNextMonthResetTime(),
			resetType: 'monthly',
			tier,
			quotaExceeded,
			upgradeRequired: false, // Monthly limits don't require immediate upgrade
			monthlyLimitReached: quotaExceeded
		};
	}

	/**
	 * Utility methods for date handling
	 */
	private getTodayString(): string {
		return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
	}

	private getTomorrowResetTime(): Date {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
		return tomorrow;
	}

	private getNextMonthResetTime(): Date {
		const nextMonth = new Date();
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		nextMonth.setDate(1);
		nextMonth.setHours(0, 0, 0, 0); // Start of next month
		return nextMonth;
	}
}

// Singleton instance
export const conversationQuotaService = new ConversationQuotaService();
