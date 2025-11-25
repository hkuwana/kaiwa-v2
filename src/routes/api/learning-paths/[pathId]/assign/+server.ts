// src/routes/api/learning-paths/[pathId]/assign/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/[pathId]/assign
 *
 * Assign a learning path to a user (admin/creator functionality)
 *
 * Request body:
 * {
 *   email?: string;        // User email (will look up userId)
 *   userId?: string;       // Direct user ID
 *   note?: string;         // Optional admin note
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     assignment: {...}
 *   }
 * }
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const { pathId } = params;
		const body = await request.json();
		const { email, userId, note } = body;

		// Verify admin/creator access (for now, just check if user is logged in)
		// TODO: Add proper admin role check
		if (!locals.user?.id) {
			return json(
				createErrorResponse('You must be logged in to assign learning paths'),
				{ status: 401 }
			);
		}

		// Validate path exists
		const path = await learningPathRepository.findPathById(pathId);
		if (!path) {
			return json(
				createErrorResponse('Learning path not found'),
				{ status: 404 }
			);
		}

		// Determine target user ID
		let targetUserId: string;

		if (userId) {
			targetUserId = userId;
		} else if (email) {
			// TODO: Look up user by email
			// For now, just use email as placeholder
			return json(
				createErrorResponse('Email lookup not yet implemented. Please use userId instead.'),
				{ status: 400 }
			);
		} else {
			return json(
				createErrorResponse('Either email or userId is required'),
				{ status: 400 }
			);
		}

		// Create assignment
		const assignment = await learningPathAssignmentRepository.createAssignment({
			pathId,
			userId: targetUserId,
			assignedByUserId: locals.user.id,
			status: 'active',
			currentDayIndex: 1,
			note
		});

		return json(
			createSuccessResponse({
				assignment
			}),
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error assigning learning path:', error);

		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to assign learning path'
			),
			{ status: 500 }
		);
	}
};
