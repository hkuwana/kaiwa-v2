// 💳 Dev Stripe Info API
// Returns Stripe environment configuration for development monitoring

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { getTierEnvironmentInfo } from '$lib/server/tiers';
import { getStripeEnvironmentInfo } from '$lib/data/stripe';
import { getServerStripeEnvironmentInfo } from '$lib/server/stripe-config';

export const GET: RequestHandler = async () => {
	// Only allow in development
	if (!dev) {
		return json({ error: 'Not available in production' }, { status: 403 });
	}

	try {
		// Get server-side tier info
		const serverInfo = getTierEnvironmentInfo();
		
		// Get server-side stripe info (has access to private env vars)
		const serverStripeInfo = getServerStripeEnvironmentInfo();

		// Combine the information
		const combinedInfo = {
			isStripeDev: serverStripeInfo.isStripeDev,
			stripeDevMode: serverStripeInfo.stripeDevMode,
			currentPrices: serverStripeInfo.currentPrices,
			allPriceIds: serverStripeInfo.allPriceIds,
			tierConfigs: Object.keys(serverInfo.currentTierConfigs || {}),
			environment: dev ? 'development' : 'production',
			serverSide: true
		};

		return json(combinedInfo);
	} catch (error) {
		console.error('Error fetching Stripe environment info:', error);
		
		// Fallback to client-side info only
		try {
			const fallbackInfo = getStripeEnvironmentInfo();
			return json({
				...fallbackInfo,
				environment: dev ? 'development' : 'production',
				fallback: true,
				error: 'Server-side config failed, using client fallback'
			});
		} catch (fallbackError) {
			return json(
				{
					error: 'Failed to fetch Stripe environment info',
					details: error instanceof Error ? error.message : 'Unknown error'
				},
				{ status: 500 }
			);
		}
	}
};