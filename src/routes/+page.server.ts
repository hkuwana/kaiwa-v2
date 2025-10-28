import { subscriptionService } from '$lib/server/services/subscription.service';
import { serverTierConfigs } from '$lib/server/tiers';

export const load = async ({ locals, url }) => {
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
			audioSecondsPerMonth: tierInfo.monthlySeconds, // Keep original seconds
			canUseRealtime: tierInfo.hasRealtimeAccess,
			canUseAdvancedAnalytics: tierInfo.hasAnalytics
		};
	}

	// SEO data optimized for daily speaking practice positioning
	const seo = {
		title:
			'Speak Any Language in 5 Minutes a Day - AI Conversation Practice',
		description:
			'Build real speaking confidence in 5 minutes a day. Practice 30+ authentic scenarios with your AI language partner in 8+ languages. Get instant feedback and master conversations before talking with real people. Free to start, no scheduling required.',
		keywords:
			'5 minute daily language practice, speaking practice, scenario-based conversation, AI language partner, language confidence, speaking skills, authentic practice, daily habit, language immersion, conversation practice app, learn languages fast',
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
