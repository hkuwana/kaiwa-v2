// 🏆 Tier Management Service - MVP Version
// Simplified version that works with current MVP schema

import { db } from './db/index';
import { users, tiers } from './db/schema';
import { eq } from 'drizzle-orm';

export interface TierLimits {
	monthlyConversations: number | null; // null = unlimited
	monthlyMinutes: number | null;
	monthlyRealtimeSessions: number | null;
	hasRealtimeAccess: boolean;
	hasAdvancedVoices: boolean;
	hasAnalytics: boolean;
}

export interface UsageStatus {
	tier: string;
	limits: TierLimits;
	usage: {
		conversationsUsed: number;
		minutesUsed: number;
		realtimeSessionsUsed: number;
	};
	canStartConversation: boolean;
	canUseRealtime: boolean;
	resetDate: Date;
}

// Default tier configurations
const DEFAULT_TIERS: Record<string, TierLimits> = {
	free: {
		monthlyConversations: 10,
		monthlyMinutes: 30,
		monthlyRealtimeSessions: 3,
		hasRealtimeAccess: true, // Allow limited realtime for trial
		hasAdvancedVoices: false,
		hasAnalytics: false
	},
	pro: {
		monthlyConversations: 100,
		monthlyMinutes: 300,
		monthlyRealtimeSessions: 50,
		hasRealtimeAccess: true,
		hasAdvancedVoices: true,
		hasAnalytics: true
	},
	premium: {
		monthlyConversations: null, // unlimited
		monthlyMinutes: null, // unlimited
		monthlyRealtimeSessions: null, // unlimited
		hasRealtimeAccess: true,
		hasAdvancedVoices: true,
		hasAnalytics: true
	}
};

export class TierService {
	/**
	 * Get user's current tier and usage status
	 * MVP: All users get free tier for now
	 */
	async getUserTierStatus(userId: string): Promise<UsageStatus> {
		// Get user - MVP version assumes 'free' tier for all users
		const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		if (!user.length) {
			throw new Error('User not found');
		}

		// MVP: All users get free tier limits
		const userTier = 'free';
		const limits = await this.getTierLimits(userTier);

		// MVP: Simplified usage tracking - assume no usage for now
		const usage = {
			conversationsUsed: 0,
			minutesUsed: 0,
			realtimeSessionsUsed: 0
		};

		// Check limits
		const canStartConversation = this.canStartConversation(limits, usage);
		const canUseRealtime = this.canUseRealtime(limits, usage);

		return {
			tier: userTier,
			limits,
			usage,
			canStartConversation,
			canUseRealtime,
			resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
		};
	}

	/**
	 * Track usage when starting a conversation
	 * MVP: Usage tracking disabled for now
	 */
	async trackConversationStart(userId: string, isRealtime: boolean = false): Promise<void> {
		// MVP: Usage tracking disabled - just log for now
		console.log(`MVP: Conversation started for user ${userId}, realtime: ${isRealtime}`);

		// TODO: Implement usage tracking when userUsage table is available
	}

	/**
	 * Track usage when ending a conversation
	 * MVP: Usage tracking disabled for now
	 */
	async trackConversationEnd(userId: string, durationMinutes: number): Promise<void> {
		// MVP: Usage tracking disabled - just log for now
		console.log(`MVP: Conversation ended for user ${userId}, duration: ${durationMinutes} minutes`);

		// TODO: Implement usage tracking when userUsage table is available
	}

	/**
	 * Check if user can start a new conversation
	 */
	async canUserStartConversation(userId: string): Promise<boolean> {
		const status = await this.getUserTierStatus(userId);
		return status.canStartConversation;
	}

	/**
	 * Check if user can use realtime mode
	 */
	async canUserUseRealtime(userId: string): Promise<boolean> {
		const status = await this.getUserTierStatus(userId);
		return status.canUseRealtime;
	}

	/**
	 * Upgrade user tier
	 * MVP: Disabled - tier field not available in current schema
	 */
	async upgradeUserTier(userId: string, newTier: 'free' | 'pro' | 'premium'): Promise<void> {
		// MVP: Tier upgrades disabled - just log for now
		console.log(`MVP: Tier upgrade requested for user ${userId} to ${newTier}`);

		// TODO: Implement when tier field is added to users table
	}

	// Private helper methods

	private async getTierLimits(tierName: string): Promise<TierLimits> {
		// Try to get from database first
		const tierData = await db.select().from(tiers).where(eq(tiers.id, tierName)).limit(1);

		if (tierData.length > 0) {
			const tier = tierData[0];
			return {
				monthlyConversations: tier.monthlyConversations,
				monthlyMinutes: tier.monthlyMinutes,
				monthlyRealtimeSessions: tier.monthlyRealtimeSessions,
				hasRealtimeAccess: tier.hasRealtimeAccess || false,
				hasAdvancedVoices: tier.hasAdvancedVoices || false,
				hasAnalytics: tier.hasAnalytics || false
			};
		}

		// Fallback to default configuration
		return DEFAULT_TIERS[tierName] || DEFAULT_TIERS.free;
	}

	/**
	 * Check if user can start a conversation based on limits
	 */
	private canStartConversation(limits: TierLimits, usage: { conversationsUsed: number }): boolean {
		if (limits.monthlyConversations === null) return true; // unlimited
		return usage.conversationsUsed < limits.monthlyConversations;
	}

	/**
	 * Check if user can use realtime based on limits
	 */
	private canUseRealtime(limits: TierLimits, usage: { realtimeSessionsUsed: number }): boolean {
		if (!limits.hasRealtimeAccess) return false;
		if (limits.monthlyRealtimeSessions === null) return true; // unlimited
		return usage.realtimeSessionsUsed < limits.monthlyRealtimeSessions;
	}

	/**
	 * Get current billing period
	 * MVP: Simplified - always returns current month
	 */
	private getCurrentPeriod(): { start: Date; end: Date } {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
		return { start, end };
	}
}

// Export singleton instance
export const tierService = new TierService();
