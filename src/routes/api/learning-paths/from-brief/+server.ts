// src/routes/api/learning-paths/from-brief/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { PathGeneratorService } from '$lib/features/learning-path/services/PathGeneratorService.server';
import type { RequestHandler } from './$types';
import type { PathFromCreatorBriefInput } from '$lib/features/learning-path/types';

/**
 * POST /api/learning-paths/from-brief
 *
 * Create a learning path from a creator brief
 *
 * Request body:
 * {
 *   userId?: string;              // Optional - if not provided, creates anonymous template
 *   brief: string;                 // Required - detailed course description
 *   targetLanguage: string;        // Required - language code (e.g., 'ja', 'es')
 *   duration?: number;             // Optional - number of days (default: 30)
 *   difficultyRange?: {
 *     start: string;               // e.g., 'A1', 'A2'
 *     end: string;                 // e.g., 'B1', 'B2'
 *   };
 *   primarySkill?: string;         // e.g., 'conversation', 'listening'
 *   metadata?: {
 *     category?: string;
 *     tags?: string[];
 *   };
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     pathId: string;
 *     path: {
 *       id: string;
 *       title: string;
 *       description: string;
 *       targetLanguage: string;
 *       totalDays: number;
 *       status: string;
 *     };
 *     queuedJobs: number;
 *   }
 * }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const { userId, brief, targetLanguage, duration, difficultyRange, primarySkill, metadata } =
			body;

		// Validate required fields
		if (!brief || !targetLanguage) {
			return json(
				createErrorResponse('Both "brief" and "targetLanguage" are required'),
				{ status: 400 }
			);
		}

		// Use logged-in user if no userId provided
		const effectiveUserId = userId || locals.user?.id || null;

		// If userId is provided and user is logged in, verify they match
		if (userId && locals.user?.id && userId !== locals.user.id) {
			return json(
				createErrorResponse('You are not authorized to create paths for other users'),
				{ status: 403 }
			);
		}

		// Build creator input
		const creatorInput: PathFromCreatorBriefInput = {
			brief,
			targetLanguage,
			duration,
			difficultyRange,
			primarySkill,
			metadata
		};

		// Generate path
		const result = await PathGeneratorService.createPathFromCreatorBrief(
			effectiveUserId,
			creatorInput
		);

		if (!result.success) {
			return json(createErrorResponse(result.error || 'Failed to create learning path'), {
				status: 500
			});
		}

		return json(
			createSuccessResponse(
				{
					pathId: result.pathId,
					path: result.path,
					queuedJobs: result.queuedJobs
				},
				'Learning path created successfully from brief'
			),
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating learning path from brief:', error);
		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to create learning path'
			),
			{ status: 500 }
		);
	}
};
