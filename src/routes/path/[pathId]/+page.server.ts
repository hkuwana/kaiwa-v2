// src/routes/path/[pathId]/+page.server.ts

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';

/**
 * Server-side load function for individual learning path page
 *
 * This page shows a specific learning path and the user's progress on it.
 * - Anyone can view the path (logged in or not)
 * - If logged in and assigned, they see their progress and can start lessons
 * - If logged in but not assigned, they see "Add to dashboard" CTA
 * - If not logged in, they see path details and "Sign in to start" CTA
 *
 * Route: /path/[pathId]
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	const { pathId } = params;

	// Allow anonymous access - check if user is logged in
	const isLoggedIn = !!(locals.session && locals.user);
	const userId = locals.user?.id;

	// Fetch the learning path
	const path = await learningPathRepository.findPathById(pathId);

	if (!path) {
		throw error(404, 'Learning path not found');
	}

	// Check if user is assigned to this path (only if logged in)
	const assignment = isLoggedIn && userId
		? await learningPathAssignmentRepository.findAssignment(userId, pathId)
		: null;

	// Calculate progress data
	const totalDays = path.schedule?.length || 0;
	const daysCompleted = assignment?.currentDayIndex || 0;
	const progressPercent = totalDays > 0 ? Math.round((daysCompleted / totalDays) * 100) : 0;

	// Get current and next day info
	const schedule = path.schedule || [];
	const currentDayIndex = Math.min(daysCompleted + 1, totalDays);
	const currentDaySchedule = schedule.find((s) => s.dayIndex === currentDayIndex);
	const nextDaySchedule = schedule.find((s) => s.dayIndex === currentDayIndex + 1);

	return {
		user: locals.user || null,
		isLoggedIn,
		path: {
			id: path.id,
			title: path.title,
			description: path.description,
			targetLanguage: path.targetLanguage,
			schedule: path.schedule,
			status: path.status,
			isTemplate: path.isTemplate,
			isPublic: path.isPublic,
			shareSlug: path.shareSlug,
			estimatedMinutesPerDay: path.metadata?.estimatedMinutesPerDay,
			category: path.metadata?.category,
			tags: path.metadata?.tags,
			createdAt: path.createdAt
		},
		assignment: assignment
			? {
					id: assignment.id,
					status: assignment.status,
					currentDayIndex: assignment.currentDayIndex,
					startsAt: assignment.startsAt,
					completedAt: assignment.completedAt,
					role: assignment.role
				}
			: null,
		progress: {
			totalDays,
			daysCompleted,
			progressPercent,
			currentDay: currentDaySchedule
				? {
						dayIndex: currentDaySchedule.dayIndex,
						theme: currentDaySchedule.theme,
						difficulty: currentDaySchedule.difficulty,
						description: currentDaySchedule.description,
						scenarioId: currentDaySchedule.scenarioId,
						isReady: !!currentDaySchedule.scenarioId
					}
				: null,
			nextDay: nextDaySchedule
				? {
						dayIndex: nextDaySchedule.dayIndex,
						theme: nextDaySchedule.theme,
						difficulty: nextDaySchedule.difficulty
					}
				: null
		},
		isAssigned: !!assignment,
		isOwner: userId ? path.userId === userId : false
	};
};
