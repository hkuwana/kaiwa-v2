// src/routes/api/learning-paths/preview/[sessionId]/refine/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { PreviewGeneratorService } from '$lib/features/learning-path/services/PreviewGeneratorService.server';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/preview/{sessionId}/refine
 *
 * Refine preview based on natural language feedback
 *
 * Request params:
 * - sessionId: Preview session ID
 *
 * Request body:
 * {
 *   refinementPrompt: string;    // e.g., "Make week 1 more casual and conversational"
 *   scope?: 'full' | 'week' | 'day';  // Default: 'full'
 *   target?: number;             // Week or day number if scoped
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     sessionId: string;
 *     title: string;
 *     description: string;
 *     schedule: DayScheduleEntry[];
 *     scenarios: Record<string, ScenarioPreview>;
 *     changesPreview?: {
 *       modified: number[];      // Which days changed
 *       summary: string;         // Summary of changes
 *     }
 *   }
 * }
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		// Require authentication
		if (!locals.user?.id) {
			return json(createErrorResponse('You must be logged in to refine a preview'), {
				status: 401
			});
		}

		const { sessionId } = params;
		const body = await request.json();
		const { refinementPrompt, scope, target } = body;

		// Validate input
		if (!sessionId) {
			return json(createErrorResponse('Session ID is required'), {
				status: 400
			});
		}

		if (!refinementPrompt || typeof refinementPrompt !== 'string') {
			return json(createErrorResponse('refinementPrompt is required and must be a string'), {
				status: 400
			});
		}

		if (refinementPrompt.trim().length < 5) {
			return json(createErrorResponse('refinementPrompt must be at least 5 characters'), {
				status: 400
			});
		}

		if (scope && !['full', 'week', 'day'].includes(scope)) {
			return json(createErrorResponse('scope must be "full", "week", or "day"'), {
				status: 400
			});
		}

		// Refine preview
		const preview = await PreviewGeneratorService.refinePreview(
			sessionId,
			refinementPrompt,
			scope || 'full',
			target
		);

		return json(
			createSuccessResponse(
				{
					sessionId: preview.sessionId,
					title: preview.title,
					description: preview.description,
					targetLanguage: preview.targetLanguage,
					sourceLanguage: preview.sourceLanguage,
					schedule: preview.schedule,
					scenarios: preview.scenarios
					// TODO: Add changesPreview when refinement is implemented
				},
				'Preview refined successfully'
			),
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error refining preview:', error);
		return json(
			createErrorResponse(error instanceof Error ? error.message : 'Failed to refine preview'),
			{ status: 500 }
		);
	}
};
