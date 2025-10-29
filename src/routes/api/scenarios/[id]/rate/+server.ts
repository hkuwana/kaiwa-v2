import { json } from '@sveltejs/kit';
import { userScenarioProgressRepository } from '$lib/server/repositories';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * POST /api/scenarios/[id]/rate - Rate a scenario (1-5 stars)
 */

export const POST: RequestHandler = async ({ request, locals, params }) => {
	try {
		const userId = locals.user?.id;
		const { id: scenarioId } = params;

		if (!userId) {
			return json(createErrorResponse('User not authenticated'), { status: 401 });
		}

		if (!scenarioId) {
			return json(createErrorResponse('Scenario ID is required'), { status: 400 });
		}

		const body = await request.json();
		const { rating } = body;

		// Validate rating
		if (rating === undefined || rating === null) {
			return json(createErrorResponse('Rating is required'), { status: 400 });
		}

		if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
			return json(
				createErrorResponse('Rating must be an integer between 1 and 5'),
				{ status: 400 }
			);
		}

		const result = await userScenarioProgressRepository.rateScenario(userId, scenarioId, rating);

		if (!result) {
			return json(createErrorResponse('Failed to rate scenario'), { status: 500 });
		}

		return json(
			createSuccessResponse(
				{
					scenarioId: result.scenarioId,
					userRating: result.userRating,
					updatedAt: result.updatedAt
				},
				'Scenario rated successfully'
			)
		);
	} catch (error) {
		console.error('Error rating scenario:', error);
		return json(createErrorResponse('Failed to rate scenario'), { status: 500 });
	}
};
