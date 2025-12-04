// src/lib/server/repositories/learning-path-progress.repository.ts

import { db } from '$lib/server/db';
import {
	learningPathAssignments,
	learningPaths,
	adaptiveWeeks,
	scenarios
} from '$lib/server/db/schema';
import type { Scenario } from '$lib/server/db/types';
import type { ConversationSeed } from '$lib/server/db/schema/adaptive-weeks';
import { and, eq, inArray } from 'drizzle-orm';

export type AssignmentPathWithWeek = {
	assignment: typeof learningPathAssignments.$inferSelect;
	path: typeof learningPaths.$inferSelect;
	activeWeek: typeof adaptiveWeeks.$inferSelect | null;
	seeds: ConversationSeed[];
};

class LearningPathProgressRepository {
	constructor(private database = db) {}

	async getAssignmentsWithPathAndWeek(userId: string): Promise<AssignmentPathWithWeek[]> {
		const assignments = await this.database.query.learningPathAssignments.findMany({
			where: eq(learningPathAssignments.userId, userId),
			orderBy: (table, { desc }) => desc(table.startsAt)
		});

		const results: AssignmentPathWithWeek[] = [];

		for (const assignment of assignments) {
			const path = await this.database.query.learningPaths.findFirst({
				where: eq(learningPaths.id, assignment.pathId)
			});

			if (!path) continue;

			let activeWeek: typeof adaptiveWeeks.$inferSelect | null = null;
			let seeds: ConversationSeed[] = [];

			if (path.mode === 'adaptive') {
				activeWeek = await this.database.query.adaptiveWeeks.findFirst({
					where: and(eq(adaptiveWeeks.pathId, path.id), eq(adaptiveWeeks.status, 'active')),
					orderBy: (table, { asc }) => asc(table.weekNumber)
				});
				seeds = (activeWeek?.conversationSeeds ?? []) as ConversationSeed[];
			}

			results.push({ assignment, path, activeWeek, seeds });
		}

		return results;
	}

	async getActiveLearningPathScenarios(userId: string): Promise<{
		hasLearningPath: boolean;
		pathInfo?: { title: string; weekNumber: number; theme: string; targetLanguage: string };
		scenarios: Scenario[];
	}> {
		const assignment = await this.database.query.learningPathAssignments.findFirst({
			where: and(
				eq(learningPathAssignments.userId, userId),
				eq(learningPathAssignments.status, 'active')
			)
		});

		if (!assignment) {
			return { hasLearningPath: false, scenarios: [] };
		}

		const path = await this.database.query.learningPaths.findFirst({
			where: eq(learningPaths.id, assignment.pathId)
		});

		if (!path) {
			return { hasLearningPath: false, scenarios: [] };
		}

		if (path.mode === 'adaptive') {
			const activeWeek = await this.database.query.adaptiveWeeks.findFirst({
				where: and(eq(adaptiveWeeks.pathId, path.id), eq(adaptiveWeeks.status, 'active'))
			});

			if (!activeWeek) {
				return {
					hasLearningPath: true,
					pathInfo: {
						title: path.title,
						weekNumber: assignment.currentWeekNumber,
						theme: 'Getting started',
						targetLanguage: path.targetLanguage
					},
					scenarios: []
				};
			}

			const seeds = activeWeek.conversationSeeds as ConversationSeed[];
			const scenarioIds = seeds
				.filter((seed) => seed.scenarioId)
				.map((seed) => seed.scenarioId as string);

			if (scenarioIds.length === 0) {
				return {
					hasLearningPath: true,
					pathInfo: {
						title: path.title,
						weekNumber: activeWeek.weekNumber,
						theme: activeWeek.theme,
						targetLanguage: path.targetLanguage
					},
					scenarios: []
				};
			}

			const pathScenarios = await this.database.query.scenarios.findMany({
				where: inArray(scenarios.id, scenarioIds)
			});

			return {
				hasLearningPath: true,
				pathInfo: {
					title: path.title,
					weekNumber: activeWeek.weekNumber,
					theme: activeWeek.theme,
					targetLanguage: path.targetLanguage
				},
				scenarios: pathScenarios
			};
		}

		const scheduleScenarioIds = (path.schedule || [])
			.filter((day) => day.scenarioId)
			.slice(0, 7)
			.map((day) => day.scenarioId as string);

		if (scheduleScenarioIds.length === 0) {
			return {
				hasLearningPath: true,
				pathInfo: {
					title: path.title,
					weekNumber: assignment.currentWeekNumber,
					theme: 'Current Week',
					targetLanguage: path.targetLanguage
				},
				scenarios: []
			};
		}

		const pathScenarios = await this.database.query.scenarios.findMany({
			where: inArray(scenarios.id, scheduleScenarioIds)
		});

		return {
			hasLearningPath: true,
			pathInfo: {
				title: path.title,
				weekNumber: assignment.currentWeekNumber,
				theme: 'Current Week',
				targetLanguage: path.targetLanguage
			},
			scenarios: pathScenarios
		};
	}
}

export const learningPathProgressRepository = new LearningPathProgressRepository();
