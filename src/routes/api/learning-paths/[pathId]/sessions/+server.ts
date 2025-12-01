/**
 * API endpoint for starting sessions in adaptive learning paths
 *
 * POST /api/learning-paths/[pathId]/sessions
 *
 * Starts a new session and creates a conversation.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionService } from '$lib/features/learning-path/services/SessionService.server';
import { adaptivePathService } from '$lib/features/learning-path/services/AdaptivePathService.server';
import { db } from '$lib/server/db';
import { learningPathAssignments } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const startSessionSchema = z.object({
	sessionTypeId: z.string(),
	conversationSeedId: z.string().optional()
});

// ============================================================================
// HANDLERS
// ============================================================================

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const { pathId } = params;

	try {
		const body = await request.json();
		const validatedData = startSessionSchema.parse(body);

		// Find the user's assignment for this path
		const assignment = await db.query.learningPathAssignments.findFirst({
			where: and(
				eq(learningPathAssignments.pathId, pathId),
				eq(learningPathAssignments.userId, user.id)
			)
		});

		if (!assignment) {
			throw error(404, 'Learning path assignment not found');
		}

		// Get the current week to find the progress ID
		const currentWeek = await adaptivePathService.getCurrentWeek(assignment.id);

		if (!currentWeek) {
			throw error(404, 'No active week found for this path');
		}

		// Start the session
		const result = await sessionService.startSession({
			weekProgressId: currentWeek.progress.id,
			sessionTypeId: validatedData.sessionTypeId,
			conversationSeedId: validatedData.conversationSeedId
		});

		return json({
			success: true,
			data: {
				session: {
					id: result.session.id,
					sessionTypeId: result.session.sessionTypeId,
					conversationSeedId: result.session.conversationSeedId,
					startedAt: result.session.startedAt
				},
				conversation: {
					id: result.conversation.id,
					title: result.conversation.title
				},
				sessionType: result.sessionType,
				// Return conversation URL for redirect
				conversationUrl: `/app/conversations/${result.conversation.id}`
			}
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, {
				message: 'Invalid request data',
				errors: err.errors
			});
		}

		if ((err as any)?.status) {
			throw err; // Re-throw SvelteKit errors
		}

		console.error('Error starting session:', err);
		throw error(500, 'Failed to start session');
	}
};
