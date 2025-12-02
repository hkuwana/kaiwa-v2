// src/routes/dashboard/+page.server.ts

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import { db } from '$lib/server/db';
import { adaptiveWeeks } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { ConversationSeed } from '$lib/server/db/schema/adaptive-weeks';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to auth if not logged in
	if (!locals.session || !locals.user) {
		throw redirect(302, '/auth?redirect=/dashboard');
	}

	const userId = locals.user.id;

	try {
		// Get user's assignments
		const assignments = await learningPathAssignmentRepository.listAssignmentsForUser(userId);

		// Get paths for each assignment
		const activePaths = [];
		const completedPaths = [];

		for (const assignment of assignments) {
			const path = await learningPathRepository.findPathById(assignment.pathId);
			if (!path) continue;

			// Handle adaptive vs classic paths differently
			if (path.mode === 'adaptive') {
				// Fetch the active week for adaptive paths
				const activeWeek = await db.query.adaptiveWeeks.findFirst({
					where: and(
						eq(adaptiveWeeks.pathId, path.id),
						eq(adaptiveWeeks.status, 'active')
					)
				});

				const seeds = (activeWeek?.conversationSeeds || []) as ConversationSeed[];
				const readyScenarios = seeds.filter(s => s.scenarioId).length;
				const totalSeeds = seeds.length;

				const pathData = {
					path,
					assignment,
					isAdaptive: true,
					activeWeek: activeWeek ? {
						id: activeWeek.id,
						weekNumber: activeWeek.weekNumber,
						theme: activeWeek.theme,
						themeDescription: activeWeek.themeDescription,
						seeds: seeds.map((seed, index) => ({
							id: seed.id,
							title: seed.title,
							description: seed.description,
							scenarioId: seed.scenarioId,
							isReady: !!seed.scenarioId,
							optionNumber: index + 1
						}))
					} : null,
					totalOptions: totalSeeds,
					readyOptions: readyScenarios,
					progressPercent: totalSeeds > 0 ? Math.round((readyScenarios / totalSeeds) * 100) : 0,
					// For compatibility with existing code
					totalDays: totalSeeds,
					daysCompleted: 0
				};

				if (assignment.status === 'completed' || assignment.completedAt) {
					completedPaths.push(pathData);
				} else {
					activePaths.push(pathData);
				}
			} else {
				// Classic path handling (unchanged)
				const pathData = {
					path,
					assignment,
					isAdaptive: false,
					activeWeek: null,
					totalDays: path.schedule?.length || 0,
					daysCompleted: assignment.currentDayIndex,
					progressPercent: path.schedule?.length
						? Math.round((assignment.currentDayIndex / path.schedule.length) * 100)
						: 0
				};

				if (assignment.status === 'completed' || assignment.completedAt) {
					completedPaths.push(pathData);
				} else {
					activePaths.push(pathData);
				}
			}
		}

		// Sort active paths by most recent
		activePaths.sort((a, b) => {
			const dateA = new Date(a.assignment.startsAt).getTime();
			const dateB = new Date(b.assignment.startsAt).getTime();
			return dateB - dateA;
		});

		// Get public templates for discovery
		const templates = await learningPathRepository.listPublicTemplates({ limit: 6 });

		return {
			user: locals.user,
			activePaths,
			completedPaths,
			templates,
			totalActive: activePaths.length,
			totalCompleted: completedPaths.length
		};
	} catch (error) {
		console.error('[Dashboard] Load error:', error);
		return {
			user: locals.user,
			activePaths: [],
			completedPaths: [],
			templates: [],
			totalActive: 0,
			totalCompleted: 0,
			error: 'Failed to load dashboard data'
		};
	}
};
