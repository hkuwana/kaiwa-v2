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

export const GET: RequestHandler = async (event) => {
	const { url, cookies } = event;
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

		// Handle guest-id cookie data handoff
		const guestId = cookies.get('guest-id');
		if (guestId) {
			try {
				console.log(`Processing guest-id data handoff for user ${user.id}`);

				// Import the conversation repository
				const { conversationRepository } = await import(
					'$lib/server/repositories/conversation.repository'
				);

				// Transfer guest conversations to user account
				const updatedCount = await conversationRepository.transferGuestConversations(
					guestId,
					user.id
				);

				console.log(`Transferred ${updatedCount} conversations for guest-id: ${guestId}`);

				// Delete the guest-id cookie after successful update
				cookies.delete('guest-id', { path: '/' });
				console.log('Deleted guest-id cookie after data handoff');
			} catch (error) {
				console.error('Failed to process guest-id data handoff:', error);
				// Don't fail the login process if data handoff fails
				// The user can still log in, but their guest data won't be transferred
			}
		}

		// Create session
		const sessionToken = generateSessionToken();
		const { session } = await createSession(sessionToken, user.id);

		// Set session cookie
		setSessionTokenCookie(event, sessionToken, session.expiresAt);

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
