// src/lib/server/repositories/learning-path.repository.ts

import { db } from '$lib/server/db/index';
import { learningPaths } from '$lib/server/db/schema';
import type { NewLearningPath, LearningPath } from '$lib/server/db/types';
import { eq, and, desc, sql } from 'drizzle-orm';

export const learningPathRepository = {
	// CREATE
	async createPathForUser(input: NewLearningPath): Promise<LearningPath> {
		const [createdPath] = await db
			.insert(learningPaths)
			.values({
				...input,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		return createdPath;
	},

	// READ
	async findPathById(pathId: string): Promise<LearningPath | undefined> {
		return db.query.learningPaths.findFirst({
			where: eq(learningPaths.id, pathId)
		});
	},

	async findPublicTemplateBySlug(slug: string): Promise<LearningPath | undefined> {
		return db.query.learningPaths.findFirst({
			where: and(
				eq(learningPaths.shareSlug, slug),
				eq(learningPaths.isTemplate, true),
				eq(learningPaths.isPublic, true),
				eq(learningPaths.status, 'active')
			)
		});
	},

	async listPublicTemplates(options: {
		limit?: number;
		offset?: number;
		targetLanguage?: string;
	}): Promise<LearningPath[]> {
		const { limit = 50, offset = 0, targetLanguage } = options;

		const conditions = [
			eq(learningPaths.isTemplate, true),
			eq(learningPaths.isPublic, true),
			eq(learningPaths.status, 'active')
		];

		if (targetLanguage) {
			conditions.push(eq(learningPaths.targetLanguage, targetLanguage));
		}

		return db.query.learningPaths.findMany({
			where: and(...conditions),
			orderBy: [desc(learningPaths.createdAt)],
			limit,
			offset
		});
	},

	async listUserPaths(
		userId: string,
		options?: { includeArchived?: boolean }
	): Promise<LearningPath[]> {
		const conditions = [eq(learningPaths.userId, userId)];

		if (!options?.includeArchived) {
			conditions.push(eq(learningPaths.status, 'active'));
		}

		return db.query.learningPaths.findMany({
			where: and(...conditions),
			orderBy: [desc(learningPaths.updatedAt)]
		});
	},

	async findUserActivePath(userId: string): Promise<LearningPath | undefined> {
		return db.query.learningPaths.findFirst({
			where: and(
				eq(learningPaths.userId, userId),
				eq(learningPaths.status, 'active'),
				eq(learningPaths.isTemplate, false)
			),
			orderBy: [desc(learningPaths.updatedAt)]
		});
	},

	// UPDATE
	async updatePathSchedule(
		pathId: string,
		schedule: LearningPath['schedule']
	): Promise<LearningPath | undefined> {
		const [updatedPath] = await db
			.update(learningPaths)
			.set({
				schedule,
				updatedAt: new Date()
			})
			.where(eq(learningPaths.id, pathId))
			.returning();

		return updatedPath;
	},

	async updatePath(
		pathId: string,
		data: Partial<NewLearningPath>
	): Promise<LearningPath | undefined> {
		const [updatedPath] = await db
			.update(learningPaths)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(learningPaths.id, pathId))
			.returning();

		return updatedPath;
	},

	async markPathAsTemplate(pathId: string): Promise<LearningPath | undefined> {
		const [updatedPath] = await db
			.update(learningPaths)
			.set({
				isTemplate: true,
				updatedAt: new Date()
			})
			.where(eq(learningPaths.id, pathId))
			.returning();

		return updatedPath;
	},

	async publishTemplate(
		pathId: string,
		slug: string,
		makePublic: boolean = true
	): Promise<LearningPath | undefined> {
		const [updatedPath] = await db
			.update(learningPaths)
			.set({
				shareSlug: slug,
				isPublic: makePublic,
				isTemplate: true,
				updatedAt: new Date()
			})
			.where(eq(learningPaths.id, pathId))
			.returning();

		return updatedPath;
	},

	async updatePathStatus(
		pathId: string,
		status: 'draft' | 'active' | 'archived'
	): Promise<LearningPath | undefined> {
		const [updatedPath] = await db
			.update(learningPaths)
			.set({
				status,
				updatedAt: new Date()
			})
			.where(eq(learningPaths.id, pathId))
			.returning();

		return updatedPath;
	},

	// DELETE
	async deletePath(pathId: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(learningPaths)
			.where(eq(learningPaths.id, pathId))
			.returning({ id: learningPaths.id });

		return { success: result.length > 0 };
	},

	async archivePath(pathId: string): Promise<LearningPath | undefined> {
		return this.updatePathStatus(pathId, 'archived');
	},

	// UTILITY
	async countPublicTemplates(targetLanguage?: string): Promise<number> {
		const conditions = [
			eq(learningPaths.isTemplate, true),
			eq(learningPaths.isPublic, true),
			eq(learningPaths.status, 'active')
		];

		if (targetLanguage) {
			conditions.push(eq(learningPaths.targetLanguage, targetLanguage));
		}

		const [result] = await db
			.select({ count: sql<number>`count(*)` })
			.from(learningPaths)
			.where(and(...conditions));

		return Number(result?.count) || 0;
	}
};
