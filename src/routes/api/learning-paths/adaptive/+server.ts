// src/routes/api/learning-paths/adaptive/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { adaptivePathService } from '$lib/features/learning-path/services/AdaptivePathService.server';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/adaptive
 *
 * Create a new adaptive learning path with Week 1 (Anchor Week)
 *
 * Request body:
 * {
 *   targetLanguage: string;        // Required - language code (e.g., 'ja', 'es')
 *   title: string;                  // Required - path title
 *   description: string;            // Required - path description/goal
 *   weekThemeTemplate: string;      // Required - 'meet-family' | 'daily-life' | 'professional'
 *   cefrLevel: string;              // Required - e.g., 'A1', 'A2', 'B1'
 *   userGoal?: string;              // Optional - specific user goal
 *   metadata?: {                    // Optional - additional preferences
 *     focusAreas?: object;
 *     grammarFocus?: string;
 *     sessionDuration?: string;
 *     feedbackStyle?: string;
 *     skillsPriority?: string;
 *   };
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     path: { id, title, description, ... },
 *     assignment: { id, userId, pathId, ... },
 *     week1: { id, theme, ... },
 *     weekProgress: { id, sessionsCompleted, ... }
 *   }
 * }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Require authentication
		if (!locals.user?.id) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		const body = await request.json();
		const { targetLanguage, title, description, weekThemeTemplate, cefrLevel, userGoal } = body;

		// Validate required fields
		if (!targetLanguage || !title || !description || !weekThemeTemplate || !cefrLevel) {
			return json(
				createErrorResponse(
					'Missing required fields: targetLanguage, title, description, weekThemeTemplate, cefrLevel'
				),
				{ status: 400 }
			);
		}

		// Validate weekThemeTemplate
		const validTemplates = ['meet-family', 'daily-life', 'professional'];
		if (!validTemplates.includes(weekThemeTemplate)) {
			return json(
				createErrorResponse(
					`Invalid weekThemeTemplate. Must be one of: ${validTemplates.join(', ')}`
				),
				{ status: 400 }
			);
		}

		// Create the adaptive path
		const result = await adaptivePathService.createPath({
			userId: locals.user.id,
			targetLanguage,
			title,
			description,
			weekThemeTemplate,
			cefrLevel,
			userGoal
		});

		return json(
			createSuccessResponse(
				{
					path: result.path,
					assignment: result.assignment,
					week1: result.week1,
					weekProgress: result.weekProgress
				},
				'Adaptive learning path created successfully'
			),
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating adaptive learning path:', error);
		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to create adaptive learning path'
			),
			{ status: 500 }
		);
	}
};
