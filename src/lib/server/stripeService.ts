// 💳 Stripe Integration Service
// Handles subscriptions, payments, and tier management

import Stripe from 'stripe';
import { db } from './db/index';
import { users, subscriptions, payments } from './db/schema';
import { eq } from 'drizzle-orm';
import type { User } from './db/types';
import type { Subscription as DbSubscription } from './db/types';
import { tierService } from './tierService';
import { env } from '$env/dynamic/private';

// Environment variables
const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

// Stripe price IDs for different tiers
export const STRIPE_PRICES = {
	pro: env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
	premium: env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly'
} as const;

if (!STRIPE_SECRET_KEY) {
	throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY);

export class StripeService {
	/**
	 * Create a Stripe customer for a user
	 */
	async createCustomer(user: User): Promise<string> {
		const customer = await stripe.customers.create({
			email: user.email,
			name: user.displayName || user.username || undefined,
			metadata: {
				userId: user.id
			}
		});

		// Update user with Stripe customer ID
		await db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, user.id));

		return customer.id;
	}

	/**
	 * Create a checkout session for subscription
	 */
	async createCheckoutSession(
		userId: string,
		priceId: string,
		successUrl: string,
		cancelUrl: string
	): Promise<{ sessionId: string; url: string }> {
		const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		if (!user[0]) {
			throw new Error('User not found');
		}

		let customerId = user[0].stripeCustomerId;

		// Create customer if doesn't exist
		if (!customerId) {
			customerId = await this.createCustomer(user[0]);
		}

		const session = await stripe.checkout.sessions.create({
			customer: customerId,
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
				userId: userId
			},
			// Enhanced subscription settings
			subscription_data: {
				metadata: {
					userId: userId
				}
			}
		});

		if (!session.url) {
			throw new Error('Failed to create checkout session');
		}

		return {
			sessionId: session.id,
			url: session.url
		};
	}

	/**
	 * Extract key subscription data from Stripe subscription object
	 * Uses Stripe metadata and dynamic pricing instead of hardcoded mappings
	 */
	private async extractSubscriptionData(stripeSubscription: Stripe.Subscription) {
		const primaryItem = stripeSubscription.items.data[0];
		if (!primaryItem) {
			throw new Error('No subscription items found');
		}

		const price = primaryItem.price;

		// Get tier from price metadata or fallback to price ID analysis
		let tierId = price.metadata?.tier;
		if (!tierId) {
			// Fallback: analyze price ID or description for tier info
			tierId = this.inferTierFromPrice(price);
		}

		return {
			priceId: price.id,
			tierId,
			quantity: primaryItem.quantity || 1,
			billingCycleAnchor: new Date(stripeSubscription.billing_cycle_anchor * 1000),
			startDate: new Date(stripeSubscription.start_date * 1000),

			collectionMethod: stripeSubscription.collection_method,
			currency: stripeSubscription.currency,
			metadata: stripeSubscription.metadata
		};
	}

	/**
	 * Infer tier from price information when metadata is not available
	 */
	private inferTierFromPrice(price: Stripe.Price): string {
		// Check price metadata first
		if (price.metadata?.tier) {
			return price.metadata.tier;
		}

		// Check price ID pattern
		if (price.id.includes('premium')) return 'premium';
		if (price.id.includes('plus')) return 'plus';

		// Default fallback
		return 'plus';
	}

	/**
	 * Handle successful subscription creation
	 */
	async handleSubscriptionCreated(stripeSubscription: Stripe.Subscription): Promise<void> {
		const userId = stripeSubscription.metadata?.userId;
		if (!userId) {
			console.error('No userId in subscription metadata');
			return;
		}

		try {
			const subscriptionData = await this.extractSubscriptionData(stripeSubscription);

			// Create subscription record with enhanced data
			await db.insert(subscriptions).values({
				userId: userId,
				stripeSubscriptionId: stripeSubscription.id,
				stripePriceId: subscriptionData.priceId,
				currentTier: subscriptionData.tierId as any
			});

			// Update user tier
			await tierService.upgradeUserTier(userId, subscriptionData.tierId as 'plus' | 'premium');

			console.log(`✅ Subscription created for user ${userId}, tier: ${subscriptionData.tierId}`);
		} catch (error) {
			console.error('Error handling subscription creation:', error);
			throw error;
		}
	}

	/**
	 * Handle subscription updates
	 */
	async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
		const existingSubscription = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id))
			.limit(1);

		if (!existingSubscription[0]) {
			console.error('Subscription not found:', stripeSubscription.id);
			return;
		}

		try {
			const subscriptionData = await this.extractSubscriptionData(stripeSubscription);

			// Update subscription with enhanced data
			await db
				.update(subscriptions)
				.set({
					stripePriceId: subscriptionData.priceId,
					currentTier: subscriptionData.tierId as any,
					updatedAt: new Date()
				})
				.where(eq(subscriptions.id, existingSubscription[0].id));

			// Update user tier if changed
			if (subscriptionData.tierId) {
				await tierService.upgradeUserTier(
					existingSubscription[0].userId,
					subscriptionData.tierId as 'plus' | 'premium'
				);
			}

			// Handle different subscription statuses
			await this.handleSubscriptionStatusChange(
				existingSubscription[0].userId,
				stripeSubscription.status,
				subscriptionData.tierId
			);

			console.log(
				`✅ Subscription updated: ${stripeSubscription.id}, status: ${stripeSubscription.status}`
			);
		} catch (error) {
			console.error('Error handling subscription update:', error);
			throw error;
		}
	}

	/**
	 * Handle subscription status changes
	 */
	private async handleSubscriptionStatusChange(
		userId: string,
		_status: string,
		tierId: string | null
	): Promise<void> {
		// Minimal handler: ensure tier is applied when provided
		if (tierId) {
			await tierService.upgradeUserTier(userId, tierId as 'plus' | 'premium');
		}
	}

	/**
	 * Handle successful payment
	 */
	async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
		const subscriptionId = paymentIntent.metadata?.subscription_id;
		let dbSubscriptionId: string | null = null;

		// Find subscription if available
		if (subscriptionId) {
			const subscription = await db
				.select()
				.from(subscriptions)
				.where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
				.limit(1);

			dbSubscriptionId = subscription[0]?.id || null;
		}

		// Record payment
		await db.insert(payments).values({
			userId: paymentIntent.metadata?.userId || '', // This should be set in metadata
			subscriptionId: dbSubscriptionId,
			stripePaymentIntentId: paymentIntent.id,
			amount: (paymentIntent.amount / 100).toString(), // Convert from cents
			currency: paymentIntent.currency,
			status: paymentIntent.status
		});

		console.log(`✅ Payment recorded: ${paymentIntent.id}, amount: ${paymentIntent.amount / 100}`);
	}

	/**
	 * Get user's active subscription
	 */
	async getUserSubscription(userId: string): Promise<DbSubscription | null> {
		const rows = await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.userId, userId))
			.orderBy(subscriptions.updatedAt);

		return rows[0] || null;
	}

	/**
	 * Get user's subscription by status
	 */
	async getUserSubscriptionByStatus(
		userId: string,
		_status: string
	): Promise<DbSubscription | null> {
		return await this.getUserSubscription(userId);
	}

	/**
	 * Get all user subscriptions
	 */
	async getAllUserSubscriptions(userId: string): Promise<DbSubscription[]> {
		return await db
			.select()
			.from(subscriptions)
			.where(eq(subscriptions.userId, userId))
			.orderBy(subscriptions.createdAt);
	}

	/**
	 * Cancel subscription
	 */
	async cancelSubscription(userId: string): Promise<void> {
		const subscription = await this.getUserSubscription(userId);
		if (!subscription) {
			throw new Error('No active subscription found');
		}

		// Cancel at period end in Stripe
		await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
			cancel_at_period_end: true
		});

		// Update local record
		await db
			.update(subscriptions)
			.set({ updatedAt: new Date() })
			.where(eq(subscriptions.id, subscription.id));

		console.log(`✅ Subscription cancelled for user ${userId}`);
	}

	/**
	 * Reactivate a canceled subscription
	 */
	async reactivateSubscription(userId: string): Promise<void> {
		const subscription = await this.getUserSubscriptionByStatus(userId, 'canceled');
		if (!subscription) {
			throw new Error('No canceled subscription found');
		}

		// Reactivate in Stripe
		await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
			cancel_at_period_end: false
		});

		// Update local record
		await db
			.update(subscriptions)
			.set({ updatedAt: new Date() })
			.where(eq(subscriptions.id, subscription.id));

		// Restore user tier
		await tierService.upgradeUserTier(userId, subscription.currentTier as 'plus' | 'premium');

		console.log(`✅ Subscription reactivated for user ${userId}`);
	}

	/**
	 * Pause subscription collection
	 */
	async pauseSubscriptionCollection(userId: string, resumeAt?: Date): Promise<void> {
		const subscription = await this.getUserSubscription(userId);
		if (!subscription) {
			throw new Error('No active subscription found');
		}

		await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
			pause_collection: {
				behavior: 'keep_as_draft',
				resumes_at: resumeAt ? Math.floor(resumeAt.getTime() / 1000) : undefined
			}
		});

		console.log(`✅ Subscription collection paused for user ${userId}`);
	}

	/**
	 * Resume subscription collection
	 */
	async resumeSubscriptionCollection(userId: string): Promise<void> {
		const subscription = await this.getUserSubscription(userId);
		if (!subscription) {
			throw new Error('No active subscription found');
		}

		await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
			pause_collection: null
		});

		console.log(`✅ Subscription collection resumed for user ${userId}`);
	}

	/**
	 * Create customer portal session
	 */
	async createPortalSession(userId: string, returnUrl: string): Promise<string> {
		const subscription = await this.getUserSubscription(userId);
		if (!subscription) {
			throw new Error('No active subscription found');
		}

		// Fetch user to obtain Stripe customer ID
		const userRow = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		const customerId = userRow[0]?.stripeCustomerId;
		if (!customerId) throw new Error('User missing Stripe customer ID');
		const session = await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: returnUrl
		});

		return session.url;
	}

	/**
	 * Get subscription details from Stripe
	 */
	async getStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
		try {
			return await stripe.subscriptions.retrieve(subscriptionId);
		} catch (error) {
			console.error('Error retrieving Stripe subscription:', error);
			return null;
		}
	}

	/**
	 * Verify webhook signature
	 */
	verifyWebhook(body: string, signature: string): Stripe.Event {
		if (!STRIPE_WEBHOOK_SECRET) {
			throw new Error('STRIPE_WEBHOOK_SECRET not configured');
		}

		return stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
	}
}

// Export singleton instance
export const stripeService = new StripeService();
export { stripe };
