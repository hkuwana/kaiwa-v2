import type { PageServerLoad } from './$types';
import { getUserFromSession } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
	const userId = await getUserFromSession(cookies);

	if (!userId) {
		throw redirect(302, '/auth/login?redirect=/history');
	}

	// Return basic user info for the page
	return {
		user: {
			id: userId
		}
	};
}) satisfies PageServerLoad;