// src/routes/api/user/subscription-status/+server.ts
// Client-accessible endpoint to check current subscription status

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscriptionService } from '$lib/server/services/subscription.service';
import { subscriptionRepository } from '$lib/server/repositories/subscription.repository';

export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	const detailed = url.searchParams.get('detailed') === 'true';

	try {
		// Get current subscription
		const subscription = await subscriptionService.getOrCreateUserSubscription(userId);
		const tier = await subscriptionService.getUserTier(userId);
		const limits = await subscriptionService.getUsageLimits(userId);

		const basicInfo = {
			tier,
			hasActiveSubscription: !!subscription && subscription.isActive,
			status: subscription.status,
			effectiveTier: subscription.effectiveTier,
			currentPeriodEnd: subscription.currentPeriodEnd,
			cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
			limits
		};

		if (!detailed) {
			return json(basicInfo);
		}

		// Detailed info for debugging
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
			subscription: {
				id: subscription.id,
				stripeSubscriptionId: subscription.stripeSubscriptionId,
				stripePriceId: subscription.stripePriceId,
				tierId: subscription.tierId,
				currentPeriodStart: subscription.currentPeriodStart,
				createdAt: subscription.createdAt,
				updatedAt: subscription.updatedAt
			},
			allSubscriptions: allSubscriptions.map((sub) => ({
				id: sub.id,
				tierId: sub.tierId,
				status: sub.status,
				isActive: sub.isActive,
				createdAt: sub.createdAt
			})),
			featureAccess,
			debug: {
				userId,
				subscriptionCount: allSubscriptions.length,
				activeSubscriptions: allSubscriptions.filter((sub) => sub.isActive).length
			}
		});
	} catch (err) {
		console.error('Subscription status error:', err);
		throw error(500, 'Failed to get subscription status');
	}
};
