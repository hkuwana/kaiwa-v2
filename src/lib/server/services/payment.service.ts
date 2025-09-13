// src/lib/server/services/payment.service.ts
// Central payment service that orchestrates Stripe operations, subscription management,
// and ensures proper schema field updates

import { stripeService } from './stripe.service';
import { subscriptionRepository } from '../repositories/subscription.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { userRepository } from '../repositories/user.repository';
import type { Subscription, Payment, User } from '../db/types';

export class PaymentService {
	/**
	 * Initialize a subscription for a user (creates checkout session)
	 * Ensures user has stripe customer ID before proceeding
	 */
	async initializeSubscription(
		userId: string,
		priceId: string,
		successUrl: string,
		cancelUrl: string
	): Promise<{ sessionId: string; url: string }> {
		// Ensure user exists and has necessary fields
		const user = await this.ensureUserExists(userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Ensure user has stripe customer ID
		await this.ensureStripeCustomer(user);

		// Create checkout session via Stripe service
		return await stripeService.createCheckoutSession(userId, priceId, successUrl, cancelUrl);
	}

	/**
	 * Process a successful subscription creation/update
	 * This is the main entry point for webhook handlers and manual subscription updates
	 */
	async processSubscriptionSuccess(subscriptionData: {
		userId: string;
		stripeSubscriptionId: string;
		stripeCustomerId: string;
		stripePriceId: string;
		status: string;
		currentPeriodStart: Date;
		currentPeriodEnd: Date;
		cancelAtPeriodEnd: boolean;
		tierId: string;
		stripeMeteredSubscriptionItemId?: string;
	}): Promise<Subscription> {
		// Ensure user has free tier subscription if they don't have any
		await this.ensureUserHasSubscription(subscriptionData.userId);

		// Check if subscription already exists
		const existingSubscription = await subscriptionRepository.findSubscriptionByStripeId(
			subscriptionData.stripeSubscriptionId
		);

		if (existingSubscription) {
			// Update existing subscription
			return await this.updateSubscriptionFields(existingSubscription.id, {
				status: subscriptionData.status,
				currentPeriodStart: subscriptionData.currentPeriodStart,
				currentPeriodEnd: subscriptionData.currentPeriodEnd,
				cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
				stripePriceId: subscriptionData.stripePriceId,
				tierId: subscriptionData.tierId,
				isActive: this.isActiveStatus(subscriptionData.status),
				effectiveTier: subscriptionData.tierId,
				stripeMeteredSubscriptionItemId: subscriptionData.stripeMeteredSubscriptionItemId
			});
		} else {
			// Create new subscription
			return await this.createSubscription(subscriptionData);
		}
	}

	/**
	 * Process a payment success event
	 * Records payment and links to subscription if applicable
	 */
	async processPaymentSuccess(paymentData: {
		userId: string;
		stripePaymentIntentId: string;
		stripeInvoiceId?: string;
		amount: string;
		currency: string;
		status: string;
		subscriptionId?: string;
	}): Promise<Payment> {
		// Find subscription by stripe subscription ID if provided
		let localSubscriptionId: string | undefined;
		if (paymentData.subscriptionId) {
			const subscription = await subscriptionRepository.findSubscriptionByStripeId(
				paymentData.subscriptionId
			);
			localSubscriptionId = subscription?.id;
		}

		// Create payment record
		return await paymentRepository.createPayment({
			userId: paymentData.userId,
			subscriptionId: localSubscriptionId,
			stripePaymentIntentId: paymentData.stripePaymentIntentId,
			stripeInvoiceId: paymentData.stripeInvoiceId,
			amount: paymentData.amount,
			currency: paymentData.currency,
			status: paymentData.status
		});
	}

	/**
	 * Cancel a user's subscription
	 * Updates both Stripe and local database
	 */
	async cancelUserSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
		const subscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		if (!subscription) {
			throw new Error('No active subscription found for user');
		}

		// Cancel in Stripe
		await stripeService.cancelSubscription(userId);

		// Update local subscription
		await this.updateSubscriptionFields(subscription.id, {
			cancelAtPeriodEnd,
			isActive: !cancelAtPeriodEnd, // If immediate cancellation, set inactive
			effectiveTier: cancelAtPeriodEnd ? subscription.tierId : 'free'
		});

		// If immediate cancellation, ensure user gets free tier subscription
		if (!cancelAtPeriodEnd) {
			await this.ensureUserHasSubscription(userId);
		}
	}

