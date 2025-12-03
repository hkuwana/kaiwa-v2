// src/routes/api/learning-paths/[pathId]/generation-status/+server.ts

/**
 * Scenario Generation Status & Trigger API
 *
 * This endpoint provides:
 * - GET: Current generation status for a learning path
 * - POST: Trigger generation of next pending scenario
 *
 * The frontend polls this endpoint to show real-time progress
 * and auto-triggers generation when user lands on dashboard.
 */

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import {
	ScenarioGenerationJobService,
	type WeekGenerationStatus
} from '$lib/features/learning-path/services/ScenarioGenerationJobService.server';
import type { RequestHandler } from './$types';

/**
 * GET /api/learning-paths/[pathId]/generation-status
 *
 * Returns the current scenario generation status for all active weeks
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     pathId: string,
 *     weeks: WeekGenerationStatus[],
 *     totalReady: number,
 *     totalPending: number,
 *     totalFailed: number,
 *     isComplete: boolean,
 *     needsGeneration: boolean
 *   }
 * }
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const { pathId } = params;

		// Verify user is logged in
		if (!locals.user?.id) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		// Verify path exists
		const path = await learningPathRepository.findPathById(pathId);
		if (!path) {
			return json(createErrorResponse('Learning path not found'), { status: 404 });
		}

		// Verify user has assignment
		const assignment = await learningPathAssignmentRepository.findAssignment(
			locals.user.id,
			pathId
		);
		if (!assignment) {
			return json(createErrorResponse('Not assigned to this path'), { status: 403 });
		}

		// Only for adaptive paths
		if (path.mode !== 'adaptive') {
			return json(createSuccessResponse({
				pathId,
				weeks: [],
				totalReady: 0,
				totalPending: 0,
				totalFailed: 0,
				isComplete: true,
				needsGeneration: false
			}));
		}

		// Get status for all active weeks
		const weekStatuses = await ScenarioGenerationJobService.getPathStatus(pathId);

		// Aggregate stats
		let totalReady = 0;
		let totalPending = 0;
		let totalFailed = 0;
		let totalGenerating = 0;

		for (const week of weekStatuses) {
			totalReady += week.readyCount;
			totalPending += week.pendingCount;
			totalFailed += week.failedCount;
			totalGenerating += week.generatingCount;
		}

		const isComplete = totalPending === 0 && totalGenerating === 0 && totalFailed === 0;
		const needsGeneration = totalPending > 0 || totalFailed > 0;

		return json(createSuccessResponse({
			pathId,
			weeks: weekStatuses,
			totalReady,
			totalPending,
			totalFailed,
			totalGenerating,
			isComplete,
			needsGeneration
		}));

	} catch (error) {
		console.error('[GenerationStatus] GET error:', error);
		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to get generation status'
			),
			{ status: 500 }
		);
	}
};

/**
 * POST /api/learning-paths/[pathId]/generation-status
 *
 * Trigger generation of the next pending scenario
 *
 * Request body:
 * {
 *   weekId?: string;       // Specific week to generate for (optional)
 *   resetFailed?: boolean; // Reset failed seeds before generating (optional)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     generated: boolean,
 *     seedId?: string,
 *     scenarioId?: string,
 *     error?: string,
 *     shouldContinue: boolean,
 *     currentStatus: WeekGenerationStatus
 *   }
 * }
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const { pathId } = params;
		const body = await request.json().catch(() => ({}));
		const { weekId, resetFailed = false } = body as { weekId?: string; resetFailed?: boolean };

		// Verify user is logged in
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

		// Only for adaptive paths
		if (path.mode !== 'adaptive') {
			return json(createErrorResponse('Only adaptive paths support this'), { status: 400 });
		}

		// Get active weeks
		const weekStatuses = await ScenarioGenerationJobService.getPathStatus(pathId);

		if (weekStatuses.length === 0) {
			return json(createSuccessResponse({
				generated: false,
				shouldContinue: false,
				error: 'No active weeks found'
			}));
		}

		// Find the week to process
		let targetWeek: WeekGenerationStatus;
		if (weekId) {
			const found = weekStatuses.find(w => w.weekId === weekId);
			if (!found) {
				return json(createErrorResponse('Week not found'), { status: 404 });
			}
			targetWeek = found;
		} else {
			// Find first week with pending scenarios
			targetWeek = weekStatuses.find(w => w.pendingCount > 0 || w.failedCount > 0) || weekStatuses[0];
		}

		// Reset failed if requested
		if (resetFailed && targetWeek.failedCount > 0) {
			await ScenarioGenerationJobService.resetFailedSeeds(targetWeek.weekId);
		}

		// Check if there's anything to generate
		const status = await ScenarioGenerationJobService.getWeekStatus(targetWeek.weekId);
		if (!status || (status.pendingCount === 0 && status.generatingCount === 0)) {
			return json(createSuccessResponse({
				generated: false,
				shouldContinue: false,
				currentStatus: status
			}));
		}

		// Generate next pending scenario
		const result = await ScenarioGenerationJobService.generateNextPending(
			targetWeek.weekId,
			userId,
			path.targetLanguage
		);

		// Get updated status
		const updatedStatus = await ScenarioGenerationJobService.getWeekStatus(targetWeek.weekId);

		// Determine if we should continue polling
		const shouldContinue = updatedStatus
			? (updatedStatus.pendingCount > 0 || updatedStatus.generatingCount > 0)
			: false;

		return json(createSuccessResponse({
			generated: result.success && !!result.scenarioId,
			seedId: result.seedId,
			scenarioId: result.scenarioId,
			error: result.error,
			shouldContinue,
			currentStatus: updatedStatus
		}));

	} catch (error) {
		console.error('[GenerationStatus] POST error:', error);
		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to generate scenario'
			),
			{ status: 500 }
		);
	}
};
