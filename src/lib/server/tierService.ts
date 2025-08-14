// 🏆 Tier Management Service
// Handles user tiers, usage tracking, and limit enforcement

import { db } from './db/index';
import { users, tiers, userUsage, subscriptions } from './db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { UserUsage, Subscription } from './db/schema';
import { analytics } from './analyticsService';

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
	 */
	async getUserTierStatus(userId: string): Promise<UsageStatus> {
		// Get user and their tier
		const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		if (!user.length) {
			throw new Error('User not found');
		}

		const userTier = user[0].tier;
		const limits = await this.getTierLimits(userTier);

		// Get current usage period
		const currentPeriod = this.getCurrentPeriod();
		const usage = await this.getUserUsage(userId, currentPeriod.start, currentPeriod.end);

		// Check limits
		const canStartConversation = this.canStartConversation(limits, usage);
		const canUseRealtime = this.canUseRealtime(limits, usage);

		return {
			tier: userTier,
			limits,
			usage: {
				conversationsUsed: usage.conversationsUsed || 0,
				minutesUsed: usage.minutesUsed || 0,
				realtimeSessionsUsed: usage.realtimeSessionsUsed || 0
			},
			canStartConversation,
			canUseRealtime,
			resetDate: currentPeriod.end
		};
	}

	/**
	 * Track usage when starting a conversation
	 */
	async trackConversationStart(userId: string, isRealtime: boolean = false): Promise<void> {
		const currentPeriod = this.getCurrentPeriod();

		// Get or create usage record
		let usage = await this.getOrCreateUserUsage(userId, currentPeriod.start, currentPeriod.end);

		// Increment counters
		const updates: Partial<UserUsage> = {
			conversationsUsed: (usage.conversationsUsed || 0) + 1,
			updatedAt: new Date()
		};

		if (isRealtime) {
			updates.realtimeSessionsUsed = (usage.realtimeSessionsUsed || 0) + 1;
		}

		await db.update(userUsage).set(updates).where(eq(userUsage.id, usage.id));
	}

	/**
	 * Track usage when ending a conversation
	 */
	async trackConversationEnd(userId: string, durationMinutes: number): Promise<void> {
		const currentPeriod = this.getCurrentPeriod();

		// Get usage record
		const usage = await this.getOrCreateUserUsage(userId, currentPeriod.start, currentPeriod.end);

		// Add minutes used
		await db
			.update(userUsage)
			.set({
				minutesUsed: (usage.minutesUsed || 0) + Math.ceil(durationMinutes),
				updatedAt: new Date()
			})
			.where(eq(userUsage.id, usage.id));
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
	 */
	async upgradeUserTier(userId: string, newTier: 'free' | 'pro' | 'premium'): Promise<void> {
		await db
			.update(users)
			.set({
				tier: newTier,
				lastUsage: new Date()
			})
			.where(eq(users.id, userId));
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

	private async getUserUsage(
		userId: string,
		periodStart: Date,
		periodEnd: Date
	): Promise<UserUsage> {
		const usage = await db
			.select()
			.from(userUsage)
			.where(
				and(
					eq(userUsage.userId, userId),
					gte(userUsage.periodStart, periodStart),
					lte(userUsage.periodEnd, periodEnd)
				)
			)
			.orderBy(desc(userUsage.createdAt))
			.limit(1);

		if (usage.length > 0) {
			return usage[0];
		}

		// Return empty usage if none exists
		return {
			id: '',
			userId,
			periodStart,
			periodEnd,
			conversationsUsed: 0,
			minutesUsed: 0,
			realtimeSessionsUsed: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		};
	}

	private async getOrCreateUserUsage(
		userId: string,
		periodStart: Date,
		periodEnd: Date
	): Promise<UserUsage> {
		const existing = await db
			.select()
			.from(userUsage)
			.where(
				and(
					eq(userUsage.userId, userId),
					gte(userUsage.periodStart, periodStart),
					lte(userUsage.periodEnd, periodEnd)
				)
			)
			.limit(1);

		if (existing.length > 0) {
			return existing[0];
		}

		// Create new usage record
		const newUsage = await db
			.insert(userUsage)
			.values({
				userId,
				periodStart,
				periodEnd,
				conversationsUsed: 0,
				minutesUsed: 0,
				realtimeSessionsUsed: 0
			})
			.returning();

		return newUsage[0];
	}

	private getCurrentPeriod(): { start: Date; end: Date } {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1); // First day of month
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of month
		end.setHours(23, 59, 59, 999);

		return { start, end };
	}

	private canStartConversation(limits: TierLimits, usage: UserUsage): boolean {
		if (limits.monthlyConversations === null) return true; // Unlimited
		return (usage.conversationsUsed || 0) < limits.monthlyConversations;
	}

	private canUseRealtime(limits: TierLimits, usage: UserUsage): boolean {
		if (!limits.hasRealtimeAccess) return false;
		if (limits.monthlyRealtimeSessions === null) return true; // Unlimited
		return (usage.realtimeSessionsUsed || 0) < limits.monthlyRealtimeSessions;
	}

	/**
	 * Get user's active subscription details
	 */
	async getUserSubscription(userId: string): Promise<Subscription | null> {
		const subscription = await db
			.select()
			.from(subscriptions)
			.where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
			.limit(1);

		return subscription[0] || null;
	}

	/**
	 * Track tier change with analytics
	 */
	async upgradeUserTierWithAnalytics(
		userId: string,
		newTier: 'free' | 'pro' | 'premium'
	): Promise<void> {
		// Get current tier for analytics
		const currentUser = await db
			.select({ tier: users.tier })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		const oldTier = currentUser[0]?.tier || 'free';

		// Update user tier
		await this.upgradeUserTier(userId, newTier);

		// Track tier change
		if (oldTier !== newTier) {
			await analytics.trackTierChange(userId, oldTier, newTier);
		}

		console.log(`✅ User ${userId} upgraded from ${oldTier} to ${newTier} tier`);
	}
}

// Export singleton instance
export const tierService = new TierService();
