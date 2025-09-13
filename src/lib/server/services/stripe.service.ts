// 💳 Stripe Integration Service
// Handles subscriptions, payments, and tier management

import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { paymentRepository, userRepository } from '../repositories';
import { subscriptionRepository } from '../repositories/subscription.repository';
import type { Subscription } from '../db/types';
import { getAllStripePriceIds, getStripePriceId } from '../tiers';

// Environment variables
const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

// Stripe configuration is now imported from ../../data/stripe

// Legacy price IDs for backward compatibility
export const STRIPE_PRICES_LEGACY = {
	pro: env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
	premium: env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly'
} as const;

if (!STRIPE_SECRET_KEY) {
	throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
	apiVersion: '2025-08-27.basil'
});

export class StripeService {
	// Price ID helper methods are now imported from ../../data/stripe

	/**
	 * Creates a Stripe customer for a user or retrieves the existing one.
	 */
	async createCustomer(userId: string, email: string): Promise<string | null> {
		try {
			// Check if the user already has a Stripe Customer ID in our database
			const userProfile = await userRepository.findUserById(userId);
			if (userProfile?.stripeCustomerId) {
				return userProfile.stripeCustomerId;
			}

			// If not, create a new customer in Stripe
			const customer = await stripe.customers.create({
				email: email,
				metadata: { userId: userId }
			});

			// Save the new Stripe Customer ID to the user's profile
			if (userProfile) {
				await userRepository.updateUser(userId, { stripeCustomerId: customer.id });
			}

			return customer.id;
		} catch (error) {
			console.error(`Error creating Stripe customer for user ${userId}:`, error);
			return null;
		}
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
		const user = await userRepository.findUserById(userId);
		if (!user) {
			throw new Error('User not found');
		}

		let customerId = user.stripeCustomerId;

		// Create customer if doesn't exist
		if (!customerId) {
			customerId = await this.createCustomer(user.id, user.email);
			if (!customerId) {
				throw new Error('Failed to create Stripe customer');
			}
		}

		// Validate price ID
		const validPrices = getAllStripePriceIds();
		if (!validPrices.includes(priceId)) {
			throw new Error(`Invalid price ID: ${priceId}. Valid prices: ${validPrices.join(', ')}`);
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
			subscription_data: {},
			success_url: successUrl,
			cancel_url: cancelUrl,
			metadata: {
				userId: userId,
				planType: priceId.includes('annual') ? 'annual' : 'monthly'
			},
			allow_promotion_codes: true
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
		console.log('🔍 [EXTRACT DATA] Starting subscription data extraction...');
		
		const primaryItem = stripeSubscription.items.data[0];
		if (!primaryItem) {
			throw new Error('No subscription items found');
		}

		const price = primaryItem.price;
		
		console.log('🔍 [EXTRACT DATA] Primary subscription item:');
		console.log('  - price.id:', price.id);
		console.log('  - price.metadata:', price.metadata);
		console.log('  - price.product:', typeof price.product === 'string' ? price.product : price.product?.id);
		console.log('  - price.unit_amount:', price.unit_amount);
		console.log('  - price.currency:', price.currency);
		console.log('  - price.recurring:', price.recurring);

		// Get tier from price metadata or fallback to price ID analysis
		let tierId = price.metadata?.tier;
		console.log('🔍 [EXTRACT DATA] Tier from price metadata:', tierId);
		
		if (!tierId) {
			console.log('🔍 [EXTRACT DATA] No tier in metadata, inferring from price...');
			// Fallback: analyze price ID or description for tier info
			tierId = this.inferTierFromPrice(price);
			console.log('🔍 [EXTRACT DATA] Inferred tier:', tierId);
		}

		const extractedData = {
			priceId: price.id,
			tierId,
			quantity: primaryItem.quantity || 1,
			billingCycleAnchor: new Date(stripeSubscription.billing_cycle_anchor * 1000),
			startDate: new Date(stripeSubscription.start_date * 1000),
			trialStart: stripeSubscription.trial_start
				? new Date(stripeSubscription.trial_start * 1000)
				: null,

			collectionMethod: stripeSubscription.collection_method,
			currency: stripeSubscription.currency,
			metadata: stripeSubscription.metadata
		};

		console.log('🔍 [EXTRACT DATA] Final extracted data:', extractedData);
		return extractedData;
	}

	/**
	 * Infer tier from price information when metadata is not available
	 */
	private inferTierFromPrice(price: Stripe.Price): string {
		console.log('🔍 [INFER TIER] Starting tier inference...');
		console.log('  - price.id:', price.id);
		console.log('  - price.metadata:', price.metadata);
		console.log('  - env.STRIPE_EARLY_BACKER_PRICE_ID:', env.STRIPE_EARLY_BACKER_PRICE_ID);
		
		// Check price metadata first
		if (price.metadata?.tier) {
			console.log('🔍 [INFER TIER] Found tier in metadata:', price.metadata.tier);
			return price.metadata.tier;
		}

		// Check price ID pattern
		if (env.STRIPE_EARLY_BACKER_PRICE_ID && price.id === env.STRIPE_EARLY_BACKER_PRICE_ID) {
			console.log('🔍 [INFER TIER] Matched early backer price ID → plus');
			return 'plus';
		}
		
		if (price.id.includes('premium')) {
			console.log('🔍 [INFER TIER] Price ID contains "premium" → premium');
			return 'premium';
		}
		
		if (price.id.includes('plus')) {
			console.log('🔍 [INFER TIER] Price ID contains "plus" → plus');
			return 'plus';
		}

		// Check product name if available
		if (typeof price.product === 'object' && price.product && 'name' in price.product && price.product.name) {
			console.log('🔍 [INFER TIER] Checking product name:', price.product.name);
			const productName = price.product.name.toLowerCase();
			if (productName.includes('premium')) {
				console.log('🔍 [INFER TIER] Product name contains "premium" → premium');
				return 'premium';
			}
			if (productName.includes('plus')) {
				console.log('🔍 [INFER TIER] Product name contains "plus" → plus');
				return 'plus';
			}
		}

		// Default fallback
		console.log('🔍 [INFER TIER] No match found, using default fallback → plus');
		return 'plus';
	}

	/**
	 * Handles the 'checkout.session.completed' webhook event.
	 * It retrieves necessary data and delegates the subscription update logic
	 * to the dedicated subscriptionRepository.
	 */
	async handleCheckoutSuccess(session: Stripe.Checkout.Session): Promise<void> {
		console.log('🎣 [CHECKOUT SUCCESS] Starting handleCheckoutSuccess...');
		
		// Get userId from metadata (we set this in createCheckoutSession)
		const userId = session.metadata?.userId;

		console.log('🎣 [CHECKOUT SUCCESS] Extracted data from session:');
		console.log('  - userId:', userId);
		console.log('  - session.subscription:', session.subscription);
		console.log('  - session.customer:', session.customer);
		console.log('  - session.payment_status:', session.payment_status);

		if (!userId || !session.subscription || !session.customer) {
			console.error('🎣 [CHECKOUT SUCCESS] ❌ Missing required data in session:');
			console.error('  - Session ID:', session.id);
			console.error('  - userId:', userId);
			console.error('  - subscription:', session.subscription);
			console.error('  - customer:', session.customer);
			return;
		}

		const subscriptionId =
			typeof session.subscription === 'string' ? session.subscription : session.subscription.id;

		console.log('🎣 [CHECKOUT SUCCESS] Processing for user:', userId, 'subscription:', subscriptionId);

		try {
			// Retrieve the full subscription object to get all details
			console.log('🎣 [CHECKOUT SUCCESS] Retrieving full subscription from Stripe...');
			const subscription = await stripe.subscriptions.retrieve(subscriptionId);
			
			console.log('🎣 [CHECKOUT SUCCESS] Full subscription data:');
			console.log('  - id:', subscription.id);
			console.log('  - status:', subscription.status);
			console.log('  - customer:', subscription.customer);
			console.log('  - created:', new Date(subscription.created * 1000).toISOString());
			console.log('  - current_period_start:', new Date(subscription.current_period_start * 1000).toISOString());
			console.log('  - current_period_end:', new Date(subscription.current_period_end * 1000).toISOString());
			console.log('  - items count:', subscription.items.data.length);
			console.log('  - metadata:', subscription.metadata);

			// Extract subscription data to determine tier
			console.log('🎣 [CHECKOUT SUCCESS] Extracting subscription data...');
			const subscriptionData = await this.extractSubscriptionData(subscription);
			const tierId = subscriptionData.tierId;

			console.log('🎣 [CHECKOUT SUCCESS] Extracted subscription data:');
			console.log('  - priceId:', subscriptionData.priceId);
			console.log('  - tierId:', tierId);
			console.log('  - currency:', subscriptionData.currency);

			// Check if subscription already exists
			console.log('🎣 [CHECKOUT SUCCESS] Checking for existing subscription...');
			const existingSubscription = await subscriptionRepository.findSubscriptionByStripeId(subscriptionId);
			
			if (existingSubscription) {
				console.log('🎣 [CHECKOUT SUCCESS] ⚠️ Subscription already exists:', existingSubscription.id);
				console.log('  - Current status:', existingSubscription.status);
				console.log('  - Current tier:', existingSubscription.tierId);
				console.log('  - Is active:', existingSubscription.isActive);
				
				// Update existing subscription
				const updated = await subscriptionRepository.updateSubscription(existingSubscription.id, {
					status: subscription.status,
					currentPeriodStart: new Date(subscription.current_period_start * 1000),
					currentPeriodEnd: new Date(subscription.current_period_end * 1000),
					cancelAtPeriodEnd: subscription.cancel_at_period_end,
					stripePriceId: subscriptionData.priceId,
					tierId: tierId,
					isActive: ['active', 'trialing'].includes(subscription.status),
					effectiveTier: tierId
				});
				
				console.log('🎣 [CHECKOUT SUCCESS] ✅ Updated existing subscription:', updated?.id);
			} else {
				// Create subscription record using repository
				console.log('🎣 [CHECKOUT SUCCESS] Creating new subscription record...');
				const newSubscription = await subscriptionRepository.createSubscription({
					userId,
					stripeCustomerId: session.customer as string,
					stripeSubscriptionId: subscriptionId,
					stripePriceId: subscriptionData.priceId,
					status: subscription.status,
					currentPeriodStart: new Date(subscription.current_period_start * 1000),
					currentPeriodEnd: new Date(subscription.current_period_end * 1000),
					cancelAtPeriodEnd: subscription.cancel_at_period_end,
					tierId: tierId,
					isActive: ['active', 'trialing'].includes(subscription.status),
					effectiveTier: tierId
				});

				console.log('🎣 [CHECKOUT SUCCESS] ✅ Created new subscription:', newSubscription.id);
			}

			// Verify the subscription was created/updated properly
			console.log('🎣 [CHECKOUT SUCCESS] Verifying subscription in database...');
			const finalSubscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
			
			if (finalSubscription) {
				console.log('🎣 [CHECKOUT SUCCESS] ✅ Final verification successful:');
				console.log('  - Subscription ID:', finalSubscription.id);
				console.log('  - User ID:', finalSubscription.userId);
				console.log('  - Tier ID:', finalSubscription.tierId);
				console.log('  - Effective Tier:', finalSubscription.effectiveTier);
				console.log('  - Is Active:', finalSubscription.isActive);
				console.log('  - Status:', finalSubscription.status);
			} else {
				console.error('🎣 [CHECKOUT SUCCESS] ❌ No active subscription found after creation/update!');
			}

			console.log(`🎣 [CHECKOUT SUCCESS] ✅ Checkout success processed for user ${userId}, tier updated to: ${tierId}`);
		} catch (error) {
			console.error('🎣 [CHECKOUT SUCCESS] ❌ Error processing checkout success:', error);
			throw error;
		}
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

			// Create subscription record using repository
			await subscriptionRepository.createSubscription({
				userId: userId,
				stripeSubscriptionId: stripeSubscription.id,
				stripeCustomerId:
					typeof stripeSubscription.customer === 'string'
						? stripeSubscription.customer
						: stripeSubscription.customer.id,
				stripePriceId: subscriptionData.priceId,
				status: stripeSubscription.status,
				currentPeriodStart: new Date(stripeSubscription.created * 1000),
				currentPeriodEnd: new Date((stripeSubscription.cancel_at ?? 0) * 1000),
				cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
				tierId: subscriptionData.tierId
			});

			// Update user tier
			console.log(`User ${userId} tier updated to ${subscriptionData.tierId} via subscription`);

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
		const existingSubscription = await subscriptionRepository.findSubscriptionByStripeId(
			stripeSubscription.id
		);

		if (!existingSubscription) {
			console.error('Subscription not found:', stripeSubscription.id);
			return;
		}

		try {
			const subscriptionData = await this.extractSubscriptionData(stripeSubscription);

			// Update subscription using repository
			await subscriptionRepository.updateSubscription(existingSubscription.id, {
				status: stripeSubscription.status,
				currentPeriodStart: new Date(stripeSubscription.created * 1000),
				currentPeriodEnd: new Date(stripeSubscription.cancel_at ?? 0 * 1000),
				cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
				stripePriceId: subscriptionData.priceId,
				tierId: subscriptionData.tierId
			});

			// Update user tier if changed
			if (subscriptionData.tierId) {
				console.log(
					`User ${existingSubscription.userId} tier updated to ${subscriptionData.tierId} via subscription`
				);
			}

			// Handle different subscription statuses
			await this.handleSubscriptionStatusChange(
				existingSubscription.userId,
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
		status: string,
		tierId: string | null
	): Promise<void> {
		switch (status) {
			case 'canceled':
			case 'unpaid':
			case 'incomplete_expired':
				// Downgrade to free tier
				console.log(`User ${userId} tier downgraded to free due to subscription status: ${status}`);
				break;
			case 'past_due':
				// Keep current tier but log warning
				console.warn(`Subscription past due for user ${userId}`);
				break;
			case 'trialing':
				// Apply tier benefits during trial
				if (tierId) {
					console.log(`User ${userId} tier set to ${tierId} during trial`);
				}
				break;
			case 'active':
				// Ensure user has correct tier
				if (tierId) {
					console.log(`User ${userId} tier confirmed as ${tierId} for active subscription`);
				}
				break;
		}
	}

	/**
	 * Handle successful payment
	 */
	async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
		const subscriptionId = paymentIntent.metadata?.subscription_id;
		let SubscriptionId: string | null = null;

		// Find subscription if available
		if (subscriptionId) {
			const subscription = await subscriptionRepository.findSubscriptionByStripeId(subscriptionId);
			SubscriptionId = subscription?.id || null;
		}

		// Record payment using repository
		await paymentRepository.createPayment({
			userId: paymentIntent.metadata?.userId || '', // This should be set in metadata
			subscriptionId: SubscriptionId,
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
	async getUserSubscription(userId: string): Promise<Subscription | undefined> {
		return await subscriptionRepository.findActiveSubscriptionByUserId(userId);
	}

	/**
	 * Get user's subscription by status
	 */
	async getUserSubscriptionByStatus(userId: string, status: string): Promise<Subscription | null> {
		return await subscriptionRepository
			.findSubscriptionsByStatus(status)
			.then((subs) => subs[0] || null);
	}

	/**
	 * Get all user subscriptions
	 */
	async getAllUserSubscriptions(userId: string): Promise<Subscription[]> {
		return await subscriptionRepository.findSubscriptionsByUserId(userId);
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

		// Update local record using repository
		await subscriptionRepository.cancelSubscription(subscription.id, true);

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

		// Update local record using repository
		await subscriptionRepository.updateSubscription(subscription.id, {
			cancelAtPeriodEnd: false,
			status: 'active'
		});

		// Restore user tier
		console.log(
			`User ${userId} tier restored to ${subscription.tierId} via subscription reactivation`
		);

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

		const session = await stripe.billingPortal.sessions.create({
			customer: subscription.stripeCustomerId,
			return_url: returnUrl
		});

		return session.url;
	}

	/**
	 * Retrieves a customer's active subscription from Stripe.
	 */
	async getSubscription(stripeCustomerId: string): Promise<Stripe.Subscription | null> {
		if (!stripeCustomerId) {
			return null;
		}

		try {
			const subscriptions = await stripe.subscriptions.list({
				customer: stripeCustomerId,
				status: 'active',
				limit: 1
			});

			// If the customer has an active subscription, return the first one.
			if (subscriptions.data.length > 0) {
				return subscriptions.data[0];
			}

			return null;
		} catch (error) {
			console.error(`Error fetching subscription for customer ${stripeCustomerId}:`, error);
			return null;
		}
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

	/**
	 * Get available price IDs for a specific tier and billing cycle
	 */
	getPriceId(tier: 'plus' | 'premium', billingCycle: 'monthly' | 'annual'): string | null {
		return getStripePriceId(tier, billingCycle);
	}

	/**
	 * Validate if a price ID is valid
	 */
	isValidPriceId(priceId: string): boolean {
		const validPrices = getAllStripePriceIds();
		return validPrices.includes(priceId);
	}

	/**
	 * Get available price IDs
	 */
	get STRIPE_PRICES() {
		return getAllStripePriceIds();
	}

	/**
	 * Retrieve a price from Stripe by ID
	 */
	async getPrice(priceId: string): Promise<Stripe.Price | null> {
		try {
			return await stripe.prices.retrieve(priceId);
		} catch (error) {
			console.error(`Error retrieving price ${priceId}:`, error);
			return null;
		}
	}
}

// Export singleton instance
export const stripeService = new StripeService();
export { stripe };
