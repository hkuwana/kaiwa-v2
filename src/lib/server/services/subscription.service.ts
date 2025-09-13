// src/lib/server/services/subscription.service.ts
// Enhanced subscription service for tier management, usage tracking, and subscription lifecycle

import { subscriptionRepository } from '../repositories/subscription.repository';
import { userRepository } from '../repositories/user.repository';
import { stripeService } from './stripe.service';
import type { Subscription, NewSubscription } from '../db/types';

export class SubscriptionService {
	/**
	 * Get or create user's subscription
	 * Ensures every user has at least a free tier subscription
	 */
	async getOrCreateUserSubscription(userId: string): Promise<Subscription> {
		// Try to find existing active subscription
		let subscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		
		if (!subscription) {
			// Create free tier subscription if none exists
			subscription = await this.createFreeSubscription(userId);
		}

		return subscription;
	}

	/**
	 * Create a free tier subscription for a user
	 */
	async createFreeSubscription(userId: string): Promise<Subscription> {
		const user = await userRepository.findUserById(userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Ensure user has stripe customer ID
		let stripeCustomerId = user.stripeCustomerId;
		if (!stripeCustomerId) {
			stripeCustomerId = await stripeService.createCustomer(userId, user.email);
			if (stripeCustomerId) {
				await userRepository.updateUser(userId, { stripeCustomerId });
			}
		}

		const subscriptionData: NewSubscription = {
			userId,
			stripeCustomerId: stripeCustomerId || '',
			stripeSubscriptionId: `free_${userId}_${Date.now()}`, // Unique ID for free subscriptions
			stripePriceId: 'free',
			status: 'active',
			currentPeriodStart: new Date(),
			currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
			cancelAtPeriodEnd: false,
			tierId: 'free',
			isActive: true,
			effectiveTier: 'free'
		};

		return await subscriptionRepository.createSubscription(subscriptionData);
	}

	/**
	 * Upgrade user to a paid subscription
	 */
	async upgradeSubscription(
		userId: string,
		newTierId: string,
		stripePriceId: string,
		stripeSubscriptionId: string
	): Promise<Subscription> {
		// Deactivate existing subscription
		const existingSubscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		if (existingSubscription) {
			await subscriptionRepository.updateSubscription(existingSubscription.id, {
				isActive: false,
				effectiveTier: 'free' // Fallback tier
			});
		}

		// Get user's stripe customer ID
		const user = await userRepository.findUserById(userId);
		if (!user?.stripeCustomerId) {
			throw new Error('User does not have a Stripe customer ID');
		}

		// Create new subscription
		const subscriptionData: NewSubscription = {
			userId,
			stripeCustomerId: user.stripeCustomerId,
			stripeSubscriptionId,
			stripePriceId,
			status: 'active',
			currentPeriodStart: new Date(),
			currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
			cancelAtPeriodEnd: false,
			tierId: newTierId,
			isActive: true,
			effectiveTier: newTierId
		};

		return await subscriptionRepository.createSubscription(subscriptionData);
	}

	/**
	 * Downgrade user to free tier
	 */
	async downgradeToFree(userId: string): Promise<Subscription> {
		// Deactivate any existing paid subscriptions
		const existingSubscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		if (existingSubscription && existingSubscription.tierId !== 'free') {
			await subscriptionRepository.updateSubscription(existingSubscription.id, {
				isActive: false,
				cancelAtPeriodEnd: true,
				effectiveTier: 'free'
			});
		}

		// Ensure user has a free subscription
		return await this.getOrCreateUserSubscription(userId);
	}

	/**
	 * Get user's current tier
	 */
	async getUserTier(userId: string): Promise<string> {
		const subscription = await this.getOrCreateUserSubscription(userId);
		return subscription.effectiveTier || subscription.tierId;
	}

	/**
	 * Check if user has access to a specific feature based on their tier
	 */
	async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
		const tier = await this.getUserTier(userId);
		
		// Define feature access by tier
		const featureAccess: Record<string, string[]> = {
			free: ['basic_conversations', 'limited_sessions'],
			plus: ['basic_conversations', 'unlimited_sessions', 'realtime_access', 'advanced_voices'],
			premium: [
				'basic_conversations',
				'unlimited_sessions',
				'realtime_access',
				'advanced_voices',
				'analytics',
				'custom_phrases',
				'conversation_memory',
				'anki_export'
			]
		};

		return featureAccess[tier]?.includes(feature) || false;
	}

