import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';

const BASE_SEO = {
	title: 'Kaiwa - AI Language Learning Through Conversation',
	description:
		'Practice speaking languages naturally with AI. Immerse yourself in real conversations and learn through dialogue with our intelligent language tutor.',
	keywords:
		'language learning, AI tutor, conversation practice, speaking practice, language immersion, AI conversation, language practice, speaking tutor',
	author: 'Kaiwa Team',
	robots: 'index, follow',
	ogType: 'website',
	twitterCard: 'summary_large_image',
	canonical: 'https://kaiwa.app'
};

export const load = async ({ url }) => {
	if (browser) {
		posthog.init(PUBLIC_POSTHOG_KEY, {
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
	return {
		seo: {
			...BASE_SEO,
			canonical: `${BASE_SEO.canonical}${url.pathname}`,
			url: url.href
		}
	};
};
