// 🔐 Google OAuth Initiation
// Redirects user to Google's authorization page

import { generateState, generateCodeVerifier } from 'arctic';
import { google, isGoogleOAuthEnabled } from '$lib/server/oauth';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	// Check if Google OAuth is enabled
	if (!isGoogleOAuthEnabled) {
		throw error(501, 'Google OAuth is not configured');
	}

	try {
		// Generate state and code verifier for PKCE
		const state = generateState();
		const codeVerifier = generateCodeVerifier();

		// Create authorization URL with required scopes
		const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

		// Store state and code verifier in secure cookies
		cookies.set('google_oauth_state', state, {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 10, // 10 minutes
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production'
		});

		cookies.set('google_code_verifier', codeVerifier, {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 10, // 10 minutes
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production'
		});

		// Redirect to Google's authorization page
		return new Response(null, {
			status: 302,
			headers: {
				Location: url.toString()
			}
		});
	} catch (err) {
		console.error('Error initiating Google OAuth:', err);
		throw error(500, 'Failed to initiate Google authentication');
	}
};
