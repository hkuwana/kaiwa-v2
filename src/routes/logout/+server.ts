// 🚪 Logout Handler
// Invalidates session and redirects to home

import { invalidateSession, sessionCookieName } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const POST = async ({ locals, cookies }) => {
	// If no session, just redirect
	if (!locals.session) {
		throw redirect(302, '/');
	}

	// Invalidate the session in the database
	await invalidateSession(locals.session.id);

	// Delete the session cookie
	cookies.delete(sessionCookieName, { path: '/' });

	// Redirect to home page
	throw redirect(302, '/');
};

// Also support GET for simple logout links
export const GET = async ({ locals, cookies }) => {
	if (locals.session) {
		await invalidateSession(locals.session.id);
		cookies.delete(sessionCookieName, { path: '/' });
	}

	throw redirect(302, '/');
};
