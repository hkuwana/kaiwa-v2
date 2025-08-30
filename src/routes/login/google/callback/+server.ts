// 🔐 Login Google Callback - Redirects to Auth Google Callback
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	// Redirect to the main auth Google callback route, preserving query parameters
	const callbackUrl = new URL('/auth/google/callback', url.origin);
	callbackUrl.search = url.search;

	throw redirect(302, callbackUrl.toString());
};
