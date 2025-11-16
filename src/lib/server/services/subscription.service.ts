import { logger } from '../logger';
// src/lib/server/services/subscription.service.ts
// Subscription business logic service

import { subscriptionRepository } from '../repositories/subscription.repository';
import { serverTierConfigs } from '../tiers';
import { stripeService } from './stripe.service';
import type { UserTier, Subscription, NewSubscription } from '../db/types';
import type Stripe from 'stripe';

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
		logger.error('Error getting or creating user subscription:', error);
		throw error;
	}
}

/**
 * Get user's current tier from Stripe (source of truth)
 */
export async function getUserTier(userId: string): Promise<UserTier> {
	try {
		// First, get the subscription from our database
		const subscription = await getOrCreateUserSubscription(userId);

		// If this is a real Stripe subscription, verify with Stripe
		if (
			subscription.stripeSubscriptionId &&
			!subscription.stripeSubscriptionId.startsWith('free_')
		) {
			const stripeSubscription = await stripeService.getStripeSubscription(
				subscription.stripeSubscriptionId
			);

			if (stripeSubscription && stripeSubscription.status === 'active') {
				// Extract tier from Stripe subscription data
				const subscriptionData = await extractSubscriptionDataFromStripe(stripeSubscription);
				const stripeTier = normalizeTier(subscriptionData.tierId);

				// Update our database if there's a mismatch
				if (stripeTier !== subscription.currentTier) {
					logger.info(
						`🔄 [TIER SYNC] Updating tier from ${subscription.currentTier} to ${stripeTier} (from Stripe)`
					);
					await subscriptionRepository.updateSubscription(subscription.id, {
						currentTier: stripeTier
					});
				}

				return stripeTier;
			} else {
				// Stripe subscription is not active, user should be on free tier
				logger.info(
					`⚠️ [TIER SYNC] Stripe subscription ${subscription.stripeSubscriptionId} is not active, setting to free`
				);
				if (subscription.currentTier !== 'free') {
					await subscriptionRepository.updateSubscription(subscription.id, {
						currentTier: 'free'
					});
				}
				return 'free';
			}
		}

		// For free tier or local subscriptions, use database value
		return subscription.currentTier as UserTier;
	} catch (error) {
		logger.error('Error getting user tier:', error);
		return 'free';
	}
}

/**
 * Extract subscription data from Stripe subscription (helper function)
 */
async function extractSubscriptionDataFromStripe(stripeSubscription: Stripe.Subscription) {
	const primaryItem = stripeSubscription.items.data[0];
	if (!primaryItem) {
		throw new Error('No subscription items found');
	}

	const price = primaryItem.price;
	let tierId = price.metadata?.tier;

	if (!tierId) {
		// Fallback: infer from price ID
		tierId = inferTierFromPrice(price);
	}

	return {
		priceId: price.id,
		tierId,
		currency: stripeSubscription.currency,
		status: stripeSubscription.status
	};
}

/**
 * Infer tier from price information when metadata is not available
 */
function inferTierFromPrice(price: Stripe.Price): string {
	if (price.id.includes('premium')) return 'premium';
	if (price.id.includes('plus')) return 'plus';
	return 'plus'; // Default for paid subscriptions
}

/**
 * Normalize tier to ensure it's a valid UserTier
 */
function normalizeTier(tierId: string | null | undefined): UserTier {
	if (tierId === 'plus' || tierId === 'premium') {
		return tierId;
	}
	return 'free';
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
		logger.error('Error getting usage limits:', error);
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
		logger.error('Error checking feature access:', error);
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
		logger.error('Error updating subscription from Stripe:', error);
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

/**
 * Get detailed subscription data including Stripe info (for dev views)
 */
export async function getDetailedSubscriptionData(userId: string) {
	try {
		const subscription = await getOrCreateUserSubscription(userId);
		const tier = await getUserTier(userId);

		let stripeData: Stripe.Subscription | null = null;
		if (
			subscription.stripeSubscriptionId &&
			!subscription.stripeSubscriptionId.startsWith('free_')
		) {
			try {
				stripeData = await stripeService.getStripeSubscription(subscription.stripeSubscriptionId);
			} catch (error) {
				logger.error('Error fetching Stripe subscription:', error);
			}
		}

		return {
			local: {
				id: subscription.id,
				userId: subscription.userId,
				stripeSubscriptionId: subscription.stripeSubscriptionId,
				stripePriceId: subscription.stripePriceId,
				currentTier: subscription.currentTier,
				createdAt: subscription.createdAt,
				updatedAt: subscription.updatedAt
			},
			effective: {
				tier,
				isFromStripe: !!stripeData
			},
			stripe: stripeData
				? {
						id: stripeData.id,
						status: stripeData.status,
						created: new Date(stripeData.created * 1000),
						cancel_at_period_end: stripeData.cancel_at_period_end,
						metadata: stripeData.metadata,
						items: stripeData.items.data.map((item) => ({
							price_id: item.price.id,
							unit_amount: item.price.unit_amount,
							currency: item.price.currency,
							metadata: item.price.metadata || {}
						}))
					}
				: null,
			syncCheck: {
				inSync: !stripeData || tier === subscription.currentTier,
				dbTier: subscription.currentTier,
				stripeTier: stripeData ? (await extractSubscriptionDataFromStripe(stripeData)).tierId : null
			}
		};
	} catch (error) {
		logger.error('Error getting detailed subscription data:', error);
		throw error;
	}
}

export const subscriptionService = {
	getOrCreateUserSubscription,
	getUserTier,
	getUsageLimits,
	hasFeatureAccess,
	updateSubscriptionFromStripe,
	getDetailedSubscriptionData
};
