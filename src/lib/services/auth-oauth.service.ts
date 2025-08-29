import { Google } from 'arctic';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { dev } from '$app/environment';

const GOOGLE_REDIRECT_URI = dev
	? 'http://localhost:5173/auth/google/callback'
	: 'https://trykaiwa.com/auth/google/callback';

export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
