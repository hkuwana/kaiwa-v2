// 🔐 Login Page Server Logic
import { redirect } from '@sveltejs/kit';
import { isGoogleOAuthEnabled } from '$lib/server/oauth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is already authenticated, redirect to home
	if (locals.user) {
		throw redirect(302, '/');
	}

	return {
		isGoogleOAuthEnabled,
		seo: {
			title: 'Sign In - Kaiwa Language Learning',
			description:
				'Sign in to Kaiwa to save your conversation progress and continue your language learning journey. Access your personalized AI tutor and track your progress.',
			keywords:
				'sign in, login, language learning account, AI tutor login, conversation progress, language practice account',
			ogType: 'website',
			canonical: 'https://kaiwa.app/login',
			robots: 'noindex, nofollow', // Login pages shouldn't be indexed
			structuredData: {
				'@context': 'https://schema.org',
				'@type': 'WebPage',
				name: 'Sign In',
				description: 'Sign in to your Kaiwa account',
				url: 'https://kaiwa.app/login',
				mainEntity: {
					'@type': 'AuthenticationService',
					name: 'Kaiwa Authentication',
					description: 'Sign in to access your language learning account'
				}
			}
		}
	};
};
