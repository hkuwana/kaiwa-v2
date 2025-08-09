// 🔐 Login Page Server Logic
import { redirect } from '@sveltejs/kit';
import { isGoogleOAuthEnabled } from '$lib/server/oauth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is already authenticated, redirect to home
	if (locals.user) {
		throw redirect(302, '/');
	}

	return {
		isGoogleOAuthEnabled
	};
};

