// 💳 Stripe Checkout API
// Creates checkout sessions for subscription upgrades

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripeService } from '$lib/server/services/stripe.service';
import { analytics } from '$lib/server/analyticsService';
import { getTierFromPriceId, getBillingFromPriceId } from '$lib/data/stripe';

export const POST: RequestHandler = async ({ request, url, locals }) => {
	try {
		// Get user from session (assuming you have auth middleware)
		const userId = locals.user?.id;
		if (!userId) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const requestBody = await request.json();
		const { priceId, successPath = '/dashboard', cancelPath = '/pricing' } = requestBody;

		// 🔍 DEBUG: Log all the incoming data
		console.log('🔍 CHECKOUT DEBUG - Incoming request data:');
		console.log('  - userId:', userId);
		console.log('  - priceId:', priceId);
		console.log('  - successPath:', successPath);
		console.log('  - cancelPath:', cancelPath);
		console.log('  - Full request body:', requestBody);

		// 🔍 DEBUG: Log price validation details
		console.log('🔍 CHECKOUT DEBUG - Price validation:');
		console.log('  - Received priceId:', priceId);
		console.log('  - Available STRIPE_PRICES:', stripeService.STRIPE_PRICES);
		console.log('  - isValidPriceId result:', stripeService.isValidPriceId(priceId));
		console.log('  - Valid prices array:', Object.values(stripeService.STRIPE_PRICES || {}));

		// Validate price ID using the service
		if (!stripeService.isValidPriceId(priceId)) {
			console.log('❌ CHECKOUT DEBUG - Price validation FAILED');
			console.log('  - Invalid priceId:', priceId);
			console.log('  - Expected valid prices:', Object.values(stripeService.STRIPE_PRICES || {}));

			return json(
				{
					error: 'Invalid price ID',
					validPrices: Object.values(stripeService.STRIPE_PRICES || {}),
					receivedPriceId: priceId
				},
				{ status: 400 }
			);
		}

		console.log('✅ CHECKOUT DEBUG - Price validation PASSED');

		// Determine tier and billing from price ID using centralized functions
		const tier = getTierFromPriceId(priceId);
		const billing = getBillingFromPriceId(priceId);

		// 🔍 DEBUG: Log tier and billing detection
		console.log('🔍 CHECKOUT DEBUG - Tier and billing detection:');
		console.log('  - Detected tier:', tier);
		console.log('  - Detected billing:', billing);
		console.log('  - PriceId analysis:', {
			containsPremium: priceId.includes('premium'),
			containsPlus: priceId.includes('plus'),
			containsAnnual: priceId.includes('annual'),
			containsYearly: priceId.includes('yearly')
		});

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
		// Check if successPath already has query parameters
		const successUrl = successPath.includes('?')
			? `${baseUrl}${successPath}&tier=${tier}`
			: `${baseUrl}${successPath}?success=true&tier=${tier}`;
		const cancelUrl = cancelPath.includes('?')
			? `${baseUrl}${cancelPath}`
			: `${baseUrl}${cancelPath}?cancelled=true`;

		// 🔍 DEBUG: Log checkout session creation
		console.log('🔍 CHECKOUT DEBUG - Creating checkout session:');
		console.log('  - baseUrl:', baseUrl);
		console.log('  - successUrl:', successUrl);
		console.log('  - cancelUrl:', cancelUrl);
		console.log('  - Calling stripeService.createCheckoutSession with:');
		console.log('    - userId:', userId);
		console.log('    - priceId:', priceId);
		console.log('    - successUrl:', successUrl);
		console.log('    - cancelUrl:', cancelUrl);

		const { sessionId, url: checkoutUrl } = await stripeService.createCheckoutSession(
			userId,
			priceId,
			successUrl,
			cancelUrl
		);

		console.log('✅ CHECKOUT DEBUG - Checkout session created successfully:');
		console.log('  - sessionId:', sessionId);
		console.log('  - checkoutUrl:', checkoutUrl);

		return json({
			sessionId,
			url: checkoutUrl
		});
	} catch (error) {
		console.error('❌ CHECKOUT DEBUG - Error occurred:');
		console.error('  - Error type:', error?.constructor?.name || 'Unknown');
		console.error('  - Error message:', error instanceof Error ? error.message : 'Unknown error');
		console.error('  - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
		console.error('  - Full error object:', error);

		// Track checkout failure
		if (locals.user?.id) {
			await analytics.track('checkout_failed', locals.user.id, {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}

		return json(
			{
				error: 'Failed to create checkout session',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
