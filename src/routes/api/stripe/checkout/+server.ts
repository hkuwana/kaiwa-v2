// 💳 Simple Stripe Checkout API (MVP)
// Creates checkout sessions using serverTierConfigs directly

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createStripeCheckout, ensureStripeCustomer } from '$lib/server/services/payment.service';
import { getStripePriceId, serverTierConfigs } from '$lib/server/tiers';
import { analytics } from '$lib/server/analyticsService';
import type { UserTier } from '$lib/server/db/types';

export const POST: RequestHandler = async ({ request, url, locals }) => {
	try {
		const userId = locals.user?.id;
		const userEmail = locals.user?.email;

		if (!userId || !userEmail) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		const { tier, billing = 'monthly', successPath = '/dashboard', cancelPath = '/pricing' } = await request.json();

		// Validate tier
		if (!tier || !(tier in serverTierConfigs)) {
			return json({
				error: 'Invalid tier',
				validTiers: Object.keys(serverTierConfigs),
				receivedTier: tier
			}, { status: 400 });
		}

		// Validate billing
		if (!['monthly', 'annual'].includes(billing)) {
			return json({
				error: 'Invalid billing cycle',
				validBilling: ['monthly', 'annual'],
				receivedBilling: billing
			}, { status: 400 });
		}

		// Get price ID from tier configs
		const priceId = getStripePriceId(tier as UserTier, billing);
		if (!priceId) {
			return json({
				error: `No price ID found for ${tier} ${billing}`,
				tierConfig: serverTierConfigs[tier as UserTier]
			}, { status: 400 });
		}

		console.log(`🔧 Creating checkout for ${tier} ${billing} (${priceId})`);

		// Ensure user has Stripe customer ID
		const stripeCustomerId = await ensureStripeCustomer(userId, userEmail);
		if (!stripeCustomerId) {
			return json({ error: 'Failed to create Stripe customer' }, { status: 500 });
		}

		// Track checkout initiation
		await analytics.trackConversion('checkout_started', userId, undefined, {
			target_tier: tier,
			billing_cycle: billing,
			price_id: priceId,
			source: 'api'
		});

		// Create checkout session using our simple service
		const baseUrl = url.origin;
		const successUrl = successPath.includes('?')
			? `${baseUrl}${successPath}&tier=${tier}`
			: `${baseUrl}${successPath}?success=true&tier=${tier}`;
		const cancelUrl = cancelPath.includes('?')
			? `${baseUrl}${cancelPath}`
			: `${baseUrl}${cancelPath}?cancelled=true`;

		const { sessionId, url: checkoutUrl } = await createStripeCheckout(
			stripeCustomerId,
			tier as UserTier,
			billing,
			successUrl,
			cancelUrl
		);

		console.log(`✅ Created checkout session ${sessionId} for ${tier} ${billing}`);

		return json({
			sessionId,
			url: checkoutUrl
		});
	} catch (error) {
		console.error('❌ Checkout error:', error);

		// Track checkout failure
		if (locals.user?.id) {
			await analytics.track('checkout_failed', locals.user.id, {
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		}

		return json({
			error: 'Failed to create checkout session',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};
