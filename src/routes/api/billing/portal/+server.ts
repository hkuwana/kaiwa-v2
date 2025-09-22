import { json } from '@sveltejs/kit';
import { stripeService } from '$lib/server/services/stripe.service';

export const POST = async ({ locals, url }) => {
	try {
		// Check authentication
		if (!locals.user || locals.user.id === 'guest') {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const userId = locals.user.id;

		// Get return URL from the request origin
		const returnUrl = `${url.origin}/profile`;

		// Create Stripe customer portal session
		const portalUrl = await stripeService.createPortalSession(userId, returnUrl);

		return json({ url: portalUrl });
	} catch (error) {
		console.error('Error creating billing portal session:', error);

		if (error instanceof Error) {
			// Handle specific Stripe portal configuration error
			if (error.message.includes('No configuration provided')) {
				return json({
					error: 'Billing portal not configured. Please contact support.',
					isConfigurationError: true
				}, { status: 503 });
			}
			return json({ error: error.message }, { status: 400 });
		}

		return json({ error: 'Failed to create billing portal session' }, { status: 500 });
	}
};
