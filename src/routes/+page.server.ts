import type { PageServerLoad } from './$types';
import { subscriptionService } from '$lib/server/services/subscription.service';
import { serverTierConfigs } from '$lib/server/tiers';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Get user data from locals (set by hooks.server.ts)
	const user = locals.user || null;

	// Get usage limits for the user (including guests)
	let usageLimits = null;
	let tierInfo = null;

	if (user && user.id !== 'guest') {
		try {
			usageLimits = await subscriptionService.getUsageLimits(user.id);
			const userTier = await subscriptionService.getUserTier(user.id);
			tierInfo = serverTierConfigs[userTier];
		} catch (error) {
			console.error('Error loading usage limits:', error);
		}
	} else {
		// Get free tier config for guest users
		tierInfo = serverTierConfigs.free;
		usageLimits = {
			conversationsPerMonth: tierInfo.monthlyConversations,
			messagesPerConversation: 50,
			audioMinutesPerMonth: Math.floor(tierInfo.monthlySeconds / 60), // Convert seconds to minutes
			canUseRealtime: tierInfo.hasRealtimeAccess,
			canUseAdvancedAnalytics: tierInfo.hasAnalytics
		};
	}

	// SEO data optimized for family conversations and anxiety-free learning
	const seo = {
		title: 'Connect with Family in Japanese | Anxiety-Free AI Practice - Kaiwa',
		description:
			'Practice Japanese conversations with AI in a safe, judgment-free space. Connect with your family in their native language.',
		keywords:
			'Japanese conversation practice, family conversations Japanese, anxiety-free Japanese learning, AI Japanese tutor, speak Japanese confidently',
		author: 'Kaiwa',
		robots: 'index, follow',
		canonical: url.href,
		url: url.href,
		ogType: 'website',
		twitterCard: 'summary_large_image'
	};

	return {
		user,
		usageLimits,
		tierInfo,
		seo
	};
};
