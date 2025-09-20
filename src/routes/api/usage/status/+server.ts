import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { tierService } from '$lib/server/tierService';

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	try {
		const usageStatus = await tierService.getUsageStatus(userId);
		return json(usageStatus);
	} catch (err) {
		console.error('Usage status API error:', err);
		throw error(500, 'Failed to load usage status');
	}
};