// src/routes/api/learning-paths/[pathId]/generate-day/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import { QueueProcessorService } from '$lib/features/learning-path/services/QueueProcessorService.server';
import { ScenarioGenerationJobService } from '$lib/features/learning-path/services/ScenarioGenerationJobService.server';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/[pathId]/generate-day
 *
 * Generate scenario for a specific day in a learning path.
 * Works for both classic and adaptive paths.
 *
 * Request body:
 * {
 *   dayIndex?: number;     // For classic paths - the day to generate
 *   seedId?: string;       // For adaptive paths - the seed to generate
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     generated: boolean,
 *     scenarioId?: string,
 *     error?: string
 *   }
 * }
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const { pathId } = params;
		const body = await request.json().catch(() => ({}));
		const { dayIndex, seedId } = body as { dayIndex?: number; seedId?: string };

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

		// Handle based on path mode
		if (path.mode === 'adaptive') {
			// For adaptive paths, use ScenarioGenerationJobService
			const weekStatuses = await ScenarioGenerationJobService.getPathStatus(pathId);

			if (weekStatuses.length === 0) {
				return json(createErrorResponse('No active weeks found'), { status: 400 });
			}

			// Find the week (use first active week if seedId not provided)
			const targetWeek = weekStatuses[0];

			// Generate next pending scenario
			const result = await ScenarioGenerationJobService.generateNextPending(
				targetWeek.weekId,
				userId,
				path.targetLanguage
			);

			return json(createSuccessResponse({
				generated: result.success && !!result.scenarioId,
				scenarioId: result.scenarioId,
				seedId: result.seedId,
				error: result.error
			}));
		} else {
			// For classic paths, process queue jobs
			if (!dayIndex) {
				return json(createErrorResponse('dayIndex is required for classic paths'), { status: 400 });
			}

			// Process pending jobs (this will generate scenarios for ready days)
			const result = await QueueProcessorService.processPendingJobs(5, false);

			// Check if the specific day now has a scenario
			const updatedPath = await learningPathRepository.findPathById(pathId);
			const schedule = updatedPath?.schedule || [];
			const dayEntry = schedule.find(d => d.dayIndex === dayIndex);

			return json(createSuccessResponse({
				generated: !!dayEntry?.scenarioId,
				scenarioId: dayEntry?.scenarioId || null,
				processedJobs: result.processed,
				succeededJobs: result.succeeded,
				error: result.errors.length > 0 ? result.errors[0].error : undefined
			}));
		}
	} catch (error) {
		console.error('[GenerateDay] Error:', error);
		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to generate scenario'
			),
			{ status: 500 }
		);
	}
};
