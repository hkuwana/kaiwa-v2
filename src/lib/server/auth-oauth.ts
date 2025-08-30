// 🔐 Google OAuth Configuration
// Using Arctic for OAuth handling as recommended by Lucia

import { Google } from 'arctic';
import { dev } from '$app/environment';

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// Redirect URI - adjust based on environment
const redirectURI = dev
	? 'http://localhost:5173/auth/google/callback'
	: 'https://trykaiwa.com/auth/google/callback'; // Update with your production domain

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
	console.warn('Google OAuth credentials not configured. Authentication will be disabled.');
}

// Initialize Google provider
export const google = new Google(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectURI);

export const isGoogleOAuthEnabled = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
