// src/lib/server/services/subscription.service.ts
// Subscription business logic service

import { subscriptionRepository } from '../repositories/subscription.repository';
import { serverTierConfigs } from '../tiers';
import type { UserTier, Subscription, NewSubscription } from '../db/types';

/**
 * Get or create a user subscription (defaults to free tier)
 */
export async function getOrCreateUserSubscription(userId: string): Promise<Subscription> {
	try {
		// Try to find existing subscription
		let subscription = await subscriptionRepository.findSubscriptionByUserId(userId);

		if (!subscription) {
			// Create free tier subscription
			const newSubscription: NewSubscription = {
				userId,
				stripeSubscriptionId: `free_${userId}`, // Create a unique identifier for free tier
				stripePriceId: 'free',
				currentTier: 'free'
			};

			subscription = await subscriptionRepository.createSubscription(newSubscription);
		}

		return subscription;
	} catch (error) {
		console.error('Error getting or creating user subscription:', error);
		throw error;
	}
}

/**
 * Get user's current tier
 */
export async function getUserTier(userId: string): Promise<UserTier> {
	try {
		const subscription = await getOrCreateUserSubscription(userId);
		return subscription.currentTier as UserTier;
	} catch (error) {
		console.error('Error getting user tier:', error);
		return 'free';
	}
}

/**
 * Get usage limits for a user based on their tier
 */
export async function getUsageLimits(userId: string) {
	try {
		const tier = await getUserTier(userId);
		const tierConfig = serverTierConfigs[tier];

		return {
			conversationsPerMonth: tierConfig?.monthlyConversations || 10,
			messagesPerConversation: 50, // Fixed value for now
			audioMinutesPerMonth: Math.floor((tierConfig?.monthlySeconds || 900) / 60),
			canUseRealtime: tierConfig?.hasRealtimeAccess || false,
			canUseAdvancedAnalytics: tierConfig?.hasAnalytics || false
		};
	} catch (error) {
		console.error('Error getting usage limits:', error);
		return {
			conversationsPerMonth: 10,
			messagesPerConversation: 50,
			audioMinutesPerMonth: 60,
			canUseRealtime: false,
			canUseAdvancedAnalytics: false
		};
	}
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
	try {
		const tier = await getUserTier(userId);
		const tierConfig = serverTierConfigs[tier];

		// Map feature names to tier config properties
		switch (feature) {
			case 'realtime_access':
				return tierConfig?.hasRealtimeAccess || false;
			case 'advanced_voices':
				return tierConfig?.hasAdvancedVoices || false;
			case 'analytics':
				return tierConfig?.hasAnalytics || false;
			case 'custom_phrases':
				return tierConfig?.hasCustomPhrases || false;
			case 'conversation_memory':
				return tierConfig?.hasConversationMemory || false;
			case 'anki_export':
				return tierConfig?.hasAnkiExport || false;
			default:
				return false;
		}
	} catch (error) {
		console.error('Error checking feature access:', error);
		return false;
	}
}

/**
 * Update subscription when Stripe webhook is received
 */
export async function updateSubscriptionFromStripe(
	userId: string,
	stripeSubscriptionId: string,
	stripePriceId: string
): Promise<Subscription | null> {
	try {
		const subscription = await subscriptionRepository.findSubscriptionByUserId(userId);
		const currentTier = mapStripePriceToTier(stripePriceId);

		if (!subscription) {
			// Create new subscription
			const newSubscription: NewSubscription = {
				userId,
				stripeSubscriptionId,
				stripePriceId,
				currentTier
			};

			return await subscriptionRepository.createSubscription(newSubscription);
		} else {
			// Update existing subscription
			const updates = {
				stripeSubscriptionId,
				stripePriceId,
				currentTier,
				updatedAt: new Date()
			};

			return (await subscriptionRepository.updateSubscription(subscription.id, updates)) || null;
		}
	} catch (error) {
		console.error('Error updating subscription from Stripe:', error);
		return null;
	}
}

/**
 * Map Stripe price ID to our tier system
 */
function mapStripePriceToTier(stripePriceId: string): UserTier {
	for (const [tier, config] of Object.entries(serverTierConfigs)) {
		if (
			config.stripePriceIdMonthly === stripePriceId ||
			config.stripePriceIdAnnual === stripePriceId
		) {
			return tier as UserTier;
		}
	}
	return 'free';
}

export const subscriptionService = {
	getOrCreateUserSubscription,
	getUserTier,
	getUsageLimits,
	hasFeatureAccess,
	updateSubscriptionFromStripe
};
