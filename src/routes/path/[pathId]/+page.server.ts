// src/routes/path/[pathId]/+page.server.ts

import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';

/**
 * Server-side load function for individual learning path page
 *
 * This page shows a specific learning path and the user's progress on it.
 * If the user is assigned to the path, they see their progress and can start lessons.
 * If not assigned, they see path details and can enroll (if public) or get redirected.
 *
 * Route: /path/[pathId]
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	const { pathId } = params;

	// Require login to view paths
	if (!locals.session || !locals.user) {
		throw redirect(302, `/auth?redirect=/path/${pathId}`);
	}

	const userId = locals.user.id;

	// Fetch the learning path
	const path = await learningPathRepository.findPathById(pathId);

	if (!path) {
		throw error(404, {
			message: 'Learning path not found',
			details: `The learning path you're looking for doesn't exist.`
		});
	}

	// Check if user is assigned to this path
	const assignment = await learningPathAssignmentRepository.findAssignment(userId, pathId);

	// If not assigned and path is not public, deny access
	if (!assignment && !path.isPublic && path.userId !== userId) {
		throw error(403, {
			message: 'Access denied',
			details: `You don't have access to this learning path.`
		});
	}

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
		user: locals.user,
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
			estimatedMinutesPerDay: path.estimatedMinutesPerDay,
			category: path.category,
			tags: path.tags,
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
						learningObjectives: currentDaySchedule.learningObjectives,
						scenarioDescription: currentDaySchedule.scenarioDescription,
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
		isOwner: path.userId === userId
	};
};
