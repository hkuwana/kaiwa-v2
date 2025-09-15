import { json } from '@sveltejs/kit';
import { stripeService } from '$lib/server/services/stripe.service';

export const POST = async ({ locals }) => {
	try {
		// Check authentication
		if (!locals.user || locals.user.id === 'guest') {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const userId = locals.user.id;

		// Pause the user's subscription collection
		await stripeService.pauseSubscriptionCollection(userId);

		return json({
			success: true,
			message:
				'Subscription paused successfully. You can resume it anytime from your billing portal.'
		});
	} catch (error) {
		console.error('Error pausing subscription:', error);

		if (error instanceof Error) {
			return json({ error: error.message }, { status: 400 });
		}

		return json({ error: 'Failed to pause subscription' }, { status: 500 });
	}
};
