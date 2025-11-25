// src/routes/api/learning-paths/from-preferences/+server.ts

import { json } from '@sveltejs/kit';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { PathGeneratorService } from '$lib/features/learning-path/services/PathGeneratorService.server';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import type { RequestHandler } from './$types';

/**
 * POST /api/learning-paths/from-preferences
 *
 * Create a learning path from user preferences
 *
 * Request body:
 * {
 *   userId?: string;        // Optional - if not provided, creates anonymous path
 *   presetName?: string;    // Optional preset template name
 *   presetDescription?: string;
 *   duration?: number;      // Optional duration override (default: 28 days)
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
		const { userId, presetName, presetDescription, duration } = body;

		// Use logged-in user if no userId provided
		const effectiveUserId = userId || locals.user?.id || null;

		// If userId is provided and user is logged in, verify they match
		if (userId && locals.user?.id && userId !== locals.user.id) {
			return json(
				createErrorResponse('You are not authorized to create paths for other users'),
				{ status: 403 }
			);
		}

		// Fetch user preferences
		let userPreferences;
		if (effectiveUserId) {
			userPreferences = await userPreferencesRepository.getPreferencesByUserId(effectiveUserId);

			if (!userPreferences) {
				return json(
					createErrorResponse(
						'User preferences not found. Please complete onboarding first.'
					),
					{ status: 400 }
				);
			}
		} else {
			// For anonymous paths, require preferences in request body
			if (!body.userPreferences) {
				return json(
					createErrorResponse(
						'Either userId or userPreferences must be provided'
					),
					{ status: 400 }
				);
			}
			userPreferences = body.userPreferences;
		}

		// Build preset if provided
		const preset =
			presetName && presetDescription
				? {
						name: presetName,
						description: presetDescription,
						duration
					}
				: undefined;

		// Generate path
		const result = await PathGeneratorService.createPathFromPreferences(effectiveUserId, {
			userPreferences,
			preset
		});

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
				'Learning path created successfully'
			),
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating learning path from preferences:', error);
		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to create learning path'
			),
			{ status: 500 }
		);
	}
};
