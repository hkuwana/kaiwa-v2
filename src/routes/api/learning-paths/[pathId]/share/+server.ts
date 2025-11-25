// src/routes/api/learning-paths/[pathId]/share/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { TemplatePublishingService } from '$lib/features/learning-path/services/TemplatePublishingService.server';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/[pathId]/share
 *
 * Publish a learning path as a public, anonymous template
 *
 * This endpoint creates a shareable, SEO-friendly version of a user's
 * learning path by:
 * - Removing PII from title and description
 * - Creating an anonymous copy (userId = null)
 * - Generating a unique share slug
 * - Marking as template and public
 *
 * **Authentication Required**: User must own the original path
 *
 * Request params:
 * - pathId: ID of the learning path to publish
 *
 * Request body:
 * {} // No body parameters required
 *
 * Response on success:
 * {
 *   success: true,
 *   data: {
 *     template: {
 *       id: string;
 *       title: string;           // PII-scrubbed
 *       description: string;      // PII-scrubbed
 *       shareSlug: string;        // Unique slug
 *       targetLanguage: string;
 *       schedule: [...];
 *       isTemplate: true;
 *       isPublic: true;
 *       userId: null;
 *       createdByUserId: string;  // Original creator
 *     };
 *     shareUrl: string;           // e.g., "/program/jp-meeting-partners-parents"
 *   }
 * }
 *
 * Response on error:
 * {
 *   success: false,
 *   error: string
 * }
 *
 * Possible errors:
 * - 401: User not authenticated
 * - 403: User does not own the path
 * - 404: Path not found
 * - 409: Path is already a template
 * - 500: Server error
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/learning-paths/path-123/share', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json'
 *   }
 * });
 *
 * const { data } = await response.json();
 * console.log('Share URL:', data.shareUrl);
 * ```
 */
export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		const { pathId } = params;

		// Check authentication
		if (!locals.user?.id) {
			return json(
				createErrorResponse('You must be logged in to publish a learning path as a template'),
				{ status: 401 }
			);
		}

		const userId = locals.user.id;

		// Create anonymous template
		const result = await TemplatePublishingService.createAnonymousTemplate(pathId, userId);

		if (!result.success) {
			// Determine appropriate status code based on error message
			let statusCode = 500;

			if (result.error.includes('not found')) {
				statusCode = 404;
			} else if (result.error.includes('permission') || result.error.includes('authorized')) {
				statusCode = 403;
			} else if (result.error.includes('already a template')) {
				statusCode = 409; // Conflict
			}

			return json(createErrorResponse(result.error), { status: statusCode });
		}

		// Return success with template and share URL
		return json(
			createSuccessResponse({
				template: result.template,
				shareUrl: result.shareUrl
			}),
			{ status: 201 } // Created
		);
	} catch (error) {
		console.error('Error publishing learning path as template:', error);

		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to publish learning path as template'
			),
			{ status: 500 }
		);
	}
};
