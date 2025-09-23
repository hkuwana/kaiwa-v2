import { eq, and, desc, asc, sql, count, gte, lte } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { scenarioAttempts } from '$lib/server/db/schema';
import type { NewScenarioAttempt, ScenarioAttempt } from '$lib/server/db/types';

export class ScenarioAttemptsRepository {
	/**
	 * Create a new scenario attempt
	 */
	async createScenarioAttempt(attempt: NewScenarioAttempt): Promise<ScenarioAttempt> {
		const [created] = await db.insert(scenarioAttempts).values(attempt).returning();
		return created;
	}

	/**
	 * Get a scenario attempt by ID
	 */
	async getScenarioAttemptById(id: string): Promise<ScenarioAttempt | null> {
		const result = await db
			.select()
			.from(scenarioAttempts)
			.where(eq(scenarioAttempts.id, id))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * Get all scenario attempts for a user
	 */
	async getScenarioAttemptsByUserId(userId: string): Promise<ScenarioAttempt[]> {
		return await db
			.select()
			.from(scenarioAttempts)
			.where(eq(scenarioAttempts.userId, userId))
			.orderBy(desc(scenarioAttempts.createdAt));
	}

	/**
	 * Get scenario attempts for a specific scenario
	 */
	async getScenarioAttemptsByScenarioId(scenarioId: string): Promise<ScenarioAttempt[]> {
		return await db
			.select()
			.from(scenarioAttempts)
			.where(eq(scenarioAttempts.scenarioId, scenarioId))
			.orderBy(desc(scenarioAttempts.createdAt));
	}

	/**
	 * Get scenario attempts for a user and scenario
	 */
	async getScenarioAttemptsByUserAndScenario(
		userId: string,
		scenarioId: string
	): Promise<ScenarioAttempt[]> {
		return await db
			.select()
			.from(scenarioAttempts)
			.where(and(eq(scenarioAttempts.userId, userId), eq(scenarioAttempts.scenarioId, scenarioId)))
			.orderBy(asc(scenarioAttempts.attemptNumber));
	}

	/**
	 * Get the latest attempt for a user and scenario
	 */
	async getLatestScenarioAttempt(
		userId: string,
		scenarioId: string
	): Promise<ScenarioAttempt | null> {
		const result = await db
			.select()
			.from(scenarioAttempts)
			.where(and(eq(scenarioAttempts.userId, userId), eq(scenarioAttempts.scenarioId, scenarioId)))
			.orderBy(desc(scenarioAttempts.attemptNumber))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * Get completed scenario attempts for a user
	 */
	async getCompletedScenarioAttemptsByUserId(userId: string): Promise<ScenarioAttempt[]> {
		return await db
			.select()
			.from(scenarioAttempts)
			.where(
				and(eq(scenarioAttempts.userId, userId), sql`${scenarioAttempts.completedAt} IS NOT NULL`)
			)
			.orderBy(desc(scenarioAttempts.completedAt));
	}

	/**
	 * Get incomplete scenario attempts for a user
	 */
	async getIncompleteScenarioAttemptsByUserId(userId: string): Promise<ScenarioAttempt[]> {
		return await db
			.select()
			.from(scenarioAttempts)
			.where(and(eq(scenarioAttempts.userId, userId), sql`${scenarioAttempts.completedAt} IS NULL`))
			.orderBy(desc(scenarioAttempts.startedAt));
	}

	/**
	 * Get scenario attempts within a date range
	 */
	async getScenarioAttemptsInDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<ScenarioAttempt[]> {
		return await db
			.select()
			.from(scenarioAttempts)
			.where(
				and(
					eq(scenarioAttempts.userId, userId),
					gte(scenarioAttempts.startedAt, startDate),
					lte(scenarioAttempts.startedAt, endDate)
				)
			)
			.orderBy(desc(scenarioAttempts.startedAt));
	}

	/**
	 * Get scenario attempts by attempt number
	 */
	async getScenarioAttemptsByAttemptNumber(
		userId: string,
		scenarioId: string,
		attemptNumber: number
	): Promise<ScenarioAttempt[]> {
		return await db
			.select()
			.from(scenarioAttempts)
			.where(
				and(
					eq(scenarioAttempts.userId, userId),
					eq(scenarioAttempts.scenarioId, scenarioId),
					eq(scenarioAttempts.attemptNumber, attemptNumber)
				)
			)
			.orderBy(desc(scenarioAttempts.startedAt));
	}

	/**
	 * Get scenario attempts with high hint usage
	 */
	async getScenarioAttemptsWithHighHintUsage(
		userId: string,
		minHints: number = 5
	): Promise<ScenarioAttempt[]> {
		return await db
			.select()
			.from(scenarioAttempts)
			.where(
				and(eq(scenarioAttempts.userId, userId), sql`${scenarioAttempts.hintsUsed} >= ${minHints}`)
			)
			.orderBy(desc(scenarioAttempts.hintsUsed));
	}

	/**
	 * Get scenario attempts with high translation usage
	 */
	async getScenarioAttemptsWithHighTranslationUsage(
		userId: string,
		minTranslations: number = 5
	): Promise<ScenarioAttempt[]> {
		return await db
			.select()
			.from(scenarioAttempts)
			.where(
				and(
					eq(scenarioAttempts.userId, userId),
					sql`${scenarioAttempts.translationsUsed} >= ${minTranslations}`
				)
			)
			.orderBy(desc(scenarioAttempts.translationsUsed));
	}

	/**
	 * Get scenario attempts by time spent range
	 */
	async getScenarioAttemptsByTimeSpent(
		userId: string,
		minSeconds: number,
		maxSeconds: number
	): Promise<ScenarioAttempt[]> {
		return await db
			.select()
			.from(scenarioAttempts)
			.where(
				and(
					eq(scenarioAttempts.userId, userId),
					sql`${scenarioAttempts.timeSpentSeconds} >= ${minSeconds}`,
					sql`${scenarioAttempts.timeSpentSeconds} <= ${maxSeconds}`
				)
			)
			.orderBy(desc(scenarioAttempts.timeSpentSeconds));
	}

	/**
	 * Update a scenario attempt
	 */
	async updateScenarioAttempt(
		id: string,
		updates: Partial<NewScenarioAttempt>
	): Promise<ScenarioAttempt | null> {
		const [updated] = await db
			.update(scenarioAttempts)
			.set(updates)
			.where(eq(scenarioAttempts.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * Mark a scenario attempt as completed
	 */
	async markScenarioAttemptCompleted(
		id: string,
		completedSteps: string[],
		timeSpentSeconds: number
	): Promise<ScenarioAttempt | null> {
		const [updated] = await db
			.update(scenarioAttempts)
			.set({
				completedAt: new Date(),
				completedSteps,
				timeSpentSeconds
			})
			.where(eq(scenarioAttempts.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * Mark a scenario attempt as abandoned
	 */
	async markScenarioAttemptAbandoned(
		id: string,
		abandonedAt: string,
		timeSpentSeconds: number
	): Promise<ScenarioAttempt | null> {
		const [updated] = await db
			.update(scenarioAttempts)
			.set({
				abandonedAt,
				timeSpentSeconds
			})
			.where(eq(scenarioAttempts.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * Increment hint usage for a scenario attempt
	 */
	async incrementHintUsage(id: string): Promise<ScenarioAttempt | null> {
		const [updated] = await db
			.update(scenarioAttempts)
			.set({
				hintsUsed: sql`${scenarioAttempts.hintsUsed} + 1`
			})
			.where(eq(scenarioAttempts.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * Increment translation usage for a scenario attempt
	 */
	async incrementTranslationUsage(id: string): Promise<ScenarioAttempt | null> {
		const [updated] = await db
			.update(scenarioAttempts)
			.set({
				translationsUsed: sql`${scenarioAttempts.translationsUsed} + 1`
			})
			.where(eq(scenarioAttempts.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * Delete a scenario attempt
	 */
	async deleteScenarioAttempt(id: string): Promise<boolean> {
		const result = await db
			.delete(scenarioAttempts)
			.where(eq(scenarioAttempts.id, id))
			.returning({ id: scenarioAttempts.id });
		return result.length > 0;
	}

	/**
	 * Get scenario attempt count for a user
	 */
	async getScenarioAttemptCountByUserId(userId: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(scenarioAttempts)
			.where(eq(scenarioAttempts.userId, userId));
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get completed scenario attempt count for a user
	 */
	async getCompletedScenarioAttemptCountByUserId(userId: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(scenarioAttempts)
			.where(
				and(eq(scenarioAttempts.userId, userId), sql`${scenarioAttempts.completedAt} IS NOT NULL`)
			);
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get scenario attempt statistics for a user
	 */
	async getUserScenarioAttemptStatistics(userId: string): Promise<{
		totalAttempts: number;
		completedAttempts: number;
		abandonedAttempts: number;
		averageTimeSpent: number;
		totalHintsUsed: number;
		totalTranslationsUsed: number;
	}> {
		const result = await db
			.select({
				totalAttempts: count(),
				completedAttempts: sql<number>`COUNT(CASE WHEN ${scenarioAttempts.completedAt} IS NOT NULL THEN 1 END)`,
				abandonedAttempts: sql<number>`COUNT(CASE WHEN ${scenarioAttempts.abandonedAt} IS NOT NULL THEN 1 END)`,
				averageTimeSpent: sql<number>`AVG(${scenarioAttempts.timeSpentSeconds})`,
				totalHintsUsed: sql<number>`SUM(${scenarioAttempts.hintsUsed})`,
				totalTranslationsUsed: sql<number>`SUM(${scenarioAttempts.translationsUsed})`
			})
			.from(scenarioAttempts)
			.where(eq(scenarioAttempts.userId, userId));

		const row = result[0];
		return {
			totalAttempts: Number(row?.totalAttempts) || 0,
			completedAttempts: Number(row?.completedAttempts) || 0,
			abandonedAttempts: Number(row?.abandonedAttempts) || 0,
			averageTimeSpent: Number(row?.averageTimeSpent) || 0,
			totalHintsUsed: Number(row?.totalHintsUsed) || 0,
			totalTranslationsUsed: Number(row?.totalTranslationsUsed) || 0
		};
	}

	/**
	 * Get scenario attempt statistics for a scenario
	 */
	async getScenarioAttemptStatistics(scenarioId: string): Promise<{
		totalAttempts: number;
		completedAttempts: number;
		abandonedAttempts: number;
		averageAttemptsPerUser: number;
		averageTimeSpent: number;
	}> {
		const result = await db
			.select({
				totalAttempts: count(),
				completedAttempts: sql<number>`COUNT(CASE WHEN ${scenarioAttempts.completedAt} IS NOT NULL THEN 1 END)`,
				abandonedAttempts: sql<number>`COUNT(CASE WHEN ${scenarioAttempts.abandonedAt} IS NOT NULL THEN 1 END)`,
				uniqueUsers: sql<number>`COUNT(DISTINCT ${scenarioAttempts.userId})`,
				averageTimeSpent: sql<number>`AVG(${scenarioAttempts.timeSpentSeconds})`
			})
			.from(scenarioAttempts)
			.where(eq(scenarioAttempts.scenarioId, scenarioId));

		const row = result[0];
		const uniqueUsers = Number(row?.uniqueUsers) || 0;
		return {
			totalAttempts: Number(row?.totalAttempts) || 0,
			completedAttempts: Number(row?.completedAttempts) || 0,
			abandonedAttempts: Number(row?.abandonedAttempts) || 0,
			averageAttemptsPerUser: uniqueUsers > 0 ? Number(row?.totalAttempts) / uniqueUsers : 0,
			averageTimeSpent: Number(row?.averageTimeSpent) || 0
		};
	}
}

// Export singleton instance
export const scenarioAttemptsRepository = new ScenarioAttemptsRepository();
