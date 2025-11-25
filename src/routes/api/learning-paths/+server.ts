// src/routes/api/learning-paths/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import type { RequestHandler } from './$types';

/**
 * GET /api/learning-paths
 *
 * List learning paths with optional filters
 *
 * Query parameters:
 * - userId: Filter by user ID (defaults to logged-in user)
 * - status: Filter by status (draft, active, completed, archived)
 * - isTemplate: Filter templates (true/false)
 * - isPublic: Filter public paths (true/false)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     paths: Array<LearningPath>,
 *     count: number
 *   }
 * }
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Parse query parameters
		const userId = url.searchParams.get('userId') || locals.user?.id;
		const status = url.searchParams.get('status');
		const isTemplate = url.searchParams.get('isTemplate');
		const isPublic = url.searchParams.get('isPublic');

		// If requesting another user's paths, can only see public/template paths
		if (userId && userId !== locals.user?.id) {
			const publicPaths = await learningPathRepository.listPublicTemplates();
			return json(
				createSuccessResponse({
					paths: publicPaths,
					count: publicPaths.length
				})
			);
		}

		// User can see their own paths
		if (!userId) {
			// No user specified and not logged in - return public templates only
			const publicPaths = await learningPathRepository.listPublicTemplates();
			return json(
				createSuccessResponse({
					paths: publicPaths,
					count: publicPaths.length
				})
			);
		}

		// Fetch user's paths
		const paths = await learningPathRepository.listPathsForUser(userId);

		// Apply filters
		let filteredPaths = paths;

		if (status) {
			filteredPaths = filteredPaths.filter((p) => p.status === status);
		}

		if (isTemplate !== null) {
			const templateFilter = isTemplate === 'true';
			filteredPaths = filteredPaths.filter((p) => p.isTemplate === templateFilter);
		}

		if (isPublic !== null) {
			const publicFilter = isPublic === 'true';
			filteredPaths = filteredPaths.filter((p) => p.isPublic === publicFilter);
		}

		return json(
			createSuccessResponse({
				paths: filteredPaths,
				count: filteredPaths.length
			})
		);
	} catch (error) {
		console.error('Error listing learning paths:', error);
		return json(
			createErrorResponse(error instanceof Error ? error.message : 'Failed to list learning paths'),
			{ status: 500 }
		);
	}
};
