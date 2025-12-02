// src/routes/api/learning-paths/[pathId]/generate-scenarios/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import { CustomScenarioGenerationService } from '$lib/features/learning-path/services/CustomScenarioGenerationService.server';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/[pathId]/generate-scenarios
 *
 * Generate custom scenarios for a user's learning path assignment.
 * This creates personalized scenarios from the conversation seeds in the active week.
 *
 * Request body:
 * {
 *   userId?: string;        // User ID (defaults to logged-in user)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     scenariosGenerated: number,
 *     scenarioIds: string[],
 *     errors: Array<{ seedId: string, error: string }>
 *   }
 * }
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const { pathId } = params;
		const body = await request.json();
		const { userId: requestedUserId } = body;

		// Get the effective user ID
		const userId = requestedUserId || locals.user?.id;

		if (!userId) {
			return json(createErrorResponse('User ID is required'), { status: 400 });
		}

		// Verify the user is the requester or an admin
		if (requestedUserId && locals.user?.id && requestedUserId !== locals.user.id) {
			// TODO: Add admin check here if needed
			return json(createErrorResponse('You can only generate scenarios for yourself'), {
				status: 403
			});
		}

		// Verify path exists
		const path = await learningPathRepository.findPathById(pathId);
		if (!path) {
			return json(createErrorResponse('Learning path not found'), { status: 404 });
		}

		// Verify user has an assignment to this path
		const assignment = await learningPathAssignmentRepository.findAssignment(userId, pathId);
		if (!assignment) {
			return json(
				createErrorResponse('User is not assigned to this learning path'),
				{ status: 403 }
			);
		}

		// Check if this is an adaptive mode path
		if (path.mode !== 'adaptive') {
			return json(
				createErrorResponse('Custom scenario generation is only available for adaptive paths'),
				{ status: 400 }
			);
		}

		// Generate scenarios
		const result = await CustomScenarioGenerationService.generateScenariosForAssignment(
			pathId,
			userId,
			path.targetLanguage
		);

		if (!result.success && result.scenariosGenerated === 0) {
			return json(
				createErrorResponse(`Failed to generate scenarios: ${result.errors.map(e => e.error).join(', ')}`),
				{ status: 500 }
			);
		}

		return json(
			createSuccessResponse(
				{
					scenariosGenerated: result.scenariosGenerated,
					scenarioIds: result.scenarioIds,
					errors: result.errors
				},
				result.success
					? `Successfully generated ${result.scenariosGenerated} custom scenarios`
					: `Generated ${result.scenariosGenerated} scenarios with ${result.errors.length} errors`
			),
			{ status: result.success ? 200 : 207 } // 207 Multi-Status for partial success
		);
	} catch (error) {
		console.error('Error generating scenarios:', error);
		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to generate scenarios'
			),
			{ status: 500 }
		);
	}
};
