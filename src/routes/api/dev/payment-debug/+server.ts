// 🔧 Simple Payment Debug API (MVP)
// Test and debug the simplified payment flow

import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import {
	getUserCurrentTier,
	getUserTierFromStripe,
	getUserSubscriptionFromDB,
	syncUserSubscription,
	ensureStripeCustomer
} from '$lib/server/services/payment.service';
import { serverTierConfigs } from '$lib/server/tiers';
import { userRepository } from '$lib/server/repositories';

// Only allow in development mode


export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	const action = url.searchParams.get('action') || 'status';

	try {
		const result: Record<string, any> = {
			timestamp: new Date().toISOString(),
			userId,
			action,
			method: 'simple_payment_service'
		};

		// Get user info
		const user = await userRepository.findUserById(userId);
		result.user = {
			id: user?.id,
			email: user?.email,
			stripeCustomerId: user?.stripeCustomerId,
			hasStripeCustomerId: !!user?.stripeCustomerId
		};

		if (action === 'status' || action === 'full') {
			// Get current tier using our simple service
			const currentTier = await getUserCurrentTier(userId);
			result.currentTier = currentTier;

			// Get DB subscription (backup)
			const dbSubscription = await getUserSubscriptionFromDB(userId);
			result.dbSubscription = dbSubscription;

			// Get Stripe data if customer exists
			if (user?.stripeCustomerId) {
				const stripeData = await getUserTierFromStripe(user.stripeCustomerId);
				result.stripeData = stripeData;

				// Compare Stripe vs DB
				result.comparison = {
					tierMatch: currentTier === stripeData.tier,
					stripeTier: stripeData.tier,
					dbTier: dbSubscription?.currentTier || 'free',
					hasActiveSubscription: stripeData.hasActiveSubscription,
					recommendation: stripeData.hasActiveSubscription ? stripeData.tier : 'free'
				};
			}
		}

		// Show available tiers and prices
		if (action === 'full') {
			result.availableTiers = Object.entries(serverTierConfigs).map(([tier, config]) => ({
				tier,
				name: config.name,
				monthlyPrice: config.monthlyPriceUsd,
				annualPrice: config.annualPriceUsd,
				stripePriceIdMonthly: config.stripePriceIdMonthly,
				stripePriceIdAnnual: config.stripePriceIdAnnual
			}));
		}

		console.log(`🔧 Payment debug for user ${userId}: tier=${result.currentTier}`);

		return json(result);
	} catch (err) {
		console.error('Payment debug error:', err);
		return json(
			{
				error: 'Debug failed',
				message: err instanceof Error ? err.message : 'Unknown error',
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	const userEmail = locals.user?.email;

	if (!userId || !userEmail) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { action } = await request.json();

		const result: Record<string, any> = {
			timestamp: new Date().toISOString(),
			userId,
			action,
			success: false
		};

		switch (action) {
			case 'ensure_stripe_customer':
				const stripeCustomerId = await ensureStripeCustomer(userId, userEmail);
				result.success = !!stripeCustomerId;
				result.stripeCustomerId = stripeCustomerId;
				break;

			case 'sync_from_stripe':
				const user = await userRepository.findUserById(userId);
				if (!user?.stripeCustomerId) {
					throw new Error('User has no Stripe customer ID');
				}
				const syncData = await syncUserSubscription(userId, user.stripeCustomerId);
				result.success = true;
				result.syncData = syncData;
				break;

			case 'get_current_tier':
				const currentTier = await getUserCurrentTier(userId);
				result.success = true;
				result.currentTier = currentTier;
				break;

			default:
				throw new Error(`Unknown action: ${action}`);
		}

		console.log(`🔧 Payment debug action ${action} for user ${userId}: success=${result.success}`);

		return json(result);
	} catch (err) {
		console.error('Payment debug POST error:', err);
		return json(
			{
				error: 'Debug action failed',
				message: err instanceof Error ? err.message : 'Unknown error',
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		);
	}
};
