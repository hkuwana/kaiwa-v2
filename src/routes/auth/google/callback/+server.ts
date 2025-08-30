import { google, isGoogleOAuthEnabled } from '$lib/services/auth-oauth.service';
import { createSession, setSessionTokenCookie } from '$lib/server/auth';
import { OAuth2RequestError, decodeIdToken } from 'arctic';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { randomUUID } from 'crypto';
import type { RequestEvent } from './$types';

interface IdTokenClaims {
	sub: string;
	name: string;
	picture: string;
	email: string;
}

export async function GET(event: RequestEvent): Promise<Response> {
	// Check if Google OAuth is enabled
	if (!isGoogleOAuthEnabled || !google) {
		console.log('Google OAuth is not configured');
		return new Response('Google OAuth is not configured', { status: 500 });
	}

	console.log('Google OAuth callback received');
	const storedState = event.cookies.get('google_oauth_state') ?? null;
	const codeVerifier = event.cookies.get('google_code_verifier') ?? null;
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');

	if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
		console.log('OAuth callback validation failed', {
			code,
			state,
			storedState,
			codeVerifier
		});
		return new Response(null, {
			status: 400
		});
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		console.log('Successfully validated authorization code', { tokens });
		const claims = decodeIdToken(tokens.idToken()) as IdTokenClaims;
		console.log('Decoded ID token claims', { claims });
		const googleId = claims.sub;
		const email = claims.email;

		if (!email) {
			console.log('Email not provided by Google', { claims });
			return new Response('Email not provided by provider.', {
				status: 400
			});
		}

		console.log('Looking for existing user with googleId', { googleId });
		const [existingUser] = await db
			.select()
			.from(table.users)
			.where(eq(table.users.googleId, googleId));

		if (existingUser) {
			console.log('Existing user found', { userId: existingUser.id });
			const { session, token } = await createSession(existingUser.id);
			setSessionTokenCookie(event, token, session.expiresAt);
			console.log('Session created for existing user', {
				sessionId: session.id
			});
			return new Response(null, {
				status: 302,
				headers: {
					Location: '/'
				}
			});
		}

		console.log('No existing user found, creating new user');
		const userId = randomUUID();
		await db.insert(table.users).values({
			id: userId,
			googleId: googleId,
			email: email,
			displayName: claims.name,
			avatarUrl: claims.picture
		});
		console.log('New user created', { userId });

		const { session, token } = await createSession(userId);
		setSessionTokenCookie(event, token, session.expiresAt);
		console.log('Session created for new user', {
			sessionId: session.id
		});

		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		});
	} catch (e) {
		console.log('Error in Google OAuth callback', e);
		if (e instanceof OAuth2RequestError) {
			return new Response(null, {
				status: 400
			});
		}
		return new Response(null, {
			status: 500
		});
	}
}