	/**
	 * Get user's current effective subscription
	 * Returns active subscription or creates free tier if none exists
	 */
	async getUserSubscription(userId: string): Promise<Subscription> {
		let subscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		
		if (!subscription) {
			// Create free tier subscription if none exists
			subscription = await this.createFreeSubscription(userId);
		}

		return subscription;
	}

	/**
	 * Get user's payment history
	 */
	async getUserPayments(userId: string): Promise<Payment[]> {
		return await paymentRepository.findPaymentsByUserId(userId);
	}

	/**
	 * Get subscription analytics for a user
	 */
	async getUserSubscriptionAnalytics(userId: string): Promise<{
		currentSubscription: Subscription;
		paymentHistory: Payment[];
		totalSpent: number;
		subscriptionHistory: Subscription[];
	}> {
		const currentSubscription = await this.getUserSubscription(userId);
		const paymentHistory = await this.getUserPayments(userId);
		const subscriptionHistory = await subscriptionRepository.findSubscriptionsByUserId(userId);

		const totalSpent = paymentHistory
			.filter(payment => payment.status === 'succeeded')
			.reduce((sum, payment) => sum + Number(payment.amount), 0);

		return {
			currentSubscription,
			paymentHistory,
			totalSpent,
			subscriptionHistory
		};
	}

	// Private helper methods

	/**
	 * Ensure user exists in database
	 */
	private async ensureUserExists(userId: string): Promise<User | undefined> {
		return await userRepository.findUserById(userId);
	}

	/**
	 * Ensure user has a Stripe customer ID
	 */
	private async ensureStripeCustomer(user: User): Promise<void> {
		if (!user.stripeCustomerId) {
			const customerId = await stripeService.createCustomer(user.id, user.email);
			if (customerId) {
				await userRepository.updateUser(user.id, { stripeCustomerId: customerId });
			}
		}
	}

	/**
	 * Ensure user has at least a free tier subscription
	 */
	private async ensureUserHasSubscription(userId: string): Promise<void> {
		const existingSubscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		if (!existingSubscription) {
			await this.createFreeSubscription(userId);
		}
	}

	/**
	 * Create a free tier subscription for a user
	 */
	private async createFreeSubscription(userId: string): Promise<Subscription> {
		const user = await userRepository.findUserById(userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Ensure user has stripe customer ID for consistency
		await this.ensureStripeCustomer(user);
		const updatedUser = await userRepository.findUserById(userId);

		return await subscriptionRepository.createSubscription({
			userId,
			stripeCustomerId: updatedUser?.stripeCustomerId || '',
			stripeSubscriptionId: `free_${userId}_${Date.now()}`, // Unique ID for free subscriptions
			stripePriceId: 'free',
			status: 'active',
			currentPeriodStart: new Date(),
			currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
			cancelAtPeriodEnd: false,
			tierId: 'free',
			isActive: true,
			effectiveTier: 'free'
		});
	}

	/**
	 * Create a new subscription record
	 */
	private async createSubscription(subscriptionData: {
		userId: string;
		stripeSubscriptionId: string;
		stripeCustomerId: string;
		stripePriceId: string;
		status: string;
		currentPeriodStart: Date;
		currentPeriodEnd: Date;
		cancelAtPeriodEnd: boolean;
		tierId: string;
		stripeMeteredSubscriptionItemId?: string;
	}): Promise<Subscription> {
		return await subscriptionRepository.createSubscription({
			...subscriptionData,
			isActive: this.isActiveStatus(subscriptionData.status),
			effectiveTier: subscriptionData.tierId
		});
	}

	/**
	 * Update subscription fields
	 */
	private async updateSubscriptionFields(
		subscriptionId: string,
		updates: Partial<{
			status: string;
			currentPeriodStart: Date;
			currentPeriodEnd: Date;
			cancelAtPeriodEnd: boolean;
			stripePriceId: string;
			tierId: string;
			isActive: boolean;
			effectiveTier: string;
			stripeMeteredSubscriptionItemId: string;
		}>
	): Promise<Subscription> {
		const result = await subscriptionRepository.updateSubscription(subscriptionId, updates);
		if (!result) {
			throw new Error('Failed to update subscription');
		}
		return result;
	}

	/**
	 * Determine if a status is considered active
	 */
	private isActiveStatus(status: string): boolean {
		return ['active', 'trialing'].includes(status);
	}
}

// Export singleton instance
export const paymentService = new PaymentService();