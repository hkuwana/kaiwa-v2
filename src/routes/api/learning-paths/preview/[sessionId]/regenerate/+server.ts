// src/routes/api/learning-paths/preview/[sessionId]/regenerate/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { PreviewGeneratorService } from '$lib/features/learning-path/services/PreviewGeneratorService.server';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/preview/{sessionId}/regenerate
 *
 * Regenerate a single day's scenario
 *
 * Request params:
 * - sessionId: Preview session ID
 *
 * Request body:
 * {
 *   dayNumber: number;         // Day to regenerate (1-30)
 *   feedback?: string;         // Optional feedback (e.g., "Make it more casual")
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     dayNumber: number;
 *     scenario: ScenarioPreview;
 *   }
 * }
 *
 * Performance: ~3-5 seconds
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		// Require authentication
		if (!locals.user?.id) {
			return json(createErrorResponse('You must be logged in to regenerate a scenario'), {
				status: 401
			});
		}

		const { sessionId } = params;
		const body = await request.json();
		const { dayNumber, feedback } = body;

		// Validate input
		if (!sessionId) {
			return json(createErrorResponse('Session ID is required'), {
				status: 400
			});
		}

		if (!dayNumber || typeof dayNumber !== 'number') {
			return json(createErrorResponse('dayNumber is required and must be a number'), {
				status: 400
			});
		}

		if (dayNumber < 1 || dayNumber > 30) {
			return json(createErrorResponse('dayNumber must be between 1 and 30'), {
				status: 400
			});
		}

		if (feedback !== undefined && typeof feedback !== 'string') {
			return json(createErrorResponse('feedback must be a string'), {
				status: 400
			});
		}

		// Regenerate day
		const scenario = await PreviewGeneratorService.regenerateDay(sessionId, dayNumber, feedback);

		return json(
			createSuccessResponse(
				{
					dayNumber,
					scenario
				},
				'Scenario regenerated successfully'
			),
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error regenerating scenario:', error);
		return json(
			createErrorResponse(error instanceof Error ? error.message : 'Failed to regenerate scenario'),
			{ status: 500 }
		);
	}
};
