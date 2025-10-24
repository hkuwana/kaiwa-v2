import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const period = url.searchParams.get('period') || 'week';

		let startDate: Date;
		const endDate = new Date();

		// Calculate date range based on period
		switch (period) {
			case 'today':
				startDate = new Date();
				startDate.setHours(0, 0, 0, 0);
				break;
			case 'week':
				startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case 'month':
				startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			case 'all':
				startDate = new Date(0); // Beginning of time
				break;
			default:
				startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
		}

		// Get platform stats
		const stats = await conversationSessionsRepository.getPlatformStats(startDate, endDate);

		return json({
			period,
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			stats
		});
	} catch (error) {
		console.error('Error fetching platform stats:', error);
		return json({ error: 'Failed to fetch platform stats' }, { status: 500 });
	}
};
