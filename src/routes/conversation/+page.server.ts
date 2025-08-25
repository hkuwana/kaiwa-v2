import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	// Get user data from locals (set by hooks.server.ts)
	const user = locals.user || null;
	const sessionId = url.searchParams.get('sessionId') || crypto.randomUUID();
	return {
		user,
		isGuest: !user,
		sessionId
	};
};
