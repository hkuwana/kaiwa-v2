import { Google } from 'arctic';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

const GOOGLE_REDIRECT_URI = dev
	? 'https://localhost:5173/auth/google/callback'
	: 'https://trykaiwa.com/auth/google/callback';

// Use process.env directly for runtime environment variables
const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;

// Check if OAuth is enabled
export const isGoogleOAuthEnabled = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

export const google = isGoogleOAuthEnabled
	? new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
	: null;
