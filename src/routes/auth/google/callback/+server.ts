import { google, isGoogleOAuthEnabled } from '$lib/services/auth-oauth.service';
import { createSession, setSessionTokenCookie, findOrCreateUser } from '$lib/server/auth';
import { OAuth2RequestError, decodeIdToken } from 'arctic';

interface IdTokenClaims {
	sub: string;
	name: string;
	picture: string;
	email: string;
}

export async function GET(event): Promise<Response> {
	// Check if Google OAuth is enabled
	if (!isGoogleOAuthEnabled || !google) {
		console.log('Google OAuth is not configured here', isGoogleOAuthEnabled);
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

		console.log('Finding or creating user', { googleId, email });
		const { user, isNew } = await findOrCreateUser({
			email,
			googleId,
			displayName: claims.name,
			avatarUrl: claims.picture
		});

		console.log(isNew ? 'New user created' : 'Existing user found', { userId: user.id });

		const { session, token } = await createSession(user.id);
		setSessionTokenCookie(event, token, session.expiresAt);
		console.log('Session created', {
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
