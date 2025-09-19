import { eq, and, desc, sql, count, gte, lte } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { scenarioOutcomes } from '$lib/server/db/schema';
import type { NewScenarioOutcome, ScenarioOutcome } from '$lib/server/db/types';

export class ScenarioOutcomesRepository {
	/**
	 * Create a new scenario outcome
	 */
	async createScenarioOutcome(outcome: NewScenarioOutcome): Promise<ScenarioOutcome> {
		const [created] = await db.insert(scenarioOutcomes).values(outcome).returning();
		return created;
	}

	/**
	 * Get a scenario outcome by ID
	 */
	async getScenarioOutcomeById(id: string): Promise<ScenarioOutcome | null> {
		const result = await db
			.select()
			.from(scenarioOutcomes)
			.where(eq(scenarioOutcomes.id, id))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * Get all scenario outcomes for a user
	 */
	async getScenarioOutcomesByUserId(userId: string): Promise<ScenarioOutcome[]> {
		return await db
			.select()
			.from(scenarioOutcomes)
			.where(eq(scenarioOutcomes.userId, userId))
			.orderBy(desc(scenarioOutcomes.createdAt));
	}

	/**
	 * Get scenario outcomes for a specific scenario
	 */
	async getScenarioOutcomesByScenarioId(scenarioId: string): Promise<ScenarioOutcome[]> {
		return await db
			.select()
			.from(scenarioOutcomes)
			.where(eq(scenarioOutcomes.scenarioId, scenarioId))
			.orderBy(desc(scenarioOutcomes.createdAt));
	}

	/**
	 * Get scenario outcomes for a user and scenario
	 */
	async getScenarioOutcomesByUserAndScenario(
		userId: string,
		scenarioId: string
	): Promise<ScenarioOutcome[]> {
		return await db
			.select()
			.from(scenarioOutcomes)
			.where(and(eq(scenarioOutcomes.userId, userId), eq(scenarioOutcomes.scenarioId, scenarioId)))
			.orderBy(desc(scenarioOutcomes.createdAt));
	}

	/**
	 * Get scenario outcomes for a conversation
	 */
	async getScenarioOutcomesByConversationId(conversationId: string): Promise<ScenarioOutcome[]> {
		return await db
			.select()
			.from(scenarioOutcomes)
			.where(eq(scenarioOutcomes.conversationId, conversationId))
			.orderBy(desc(scenarioOutcomes.createdAt));
	}

	/**
	 * Get successful scenario outcomes for a user
	 */
	async getSuccessfulScenarioOutcomesByUserId(userId: string): Promise<ScenarioOutcome[]> {
		return await db
			.select()
			.from(scenarioOutcomes)
			.where(and(eq(scenarioOutcomes.userId, userId), eq(scenarioOutcomes.wasGoalAchieved, true)))
			.orderBy(desc(scenarioOutcomes.createdAt));
	}

	/**
	 * Get scenario outcomes within a date range
	 */
	async getScenarioOutcomesInDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<ScenarioOutcome[]> {
		return await db
			.select()
			.from(scenarioOutcomes)
			.where(
				and(
					eq(scenarioOutcomes.userId, userId),
					gte(scenarioOutcomes.createdAt, startDate),
					lte(scenarioOutcomes.createdAt, endDate)
				)
			)
			.orderBy(desc(scenarioOutcomes.createdAt));
	}

	/**
	 * Get scenario outcomes with high scores
	 */
	async getHighScoreScenarioOutcomes(
		userId: string,
		minScore: number = 0.8
	): Promise<ScenarioOutcome[]> {
		return await db
			.select()
			.from(scenarioOutcomes)
			.where(
				and(
					eq(scenarioOutcomes.userId, userId),
					sql`${scenarioOutcomes.goalCompletionScore} >= ${minScore}`
				)
			)
			.orderBy(desc(scenarioOutcomes.goalCompletionScore));
	}

	/**
	 * Get scenario outcomes by grammar score range
	 */
	async getScenarioOutcomesByGrammarScore(
		userId: string,
		minScore: number,
		maxScore: number
	): Promise<ScenarioOutcome[]> {
		return await db
			.select()
			.from(scenarioOutcomes)
			.where(
				and(
					eq(scenarioOutcomes.userId, userId),
					sql`${scenarioOutcomes.grammarUsageScore} >= ${minScore}`,
					sql`${scenarioOutcomes.grammarUsageScore} <= ${maxScore}`
				)
			)
			.orderBy(desc(scenarioOutcomes.grammarUsageScore));
	}

	/**
	 * Get scenario outcomes by vocabulary score range
	 */
	async getScenarioOutcomesByVocabularyScore(
		userId: string,
		minScore: number,
		maxScore: number
	): Promise<ScenarioOutcome[]> {
		return await db
			.select()
			.from(scenarioOutcomes)
			.where(
				and(
					eq(scenarioOutcomes.userId, userId),
					sql`${scenarioOutcomes.vocabularyUsageScore} >= ${minScore}`,
					sql`${scenarioOutcomes.vocabularyUsageScore} <= ${maxScore}`
				)
			)
			.orderBy(desc(scenarioOutcomes.vocabularyUsageScore));
	}

	/**
	 * Get scenario outcomes by pronunciation score range
	 */
	async getScenarioOutcomesByPronunciationScore(
		userId: string,
		minScore: number,
		maxScore: number
	): Promise<ScenarioOutcome[]> {
		return await db
			.select()
			.from(scenarioOutcomes)
			.where(
				and(
					eq(scenarioOutcomes.userId, userId),
					sql`${scenarioOutcomes.pronunciationScore} >= ${minScore}`,
					sql`${scenarioOutcomes.pronunciationScore} <= ${maxScore}`
				)
			)
			.orderBy(desc(scenarioOutcomes.pronunciationScore));
	}

	/**
	 * Update a scenario outcome
	 */
	async updateScenarioOutcome(
		id: string,
		updates: Partial<NewScenarioOutcome>
	): Promise<ScenarioOutcome | null> {
		const [updated] = await db
			.update(scenarioOutcomes)
			.set(updates)
			.where(eq(scenarioOutcomes.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * Delete a scenario outcome
	 */
	async deleteScenarioOutcome(id: string): Promise<boolean> {
		const result = await db
			.delete(scenarioOutcomes)
			.where(eq(scenarioOutcomes.id, id))
			.returning({ id: scenarioOutcomes.id });
		return result.length > 0;
	}

	/**
	 * Get scenario outcome count for a user
	 */
	async getScenarioOutcomeCountByUserId(userId: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(scenarioOutcomes)
			.where(eq(scenarioOutcomes.userId, userId));
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get successful scenario outcome count for a user
	 */
	async getSuccessfulScenarioOutcomeCountByUserId(userId: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(scenarioOutcomes)
			.where(and(eq(scenarioOutcomes.userId, userId), eq(scenarioOutcomes.wasGoalAchieved, true)));
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get average scores for a user
	 */
	async getUserAverageScores(userId: string): Promise<{
		goalCompletion: number;
		grammar: number;
		vocabulary: number;
		pronunciation: number;
	}> {
		const result = await db
			.select({
				avgGoalCompletion: sql<number>`AVG(${scenarioOutcomes.goalCompletionScore})`,
				avgGrammar: sql<number>`AVG(${scenarioOutcomes.grammarUsageScore})`,
				avgVocabulary: sql<number>`AVG(${scenarioOutcomes.vocabularyUsageScore})`,
				avgPronunciation: sql<number>`AVG(${scenarioOutcomes.pronunciationScore})`
			})
			.from(scenarioOutcomes)
			.where(eq(scenarioOutcomes.userId, userId));

		const row = result[0];
		return {
			goalCompletion: Number(row?.avgGoalCompletion) || 0,
			grammar: Number(row?.avgGrammar) || 0,
			vocabulary: Number(row?.avgVocabulary) || 0,
			pronunciation: Number(row?.avgPronunciation) || 0
		};
	}

	/**
	 * Get scenario outcome statistics for a scenario
	 */
	async getScenarioStatistics(scenarioId: string): Promise<{
		totalAttempts: number;
		successfulAttempts: number;
		averageScore: number;
		averageDuration: number;
	}> {
		const result = await db
			.select({
				totalAttempts: count(),
				successfulAttempts: sql<number>`COUNT(CASE WHEN ${scenarioOutcomes.wasGoalAchieved} = true THEN 1 END)`,
				averageScore: sql<number>`AVG(${scenarioOutcomes.goalCompletionScore})`,
				averageDuration: sql<number>`AVG(${scenarioOutcomes.durationSeconds})`
			})
			.from(scenarioOutcomes)
			.where(eq(scenarioOutcomes.scenarioId, scenarioId));

		const row = result[0];
		return {
			totalAttempts: Number(row?.totalAttempts) || 0,
			successfulAttempts: Number(row?.successfulAttempts) || 0,
			averageScore: Number(row?.averageScore) || 0,
			averageDuration: Number(row?.averageDuration) || 0
		};
	}
}

// Export singleton instance
export const scenarioOutcomesRepository = new ScenarioOutcomesRepository();
