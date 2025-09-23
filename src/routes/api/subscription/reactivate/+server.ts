// 🔄 Subscription Reactivate API
// Reactivates a cancelled subscription

import { json } from '@sveltejs/kit';
import { stripeService } from '$lib/server/services/stripe.service';
import { analytics } from '$lib/server/analyticsService';

export const POST = async ({ locals }) => {
	try {
		// Check if user is logged in
		const userId = locals.user?.id;
		if (!userId) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Reactivate the subscription
		await stripeService.reactivateSubscription(userId);

		// Track reactivation
		await analytics.track('subscription_reactivated', userId, {
			source: 'dev_payment_page',
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			message: 'Subscription reactivated successfully'
		});
	} catch (error) {
		console.error('Error reactivating subscription:', error);

		// Track reactivation failure
		if (locals.user?.id) {
			await analytics.track('subscription_reactivation_failed', locals.user.id, {
				error: error instanceof Error ? error.message : 'Unknown error',
				source: 'dev_payment_page',
				timestamp: new Date().toISOString()
			});
		}

		return json(
			{
				error: 'Failed to reactivate subscription',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
