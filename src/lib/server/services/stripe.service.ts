// 💳 Stripe Integration Service
// Handles subscriptions, payments, and tier management

import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { paymentRepository, userRepository, subscriptionRepository } from '../repositories';
import type { Subscription as DbSubscription, UserTier } from '../db/types';
// Note: Using simplified payment.service.ts instead of subscription repository
import { getAllStripePriceIds, getStripePriceId } from '../tiers';
import { SvelteDate } from 'svelte/reactivity';

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
const stripe = new Stripe(STRIPE_SECRET_KEY);

export class StripeService {
	// Price ID helper methods are now imported from ../../data/stripe

	/**
	 * Creates a Stripe customer for a user or retrieves the existing one.
	 * Prevents duplicate customers by checking email in both Stripe and our database.
	 */
	async createCustomer(userId: string, email: string): Promise<string | null> {
		try {
			// Check if the user already has a Stripe Customer ID in our database
			const userProfile = await userRepository.findUserById(userId);
			if (userProfile?.stripeCustomerId) {
				// Verify the customer still exists in Stripe and has the correct email
				try {
					const stripeCustomer = await stripe.customers.retrieve(userProfile.stripeCustomerId);
					if (
						typeof stripeCustomer === 'object' &&
						!stripeCustomer.deleted &&
						'email' in stripeCustomer &&
						stripeCustomer.email === email
					) {
						return userProfile.stripeCustomerId;
					}
					const customerEmail = 'email' in stripeCustomer ? stripeCustomer.email : 'unknown';
					console.warn(
						`Stripe customer ${userProfile.stripeCustomerId} email mismatch or deleted. Expected: ${email}, Got: ${customerEmail}`
					);
				} catch {
					console.warn(
						`Stripe customer ${userProfile.stripeCustomerId} not found in Stripe, will create/link new one`
					);
				}
			}

			// Check if another user in our database has the same email and stripeCustomerId
			const existingUserWithEmail = await userRepository.findUserByEmail(email);
			if (
				existingUserWithEmail &&
				existingUserWithEmail.id !== userId &&
				existingUserWithEmail.stripeCustomerId
			) {
				console.log(
					`Found existing user with same email ${email} and Stripe customer ID: ${existingUserWithEmail.stripeCustomerId}`
				);

				// Update current user to use the same Stripe customer ID
				await userRepository.updateUser(userId, {
					stripeCustomerId: existingUserWithEmail.stripeCustomerId
				});
				return existingUserWithEmail.stripeCustomerId;
			}

			// Check if a customer with this email already exists in Stripe
			const existingCustomers = await stripe.customers.list({
				email,
				limit: 1
			});

			if (existingCustomers.data.length > 0) {
				const existingCustomer = existingCustomers.data[0];
				console.log(`Found existing Stripe customer for email ${email}: ${existingCustomer.id}`);

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
		console.log(
			'  - price.product:',
			typeof price.product === 'string' ? price.product : price.product?.id
		);
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
			billingCycleAnchor: new SvelteDate(stripeSubscription.billing_cycle_anchor * 1000),
			startDate: new SvelteDate(stripeSubscription.start_date * 1000),
			trialStart: stripeSubscription.trial_start
				? new SvelteDate(stripeSubscription.trial_start * 1000)
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
		if (
			typeof price.product === 'object' &&
			price.product &&
			'name' in price.product &&
			price.product.name
		) {
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

	private normalizeTier(tierId: string | null | undefined): UserTier {
		if (tierId === 'plus' || tierId === 'premium') {
			return tierId;
		}
		return 'free';
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

		console.log(
			'🎣 [CHECKOUT SUCCESS] Processing for user:',
			userId,
			'subscription:',
			subscriptionId
		);

		try {
			// Retrieve the full subscription object to get all details
			console.log('🎣 [CHECKOUT SUCCESS] Retrieving full subscription from Stripe...');
			const subscription = await stripe.subscriptions.retrieve(subscriptionId);

			console.log('🎣 [CHECKOUT SUCCESS] Full subscription data:');
			console.log('  - id:', subscription.id);
			console.log('  - status:', subscription.status);
			console.log('  - customer:', subscription.customer);
			console.log(
				'  - created:',
				subscription.created ? new SvelteDate(subscription.created * 1000).toISOString() : 'null'
			);
			console.log(
				'  - start_date:',
				subscription.start_date
					? new SvelteDate(subscription.start_date * 1000).toISOString()
					: 'null'
			);
			console.log(
				'  - cancel_at_period_end:',
				subscription.cancel_at
					? new SvelteDate(subscription.cancel_at * 1000).toISOString()
					: 'null'
			);
			console.log('  - items count:', subscription.items?.data?.length || 0);
			console.log('  - metadata:', subscription.metadata);

			// Extract subscription data to determine tier
			console.log('🎣 [CHECKOUT SUCCESS] Extracting subscription data...');
			const subscriptionData = await this.extractSubscriptionData(subscription);
			const normalizedTier =
				subscriptionData.tierId != null ? this.normalizeTier(subscriptionData.tierId) : null;

			console.log('🎣 [CHECKOUT SUCCESS] Extracted subscription data:');
			console.log('  - priceId:', subscriptionData.priceId);
			console.log('  - tier:', normalizedTier ?? 'inherit');
			console.log('  - currency:', subscriptionData.currency);

			// Check if subscription already exists
			console.log('🎣 [CHECKOUT SUCCESS] Checking for existing subscription...');
			// Check for existing record in minimal subscriptions table
			const existingSubscription =
				await subscriptionRepository.findSubscriptionByStripeId(subscriptionId);

			if (existingSubscription) {
				const tier = normalizedTier ?? existingSubscription.currentTier;
				console.log(
					'🎣 [CHECKOUT SUCCESS] ⚠️ Subscription already exists:',
					existingSubscription.id
				);
				console.log('  - Current tier:', existingSubscription.currentTier);

				// Update existing subscription
				await subscriptionRepository.updateSubscription(existingSubscription.id, {
					stripePriceId: subscriptionData.priceId,
					currentTier: tier,
					updatedAt: new SvelteDate()
				});

				console.log(
					'🎣 [CHECKOUT SUCCESS] ✅ Updated existing subscription:',
					existingSubscription.id
				);
			} else {
				const tier = normalizedTier ?? 'free';
				// Create subscription record using repository
				console.log('🎣 [CHECKOUT SUCCESS] Creating new subscription record...');
				const inserted = await subscriptionRepository.createSubscription({
					userId,
					stripeSubscriptionId: subscriptionId,
					stripePriceId: subscriptionData.priceId,
					currentTier: tier
				});

				console.log('🎣 [CHECKOUT SUCCESS] ✅ Created new subscription:', inserted.id);
			}

			// Verify the subscription was created/updated properly
			console.log('🎣 [CHECKOUT SUCCESS] Verifying subscription in database...');
			const finalSubscription = await subscriptionRepository.findSubscriptionByUserId(userId);

			if (finalSubscription) {
				console.log('🎣 [CHECKOUT SUCCESS] ✅ Final verification successful:');
				console.log('  - Subscription ID:', finalSubscription.id);
				console.log('  - User ID:', finalSubscription.userId);
				console.log('  - Current Tier:', finalSubscription.currentTier);
			} else {
				console.error(
					'🎣 [CHECKOUT SUCCESS] ❌ No active subscription found after creation/update!'
				);
			}

			const finalTier = normalizedTier ?? finalSubscription?.currentTier ?? 'free';
			console.log(
				`🎣 [CHECKOUT SUCCESS] ✅ Checkout success processed for user ${userId}, tier updated to: ${finalTier}`
			);
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
			const tier = this.normalizeTier(subscriptionData.tierId);

			const success = await subscriptionRepository.upsertSubscription(
				userId,
				stripeSubscription.id,
				subscriptionData.priceId,
				tier
			);

			if (!success) {
				console.error(`Failed to persist subscription ${stripeSubscription.id} for user ${userId}`);
				return;
			}

			console.log(`User ${userId} tier updated to ${tier} via subscription`);
			console.log(`✅ Subscription recorded for user ${userId}, tier: ${tier}`);
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
			const tier = this.normalizeTier(subscriptionData.tierId);

			// Update subscription using repository
			await subscriptionRepository.updateSubscription(existingSubscription.id, {
				stripePriceId: subscriptionData.priceId,
				currentTier: tier
			});

			// Update user tier if changed
			if (tier !== existingSubscription.currentTier) {
				console.log(`User ${existingSubscription.userId} tier updated to ${tier} via subscription`);
			}

			// Handle different subscription statuses
			await this.handleSubscriptionStatusChange(
				existingSubscription.userId,
				stripeSubscription.status,
				tier
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
		tier: UserTier
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
				if (tier !== 'free') {
					console.log(`User ${userId} tier set to ${tier} during trial`);
				}
				break;
			case 'active':
				// Ensure user has correct tier
				if (tier !== 'free') {
					console.log(`User ${userId} tier confirmed as ${tier} for active subscription`);
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
		const userId = paymentIntent.metadata?.userId;

		console.log(`🎯 [PAYMENT SUCCESS] Processing payment intent: ${paymentIntent.id}`);
		console.log(`  - Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
		console.log(`  - User ID from metadata: ${userId}`);
		console.log(`  - Subscription ID from metadata: ${subscriptionId}`);

		// Skip recording payment if no userId is provided
		if (!userId) {
			console.log(
				`⚠️ [PAYMENT SUCCESS] No userId in payment metadata, skipping payment record creation`
			);
			return;
		}

		// Find subscription if available
		if (subscriptionId) {
			const subscription = await subscriptionRepository.findSubscriptionByStripeId(subscriptionId);
			SubscriptionId = subscription?.id || null;
		}

		// Record payment using repository
		await paymentRepository.createPayment({
			userId: userId,
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
	async getUserSubscription(userId: string): Promise<DbSubscription | null> {
		return await subscriptionRepository.findSubscriptionByUserId(userId);
	}

	/**
	 * Get user's subscription by status
	 */
	async getUserSubscriptionByStatus(
		userId: string,
		status: string
	): Promise<DbSubscription | null> {
		// Minimal schema does not track status; return latest if any
		// NOTE: Status parameter is currently unused due to simplified schema
		console.log(`Requested subscription for user ${userId} with status ${status}`);
		return await this.getUserSubscription(userId);
	}

	/**
	 * Get all user subscriptions
	 */
	async getAllUserSubscriptions(userId: string): Promise<DbSubscription[]> {
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
		// Minimal schema: no status/cancel flags to persist; update timestamp
		await subscriptionRepository.updateSubscription(subscription.id, {
			updatedAt: new SvelteDate()
		});

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
		// Minimal schema: no status/cancel flags to persist; update timestamp
		await subscriptionRepository.updateSubscription(subscription.id, {
			updatedAt: new SvelteDate()
		});

		// Restore user tier
		console.log(
			`User ${userId} tier restored to ${subscription.currentTier} via subscription reactivation`
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
	 * Create or get default portal configuration
	 */
	private async ensurePortalConfiguration(): Promise<string | undefined> {
		try {
			console.log('🔧 [PORTAL CONFIG] Checking for existing portal configurations...');

			// First, try to list existing configurations
			const configurations = await stripe.billingPortal.configurations.list({ limit: 10 });
			console.log(`🔧 [PORTAL CONFIG] Found ${configurations.data.length} existing configurations`);

			// TODO: Temporarily forcing new config creation for payment method updates
			// Uncomment the block below after testing to use existing configs
			/*
			if (configurations.data.length > 0) {
				const defaultConfig = configurations.data.find((config) => config.is_default);
				if (defaultConfig) {
					console.log(`🔧 [PORTAL CONFIG] Using existing default configuration: ${defaultConfig.id}`);
					return defaultConfig.id;
				}
				// If no default, use the first one
				console.log(`🔧 [PORTAL CONFIG] Using first available configuration: ${configurations.data[0].id}`);
				return configurations.data[0].id;
			}
			*/

			// If no configurations exist, create a basic one
			console.log('🔧 [PORTAL CONFIG] No configurations found, creating new one...');
			const configuration = await stripe.billingPortal.configurations.create({
				business_profile: {
					headline: 'Manage your subscription and payment methods'
				},
				features: {
					payment_method_update: {
						enabled: true
					},
					invoice_history: {
						enabled: true
					},
					subscription_cancel: {
						enabled: true,
						mode: 'at_period_end'
					}
				}
			});

			console.log(`🔧 [PORTAL CONFIG] ✅ Created new configuration: ${configuration.id}`);
			return configuration.id;
		} catch (error) {
			console.error('🔧 [PORTAL CONFIG] ❌ Error ensuring portal configuration:', error);
			// Instead of returning undefined, let's throw the error to see what's happening
			throw error;
		}
	}

	/**
	 * Create customer portal session
	 */
	async createPortalSession(userId: string, returnUrl: string): Promise<string> {
		console.log(`🏪 [PORTAL SESSION] Creating portal session for user: ${userId}`);

		const subscription = await this.getUserSubscription(userId);
		if (!subscription) {
			throw new Error('No active subscription found');
		}
		console.log(`🏪 [PORTAL SESSION] Found subscription: ${subscription.id}`);

		// Get customer ID from user
		const user = await userRepository.findUserById(userId);
		if (!user?.stripeCustomerId) {
			throw new Error('No customer ID found for user');
		}
		const customerId = user.stripeCustomerId;
		console.log(`🏪 [PORTAL SESSION] Using customer ID: ${customerId}`);

		// Ensure portal configuration exists
		console.log(`🏪 [PORTAL SESSION] Ensuring portal configuration...`);
		const configurationId = await this.ensurePortalConfiguration();
		console.log(`🏪 [PORTAL SESSION] Configuration ID: ${configurationId || 'none'}`);

		const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
			customer: customerId,
			return_url: returnUrl
		};

		// Only add configuration if we have one
		if (configurationId) {
			sessionParams.configuration = configurationId;
			console.log(`🏪 [PORTAL SESSION] Added configuration to session params`);
		} else {
			console.log(`🏪 [PORTAL SESSION] No configuration - using Stripe default`);
		}

		console.log(`🏪 [PORTAL SESSION] Creating session with params:`, {
			customer: customerId,
			return_url: returnUrl,
			configuration: configurationId || 'default'
		});

		const session = await stripe.billingPortal.sessions.create(sessionParams);

		console.log(`🏪 [PORTAL SESSION] ✅ Session created successfully: ${session.id}`);
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
