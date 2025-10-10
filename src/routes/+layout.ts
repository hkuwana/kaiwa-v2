import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { userManager } from '$lib/stores/user.store.svelte';

const BASE_SEO = {
	title: 'Kaiwa - AI Language Learning Through Natural Conversation Practice',
	description:
		'Master languages through real conversations with AI. Practice speaking Japanese, Spanish, French, and more with personalized scenarios. Join thousands improving fluency through natural dialogue.',
	keywords:
		'language learning app, AI conversation tutor, speaking practice, Japanese learning, Spanish practice, French conversation, language fluency, conversation practice app, AI language coach, learn languages online, speaking confidence, language immersion',
	author: 'Kaiwa',
	robots: 'index, follow',
	ogType: 'website',
	twitterCard: 'summary_large_image',
	canonical: 'https://trykaiwa.com'
};

export const load = async ({ data, url }) => {
	if (browser && env.PUBLIC_POSTHOG_KEY) {
		posthog.init(env.PUBLIC_POSTHOG_KEY, {
			api_host: 'https://us.i.posthog.com',
			defaults: '2025-05-24',
			// Enable session recording for conversion analysis
			disable_session_recording: false,
			session_recording: {
				maskAllInputs: true, // Mask sensitive inputs
				maskInputOptions: {
					password: true,
					email: false // We want to see email interactions for conversion
				}
			},
			// Privacy settings
			respect_dnt: true,
			opt_out_capturing_by_default: false,
			// Performance
			capture_pageview: false, // We'll handle this manually
			capture_pageleave: true
		});
	}

	// Sync user data with userManager store
	const { user, currentTier } = data;

	if (user) {
		// Sync the userManager with user and tier data
		// The user data from server may not have all optional fields, so we cast it
		const subscriptionData = currentTier ? { effectiveTier: currentTier } : null;
		// Cast user to User type since server data may not have all optional fields
		userManager.syncFromPageData(user as import('$lib/server/db/types').User, subscriptionData);
		console.log('👤 Layout: UserManager synced with user data', {
			userId: user.id,
			tier: currentTier || 'free'
		});
	} else {
		// Reset userManager to guest state
		userManager.reset();
	}

	return {
		user,
		currentTier,
		seo: {
			...BASE_SEO,
			canonical: `${BASE_SEO.canonical}${url.pathname}`,
			url: url.href
		}
	};
};
