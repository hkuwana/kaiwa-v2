/**
 * API endpoint for getting the current week of an adaptive learning path
 *
 * GET /api/learning-paths/[pathId]/current-week
 *
 * Returns the active week with progress and available session types.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adaptivePathService } from '$lib/features/learning-path/services/AdaptivePathService.server';
import { db } from '$lib/server/db';
import { learningPathAssignments } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// ============================================================================
// HANDLERS
// ============================================================================

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const { pathId } = params;

	try {
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

		// Get the current week data
		const result = await adaptivePathService.getCurrentWeek(assignment.id);

		if (!result) {
			throw error(404, 'No active week found for this path');
		}

		return json({
			success: true,
			data: {
				week: {
					id: result.week.id,
					weekNumber: result.week.weekNumber,
					theme: result.week.theme,
					themeDescription: result.week.themeDescription,
					conversationSeeds: result.week.conversationSeeds,
					focusAreas: result.week.focusAreas,
					leverageAreas: result.week.leverageAreas,
					difficultyMin: result.week.difficultyMin,
					difficultyMax: result.week.difficultyMax
				},
				progress: {
					id: result.progress.id,
					sessionsCompleted: result.progress.sessionsCompleted,
					totalMinutes: parseFloat(result.progress.totalMinutes?.toString() ?? '0'),
					suggestedSessionCount: result.week.suggestedSessionCount,
					minimumSessionCount: result.week.minimumSessionCount,
					sessionTypeIdsUsed: result.progress.sessionTypeIdsUsed,
					seedsExplored: result.progress.seedsExplored,
					averageComfortRating: result.progress.averageComfortRating
						? parseFloat(result.progress.averageComfortRating.toString())
						: null
				},
				sessionTypes: result.sessionTypes,
				assignment: {
					id: result.assignment.id,
					currentWeekNumber: result.assignment.currentWeekNumber
				}
			}
		});
	} catch (err) {
		if ((err as any)?.status) {
			throw err; // Re-throw SvelteKit errors
		}

		console.error('Error getting current week:', err);
		throw error(500, 'Failed to fetch current week data');
	}
};
