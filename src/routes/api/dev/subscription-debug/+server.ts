// src/routes/api/dev/subscription-debug/+server.ts
// Development endpoint for debugging subscription status and webhook issues

import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { subscriptionRepository } from '$lib/server/repositories/subscription.repository';
import { userRepository } from '$lib/server/repositories/user.repository';
import { paymentRepository } from '$lib/server/repositories/payment.repository';
import { stripeService } from '$lib/server/services/stripe.service';
import { getWebhookEvents } from '$lib/server/webhook-events-manager';

// Only allow in development mode
if (!dev) {
	throw error(404, 'Not found');
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	const action = url.searchParams.get('action') || 'full';

	try {
		const debugInfo: any = {
			timestamp: new Date().toISOString(),
			userId,
			action
		};

		// Get user info
		const user = await userRepository.findUserById(userId);
		debugInfo.user = {
			id: user?.id,
			email: user?.email,
			stripeCustomerId: user?.stripeCustomerId,
			createdAt: user?.createdAt
		};

		// Get all subscriptions for this user
		const allSubscriptions = await subscriptionRepository.findSubscriptionsByUserId(userId);
		debugInfo.allSubscriptions = allSubscriptions.map(sub => ({
			id: sub.id,
			stripeSubscriptionId: sub.stripeSubscriptionId,
			tierId: sub.tierId,
			effectiveTier: sub.effectiveTier,
			status: sub.status,
			isActive: sub.isActive,
			currentPeriodStart: sub.currentPeriodStart,
			currentPeriodEnd: sub.currentPeriodEnd,
			cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
			createdAt: sub.createdAt,
			updatedAt: sub.updatedAt
		}));

		// Get active subscription
		const activeSubscription = await subscriptionRepository.findActiveSubscriptionByUserId(userId);
		debugInfo.activeSubscription = activeSubscription ? {
			id: activeSubscription.id,
			stripeSubscriptionId: activeSubscription.stripeSubscriptionId,
			tierId: activeSubscription.tierId,
			effectiveTier: activeSubscription.effectiveTier,
			status: activeSubscription.status,
			isActive: activeSubscription.isActive,
			stripePriceId: activeSubscription.stripePriceId,
			currentPeriodStart: activeSubscription.currentPeriodStart,
			currentPeriodEnd: activeSubscription.currentPeriodEnd,
			cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd
		} : null;

		// Get payments
		const payments = await paymentRepository.findPaymentsByUserId(userId);
		debugInfo.payments = payments.map(payment => ({
			id: payment.id,
			stripePaymentIntentId: payment.stripePaymentIntentId,
			amount: payment.amount,
			currency: payment.currency,
			status: payment.status,
			createdAt: payment.createdAt
		}));

		// Get recent webhook events (filtered for this user if possible)
		const recentWebhooks = getWebhookEvents().slice(-20); // Last 20 events
		debugInfo.recentWebhooks = recentWebhooks.map(event => ({
			type: event.type,
			created: event.created,
			data: event.data?.object?.customer === user?.stripeCustomerId ? event.data : { filtered: 'not for this user' }
		}));

		// If we have stripe customer ID, get Stripe data too
		if (user?.stripeCustomerId && (action === 'full' || action === 'stripe')) {
			try {
				console.log('🔍 Fetching Stripe data for customer:', user.stripeCustomerId);
				
				// Get active subscription from Stripe
				const stripeSubscription = await stripeService.getSubscription(user.stripeCustomerId);
				debugInfo.stripeSubscription = stripeSubscription ? {
					id: stripeSubscription.id,
					status: stripeSubscription.status,
					customer: stripeSubscription.customer,
					current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
					current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
					cancel_at_period_end: stripeSubscription.cancel_at_period_end,
					items: stripeSubscription.items.data.map(item => ({
						price_id: item.price.id,
						product: typeof item.price.product === 'string' ? item.price.product : item.price.product?.id,
						unit_amount: item.price.unit_amount,
						currency: item.price.currency,
						interval: item.price.recurring?.interval
					})),
					metadata: stripeSubscription.metadata
				} : null;

			} catch (stripeError) {
				debugInfo.stripeError = {
					message: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error',
					timestamp: new Date().toISOString()
				};
			}
		}

		// Analysis
		debugInfo.analysis = {
			hasUser: !!user,
			hasStripeCustomerId: !!user?.stripeCustomerId,
			subscriptionCount: allSubscriptions.length,
			hasActiveSubscription: !!activeSubscription,
			currentTier: activeSubscription?.effectiveTier || activeSubscription?.tierId || 'none',
			paymentCount: payments.length,
			possibleIssues: []
		};

		// Check for common issues
		if (!user?.stripeCustomerId) {
			debugInfo.analysis.possibleIssues.push('User has no Stripe customer ID');
		}
		
		if (allSubscriptions.length === 0) {
			debugInfo.analysis.possibleIssues.push('User has no subscriptions at all');
		}
		
		if (!activeSubscription) {
			debugInfo.analysis.possibleIssues.push('User has no active subscription');
		}

		const activeCount = allSubscriptions.filter(sub => sub.isActive).length;
		if (activeCount > 1) {
			debugInfo.analysis.possibleIssues.push(`User has multiple active subscriptions (${activeCount})`);
		}

		// Check webhook events for this user's customer ID
		if (user?.stripeCustomerId) {
			const userWebhooks = recentWebhooks.filter(event => 
				event.data?.object?.customer === user.stripeCustomerId ||
				event.data?.object?.metadata?.userId === userId
			);
			debugInfo.analysis.userSpecificWebhooks = userWebhooks.length;
			
			if (userWebhooks.length === 0) {
				debugInfo.analysis.possibleIssues.push('No recent webhooks found for this user');
			}
		}

		return json(debugInfo);

	} catch (err) {
		console.error('Subscription debug error:', err);
		return json({
			error: 'Debug failed',
			message: err instanceof Error ? err.message : 'Unknown error',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await request.json();
		const { action } = body;

		const result: any = {
			timestamp: new Date().toISOString(),
			userId,
			action,
			success: false
		};

		switch (action) {
			case 'force_refresh_from_stripe':
				// Force refresh subscription from Stripe
				const user = await userRepository.findUserById(userId);
				if (!user?.stripeCustomerId) {
					throw new Error('User has no Stripe customer ID');
				}

				const stripeSubscription = await stripeService.getSubscription(user.stripeCustomerId);
				if (stripeSubscription) {
					// Simulate webhook handling
					await stripeService.handleSubscriptionUpdated(stripeSubscription);
					result.success = true;
					result.stripeSubscription = {
						id: stripeSubscription.id,
						status: stripeSubscription.status
					};
				} else {
					result.message = 'No active subscription found in Stripe';
				}
				break;

			case 'clear_all_subscriptions':
				// WARNING: This deletes all subscriptions for the user (dev only!)
				const deletedCount = await Promise.all(
					(await subscriptionRepository.findSubscriptionsByUserId(userId))
						.map(sub => subscriptionRepository.deleteSubscription(sub.id))
				);
				result.success = true;
				result.deletedCount = deletedCount.filter(r => r.success).length;
				break;

			case 'create_debug_subscription':
				// Create a test subscription
				const { tierId = 'plus', status = 'active' } = body;
				const debugSub = await subscriptionRepository.createSubscription({
					userId,
					stripeCustomerId: user?.stripeCustomerId || 'debug_customer',
					stripeSubscriptionId: `debug_${Date.now()}`,
					stripePriceId: `debug_price_${tierId}`,
					status,
					currentPeriodStart: new Date(),
					currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
					cancelAtPeriodEnd: false,
					tierId,
					isActive: status === 'active',
					effectiveTier: tierId
				});
				result.success = true;
				result.subscription = debugSub;
				break;

			default:
				throw new Error(`Unknown action: ${action}`);
		}

		return json(result);

	} catch (err) {
		console.error('Subscription debug POST error:', err);
		return json({
			error: 'Debug action failed',
			message: err instanceof Error ? err.message : 'Unknown error',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};