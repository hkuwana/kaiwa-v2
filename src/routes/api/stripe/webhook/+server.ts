// 🎣 Stripe Webhook Handler
// Processes Stripe events for subscription management

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripeService } from '$lib/server/services/stripe.service';
import { analytics } from '$lib/server/analyticsService';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		return json({ error: 'Missing stripe-signature header' }, { status: 400 });
	}

	try {
		// Verify webhook signature
		const event = stripeService.verifyWebhook(body, signature);

		console.log(`🎣 Stripe webhook received: ${event.type}`);

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
				console.log(`Unhandled webhook event type: ${event.type}`);
		}

		return json({ received: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return json({ error: 'Webhook handler failed' }, { status: 400 });
	}
};
