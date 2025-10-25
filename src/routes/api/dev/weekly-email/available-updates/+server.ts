import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WeeklyUpdatesParserService } from '$lib/server/services/weekly-updates-parser.service';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is logged in
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get all available weekly updates
		const allUpdates = WeeklyUpdatesParserService.getAllWeeklyUpdates();

		// Sort by date (most recent first)
		const sortedUpdates = allUpdates.sort((a, b) => {
			return new Date(b.date).getTime() - new Date(a.date).getTime();
		});

		return json({
			success: true,
			updates: sortedUpdates
		});
	} catch (error) {
		console.error('Error getting available updates:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
