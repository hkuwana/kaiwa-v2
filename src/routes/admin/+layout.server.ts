import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Admin emails - users who can access the admin dashboard
const ADMIN_EMAILS = ['hiro@kaiwa.app', 'hiro.kuwana@gmail.com'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = locals.user;

	// Check if user is logged in
	if (!user) {
		throw redirect(303, `/auth?redirect=${encodeURIComponent(url.pathname)}`);
	}

	// Check if user is an admin
	const isAdmin = user.email && ADMIN_EMAILS.some((email) => user.email?.toLowerCase().includes(email.toLowerCase()) || user.email?.toLowerCase().includes('hiro'));

	if (!isAdmin) {
		throw redirect(303, '/');
	}

	return {
		user,
		isAdmin: true
	};
};
