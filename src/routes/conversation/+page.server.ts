import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Get user data from locals (set by hooks.server.ts)
	const user = locals.user || null;

	return {
		user,
		isGuest: !user
	};
};
