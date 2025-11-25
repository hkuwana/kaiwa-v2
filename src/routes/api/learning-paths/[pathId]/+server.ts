// src/routes/api/learning-paths/[pathId]/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import type { RequestHandler } from './$types';

/**
 * GET /api/learning-paths/[pathId]
 *
 * Retrieve a learning path by ID
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: string;
 *     userId: string | null;
 *     title: string;
 *     description: string;
 *     targetLanguage: string;
 *     schedule: Array<DayScheduleEntry>;
 *     status: string;
 *     // ... other path fields
 *   }
 * }
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const { pathId } = params;

		if (!pathId) {
			return json(createErrorResponse('Path ID is required'), { status: 400 });
		}

		const path = await learningPathRepository.findPathById(pathId);

		if (!path) {
			return json(createErrorResponse('Learning path not found'), { status: 404 });
		}

		// Check access permissions
		// - Public paths or templates can be viewed by anyone
		// - Private paths can only be viewed by the owner
		const isPublic = path.isPublic || path.isTemplate;
		const isOwner = locals.user?.id === path.userId;

		if (!isPublic && !isOwner) {
			return json(
				createErrorResponse('You are not authorized to view this learning path'),
				{ status: 403 }
			);
		}

		return json(createSuccessResponse(path));
	} catch (error) {
		console.error('Error fetching learning path:', error);
		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to fetch learning path'
			),
			{ status: 500 }
		);
	}
};

/**
 * PATCH /api/learning-paths/[pathId]
 *
 * Update a learning path (title, description, etc.)
 *
 * Request body:
 * {
 *   title?: string;
 *   description?: string;
 *   status?: 'draft' | 'active' | 'completed' | 'archived';
 * }
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	try {
		const { pathId } = params;

		if (!pathId) {
			return json(createErrorResponse('Path ID is required'), { status: 400 });
		}

		const path = await learningPathRepository.findPathById(pathId);

		if (!path) {
			return json(createErrorResponse('Learning path not found'), { status: 404 });
		}

		// Only the owner can update their path
		if (locals.user?.id !== path.userId) {
			return json(
				createErrorResponse('You are not authorized to update this learning path'),
				{ status: 403 }
			);
		}

		const updates = await request.json();

		// Validate allowed fields
		const allowedFields = ['title', 'description', 'status'];
		const updateData: Record<string, any> = {};

		for (const field of allowedFields) {
			if (updates[field] !== undefined) {
				updateData[field] = updates[field];
			}
		}

		if (Object.keys(updateData).length === 0) {
			return json(createErrorResponse('No valid fields to update'), { status: 400 });
		}

		const updatedPath = await learningPathRepository.updatePath(pathId, updateData);

		return json(createSuccessResponse(updatedPath, 'Learning path updated successfully'));
	} catch (error) {
		console.error('Error updating learning path:', error);
		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to update learning path'
			),
			{ status: 500 }
		);
	}
};

/**
 * DELETE /api/learning-paths/[pathId]
 *
 * Delete a learning path
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const { pathId } = params;

		if (!pathId) {
			return json(createErrorResponse('Path ID is required'), { status: 400 });
		}

		const path = await learningPathRepository.findPathById(pathId);

		if (!path) {
			return json(createErrorResponse('Learning path not found'), { status: 404 });
		}

		// Only the owner can delete their path
		if (locals.user?.id !== path.userId) {
			return json(
				createErrorResponse('You are not authorized to delete this learning path'),
				{ status: 403 }
			);
		}

		await learningPathRepository.deletePath(pathId);

		return json(createSuccessResponse({ deleted: true }, 'Learning path deleted successfully'));
	} catch (error) {
		console.error('Error deleting learning path:', error);
		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to delete learning path'
			),
			{ status: 500 }
		);
	}
};
