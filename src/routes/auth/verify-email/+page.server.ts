import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if not authenticated
	if (!locals.user) {
		throw redirect(302, '/auth');
	}

	// Redirect if email is already verified
	if (locals.user.emailVerified) {
		throw redirect(302, '/');
	}

	return {
		user: locals.user
	};
};
