import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user || !locals.userContext) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		// Return user data and context
		return json({
			user: locals.user,
			userContext: locals.userContext
		});
	} catch (error) {
		console.error('Error fetching user data:', error);
		return json({ error: 'Failed to fetch user data' }, { status: 500 });
	}
};
