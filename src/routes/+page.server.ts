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

	// SEO data optimized for AI language partner/coach positioning
	const seo = {
		title:
			'AI Language Partner & Coach - Build Speaking Confidence with Real Conversation Practice',
		description:
			'Master confident conversations with your AI language partner. Get real-time coaching feedback, practice 30+ authentic scenarios, and build speaking confidence in 8+ languages. Practice for free, no scheduling required.',
		keywords:
			'AI language partner, AI language coach, language confidence builder, conversation practice, speaking practice, authentic conversation, language learning app, real-time feedback, pronunciation coaching, language fluency',
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
