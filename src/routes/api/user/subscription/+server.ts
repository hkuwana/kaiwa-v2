// 📊 User Subscription API
// Gets current subscription data for the authenticated user

import { json } from '@sveltejs/kit';
import { stripeService } from '$lib/server/services/stripe.service';

export const GET = async ({ locals }) => {
	try {
		// Check if user is logged in
		const userId = locals.user?.id;
		if (!userId) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Get user's active subscription
		const subscription = await stripeService.getUserSubscription(userId);

		if (!subscription) {
			return json(null);
		}

		// Return subscription data
		return json({
			id: subscription.id,
			userId: subscription.userId,

			stripeSubscriptionId: subscription.stripeSubscriptionId,
			stripePriceId: subscription.stripePriceId,
			createdAt: subscription.createdAt,
			updatedAt: subscription.updatedAt
		});
	} catch (error) {
		console.error('Error fetching user subscription:', error);
		return json(
			{
				error: 'Failed to fetch subscription data',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
