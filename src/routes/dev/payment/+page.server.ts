import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';

export const load: PageServerLoad = async ({ locals }) => {
	// Only allow access in development mode
	if (!dev) {
		throw redirect(302, '/');
	}

	// Check if user is logged in
	if (!dev && !locals.user) {
		throw redirect(302, '/auth');
	}

	return {
		meta: {
			title: 'Dev Payment Testing | Kaiwa',
			description: 'Test Stripe payment integration with dev keys'
		}
	};
};
