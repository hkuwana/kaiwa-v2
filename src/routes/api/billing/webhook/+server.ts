import { logger } from '$lib/server/logger';
// 🎣 Stripe Webhook Handler
// Processes Stripe events for subscription management

import { json } from '@sveltejs/kit';
import { stripeService } from '$lib/server/services/stripe.service';
import { analytics } from '$lib/server/analytics-service';
import { addWebhookEvent } from '$lib/server/webhook-events-manager';

export const POST = async ({ request }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	// Stripe instance removed - using simplified logging

	if (!signature) {
		return json({ error: 'Missing stripe-signature header' }, { status: 400 });
	}

	try {
		// Verify webhook signature
		const event = stripeService.verifyWebhook(body, signature);

		logger.info(`🎣 Stripe webhook received: ${event.type}`);

		// Track webhook event for dev dashboard
		addWebhookEvent(event);

		// Handle different event types
		switch (event.type) {
			case 'customer.subscription.created': {
				const subscription = event.data.object;
				await stripeService.handleSubscriptionCreated(subscription);

				// Track conversion
				const userId = subscription.metadata?.userId;
				if (userId) {
					await analytics.trackConversion(
						'subscription_created',
						userId,
						subscription.items.data[0]?.price.unit_amount
							? subscription.items.data[0].price.unit_amount / 100
							: undefined,
						{
							stripe_subscription_id: subscription.id,
							price_id: subscription.items.data[0]?.price.id,
							billing_cycle: subscription.items.data[0]?.price.recurring?.interval
						}
					);
				}
				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object;
				await stripeService.handleSubscriptionUpdated(subscription);

				// Track subscription changes
				const userId = subscription.metadata?.userId;
				if (userId) {
					await analytics.track('subscription_updated', userId, {
						stripe_subscription_id: subscription.id,
						status: subscription.status,
						cancel_at_period_end: subscription.cancel_at_period_end
					});
				}
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object;
				await stripeService.handleSubscriptionUpdated(subscription); // Same handler works for deletion

				// Track cancellation
				const userId = subscription.metadata?.userId;
				if (userId) {
					await analytics.track('subscription_cancelled', userId, {
						stripe_subscription_id: subscription.id,
						cancelled_at: new Date().toISOString()
					});
				}
				break;
			}

			case 'payment_intent.succeeded': {
				const paymentIntent = event.data.object;
				await stripeService.handlePaymentSucceeded(paymentIntent);

				// Track successful payment
				const userId = paymentIntent.metadata?.userId;
				if (userId) {
					await analytics.track('payment_succeeded', userId, {
						stripe_payment_intent_id: paymentIntent.id,
						amount: paymentIntent.amount / 100,
						currency: paymentIntent.currency
					});
				}
				break;
			}

			case 'payment_intent.payment_failed': {
				const paymentIntent = event.data.object;

				// Track failed payment
				const userId = paymentIntent.metadata?.userId;
				if (userId) {
					await analytics.track('payment_failed', userId, {
						stripe_payment_intent_id: paymentIntent.id,
						amount: paymentIntent.amount / 100,
						currency: paymentIntent.currency,
						failure_reason: paymentIntent.last_payment_error?.message
					});
				}
				break;
			}

			case 'checkout.session.completed': {
				const session = event.data.object;

				// 🎯 COMPREHENSIVE LOGGING - See everything Stripe sends back!
				logger.debug('🎣 ===== CHECKOUT SESSION COMPLETED =====');
				logger.info('📋 Session ID:', session.id);
				logger.info('💰 Amount Total:', session.amount_total, 'cents');
				logger.info('💳 Payment Status:', session.payment_status);
				logger.info('👤 Customer ID:', session.customer);
				logger.info('📅 Created:', new Date(session.created * 1000).toISOString());
				logger.info('🔗 Success URL:', session.success_url);
				logger.info('❌ Cancel URL:', session.cancel_url);
				logger.info('📝 Mode:', session.mode);
				logger.debug('🎯 Subscription ID:', session.subscription);
				logger.info('💳 Payment Intent ID:', session.payment_intent);
				logger.info('🏷️ Currency:', session.currency);
				logger.info('📊 Line Items:', JSON.stringify(session.line_items, null, 2));

				// 🔍 Metadata (your custom data)
				logger.info('🏷️ Metadata:', session.metadata);
				logger.info('👤 User ID from metadata:', session.metadata?.userId);

				// 🔍 Customer Details (simplified to avoid type issues)
				if (session.customer) {
					logger.info('👤 Customer ID:', session.customer);
				}

				// 🔍 Subscription Details (simplified to avoid type issues)
				if (session.subscription) {
					logger.info('📅 Subscription ID:', session.subscription);
				}

				logger.debug('🎣 ===== END CHECKOUT SESSION LOG =====');

				// Handle the checkout success to update user tier
				await stripeService.handleCheckoutSuccess(session);

				// Track checkout completion
				const userId = session.metadata?.userId;
				if (userId) {
					await analytics.trackConversion(
						'checkout_completed',
						userId,
						session.amount_total ? session.amount_total / 100 : undefined,
						{
							stripe_checkout_session_id: session.id,
							payment_status: session.payment_status
						}
					);
				}
				break;
			}

			default:
				logger.info(`Unhandled webhook event type: ${event.type}`);
		}

		return json({ received: true });
	} catch (error) {
		logger.error('Webhook error:', error);
		return json({ error: 'Webhook handler failed' }, { status: 400 });
	}
};
