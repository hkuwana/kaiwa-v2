// 📅 Subscription Status API
// Returns subscription renewal or cancellation information

import { json } from '@sveltejs/kit';
import { getUserTierFromStripe } from '$lib/server/services/payment.service';
import { userRepository } from '$lib/server/repositories/user.repository';
import { stripe } from '$lib/server/services/stripe.service';

export const GET = async ({ locals }) => {
	try {
		const userId = locals.user?.id;

		if (!userId || userId === 'guest') {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Get user's Stripe customer ID
		const user = await userRepository.findUserById(userId);

		if (!user?.stripeCustomerId) {
			return json({
				tier: 'free',
				hasActiveSubscription: false
			});
		}

		// Get subscription info from Stripe
		const stripeData = await getUserTierFromStripe(user.stripeCustomerId);

		if (!stripeData.hasActiveSubscription || !stripeData.subscriptionId) {
			return json({
				tier: 'free',
				hasActiveSubscription: false
			});
		}

		// Fetch full subscription details from Stripe
		const subscription = await stripe.subscriptions.retrieve(stripeData.subscriptionId);

		const currentPeriodEnd = subscription.current_period_end
			? new Date(subscription.current_period_end * 1000)
			: null;

		const cancelAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null;

		const canceledAt = subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null;

		const willCancelAtPeriodEnd = subscription.cancel_at_period_end || false;

		return json({
			tier: stripeData.tier,
			hasActiveSubscription: true,
			status: subscription.status,
			currentPeriodEnd,
			cancelAt,
			canceledAt,
			willCancelAtPeriodEnd,
			billingCycle: subscription.items.data[0]?.price?.recurring?.interval || 'month'
		});
	} catch (error) {
		console.error('❌ Subscription status error:', error);

		return json(
			{
				error: 'Failed to fetch subscription status',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
