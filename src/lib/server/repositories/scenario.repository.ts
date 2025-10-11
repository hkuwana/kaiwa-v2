// src/lib/server/repositories/scenario.repository.ts

import { db } from '$lib/server/db/index';
import { scenarios } from '$lib/server/db/schema';
import type { NewScenario, Scenario } from '$lib/server/db/types';
import { eq, and, asc } from 'drizzle-orm';
export const scenarioRepository = {
	// CREATE
	async createScenario(newScenario: NewScenario): Promise<Scenario> {
		const [createdScenario] = await db
			.insert(scenarios)
			.values({
				...newScenario,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		return createdScenario;
	},

	// READ
	async findScenarioById(id: string): Promise<Scenario | undefined> {
		return db.query.scenarios.findFirst({ where: eq(scenarios.id, id) });
	},

	async findScenariosByRole(
		role: Scenario['role'],
		limit: number = 50,
		offset: number = 0
	): Promise<Scenario[]> {
		return db.query.scenarios.findMany({
			where: and(eq(scenarios.role, role), eq(scenarios.isActive, true)),
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
			orderBy: [asc(scenarios.role), asc(scenarios.difficulty)],
			limit,
			offset
		});
	},

	// UPDATE
	async updateScenario(id: string, data: Partial<NewScenario>): Promise<Scenario | undefined> {
		const [updatedScenario] = await db
			.update(scenarios)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(scenarios.id, id))
			.returning();

		return updatedScenario;
	},

	async toggleScenarioActive(id: string): Promise<Scenario | undefined> {
		const currentScenario = await this.findScenarioById(id);
		if (!currentScenario) return undefined;

		const newActiveState = !currentScenario.isActive;
		const [updatedScenario] = await db
			.update(scenarios)
			.set({ isActive: newActiveState, updatedAt: new Date() })
			.where(eq(scenarios.id, id))
			.returning();

		return updatedScenario;
	},

	// DELETE
	async deleteScenario(id: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(scenarios)
			.where(eq(scenarios.id, id))
			.returning({ id: scenarios.id });

		return { success: result.length > 0 };
	}
};
