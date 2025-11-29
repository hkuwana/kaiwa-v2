// src/routes/api/users/[id]/learning-paths/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';
import type { UserLearningPath } from '$lib/features/learning-path/stores/learning-path.store.svelte';

/**
 * GET /api/users/[id]/learning-paths
 *
 * Returns the user's active and completed learning paths with progress info
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	const { id: userId } = params;

	// Auth check - user can only access their own learning paths
	if (!locals.session || !locals.user || locals.user.id !== userId) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get user's assignments
		const assignments = await learningPathAssignmentRepository.listAssignmentsForUser(userId);

		const activePaths: UserLearningPath[] = [];
		const completedPaths: UserLearningPath[] = [];

		for (const assignment of assignments) {
			// Get the path details
			const path = await learningPathRepository.findPathById(assignment.pathId);
			if (!path) continue;

			const schedule = path.schedule || [];
			const totalDays = schedule.length;
			const daysCompleted = assignment.currentDayIndex;
			const progressPercent = totalDays > 0 ? Math.round((daysCompleted / totalDays) * 100) : 0;

			// Get current day info
			const currentDayIndex = Math.min(daysCompleted + 1, totalDays);
			const currentDaySchedule = schedule.find((s) => s.dayIndex === currentDayIndex);

			// Check if current day scenario is ready
			let isReady = false;
			if (currentDaySchedule?.scenarioId) {
				isReady = true;
			} else {
				// Check queue status
				const queueJob = await scenarioGenerationQueueRepository.findJobForDay(
					path.id,
					currentDayIndex
				);
				isReady = queueJob?.status === 'ready';
			}

			// Get next day info
			const nextDaySchedule = schedule.find((s) => s.dayIndex === currentDayIndex + 1);

			const userPath: UserLearningPath = {
				path,
				assignment,
				progressPercent,
				daysCompleted,
				totalDays,
				currentDay: currentDaySchedule
					? {
							dayIndex: currentDaySchedule.dayIndex,
							theme: currentDaySchedule.theme,
							difficulty: currentDaySchedule.difficulty,
							scenarioId: currentDaySchedule.scenarioId,
							isReady
						}
					: null,
				nextDay: nextDaySchedule
					? {
							dayIndex: nextDaySchedule.dayIndex,
							theme: nextDaySchedule.theme,
							difficulty: nextDaySchedule.difficulty
						}
					: null
			};

			// Sort into active vs completed
			if (assignment.status === 'completed' || assignment.completedAt) {
				completedPaths.push(userPath);
			} else if (assignment.status === 'active' || assignment.status === 'invited') {
				activePaths.push(userPath);
			}
		}

		// Sort active paths by start date (most recent first)
		activePaths.sort((a, b) => {
			const dateA = new Date(a.assignment.startsAt).getTime();
			const dateB = new Date(b.assignment.startsAt).getTime();
			return dateB - dateA;
		});

		return json({
			success: true,
			data: {
				activePaths,
				completedPaths,
				totalActive: activePaths.length,
				totalCompleted: completedPaths.length
			}
		});
	} catch (error: any) {
		console.error('[API] GET user learning paths error:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
