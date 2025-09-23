// src/routes/api/user/subscription-status/+server.ts
// Client-accessible endpoint to check current subscription status

import { json, error } from '@sveltejs/kit';
import { subscriptionService } from '$lib/server/services/subscription.service';
import { subscriptionRepository } from '$lib/server/repositories/subscription.repository';

export const GET = async ({ locals, url }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	const detailed = url.searchParams.get('detailed') === 'true';

	try {
		// Get current subscription and tier (now Stripe-dependent)
		const subscription = await subscriptionService.getOrCreateUserSubscription(userId);
		const effectiveTier = await subscriptionService.getUserTier(userId); // This now checks Stripe
		const limits = await subscriptionService.getUsageLimits(userId);

		const basicInfo = {
			hasActiveSubscription: !!subscription,
			currentTier: effectiveTier, // Use Stripe-verified tier
			limits
		};

		if (!detailed) {
			return json(basicInfo);
		}

		// Detailed info for debugging - includes Stripe data
		const detailedData = await subscriptionService.getDetailedSubscriptionData(userId);
		const allSubscriptions = await subscriptionRepository.findSubscriptionsByUserId(userId);
		const featureAccess = {
			realtime: await subscriptionService.hasFeatureAccess(userId, 'realtime_access'),
			analytics: await subscriptionService.hasFeatureAccess(userId, 'analytics'),
			customPhrases: await subscriptionService.hasFeatureAccess(userId, 'custom_phrases'),
			conversationMemory: await subscriptionService.hasFeatureAccess(userId, 'conversation_memory'),
			ankiExport: await subscriptionService.hasFeatureAccess(userId, 'anki_export')
		};

		return json({
			...basicInfo,
			subscription: detailedData.local,
			stripe: detailedData.stripe,
			syncCheck: detailedData.syncCheck,
			allSubscriptions: allSubscriptions.map((sub) => ({
				id: sub.id,
				currentTier: sub.currentTier,
				stripePriceId: sub.stripePriceId,
				createdAt: sub.createdAt
			})),
			featureAccess,
			debug: {
				userId,
				subscriptionCount: allSubscriptions.length,
				effectiveTier,
				isFromStripe: detailedData.effective.isFromStripe,
				tierSource: detailedData.effective.isFromStripe ? 'stripe' : 'database'
			}
		});
	} catch (err) {
		console.error('Subscription status error:', err);
		throw error(500, 'Failed to get subscription status');
	}
};
