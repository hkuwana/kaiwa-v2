// src/routes/api/dev/subscription/+server.ts
// Development endpoint for testing subscription functionality

import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { paymentService } from '$lib/server/services/payment.service';
import { subscriptionService } from '$lib/server/services/subscription.service';
import { userService } from '$lib/server/services/user.service';

// Only allow in development mode
if (!dev) {
	throw error(404, 'Not found');
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	const action = url.searchParams.get('action');

	try {
		switch (action) {
			case 'current':
				// Get current subscription info
				const currentSubscription = await subscriptionService.getOrCreateUserSubscription(userId);
				const tier = await subscriptionService.getUserTier(userId);
				const limits = await subscriptionService.getUsageLimits(userId);
				
				return json({
					subscription: currentSubscription,
					tier,
					limits,
					featureAccess: {
						realtime: await subscriptionService.hasFeatureAccess(userId, 'realtime_access'),
						analytics: await subscriptionService.hasFeatureAccess(userId, 'analytics'),
						customPhrases: await subscriptionService.hasFeatureAccess(userId, 'custom_phrases'),
					}
				});

			case 'analytics':
				// Get subscription analytics
				const analytics = await paymentService.getUserSubscriptionAnalytics(userId);
				return json(analytics);

			case 'history':
				// Get subscription history
				const history = await subscriptionService.getUserSubscriptionHistory(userId);
				return json({ history });

			case 'expiring':
				// Check if subscription is expiring soon
				const expiring = await subscriptionService.isSubscriptionExpiringSoon(userId);
				return json({ expiring, daysThreshold: 7 });

			default:
				return json({
					availableActions: [
						'current - Get current subscription info',
						'analytics - Get subscription analytics',
						'history - Get subscription history',
						'expiring - Check if subscription is expiring soon'
					]
				});
		}
	} catch (err) {
		console.error('Dev subscription GET error:', err);
		throw error(500, 'Internal server error');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await request.json();
		const { action, ...params } = body;

		switch (action) {
			case 'create_free':
				// Create a free subscription
				const freeSubscription = await subscriptionService.createFreeSubscription(userId);
				return json({
					message: 'Free subscription created',
					subscription: freeSubscription
				});

			case 'upgrade':
				// Test upgrade to paid tier
				const { tierId, priceId } = params;
				if (!tierId || !priceId) {
					throw error(400, 'tierId and priceId are required');
				}
				
				const stripeSubscriptionId = `dev_${userId}_${tierId}_${Date.now()}`;
				const upgradedSubscription = await subscriptionService.upgradeSubscription(
					userId,
					tierId,
					priceId,
					stripeSubscriptionId
				);
				
				return json({
					message: `Upgraded to ${tierId}`,
					subscription: upgradedSubscription
				});

			case 'downgrade':
				// Test downgrade to free
				const downgraded = await subscriptionService.downgradeToFree(userId);
				return json({
					message: 'Downgraded to free tier',
					subscription: downgraded
				});

			case 'cancel':
				// Test subscription cancellation
				const cancelAtPeriodEnd = params.cancelAtPeriodEnd !== false; // default true
				await paymentService.cancelUserSubscription(userId, cancelAtPeriodEnd);
				
				return json({
					message: `Subscription ${cancelAtPeriodEnd ? 'will be cancelled at period end' : 'cancelled immediately'}`
				});

			case 'reactivate':
				// Test subscription reactivation
				const reactivated = await subscriptionService.reactivateSubscription(userId);
				return json({
					message: 'Subscription reactivated',
					subscription: reactivated
				});

			case 'simulate_payment':
				// Simulate a payment success
				const { amount, currency = 'usd', subscriptionId } = params;
				if (!amount) {
					throw error(400, 'amount is required');
				}

				const payment = await paymentService.processPaymentSuccess({
					userId,
					stripePaymentIntentId: `dev_pi_${Date.now()}`,
					stripeInvoiceId: `dev_in_${Date.now()}`,
					amount: amount.toString(),
					currency,
					status: 'succeeded',
					subscriptionId
				});

				return json({
					message: 'Payment simulated successfully',
					payment
				});

			case 'update_status':
				// Simulate subscription status update
				const { stripeSubscriptionId, status } = params;
				if (!stripeSubscriptionId || !status) {
					throw error(400, 'stripeSubscriptionId and status are required');
				}

				const updated = await subscriptionService.updateSubscriptionStatus(
					stripeSubscriptionId,
					status
				);

				return json({
					message: `Subscription status updated to ${status}`,
					subscription: updated
				});

			case 'ensure_subscription':
				// Ensure user has a subscription (creates free tier if needed)
				const ensured = await subscriptionService.getOrCreateUserSubscription(userId);
				return json({
					message: 'User subscription ensured',
					subscription: ensured
				});

			default:
				return json({
					availableActions: [
						'create_free - Create a free tier subscription',
						'upgrade - Upgrade to paid tier (requires tierId, priceId)',
						'downgrade - Downgrade to free tier',
						'cancel - Cancel subscription (optional cancelAtPeriodEnd)',
						'reactivate - Reactivate cancelled subscription',
						'simulate_payment - Simulate payment success (requires amount)',
						'update_status - Update subscription status (requires stripeSubscriptionId, status)',
						'ensure_subscription - Ensure user has a subscription'
					]
				});
		}
	} catch (err) {
		console.error('Dev subscription POST error:', err);
		throw error(500, 'Internal server error');
	}
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	const subscriptionId = url.searchParams.get('id');
	if (!subscriptionId) {
		throw error(400, 'Subscription ID is required');
	}

	try {
		// This is for dev testing only - normally you wouldn't allow direct deletion
		const { subscriptionRepository } = await import('$lib/server/repositories/subscription.repository');
		const result = await subscriptionRepository.deleteSubscription(subscriptionId);
		
		return json({
			message: 'Subscription deleted (DEV ONLY)',
			success: result.success
		});
	} catch (err) {
		console.error('Dev subscription DELETE error:', err);
		throw error(500, 'Internal server error');
	}
};