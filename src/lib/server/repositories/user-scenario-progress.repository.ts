// src/lib/server/repositories/user-scenario-progress.repository.ts

import { db } from '$lib/server/db/index';
import { userScenarioProgress } from '$lib/server/db/schema';
import type { NewUserScenarioProgress, UserScenarioProgress } from '$lib/server/db/types';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

export const userScenarioProgressRepository = {
	// CREATE / UPSERT
	async saveScenario(
		userId: string,
		scenarioId: string
	): Promise<UserScenarioProgress> {
		const now = new Date();
		const [saved] = await db
			.insert(userScenarioProgress)
			.values({
				userId,
				scenarioId,
				isSaved: true,
				savedAt: now,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: [userScenarioProgress.userId, userScenarioProgress.scenarioId],
				set: {
					isSaved: true,
					savedAt: now,
					updatedAt: now
				}
			})
			.returning();

		return saved;
	},

	async unsaveScenario(
		userId: string,
		scenarioId: string
	): Promise<UserScenarioProgress | undefined> {
		const [updated] = await db
			.update(userScenarioProgress)
			.set({
				isSaved: false,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(userScenarioProgress.userId, userId),
					eq(userScenarioProgress.scenarioId, scenarioId)
				)
			)
			.returning();

		return updated;
	},

	// READ
	async getUserScenarioProgress(
		userId: string,
		scenarioId: string
	): Promise<UserScenarioProgress | undefined> {
		return db.query.userScenarioProgress.findFirst({
			where: and(
				eq(userScenarioProgress.userId, userId),
				eq(userScenarioProgress.scenarioId, scenarioId)
			)
		});
	},

	async getUserSavedScenarios(
		userId: string,
		options: {
			limit?: number;
			offset?: number;
		} = {}
	): Promise<UserScenarioProgress[]> {
		return db.query.userScenarioProgress.findMany({
			where: and(
				eq(userScenarioProgress.userId, userId),
				eq(userScenarioProgress.isSaved, true)
			),
			orderBy: [desc(userScenarioProgress.savedAt)],
			limit: options.limit || 100,
			offset: options.offset || 0
		});
	},

	async getUserCompletedScenarios(
		userId: string,
		options: {
			limit?: number;
			offset?: number;
		} = {}
	): Promise<UserScenarioProgress[]> {
		return db.query.userScenarioProgress.findMany({
			where: and(
				eq(userScenarioProgress.userId, userId),
				sql`${userScenarioProgress.timesCompleted} > 0`
			),
			orderBy: [desc(userScenarioProgress.lastCompletedAt)],
			limit: options.limit || 100,
			offset: options.offset || 0
		});
	},

	async getUserScenariosByRating(
		userId: string,
		options: {
			minRating?: number;
			limit?: number;
			offset?: number;
		} = {}
	): Promise<UserScenarioProgress[]> {
		const conditions = [eq(userScenarioProgress.userId, userId)];

		if (options.minRating !== undefined) {
			conditions.push(sql`${userScenarioProgress.userRating} >= ${options.minRating}`);
		}

		return db.query.userScenarioProgress.findMany({
			where: and(...conditions),
			orderBy: [desc(userScenarioProgress.userRating)],
			limit: options.limit || 100,
			offset: options.offset || 0
		});
	},

	async getScenarioSavedCount(scenarioId: string): Promise<number> {
		const [result] = await db
			.select({
				count: sql<number>`count(*)`
			})
			.from(userScenarioProgress)
			.where(
				and(
					eq(userScenarioProgress.scenarioId, scenarioId),
					eq(userScenarioProgress.isSaved, true)
				)
			);

		return result?.count || 0;
	},

	async getUserRecentActivity(
		userId: string,
		options: {
			daysBack?: number;
			limit?: number;
		} = {}
	): Promise<UserScenarioProgress[]> {
		const daysBack = options.daysBack || 7;
		const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

		return db.query.userScenarioProgress.findMany({
			where: and(
				eq(userScenarioProgress.userId, userId),
				sql`${userScenarioProgress.lastAttemptAt} >= ${cutoffDate}`
			),
			orderBy: [desc(userScenarioProgress.lastAttemptAt)],
			limit: options.limit || 10
		});
	},

	// UPDATE
	async recordScenarioAttempt(
		userId: string,
		scenarioId: string,
		timeSpentSeconds: number = 0
	): Promise<UserScenarioProgress> {
		const now = new Date();
		const [result] = await db
			.insert(userScenarioProgress)
			.values({
				userId,
				scenarioId,
				timesAttempted: 1,
				lastAttemptAt: now,
				totalTimeSpentSeconds: timeSpentSeconds,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: [userScenarioProgress.userId, userScenarioProgress.scenarioId],
				set: {
					timesAttempted: sql`${userScenarioProgress.timesAttempted} + 1`,
					lastAttemptAt: now,
					totalTimeSpentSeconds: sql`${userScenarioProgress.totalTimeSpentSeconds} + ${timeSpentSeconds}`,
					updatedAt: now
				}
			})
			.returning();

		return result;
	},

	async recordScenarioCompletion(
		userId: string,
		scenarioId: string,
		timeSpentSeconds: number = 0
	): Promise<UserScenarioProgress> {
		const now = new Date();
		const [result] = await db
			.insert(userScenarioProgress)
			.values({
				userId,
				scenarioId,
				timesCompleted: 1,
				timesAttempted: 1,
				lastCompletedAt: now,
				lastAttemptAt: now,
				totalTimeSpentSeconds: timeSpentSeconds,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: [userScenarioProgress.userId, userScenarioProgress.scenarioId],
				set: {
					timesCompleted: sql`${userScenarioProgress.timesCompleted} + 1`,
					timesAttempted: sql`${userScenarioProgress.timesAttempted} + 1`,
					lastCompletedAt: now,
					lastAttemptAt: now,
					totalTimeSpentSeconds: sql`${userScenarioProgress.totalTimeSpentSeconds} + ${timeSpentSeconds}`,
					updatedAt: now
				}
			})
			.returning();

		return result;
	},

	async rateScenario(
		userId: string,
		scenarioId: string,
		rating: number // 1-5 stars
	): Promise<UserScenarioProgress | undefined> {
		if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
			throw new Error('Rating must be an integer between 1 and 5');
		}

		const [updated] = await db
			.insert(userScenarioProgress)
			.values({
				userId,
				scenarioId,
				userRating: rating,
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: [userScenarioProgress.userId, userScenarioProgress.scenarioId],
				set: {
					userRating: rating,
					updatedAt: new Date()
				}
			})
			.returning();

		return updated;
	},

	async addNotes(
		userId: string,
		scenarioId: string,
		notes: string
	): Promise<UserScenarioProgress | undefined> {
		const [updated] = await db
			.insert(userScenarioProgress)
			.values({
				userId,
				scenarioId,
				userNotes: notes,
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: [userScenarioProgress.userId, userScenarioProgress.scenarioId],
				set: {
					userNotes: notes,
					updatedAt: new Date()
				}
			})
			.returning();

		return updated;
	},

	async updateScenarioProgress(
		userId: string,
		scenarioId: string,
		data: Partial<NewUserScenarioProgress>
	): Promise<UserScenarioProgress | undefined> {
		const [updated] = await db
			.update(userScenarioProgress)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(userScenarioProgress.userId, userId),
					eq(userScenarioProgress.scenarioId, scenarioId)
				)
			)
			.returning();

		return updated;
	},

	// DELETE
	async deleteUserScenarioProgress(
		userId: string,
		scenarioId: string
	): Promise<{ success: boolean }> {
		const result = await db
			.delete(userScenarioProgress)
			.where(
				and(
					eq(userScenarioProgress.userId, userId),
					eq(userScenarioProgress.scenarioId, scenarioId)
				)
			)
			.returning({ userId: userScenarioProgress.userId });

		return { success: result.length > 0 };
	},

	async deleteAllUserScenarioProgress(userId: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(userScenarioProgress)
			.where(eq(userScenarioProgress.userId, userId))
			.returning({ userId: userScenarioProgress.userId });

		return { success: result.length > 0 };
	}
};
