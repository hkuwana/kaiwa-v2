// src/lib/server/repositories/scenario.repository.ts

import { db } from '$lib/server/db/index';
import { scenarios, scenarioOutcomes } from '$lib/server/db/schema';
import type {
	NewScenario,
	NewScenarioOutcome,
	Scenario,
	ScenarioOutcome
} from '$lib/server/db/types';
import { eq, and, desc, asc } from 'drizzle-orm';

export const scenarioRepository = {
	// CREATE
	async createScenario(newScenario: NewScenario): Promise<Scenario> {
		const [createdScenario] = await db
			.insert(scenarios)
			.values({
				...newScenario,
				id: crypto.randomUUID(),
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();
		return createdScenario;
	},

	async createScenarioOutcome(newOutcome: NewScenarioOutcome): Promise<ScenarioOutcome> {
		const [createdOutcome] = await db.insert(scenarioOutcomes).values(newOutcome).returning();
		return createdOutcome;
	},

	// READ
	async findScenarioById(id: string): Promise<Scenario | undefined> {
		return db.query.scenarios.findFirst({ where: eq(scenarios.id, id) });
	},

	async findScenariosByLanguage(
		languageId: string,
		limit: number = 50,
		offset: number = 0
	): Promise<Scenario[]> {
		return db.query.scenarios.findMany({
			where: and(eq(scenarios.languageId, languageId), eq(scenarios.isActive, true)),
			orderBy: [asc(scenarios.difficulty), asc(scenarios.title)],
			limit,
			offset
		});
	},

	async findScenariosByCategory(
		category: string,
		limit: number = 50,
		offset: number = 0
	): Promise<Scenario[]> {
		return db.query.scenarios.findMany({
			where: and(eq(scenarios.category, category), eq(scenarios.isActive, true)),
			orderBy: [asc(scenarios.difficulty), asc(scenarios.title)],
			limit,
			offset
		});
	},

	async findScenariosByDifficulty(
		difficulty: 'beginner' | 'intermediate' | 'advanced',
		limit: number = 50,
		offset: number = 0
	): Promise<Scenario[]> {
		return db.query.scenarios.findMany({
			where: and(eq(scenarios.difficulty, difficulty), eq(scenarios.isActive, true)),
			orderBy: [asc(scenarios.title)],
			limit,
			offset
		});
	},

	async findActiveScenarios(limit: number = 100, offset: number = 0): Promise<Scenario[]> {
		return db.query.scenarios.findMany({
			where: eq(scenarios.isActive, true),
			orderBy: [asc(scenarios.languageId), asc(scenarios.difficulty)],
			limit,
			offset
		});
	},

	async findScenarioOutcomeById(id: string): Promise<ScenarioOutcome | undefined> {
		return db.query.scenarioOutcomes.findFirst({ where: eq(scenarioOutcomes.id, id) });
	},

	async findScenarioOutcomesByUserId(
		userId: string,
		limit: number = 50,
		offset: number = 0
	): Promise<ScenarioOutcome[]> {
		return db.query.scenarioOutcomes.findMany({
			where: eq(scenarioOutcomes.userId, userId),
			orderBy: [desc(scenarioOutcomes.id)],
			limit,
			offset
		});
	},

	async findScenarioOutcomesByScenarioId(
		scenarioId: string,
		limit: number = 50,
		offset: number = 0
	): Promise<ScenarioOutcome[]> {
		return db.query.scenarioOutcomes.findMany({
			where: eq(scenarioOutcomes.scenarioId, scenarioId),
			orderBy: [desc(scenarioOutcomes.id)],
			limit,
			offset
		});
	},

	async getScenarioStats(scenarioId: string): Promise<{
		totalAttempts: number;
		successRate: number;
		averageScore: number;
	}> {
		const outcomes = await db.query.scenarioOutcomes.findMany({
			where: eq(scenarioOutcomes.scenarioId, scenarioId)
		});

		const totalAttempts = outcomes.length;
		const successfulAttempts = outcomes.filter((o) => o.wasGoalAchieved).length;
		const successRate = totalAttempts > 0 ? successfulAttempts / totalAttempts : 0;

		const scores = outcomes
			.map((o) => {
				const score = o.goalCompletionScore;
				return score ? parseFloat(score) : 0;
			})
			.filter((score) => score > 0);
		const averageScore =
			scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

		return {
			totalAttempts,
			successRate,
			averageScore
		};
	},

	async getUserProgress(userId: string): Promise<{
		totalScenariosAttempted: number;
		scenariosCompleted: number;
		averageScore: number;
		streakDays: number;
	}> {
		const outcomes = await db.query.scenarioOutcomes.findMany({
			where: eq(scenarioOutcomes.userId, userId)
		});

		const totalScenariosAttempted = outcomes.length;
		const scenariosCompleted = outcomes.filter((o) => o.wasGoalAchieved).length;

		const scores = outcomes
			.map((o) => {
				const score = o.goalCompletionScore;
				return score ? parseFloat(score) : 0;
			})
			.filter((score) => score > 0);
		const averageScore =
			scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

		// Calculate streak (simplified - could be enhanced with actual date logic)
		const streakDays = Math.min(scenariosCompleted, 7); // Placeholder

		return {
			totalScenariosAttempted,
			scenariosCompleted,
			averageScore,
			streakDays
		};
	},

	// UPDATE
	async updateScenario(id: string, data: Partial<NewScenario>): Promise<Scenario | undefined> {
		const [updatedScenario] = await db
			.update(scenarios)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(scenarios.id, id))
			.returning();
		return updatedScenario;
	},

	async updateScenarioOutcome(
		id: string,
		data: Partial<Omit<NewScenarioOutcome, 'userId' | 'conversationId' | 'scenarioId'>>
	): Promise<ScenarioOutcome | undefined> {
		const [updatedOutcome] = await db
			.update(scenarioOutcomes)
			.set(data)
			.where(eq(scenarioOutcomes.id, id))
			.returning();
		return updatedOutcome;
	},

	async toggleScenarioActive(id: string): Promise<Scenario | undefined> {
		const currentScenario = await this.findScenarioById(id);
		if (!currentScenario) return undefined;

		const [updatedScenario] = await db
			.update(scenarios)
			.set({ isActive: !currentScenario.isActive })
			.where(eq(scenarios.id, id))
			.returning();
		return updatedScenario;
	},

	// DELETE
	async deleteScenario(id: string): Promise<{ success: boolean }> {
		// First delete all outcomes for this scenario
		await db.delete(scenarioOutcomes).where(eq(scenarioOutcomes.scenarioId, id));

		// Then delete the scenario
		const result = await db
			.delete(scenarios)
			.where(eq(scenarios.id, id))
			.returning({ id: scenarios.id });
		return { success: result.length > 0 };
	},

	async deleteScenarioOutcome(id: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(scenarioOutcomes)
			.where(eq(scenarioOutcomes.id, id))
			.returning({ id: scenarioOutcomes.id });
		return { success: result.length > 0 };
	}
};
