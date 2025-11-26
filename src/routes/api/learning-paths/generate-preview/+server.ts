// src/routes/api/learning-paths/generate-preview/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { PreviewGeneratorService } from '$lib/features/learning-path/services/PreviewGeneratorService.server';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/generate-preview
 *
 * Generate instant preview from user intent for inline learning path creation
 *
 * Request body:
 * {
 *   intent: string;              // Natural language intent (e.g., "Learn Japanese for business")
 *   sourceLanguage?: string;     // Optional source language (defaults to 'en')
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     sessionId: string;         // Short ID for preview session
 *     title: string;
 *     description: string;
 *     targetLanguage: string;
 *     sourceLanguage: string;
 *     schedule: DayScheduleEntry[];  // 30-day schedule
 *     scenarios: {               // First 3 scenarios
 *       "1": ScenarioPreview,
 *       "2": ScenarioPreview,
 *       "3": ScenarioPreview
 *     };
 *     status: 'ready';
 *   }
 * }
 *
 * Performance: ~8-12 seconds total
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Require authentication
		if (!locals.user?.id) {
			return json(createErrorResponse('You must be logged in to create a preview'), {
				status: 401
			});
		}

		const body = await request.json();
		const { intent, sourceLanguage } = body;

		// Validate input
		if (!intent || typeof intent !== 'string') {
			return json(createErrorResponse('Intent is required and must be a string'), {
				status: 400
			});
		}

		if (intent.trim().length < 5) {
			return json(createErrorResponse('Intent must be at least 5 characters'), {
				status: 400
			});
		}

		if (sourceLanguage && typeof sourceLanguage !== 'string') {
			return json(createErrorResponse('sourceLanguage must be a string'), {
				status: 400
			});
		}

		// Generate preview
		const preview = await PreviewGeneratorService.generatePreview(
			locals.user.id,
			intent,
			sourceLanguage
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
					scenarios: preview.scenarios,
					status: preview.status
				},
				'Preview generated successfully'
			),
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error generating preview:', error);
		return json(
			createErrorResponse(error instanceof Error ? error.message : 'Failed to generate preview'),
			{ status: 500 }
		);
	}
};
