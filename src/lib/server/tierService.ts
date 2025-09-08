// 🏆 Tier Management Service - Aligned with userUsage and conversationSessions
// This service manages user tiers and usage tracking based on the database schema

import { db } from './db/index';
import { userUsage, conversationSessions, subscriptions } from './db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { UserTier, Tier, UserUsage } from './db/types';
import { getServerTierConfig } from '$lib/server/tiers';

export interface UsageStatus {
	tier: Tier;
	usage: UserUsage;
	canStartConversation: boolean;
	canUseRealtime: boolean;
	resetDate: Date;
}

export class TierService {
	/**
	 * Get user's current tier from their active subscription
	 */
	async getUserTier(userId: string): Promise<UserTier> {
		const subscription = await db
			.select()
			.from(subscriptions)
			.where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
			.limit(1);

		return (subscription[0]?.tierId as UserTier) || 'free';
	}

	/**
	 * Get current usage status for a user
	 */
	async getUsageStatus(userId: string): Promise<UsageStatus> {
		const tierId = await this.getUserTier(userId);
		const tierConfig = getServerTierConfig(tierId);
		const currentPeriod = this.getCurrentPeriod();

		// Get current month's usage
		const usage = await db
			.select()
			.from(userUsage)
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, currentPeriod)))
			.limit(1);

		const currentUsage = usage[0] || {
			userId,
			period: currentPeriod,
			conversationsUsed: 0,
			secondsUsed: 0,
			realtimeSessionsUsed: 0,
			bankedSeconds: 0,
			bankedSecondsUsed: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		// Ensure we have valid numbers (handle null values from database)
		const conversationsUsed = currentUsage.conversationsUsed || 0;
		const realtimeSessionsUsed = currentUsage.realtimeSessionsUsed || 0;

		// Check if user can start conversations and use realtime
		const canStartConversation =
			tierConfig.monthlyConversations === null ||
			conversationsUsed < tierConfig.monthlyConversations;

		const canUseRealtime =
			tierConfig.monthlyRealtimeSessions === null ||
			realtimeSessionsUsed < tierConfig.monthlyRealtimeSessions;

		return {
			tier: tierConfig,
			usage: currentUsage,
			canStartConversation,
			canUseRealtime,
			resetDate: this.getNextResetDate()
		};
	}

	/**
	 * Record conversation usage
	 */
	async recordConversationUsage(userId: string, durationSeconds: number): Promise<void> {
		const currentPeriod = this.getCurrentPeriod();

		// Get or create usage record for current period
		const existingUsage = await db
			.select()
			.from(userUsage)
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, currentPeriod)))
			.limit(1);

		if (existingUsage[0]) {
			// Update existing usage
			await db
				.update(userUsage)
				.set({
					conversationsUsed: (existingUsage[0].conversationsUsed || 0) + 1,
					secondsUsed: (existingUsage[0].secondsUsed || 0) + durationSeconds,
					updatedAt: new Date()
				})
				.where(and(eq(userUsage.userId, userId), eq(userUsage.period, currentPeriod)));
		} else {
			// Create new usage record
			await db.insert(userUsage).values({
				userId,
				period: currentPeriod,
				conversationsUsed: 1,
				secondsUsed: durationSeconds,
				realtimeSessionsUsed: 0,
				bankedSeconds: 0,
				bankedSecondsUsed: 0
			});
		}
	}

	/**
	 * Record realtime session usage
	 */
	async recordRealtimeSessionUsage(userId: string): Promise<void> {
		const currentPeriod = this.getCurrentPeriod();

		// Get or create usage record for current period
		const existingUsage = await db
			.select()
			.from(userUsage)
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, currentPeriod)))
			.limit(1);

		if (existingUsage[0]) {
			// Update existing usage
			await db
				.update(userUsage)
				.set({
					realtimeSessionsUsed: (existingUsage[0].realtimeSessionsUsed || 0) + 1,
					updatedAt: new Date()
				})
				.where(and(eq(userUsage.userId, userId), eq(userUsage.period, currentPeriod)));
		} else {
			// Create new usage record
			await db.insert(userUsage).values({
				userId,
				period: currentPeriod,
				conversationsUsed: 0,
				secondsUsed: 0,
				realtimeSessionsUsed: 1,
				bankedSeconds: 0,
				bankedSecondsUsed: 0
			});
		}
	}

	/**
	 * Record conversation session details
	 */
	async recordConversationSession(sessionData: {
		id: string;
		userId: string;
		language: string;
		startTime: Date;
		endTime?: Date;
		durationMinutes: number;
		minutesConsumed: number;
		wasExtended?: boolean;
		extensionsUsed?: number;
		transcriptionMode?: boolean;
		deviceType?: string;
	}): Promise<void> {
		await db.insert(conversationSessions).values({
			id: sessionData.id,
			userId: sessionData.userId,
			language: sessionData.language,
			startTime: sessionData.startTime,
			endTime: sessionData.endTime,
			durationMinutes: sessionData.durationMinutes,
			minutesConsumed: sessionData.minutesConsumed,
			wasExtended: sessionData.wasExtended || false,
			extensionsUsed: sessionData.extensionsUsed || 0,
			transcriptionMode: sessionData.transcriptionMode || false,
			deviceType: sessionData.deviceType
		});
	}

	/**
	 * Update user's tier (used by Stripe webhooks)
	 */
	async upgradeUserTier(userId: string, newTier: UserTier): Promise<void> {
		// This method is called by Stripe webhooks to update user tier
		// The actual tier is stored in the subscriptions table, not directly on users
		// This method exists for compatibility with existing Stripe service code
		console.log(`User ${userId} tier updated to ${newTier} via subscription`);
	}

	/**
	 * Get current period in YYYY-MM format
	 */
	private getCurrentPeriod(): string {
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		return `${year}-${month}`;
	}

	/**
	 * Get next reset date (first day of next month)
	 */
	private getNextResetDate(): Date {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth() + 1, 1);
	}

	/**
	 * Get user's conversation sessions for analytics
	 */
	async getUserConversationSessions(
		userId: string,
		limit = 50
	): Promise<(typeof conversationSessions.$inferSelect)[]> {
		return await db
			.select()
			.from(conversationSessions)
			.where(eq(conversationSessions.userId, userId))
			.orderBy(desc(conversationSessions.startTime))
			.limit(limit);
	}

	/**
	 * Get user's usage history
	 */
	async getUserUsageHistory(
		userId: string,
		limit = 12
	): Promise<(typeof userUsage.$inferSelect)[]> {
		return await db
			.select()
			.from(userUsage)
			.where(eq(userUsage.userId, userId))
			.orderBy(desc(userUsage.period))
			.limit(limit);
	}

	/**
	 * Check if user can start a conversation
	 */
	async canStartConversation(userId: string): Promise<boolean> {
		const usageStatus = await this.getUsageStatus(userId);
		return usageStatus.canStartConversation;
	}

	/**
	 * Check if user can use realtime features
	 */
	async canUseRealtime(userId: string): Promise<boolean> {
		const usageStatus = await this.getUsageStatus(userId);
		return usageStatus.canUseRealtime;
	}

	/**
	 * Get tier configuration by ID
	 */
	getTierConfig(tierId: UserTier): Tier {
		return getServerTierConfig(tierId);
	}
}

// Export singleton instance
export const tierService = new TierService();
