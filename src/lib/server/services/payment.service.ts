import { logger } from '$lib/logger';
// 💳 Simple Payment Service (MVP)
// Pure functions for Stripe operations and DB backup
// Stripe is the source of truth, DB is for backup/performance

import { stripe } from './stripe.service';
import { serverTierConfigs, getStripePriceId } from '../tiers';
import type { UserTier } from '../db/types';
import type Stripe from 'stripe';
import { subscriptionRepository } from '../repositories/subscription.repository';
import { userRepository } from '../repositories/user.repository';

// =============================================================================
// STRIPE API FUNCTIONS (Pure functions that query Stripe directly)
// =============================================================================

/**
 * Get user's active subscription from Stripe
 * This is the source of truth for subscription status
 */
export async function getStripeSubscription(stripeCustomerId: string) {
	try {
		const subscriptions = await stripe.subscriptions.list({
			customer: stripeCustomerId,
			status: 'all',
			limit: 1
		});

		const activeSubscription = subscriptions.data.find(
			(sub) => sub.status === 'active' || sub.status === 'trialing'
		);

		return activeSubscription || null;
	} catch (error) {
		logger.error('Error fetching Stripe subscription:', error);
		return null;
	}
}

/**
 * Determine user's tier from Stripe subscription
 * Maps Stripe price ID to our tier system
 */
export function getTierFromStripeSubscription(
	stripeSubscription: Stripe.Subscription | null | undefined
): UserTier {
	if (!stripeSubscription) return 'free';

	const priceId = stripeSubscription.items?.data?.[0]?.price?.id;
	if (!priceId) return 'free';

	// Check against our tier configs
	for (const [tier, config] of Object.entries(serverTierConfigs)) {
		if (config.stripePriceIdMonthly === priceId || config.stripePriceIdAnnual === priceId) {
			return tier as UserTier;
		}
	}

	return 'free';
}

/**
 * Get user's effective tier and subscription info from Stripe
 * This is the main function to check what tier a user should have
 */
export async function getUserTierFromStripe(stripeCustomerId: string): Promise<{
	tier: UserTier;
	hasActiveSubscription: boolean;
	subscriptionId?: string;
	priceId?: string;
	status?: string;
	currentPeriodEnd?: Date;
}> {
	const stripeSubscription = await getStripeSubscription(stripeCustomerId);

	if (!stripeSubscription) {
		return {
			tier: 'free',
			hasActiveSubscription: false
		};
	}

	const tier = getTierFromStripeSubscription(stripeSubscription);

	return {
		tier,
		hasActiveSubscription: true,
		subscriptionId: stripeSubscription.id,
		priceId: stripeSubscription.items?.data?.[0]?.price?.id,
		status: stripeSubscription.status,
		currentPeriodEnd: (() => {
			const extendedSubscription = stripeSubscription as Stripe.Subscription & {
				current_period_end?: number;
			};
			if (extendedSubscription.current_period_end) {
				return new Date(extendedSubscription.current_period_end * 1000);
			}
			if (stripeSubscription.cancel_at) {
				return new Date(stripeSubscription.cancel_at * 1000);
			}
			return undefined;
		})()
	};
}

/**
 * Create Stripe customer for user
 */
export async function createStripeCustomer(userId: string, email: string): Promise<string | null> {
	try {
		// First, check if a customer with this email already exists in Stripe
		const existingCustomers = await stripe.customers.list({
			email,
			limit: 1
		});

		if (existingCustomers.data.length > 0) {
			const existingCustomer = existingCustomers.data[0];
			logger.info(`Found existing Stripe customer for email ${email}: ${existingCustomer.id}`);

			// Update user with existing Stripe customer ID
			await userRepository.updateUser(userId, { stripeCustomerId: existingCustomer.id });

			// Also update the customer's metadata to include this userId if not already set
			if (!existingCustomer.metadata?.userId) {
				await stripe.customers.update(existingCustomer.id, {
					metadata: { userId }
				});
			}

			return existingCustomer.id;
		}

		const customer = await stripe.customers.create({
			email,
			metadata: { userId }
		});

		// Update user with Stripe customer ID
		await userRepository.updateUser(userId, { stripeCustomerId: customer.id });

		return customer.id;
	} catch (error) {
		logger.error('Error creating Stripe customer:', error);
		return null;
	}
}

/**
 * Create Stripe checkout session
 */
export async function createStripeCheckout(
	stripeCustomerId: string,
	tier: UserTier,
	billing: 'monthly' | 'annual',
	successUrl: string,
	cancelUrl: string
) {
	const priceId = getStripePriceId(tier, billing);
	if (!priceId) {
		throw new Error(`No price ID found for tier ${tier} ${billing}`);
	}

	try {
		const session = await stripe.checkout.sessions.create({
			customer: stripeCustomerId,
			payment_method_types: ['card'],
			line_items: [
				{
					price: priceId,
					quantity: 1
				}
			],
			mode: 'subscription',
			success_url: successUrl,
			cancel_url: cancelUrl,
			metadata: {
				tier,
				billing
			}
		});

		return {
			sessionId: session.id,
			url: session.url
		};
	} catch (error) {
		logger.error('Error creating Stripe checkout session:', error);
		throw error;
	}
}

