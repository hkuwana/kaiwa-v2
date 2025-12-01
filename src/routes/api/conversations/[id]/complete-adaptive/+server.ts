/**
 * API endpoint for completing adaptive learning sessions
 *
 * PATCH /api/conversations/[id]/complete-adaptive
 *
 * Marks a session as complete and updates week progress.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sessionService } from '$lib/features/learning-path/services/SessionService.server';
import { db } from '$lib/server/db';
import { weekSessions, conversations } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const completeSessionSchema = z.object({
	comfortRating: z.number().min(1).max(5).optional(),
	mood: z.enum(['great', 'good', 'okay', 'struggling']).optional(),
	userReflection: z.string().max(500).optional()
});

// ============================================================================
// HANDLERS
// ============================================================================

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const { id: conversationId } = params;

	try {
		const body = await request.json();
		const validatedData = completeSessionSchema.parse(body);

		// Verify the conversation belongs to the user
		const conversation = await db.query.conversations.findFirst({
			where: eq(conversations.id, conversationId)
		});

		if (!conversation) {
			throw error(404, 'Conversation not found');
		}

		if (conversation.userId !== user.id) {
			throw error(403, 'Not authorized to complete this conversation');
		}

		// Find the associated week session (if it exists - only adaptive sessions have this)
		const weekSession = await db.query.weekSessions.findFirst({
			where: and(
				eq(weekSessions.conversationId, conversationId),
				sql`${weekSessions.completedAt} IS NULL`
			)
		});

		if (!weekSession) {
			throw error(404, 'No active adaptive session found for this conversation');
		}

		// Complete the session
		const result = await sessionService.completeSession({
			sessionId: weekSession.id,
			comfortRating: validatedData.comfortRating,
			mood: validatedData.mood,
			userReflection: validatedData.userReflection
		});

		return json({
			success: true,
			data: {
				session: {
					id: result.session.id,
					completedAt: result.session.completedAt,
					durationSeconds: result.session.durationSeconds,
					exchangeCount: result.session.exchangeCount
				},
				progress: {
					sessionsCompleted: result.progress.sessionsCompleted,
					totalMinutes: parseFloat(result.progress.totalMinutes?.toString() ?? '0'),
					averageComfortRating: result.progress.averageComfortRating
						? parseFloat(result.progress.averageComfortRating.toString())
						: null
				},
				encouragement: result.encouragement
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

		console.error('Error completing session:', err);
		throw error(500, 'Failed to complete session');
	}
};
