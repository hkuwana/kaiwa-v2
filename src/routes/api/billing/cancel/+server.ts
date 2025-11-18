// 📉 Subscription Cancellation API
// Handles subscription cancellations with feedback collection

import { json } from '@sveltejs/kit';
import { stripeService } from '$lib/server/services/stripe.service';
import { analytics } from '$lib/server/analytics-service';

export const POST = async ({ request, locals }) => {
	try {
		const userId = locals.user?.id;

		if (!userId || userId === 'guest') {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { reason, feedback } = await request.json();

		// Validate reason
		if (!reason) {
			return json({ error: 'Cancellation reason is required' }, { status: 400 });
		}

		// Track cancellation with feedback
		await analytics.track('subscription_cancellation_requested', userId, {
			reason,
			feedback: feedback || '',
			has_feedback: !!feedback,
			feedback_length: feedback?.length || 0
		});

		console.log(`🚫 User ${userId} requested subscription cancellation: ${reason}`);
		if (feedback) {
			console.log(`💬 Feedback: ${feedback}`);
		}

		// Cancel subscription at period end
		await stripeService.cancelSubscription(userId);

		// Track successful cancellation
		await analytics.track('subscription_cancelled', userId, {
			reason,
			cancel_at_period_end: true
		});

		console.log(`✅ Subscription cancelled successfully for user ${userId}`);

		return json({
			success: true,
			message: 'Subscription will be cancelled at the end of your billing period'
		});
	} catch (error) {
		console.error('❌ Subscription cancellation error:', error);

		// Track cancellation failure
		if (locals.user?.id) {
			await analytics.track('subscription_cancellation_failed', locals.user.id, {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}

		if (error instanceof Error) {
			// Handle specific error cases
			if (error.message.includes('No active subscription')) {
				return json(
					{
						error: 'No active subscription found',
						details: 'You may already be on the free tier'
					},
					{ status: 404 }
				);
			}

			return json(
				{
					error: 'Failed to cancel subscription',
					details: error.message
				},
				{ status: 500 }
			);
		}

		return json(
			{
				error: 'Failed to cancel subscription',
				details: 'An unexpected error occurred'
			},
			{ status: 500 }
		);
	}
};