// =============================================================================
// DATABASE FUNCTIONS (Pure functions for local backup data)
// =============================================================================

/**
 * Get user's subscription from local DB (backup/fallback)
 */
export async function getUserSubscriptionFromDB(userId: string) {
	return await subscriptionRepository.findSubscriptionByUserId(userId);
}

/**
 * Update user's subscription in local DB (for backup)
 */
export async function updateUserSubscriptionInDB(
	userId: string,
	stripeSubscriptionId: string,
	stripePriceId: string,
	currentTier: UserTier
) {
	return await subscriptionRepository.upsertSubscription(
		userId,
		stripeSubscriptionId,
		stripePriceId,
		currentTier
	);
}

/**
 * Sync user's subscription from Stripe to local DB
 * Called from webhooks or manual sync
 */
export async function syncUserSubscription(userId: string, stripeCustomerId: string) {
	const stripeData = await getUserTierFromStripe(stripeCustomerId);

	if (stripeData.hasActiveSubscription && stripeData.subscriptionId && stripeData.priceId) {
		await updateUserSubscriptionInDB(
			userId,
			stripeData.subscriptionId,
			stripeData.priceId,
			stripeData.tier
		);
	}

	return stripeData;
}

// =============================================================================
// MAIN USER FUNCTIONS (Combines Stripe + DB)
// =============================================================================

/**
 * Get user's current tier (tries Stripe first, falls back to DB)
 * This is the main function components should use
 */
export async function getUserCurrentTier(userId: string): Promise<UserTier> {
	try {
		// Get user to check if they have Stripe customer ID
		const user = await userRepository.findUserById(userId);

		if (!user?.stripeCustomerId) {
			return 'free';
		}

		// Try Stripe first (source of truth)
		const stripeData = await getUserTierFromStripe(user.stripeCustomerId);
		if (stripeData.hasActiveSubscription && stripeData.subscriptionId && stripeData.priceId) {
			// Sync to DB for backup
			await updateUserSubscriptionInDB(
				userId,
				stripeData.subscriptionId,
				stripeData.priceId,
				stripeData.tier
			);
			return stripeData.tier;
		}

		// Fallback to DB if Stripe fails
		const dbSubscription = await getUserSubscriptionFromDB(userId);
		return (dbSubscription?.currentTier as UserTier) || 'free';
	} catch (error) {
		logger.error('Error getting user tier:', error);

		// Final fallback to DB
		try {
			const dbSubscription = await getUserSubscriptionFromDB(userId);
			return (dbSubscription?.currentTier as UserTier) || 'free';
		} catch {
			return 'free';
		}
	}
}

/**
 * Ensure user has Stripe customer ID
 * Creates one if missing, or links to existing customer with same email
 */
export async function ensureStripeCustomer(userId: string, email: string): Promise<string | null> {
	try {
		// Check if user already has customer ID
		const user = await userRepository.findUserById(userId);

		if (user?.stripeCustomerId) {
			// Verify the customer still exists in Stripe and has the correct email
			try {
				const stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
				if (
					typeof stripeCustomer === 'object' &&
					!stripeCustomer.deleted &&
					'email' in stripeCustomer &&
					stripeCustomer.email === email
				) {
					return user.stripeCustomerId;
				}
				// Customer exists but email doesn't match - need to handle this edge case
				const customerEmail = 'email' in stripeCustomer ? stripeCustomer.email : 'unknown';
				logger.warn(
					`Stripe customer ${user.stripeCustomerId} email mismatch. Expected: ${email}, Got: ${customerEmail}`
				);
			} catch {
				logger.warn(
					`Stripe customer ${user.stripeCustomerId} not found in Stripe, will create/link new one`
				);
			}
		}

		// Also check if any other user in our DB has the same email and already has a stripeCustomerId
		const existingUserWithEmail = await userRepository.findUserByEmail(email);
		if (
			existingUserWithEmail &&
			existingUserWithEmail.id !== userId &&
			existingUserWithEmail.stripeCustomerId
		) {
			logger.info(
				`Found existing user with same email ${email} and Stripe customer ID: ${existingUserWithEmail.stripeCustomerId}`
			);

			// Update current user to use the same Stripe customer ID
			await userRepository.updateUser(userId, {
				stripeCustomerId: existingUserWithEmail.stripeCustomerId
			});
			return existingUserWithEmail.stripeCustomerId;
		}

		// Create new Stripe customer or link to existing one
		return await createStripeCustomer(userId, email);
	} catch (error) {
		logger.error('Error ensuring Stripe customer:', error);
		return null;
	}
}
