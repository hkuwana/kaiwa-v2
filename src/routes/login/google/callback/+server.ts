// 🔐 Google OAuth Callback Handler
// Processes the callback from Google and creates/authenticates user

import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';
import { google, isGoogleOAuthEnabled } from '$lib/server/oauth';
import { getUserByGoogleId, createUserFromGoogle } from '$lib/server/user';
import { decodeIdToken } from 'arctic';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { OAuth2Tokens } from 'arctic';

interface GoogleClaims {
	sub: string; // Google user ID
	email: string;
	name: string;
	picture?: string;
	email_verified?: boolean;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	// Check if Google OAuth is enabled
	if (!isGoogleOAuthEnabled) {
		throw error(501, 'Google OAuth is not configured');
	}

	// Extract parameters from callback URL
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('google_oauth_state') ?? null;
	const codeVerifier = cookies.get('google_code_verifier') ?? null;

	// Validate required parameters
	if (!code || !state || !storedState || !codeVerifier) {
		console.error('Missing OAuth parameters:', {
			code: !!code,
			state: !!state,
			storedState: !!storedState,
			codeVerifier: !!codeVerifier
		});
		throw error(400, 'Invalid OAuth callback parameters');
	}

	// Validate state parameter (CSRF protection)
	if (state !== storedState) {
		console.error('OAuth state mismatch');
		throw error(400, 'Invalid OAuth state');
	}

	// Clear OAuth cookies
	cookies.delete('google_oauth_state', { path: '/' });
	cookies.delete('google_code_verifier', { path: '/' });

	try {
		// Exchange authorization code for tokens
		let tokens: OAuth2Tokens;
		try {
			tokens = await google.validateAuthorizationCode(code, codeVerifier);
		} catch (err) {
			console.error('Failed to validate authorization code:', err);
			throw error(400, 'Invalid authorization code');
		}

		// Decode the ID token to get user information
		const claims = decodeIdToken(tokens.idToken()) as GoogleClaims;
		const googleUserId = claims.sub;
		const email = claims.email;
		const displayName = claims.name;
		const avatarUrl = claims.picture;

		// Validate essential claims
		if (!googleUserId || !email || !displayName) {
			console.error('Missing essential user claims:', {
				googleUserId: !!googleUserId,
				email: !!email,
				displayName: !!displayName
			});
			throw error(400, 'Incomplete user information from Google');
		}

		// Check if user already exists
		let user = await getUserByGoogleId(googleUserId);

		if (!user) {
			// Create new user
			try {
				user = await createUserFromGoogle({
					googleId: googleUserId,
					email,
					displayName,
					avatarUrl
				});
				console.log('Created new user:', user.id);
			} catch (err) {
				console.error('Failed to create user:', err);
				throw error(500, 'Failed to create user account');
			}
		} else {
			console.log('Existing user logged in:', user.id);
		}

		// Create session
		const sessionToken = generateSessionToken();
		const session = await createSession(sessionToken, user.id);

		// Set session cookie
		setSessionTokenCookie({ cookies } as any, sessionToken, session.expiresAt);

		// Redirect to home page
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		});
	} catch (err) {
		// If it's already an error response, re-throw it
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		console.error('OAuth callback error:', err);
		throw error(500, 'Authentication failed');
	}
};
