import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripeService } from '$lib/server/services/stripe.service';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { priceId } = params;

		if (!priceId) {
			return json({ error: 'Price ID is required' }, { status: 400 });
		}

		// Fetch the price from Stripe
		const price = await stripeService.getPrice(priceId);

		if (!price) {
			return json({ error: 'Price not found' }, { status: 404 });
		}

		return json(price);
	} catch (error) {
		console.error('Error fetching price:', error);
		return json({ error: 'Failed to fetch price data' }, { status: 500 });
	}
};
