// src/routes/admin/adaptive-paths/+page.server.ts

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { learningPaths, learningPathAssignments, adaptiveWeeks } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Server-side load function for adaptive paths admin page
 *
 * Fetches all adaptive learning paths created by or assigned to the current user.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Require authentication
	if (!user) {
		throw redirect(302, '/auth');
	}

	// Fetch all adaptive paths for this user
	const userPaths = await db
		.select({
			path: learningPaths,
			assignment: learningPathAssignments,
			week: adaptiveWeeks
		})
		.from(learningPaths)
		.leftJoin(
			learningPathAssignments,
			and(
				eq(learningPathAssignments.pathId, learningPaths.id),
				eq(learningPathAssignments.userId, user.id)
			)
		)
		.leftJoin(
			adaptiveWeeks,
			and(
				eq(adaptiveWeeks.pathId, learningPaths.id),
				eq(adaptiveWeeks.status, 'active')
			)
		)
		.where(
			and(
				eq(learningPaths.mode, 'adaptive'),
				eq(learningPaths.userId, user.id)
			)
		)
		.orderBy(desc(learningPaths.createdAt));

	return {
		user,
		adaptivePaths: userPaths.map((row) => ({
			id: row.path.id,
			title: row.path.title,
			description: row.path.description,
			targetLanguage: row.path.targetLanguage,
			durationWeeks: row.path.durationWeeks,
			status: row.path.status,
			createdAt: row.path.createdAt,
			currentWeekNumber: row.assignment?.currentWeekNumber ?? 1,
			weekTheme: row.week?.theme ?? 'Not started',
			isAssigned: !!row.assignment,
			assignmentStatus: row.assignment?.status ?? 'pending'
		}))
	};
};
