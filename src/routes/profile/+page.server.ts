import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	// Early authentication check - redirect if not authenticated or is guest
	if (!locals.user || locals.user.id === 'guest') {
		console.log('⚠️ Profile access denied: User not authenticated');
		throw redirect(302, '/auth');
	}

	// Additional safety check - ensure user has a valid ID
	if (!locals.user.id || typeof locals.user.id !== 'string') {
		console.error('⚠️ Profile access denied: Invalid user ID');
		throw redirect(302, '/auth');
	}

	// Only return basic user data - everything else loads client-side
	return {
		user: locals.user
	};
};
