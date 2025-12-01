/**
 * API endpoint for creating adaptive learning paths
 *
 * POST /api/learning-paths/adaptive
 *
 * Creates a new adaptive learning path with Week 1 initialized.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adaptivePathService } from '$lib/features/learning-path/services/AdaptivePathService.server';
import { sessionService } from '$lib/features/learning-path/services/SessionService.server';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const createAdaptivePathSchema = z.object({
	targetLanguage: z.string().min(2).max(10),
	title: z.string().min(1).max(200),
	description: z.string().min(1).max(1000),
	weekThemeTemplate: z.enum(['meet-family', 'daily-life', 'professional']),
	cefrLevel: z.string().regex(/^[AB][12]$/), // A1, A2, B1, B2
	userGoal: z.string().optional()
});

// ============================================================================
// HANDLERS
// ============================================================================

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await request.json();
		const validatedData = createAdaptivePathSchema.parse(body);

		// Create the adaptive path with Week 1
		const result = await adaptivePathService.createPath({
			userId: user.id,
			...validatedData
		});

		// Get session types to return with the response
		const sessionTypes = await sessionService.getSessionTypes();

		return json({
			success: true,
			data: {
				path: result.path,
				assignment: result.assignment,
				week: result.week1,
				progress: result.weekProgress,
				sessionTypes
			}
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, {
				message: 'Invalid request data',
				errors: err.errors
			});
		}

		console.error('Error creating adaptive path:', err);
		throw error(500, 'Failed to create adaptive learning path');
	}
};
