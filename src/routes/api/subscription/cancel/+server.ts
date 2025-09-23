// 🚫 Subscription Cancel API
// Cancels the user's active subscription

import { json } from '@sveltejs/kit';
import { stripeService } from '$lib/server/services/stripe.service';
import { analytics } from '$lib/server/analytics-service';

export const POST = async ({ locals }) => {
	try {
		// Check if user is logged in
		const userId = locals.user?.id;
		if (!userId) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Cancel the subscription
		await stripeService.cancelSubscription(userId);

		// Track cancellation
		await analytics.track('subscription_cancelled', userId, {
			source: 'dev_payment_page',
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			message: 'Subscription cancelled successfully'
		});
	} catch (error) {
		console.error('Error cancelling subscription:', error);

		// Track cancellation failure
		if (locals.user?.id) {
			await analytics.track('subscription_cancellation_failed', locals.user.id, {
				error: error instanceof Error ? error.message : 'Unknown error',
				source: 'dev_payment_page',
				timestamp: new Date().toISOString()
			});
		}

		return json(
			{
				error: 'Failed to cancel subscription',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
