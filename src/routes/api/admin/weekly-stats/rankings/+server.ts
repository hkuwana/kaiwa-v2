import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { userRepository } from '$lib/server/repositories';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const period = url.searchParams.get('period') || 'week';
		const limitParam = url.searchParams.get('limit');
		const limit = limitParam ? parseInt(limitParam, 10) : 50;

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

		// Get rankings from repository
		const rankings = await conversationSessionsRepository.getUserRankings(
			startDate,
			endDate,
			limit
		);

		// Fetch user details for each ranking
		const rankingsWithUserDetails = await Promise.all(
			rankings.map(async (ranking, index) => {
				const user = await userRepository.findUserById(ranking.userId);
				return {
					rank: index + 1,
					userId: ranking.userId,
					displayName: user?.displayName || 'Unknown User',
					email: user?.email || 'N/A',
					totalSessions: ranking.totalSessions,
					totalMinutes: ranking.totalMinutes,
					activeDays: ranking.activeDays,
					mostUsedLanguage: ranking.mostUsedLanguage,
					totalWordsSpoken: ranking.totalWordsSpoken,
					totalCharactersSpoken: ranking.totalCharactersSpoken,
					averageSessionMinutes: ranking.averageSessionMinutes
				};
			})
		);

		return json({
			period,
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			rankings: rankingsWithUserDetails
		});
	} catch (error) {
		console.error('Error fetching rankings:', error);
		return json({ error: 'Failed to fetch rankings' }, { status: 500 });
	}
};
