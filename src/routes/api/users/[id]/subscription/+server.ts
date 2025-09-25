// src/routes/api/users/[id]/subscription/+server.ts
import { json, error } from '@sveltejs/kit';
import { subscriptionService } from '$lib/server/services/subscription.service';
import { subscriptionRepository } from '$lib/server/repositories/subscription.repository';
import { stripeService } from '$lib/server/services/stripe.service';

export const GET = async ({ locals, params, url }) => {
	const userId = params.id;
	const loggedInUserId = locals.user?.id;

	if (!loggedInUserId) {
		throw error(401, 'Unauthorized');
	}

	if (loggedInUserId !== userId) {
		throw error(403, 'You are not authorized to view this subscription');
	}

	const simple = url.searchParams.get('simple') === 'true';
	const detailed = url.searchParams.get('detailed') === 'true';

	try {
		if (simple) {
			const subscription = await stripeService.getUserSubscription(userId);
			if (!subscription) {
				return json(null);
			}
			return json({
				id: subscription.id,
				userId: subscription.userId,
				stripeSubscriptionId: subscription.stripeSubscriptionId,
				stripePriceId: subscription.stripePriceId,
				createdAt: subscription.createdAt,
				updatedAt: subscription.updatedAt
			});
		}

		const subscription = await subscriptionService.getOrCreateUserSubscription(userId);
		const effectiveTier = await subscriptionService.getUserTier(userId);
		const limits = await subscriptionService.getUsageLimits(userId);

		const basicInfo = {
			hasActiveSubscription: !!subscription,
			currentTier: effectiveTier,
			limits
		};

		if (!detailed) {
			return json(basicInfo);
		}

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
