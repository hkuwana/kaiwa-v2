// src/routes/api/learning-paths/preview/[sessionId]/commit/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { PreviewGeneratorService } from '$lib/features/learning-path/services/PreviewGeneratorService.server';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/preview/{sessionId}/commit
 *
 * Commit preview to real learning path
 *
 * Creates:
 * - learning_path record
 * - scenario records for generated scenarios
 * - learning_path_assignment for user
 * - Queues generation of remaining scenarios
 *
 * Request params:
 * - sessionId: Preview session ID
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     pathId: string;
 *     redirectUrl: string;  // URL to navigate to (dashboard or first lesson)
 *   }
 * }
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		// Require authentication
		if (!locals.user?.id) {
			return json(createErrorResponse('You must be logged in to commit a preview'), {
				status: 401
			});
		}

		const { sessionId } = params;

		if (!sessionId) {
			return json(createErrorResponse('Session ID is required'), {
				status: 400
			});
		}

		// Commit preview
		const pathId = await PreviewGeneratorService.commitPreview(sessionId);

		return json(
			createSuccessResponse(
				{
					pathId,
					assignmentId: pathId, // For now, use pathId (actual assignmentId would be fetched)
					redirectUrl: '/dashboard' // Redirect to dashboard after commit
				},
				'Learning path created successfully'
			),
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error committing preview:', error);
		return json(
			createErrorResponse(error instanceof Error ? error.message : 'Failed to commit preview'),
			{ status: 500 }
		);
	}
};
