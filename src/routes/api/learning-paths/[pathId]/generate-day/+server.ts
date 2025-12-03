// src/routes/api/learning-paths/[pathId]/generate-day/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import { ScenarioGenerationJobService } from '$lib/features/learning-path/services/ScenarioGenerationJobService.server';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/[pathId]/generate-day
 *
 * Generate scenario for a conversation seed in an adaptive learning path.
 *
 * Request body:
 * {
 *   seedId?: string;       // Optional - specific seed to generate (otherwise generates next pending)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     generated: boolean,
 *     scenarioId?: string,
 *     seedId?: string,
 *     error?: string
 *   }
 * }
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const { pathId } = params;
		const body = await request.json().catch(() => ({}));
		const { seedId } = body as { seedId?: string };

		// Require authentication
		if (!locals.user?.id) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		const userId = locals.user.id;

		// Verify path exists
		const path = await learningPathRepository.findPathById(pathId);
		if (!path) {
			return json(createErrorResponse('Learning path not found'), { status: 404 });
		}

		// Verify user has assignment
		const assignment = await learningPathAssignmentRepository.findAssignment(userId, pathId);
		if (!assignment) {
			return json(createErrorResponse('Not assigned to this path'), { status: 403 });
		}

		// All paths use adaptive generation now
		const weekStatuses = await ScenarioGenerationJobService.getPathStatus(pathId);

		if (weekStatuses.length === 0) {
			return json(createErrorResponse('No active weeks found'), { status: 400 });
		}

		// Find the target week (use first active week)
		const targetWeek = weekStatuses[0];

		// Generate next pending scenario (or specific seed if provided)
		const result = await ScenarioGenerationJobService.generateNextPending(
			targetWeek.weekId,
			userId,
			path.targetLanguage,
			seedId // Pass seedId if provided
		);

		return json(
			createSuccessResponse({
				generated: result.success && !!result.scenarioId,
				scenarioId: result.scenarioId,
				seedId: result.seedId,
				error: result.error
			})
		);
	} catch (error) {
		console.error('[GenerateDay] Error:', error);
		return json(
			createErrorResponse(error instanceof Error ? error.message : 'Failed to generate scenario'),
			{ status: 500 }
		);
	}
};