	/**
	 * Get subscription usage limits based on tier
	 */
	async getUsageLimits(userId: string): Promise<{
		monthlyConversations: number;
		monthlySeconds: number;
		monthlyRealtimeSessions: number;
		maxSessionLengthSeconds: number;
		sessionBankingEnabled: boolean;
		maxBankedSeconds: number;
	}> {
		const tier = await this.getUserTier(userId);
		
		// Define limits by tier - these should match your tiers table
		const limits = {
			free: {
				monthlyConversations: 10,
				monthlySeconds: 300, // 5 minutes
				monthlyRealtimeSessions: 0,
				maxSessionLengthSeconds: 300, // 5 minutes
				sessionBankingEnabled: false,
				maxBankedSeconds: 0
			},
			plus: {
				monthlyConversations: 100,
				monthlySeconds: 3600, // 60 minutes
				monthlyRealtimeSessions: 20,
				maxSessionLengthSeconds: 1800, // 30 minutes
				sessionBankingEnabled: true,
				maxBankedSeconds: 3600 // 60 minutes
			},
			premium: {
				monthlyConversations: -1, // unlimited
				monthlySeconds: -1, // unlimited
				monthlyRealtimeSessions: -1, // unlimited
				maxSessionLengthSeconds: 7200, // 120 minutes
				sessionBankingEnabled: true,
				maxBankedSeconds: 14400 // 240 minutes
			}
		};

		return limits[tier as keyof typeof limits] || limits.free;
	}

	/**
	 * Update subscription status (for webhook handlers)
	 */
	async updateSubscriptionStatus(
		stripeSubscriptionId: string,
		status: string,
		updates?: Partial<NewSubscription>
	): Promise<Subscription | null> {
		const subscription = await subscriptionRepository.findSubscriptionByStripeId(stripeSubscriptionId);
		if (!subscription) {
			return null;
		}

		const isActive = ['active', 'trialing'].includes(status);
		const updateData = {
			status,
			isActive,
			effectiveTier: isActive ? subscription.tierId : 'free',
			...updates
		};

		const result = await subscriptionRepository.updateSubscription(subscription.id, updateData);
		if (!result) {
			throw new Error('Failed to update subscription');
		}

		// If subscription becomes inactive, ensure user has free tier
		if (!isActive) {
			await this.getOrCreateUserSubscription(subscription.userId);
		}

		return result;
	}

	/**
	 * Get all subscriptions for a user
	 */
	async getUserSubscriptionHistory(userId: string): Promise<Subscription[]> {
		return await subscriptionRepository.findSubscriptionsByUserId(userId);
	}

	/**
	 * Check if subscription is expiring soon
	 */
	async isSubscriptionExpiringSoon(userId: string, daysThreshold: number = 7): Promise<boolean> {
		const subscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		if (!subscription || subscription.tierId === 'free') {
			return false;
		}

		const expiryDate = new Date(subscription.currentPeriodEnd);
		const thresholdDate = new Date();
		thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

		return expiryDate <= thresholdDate;
	}

	/**
	 * Get subscriptions expiring soon (for admin/notification purposes)
	 */
	async getExpiringSoonSubscriptions(daysThreshold: number = 7): Promise<Subscription[]> {
		return await subscriptionRepository.findExpiringSubscriptions(daysThreshold);
	}

	/**
	 * Reactivate a cancelled subscription
	 */
	async reactivateSubscription(userId: string): Promise<Subscription | null> {
		const subscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		if (!subscription || !subscription.cancelAtPeriodEnd) {
			throw new Error('No cancelled subscription found');
		}

		// Reactivate in Stripe
		await stripeService.reactivateSubscription(userId);

		// Update local record
		return await subscriptionRepository.updateSubscription(subscription.id, {
			cancelAtPeriodEnd: false,
			status: 'active',
			isActive: true,
			effectiveTier: subscription.tierId
		});
	}

	/**
	 * Cancel subscription at period end
	 */
	async cancelAtPeriodEnd(userId: string): Promise<Subscription | null> {
		const subscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		if (!subscription) {
			throw new Error('No active subscription found');
		}

		// Cancel in Stripe
		await stripeService.cancelSubscription(userId);

		// Update local record
		return await subscriptionRepository.updateSubscription(subscription.id, {
			cancelAtPeriodEnd: true
		});
	}

	/**
	 * Get subscription analytics
	 */
	async getSubscriptionAnalytics(periodStart: Date, periodEnd: Date): Promise<{
		totalActiveSubscriptions: number;
		subscriptionsByTier: Record<string, number>;
		newSubscriptions: number;
		cancelledSubscriptions: number;
		revenueEstimate: number;
	}> {
		// This would need to be implemented based on your analytics requirements
		// For now, returning basic structure
		return {
			totalActiveSubscriptions: await subscriptionRepository.getActiveSubscriptionCount(),
			subscriptionsByTier: {},
			newSubscriptions: 0,
			cancelledSubscriptions: 0,
			revenueEstimate: 0
		};
	}
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();