import { logger } from '$lib/logger';
// src/lib/server/repositories/scenario.repository.ts

import { db } from '$lib/server/db/index';
import { scenarios } from '$lib/server/db/schema';
import type { NewScenario, Scenario, ScenarioVisibility } from '$lib/server/db/types';
import { eq, and, asc, desc, count, sql } from 'drizzle-orm';
import { scenarioMetadataRepository } from './scenario-metadata.repository';
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

		// Initialize metadata for the new scenario
		try {
			await scenarioMetadataRepository.initializeMetadata(createdScenario.id);
		} catch (error) {
			logger.error(`Failed to initialize metadata for scenario ${createdScenario.id}:`, error);
			// Don't fail the scenario creation if metadata initialization fails
		}

		return createdScenario;
	},

	// READ
	async findScenarioById(id: string): Promise<Scenario | undefined> {
		return db.query.scenarios.findFirst({ where: eq(scenarios.id, id) });
	},

	async findScenarioByShareSlug(shareSlug: string): Promise<Scenario | undefined> {
		return db.query.scenarios.findFirst({
			where: and(eq(scenarios.shareSlug, shareSlug), eq(scenarios.isActive, true))
		});
	},

	async findScenarioByIdOrSlug(idOrSlug: string): Promise<Scenario | undefined> {
		// Try to find by shareSlug first, then by ID
		const bySlug = await this.findScenarioByShareSlug(idOrSlug);
		if (bySlug) return bySlug;
		return this.findScenarioById(idOrSlug);
	},

	async listUserScenarios(options: {
		userId: string;
		visibility?: ScenarioVisibility;
		includeInactive?: boolean;
	}): Promise<Scenario[]> {
		const conditions = [eq(scenarios.createdByUserId, options.userId)];

		if (!options.includeInactive) {
			conditions.push(eq(scenarios.isActive, true));
		}

		if (options.visibility) {
			conditions.push(eq(scenarios.visibility, options.visibility));
		}

		return db.query.scenarios.findMany({
			where: and(...conditions),
			orderBy: [desc(scenarios.updatedAt)]
		});
	},

	async countUserScenarios(userId: string): Promise<number> {
		const [result] = await db
			.select({ value: count() })
			.from(scenarios)
			.where(and(eq(scenarios.createdByUserId, userId), eq(scenarios.isActive, true)));

		return Number(result?.value) || 0;
	},

	async countPrivateUserScenarios(userId: string): Promise<number> {
		const [result] = await db
			.select({ value: count() })
			.from(scenarios)
			.where(
				and(
					eq(scenarios.createdByUserId, userId),
					eq(scenarios.isActive, true),
					eq(scenarios.visibility, 'private')
				)
			);

		return Number(result?.value) || 0;
	},

	async findOwnedScenario(userId: string, scenarioId: string): Promise<Scenario | undefined> {
		return db.query.scenarios.findFirst({
			where: and(
				eq(scenarios.id, scenarioId),
				eq(scenarios.createdByUserId, userId),
				eq(scenarios.isActive, true)
			)
		});
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
	},

	async softDeleteScenarioForUser(scenarioId: string, userId: string): Promise<boolean> {
		const [record] = await db
			.update(scenarios)
			.set({
				isActive: false,
				updatedAt: new Date()
			})
			.where(and(eq(scenarios.id, scenarioId), eq(scenarios.createdByUserId, userId)))
			.returning({ id: scenarios.id });

		return Boolean(record?.id);
	},

	async updateScenarioForUser(
		scenarioId: string,
		userId: string,
		data: Partial<NewScenario>
	): Promise<Scenario | undefined> {
		const [record] = await db
			.update(scenarios)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(and(eq(scenarios.id, scenarioId), eq(scenarios.createdByUserId, userId)))
			.returning();

		return record;
	},

	async incrementUsage(scenarioId: string): Promise<void> {
		await db
			.update(scenarios)
			.set({
				usageCount: sql`${scenarios.usageCount} + 1`,
				updatedAt: new Date()
			})
			.where(eq(scenarios.id, scenarioId));
	}
};
