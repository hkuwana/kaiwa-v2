import { json } from '@sveltejs/kit';
import { userScenarioProgressRepository } from '$lib/server/repositories';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * POST /api/scenarios/[id]/save - Save a scenario for the user
 * DELETE /api/scenarios/[id]/save - Unsave a scenario for the user
 */

export const POST: RequestHandler = async ({ locals, params }) => {
	try {
		const userId = locals.user?.id;
		const { id: scenarioId } = params;

		if (!userId) {
			return json(createErrorResponse('User not authenticated'), { status: 401 });
		}

		if (!scenarioId) {
			return json(createErrorResponse('Scenario ID is required'), { status: 400 });
		}

		const result = await userScenarioProgressRepository.saveScenario(userId, scenarioId);

		return json(
			createSuccessResponse(
				{
					isSaved: result.isSaved,
					scenarioId: result.scenarioId,
					savedAt: result.savedAt
				},
				'Scenario saved successfully'
			)
		);
	} catch (error) {
		console.error('Error saving scenario:', error);
		return json(createErrorResponse('Failed to save scenario'), { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	try {
		const userId = locals.user?.id;
		const { id: scenarioId } = params;

		if (!userId) {
			return json(createErrorResponse('User not authenticated'), { status: 401 });
		}

		if (!scenarioId) {
			return json(createErrorResponse('Scenario ID is required'), { status: 400 });
		}

		const result = await userScenarioProgressRepository.unsaveScenario(userId, scenarioId);

		if (!result) {
			return json(createErrorResponse('Scenario save record not found'), { status: 404 });
		}

		return json(
			createSuccessResponse(
				{
					isSaved: result.isSaved,
					scenarioId: result.scenarioId
				},
				'Scenario unsaved successfully'
			)
		);
	} catch (error) {
		console.error('Error unsaving scenario:', error);
		return json(createErrorResponse('Failed to unsave scenario'), { status: 500 });
	}
};
