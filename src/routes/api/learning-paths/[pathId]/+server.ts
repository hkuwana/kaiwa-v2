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
		// - Anonymous paths (userId === null) can be viewed by anyone
		// - Public paths or templates can be viewed by anyone
		// - Private paths can only be viewed by the owner
		const isAnonymous = path.userId === null;
		const isPublic = path.isPublic || path.isTemplate;
		const isOwner = locals.user?.id === path.userId;

		if (!isAnonymous && !isPublic && !isOwner) {
			return json(createErrorResponse('You are not authorized to view this learning path'), {
				status: 403
			});
		}

		return json(createSuccessResponse(path));
	} catch (error) {
		console.error('Error fetching learning path:', error);
		return json(
			createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch learning path'),
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
			return json(createErrorResponse('You are not authorized to update this learning path'), {
				status: 403
			});
		}

		const updates = await request.json();

		// Validate allowed fields
		const allowedFields = ['title', 'description', 'status'];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Admin domains and emails for authorization
const ADMIN_DOMAINS = ['trykaiwa.com', 'kaiwa.app'];
const ADMIN_EMAILS = ['hkuwana97@gmail.com'];

function isUserAdmin(email: string | null | undefined): boolean {
	if (!email) return false;
	const normalizedEmail = email.toLowerCase().trim();
	const emailDomain = normalizedEmail.split('@')[1];
	if (emailDomain && ADMIN_DOMAINS.includes(emailDomain)) return true;
	if (ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalizedEmail)) return true;
	return false;
}

/**
 * DELETE /api/learning-paths/[pathId]
 *
 * Delete a learning path (owner or admin)
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

		// Check if user is owner or admin
		const isOwner = locals.user?.id === path.userId;
		const isAdmin = isUserAdmin(locals.user?.email);

		if (!isOwner && !isAdmin) {
			return json(createErrorResponse('You are not authorized to delete this learning path'), {
				status: 403
			});
		}

		await learningPathRepository.deletePath(pathId);

		console.log(
			`[API] Learning path ${pathId} deleted by ${locals.user?.email} (admin: ${isAdmin})`
		);

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
