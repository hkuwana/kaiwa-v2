import { json } from '@sveltejs/kit';
import { userScenarioProgressRepository } from '$lib/server/repositories';
import { scenarioRepository } from '$lib/server/repositories';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * GET /api/user/scenarios/completed - Get user's completed scenarios
 */

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		const userId = locals.user?.id;

		if (!userId) {
			return json(createErrorResponse('User not authenticated'), { status: 401 });
		}

		// Get pagination parameters
		const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);
		const offset = parseInt(url.searchParams.get('offset') || '0', 10);

		// Get user's completed scenario progress records
		const completedProgress = await userScenarioProgressRepository.getUserCompletedScenarios(
			userId,
			{ limit, offset }
		);

		// Fetch full scenario details for each completed scenario
		const scenarios = await Promise.all(
			completedProgress.map(async (progress) => {
				const scenario = await scenarioRepository.findScenarioById(progress.scenarioId);
				return scenario
					? {
							...scenario,
							userProgress: {
								isSaved: progress.isSaved,
								timesCompleted: progress.timesCompleted,
								timesAttempted: progress.timesAttempted,
								userRating: progress.userRating,
								lastAttemptAt: progress.lastAttemptAt,
								lastCompletedAt: progress.lastCompletedAt,
								totalTimeSpentSeconds: progress.totalTimeSpentSeconds
							}
						}
					: null;
			})
		);

		// Filter out null results
		const validScenarios = scenarios.filter((s) => s !== null);

		return json(
			createSuccessResponse(
				{
					scenarios: validScenarios,
					count: validScenarios.length,
					limit,
					offset,
					hasMore: validScenarios.length === limit
				},
				'User completed scenarios retrieved successfully'
			)
		);
	} catch (error) {
		console.error('Error fetching completed scenarios:', error);
		return json(createErrorResponse('Failed to fetch completed scenarios'), { status: 500 });
	}
};
