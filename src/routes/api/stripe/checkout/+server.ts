// 💳 Stripe Checkout API
// Creates checkout sessions for subscription upgrades

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripeService, STRIPE_PRICES } from '$lib/server/stripeService';
import { analytics } from '$lib/server/analyticsService';

export const POST: RequestHandler = async ({ request, url, locals }) => {
	try {
		// Get user from session (assuming you have auth middleware)
		const userId = locals.user?.id;
		if (!userId) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { priceId, successPath = '/dashboard', cancelPath = '/pricing' } = await request.json();

		// Validate price ID
		const validPrices = Object.values(STRIPE_PRICES);
		if (!validPrices.includes(priceId)) {
			return json({ error: 'Invalid price ID' }, { status: 400 });
		}

		// Determine tier and billing from price ID
		const getTierFromPrice = (priceId: string) => {
			if (priceId.includes('pro')) return 'pro';
			if (priceId.includes('premium')) return 'premium';
			return 'unknown';
		};

		const getBillingFromPrice = (priceId: string) => {
			if (priceId.includes('yearly')) return 'yearly';
			return 'monthly';
		};

		const tier = getTierFromPrice(priceId);
		const billing = getBillingFromPrice(priceId);

		// Track checkout initiation
		await analytics.trackConversion(
			'checkout_started',
			userId,
			undefined, // No value yet
			{
				target_tier: tier,
				billing_cycle: billing,
				price_id: priceId,
				source: 'api'
			}
		);

		// Create checkout session
		const baseUrl = url.origin;
		const successUrl = `${baseUrl}${successPath}?success=true&tier=${tier}`;
		const cancelUrl = `${baseUrl}${cancelPath}?cancelled=true`;

		const { sessionId, url: checkoutUrl } = await stripeService.createCheckoutSession(
			userId,
			priceId,
			successUrl,
			cancelUrl
		);

		return json({
			sessionId,
			url: checkoutUrl
		});
	} catch (error) {
		console.error('Checkout creation error:', error);

		// Track checkout failure
		if (locals.user?.id) {
			await analytics.track('checkout_failed', locals.user.id, {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}

		return json({ error: 'Failed to create checkout session' }, { status: 500 });
	}
};
