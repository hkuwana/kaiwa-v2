// src/lib/server/repositories/scenario-metadata.repository.ts

import { db } from '$lib/server/db/index';
import { scenarioMetadata } from '$lib/server/db/schema';
import type { ScenarioMetadata } from '$lib/server/db/types';
import { eq, sql } from 'drizzle-orm';

/**
 * Repository for managing scenario metadata (app-wide aggregate metrics)
 *
 * This repository handles:
 * - Initializing metadata for new scenarios
 * - Updating engagement metrics (saves, completions, attempts)
 * - Updating quality metrics (ratings, completion rate)
 * - Computing derived metrics (completion rate, average time spent)
 */
export const scenarioMetadataRepository = {
	// CREATE / INITIALIZE
	/**
	 * Initialize metadata for a new scenario
	 * Should be called whenever a new scenario is created
	 */
	async initializeMetadata(scenarioId: string): Promise<ScenarioMetadata> {
		const now = new Date();
		const [created] = await db
			.insert(scenarioMetadata)
			.values({
				scenarioId,
				amountSavedCount: 0,
				totalTimesUsed: 0,
				totalAttempts: 0,
				ratingsCount: 0,
				averageRating: null,
				completionRate: null,
				averageTimeSpent: null,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoNothing()
			.returning();

		if (created) {
			return created;
		}

		// If already exists, return it
		const existing = await this.getMetadata(scenarioId);
		if (!existing) {
			throw new Error(`Failed to initialize metadata for scenario ${scenarioId}`);
		}
		return existing;
	},

	// READ
	/**
	 * Get metadata for a specific scenario
	 */
	async getMetadata(scenarioId: string): Promise<ScenarioMetadata | undefined> {
		return db.query.scenarioMetadata.findFirst({
			where: eq(scenarioMetadata.scenarioId, scenarioId)
		});
	},

	// UPDATE - Engagement Metrics
	/**
	 * Increment the save count when a user saves a scenario
	 */
	async incrementSaveCount(scenarioId: string): Promise<ScenarioMetadata | undefined> {
		const [result] = await db
			.update(scenarioMetadata)
			.set({
				amountSavedCount: sql`${scenarioMetadata.amountSavedCount} + 1`,
				updatedAt: new Date()
			})
			.where(eq(scenarioMetadata.scenarioId, scenarioId))
			.returning();

		return result;
	},

	/**
	 * Decrement the save count when a user unsaves a scenario
	 */
	async decrementSaveCount(scenarioId: string): Promise<ScenarioMetadata | undefined> {
		const [result] = await db
			.update(scenarioMetadata)
			.set({
				amountSavedCount: sql`GREATEST(${scenarioMetadata.amountSavedCount} - 1, 0)`,
				updatedAt: new Date()
			})
			.where(eq(scenarioMetadata.scenarioId, scenarioId))
			.returning();

		return result;
	},

	/**
	 * Increment total attempts when a user attempts a scenario
	 */
	async incrementAttemptCount(scenarioId: string): Promise<ScenarioMetadata | undefined> {
		const [result] = await db
			.update(scenarioMetadata)
			.set({
				totalAttempts: sql`${scenarioMetadata.totalAttempts} + 1`,
				updatedAt: new Date()
			})
			.where(eq(scenarioMetadata.scenarioId, scenarioId))
			.returning();

		return result;
	},

	/**
	 * Increment total completions and update completion rate
	 */
	async incrementCompletionCount(scenarioId: string): Promise<ScenarioMetadata | undefined> {
		const metadata = await this.getMetadata(scenarioId);
		if (!metadata) {
			return undefined;
		}

		const newCompletions = (metadata.totalTimesUsed || 0) + 1;
		const newAttempts = metadata.totalAttempts || 0;
		const newCompletionRate =
			newAttempts > 0 ? (newCompletions / newAttempts) * 100 : 0;

		const [result] = await db
			.update(scenarioMetadata)
			.set({
				totalTimesUsed: sql`${scenarioMetadata.totalTimesUsed} + 1`,
				completionRate: newCompletionRate,
				updatedAt: new Date()
			})
			.where(eq(scenarioMetadata.scenarioId, scenarioId))
			.returning();

		return result;
	},

	// UPDATE - Quality Metrics
	/**
	 * Record a new rating for a scenario (user rating for the first time)
	 * Recalculates the average rating based on the new rating
	 */
	async recordRating(
		scenarioId: string,
		newRating: number
	): Promise<ScenarioMetadata | undefined> {
		const metadata = await this.getMetadata(scenarioId);
		if (!metadata) {
			return undefined;
		}

		const oldRating = metadata.averageRating || 0;
		const oldCount = metadata.ratingsCount || 0;
		const newCount = oldCount + 1;

		// Calculate new average rating
		const newAverageRating = (oldRating * oldCount + newRating) / newCount;

		const [result] = await db
			.update(scenarioMetadata)
			.set({
				averageRating: newAverageRating,
				ratingsCount: newCount,
				updatedAt: new Date()
			})
			.where(eq(scenarioMetadata.scenarioId, scenarioId))
			.returning();

		return result;
	},

	/**
	 * Update an existing rating (user changing their rating)
	 * Recalculates the average rating by removing old rating and adding new rating
	 */
	async updateRating(
		scenarioId: string,
		oldRating: number,
		newRating: number
	): Promise<ScenarioMetadata | undefined> {
		const metadata = await this.getMetadata(scenarioId);
		if (!metadata) {
			return undefined;
		}

		const currentAverage = metadata.averageRating || 0;
		const count = metadata.ratingsCount || 1;

		// Remove old rating contribution and add new rating
		const newAverageRating = count > 0 ? (currentAverage * count - oldRating + newRating) / count : newRating;

		const [result] = await db
			.update(scenarioMetadata)
			.set({
				averageRating: newAverageRating,
				updatedAt: new Date()
			})
			.where(eq(scenarioMetadata.scenarioId, scenarioId))
			.returning();

		return result;
	},

	/**
	 * Update time spent metrics
	 * NOTE: This is a simplified implementation. For production, consider using
	 * a more sophisticated approach like exponential moving average or bucketing.
	 */
	async recordTimeSpent(
		scenarioId: string,
		timeSpentSeconds: number
	): Promise<ScenarioMetadata | undefined> {
		const metadata = await this.getMetadata(scenarioId);
		if (!metadata) {
			return undefined;
		}

		const oldAverage = metadata.averageTimeSpent || 0;
		const oldCount = metadata.totalAttempts || 0;
		const newCount = Math.max(oldCount, 1); // Avoid division by zero

		// Calculate new average time spent
		const newAverageTimeSpent = (oldAverage * (newCount - 1) + timeSpentSeconds) / newCount;

		const [result] = await db
			.update(scenarioMetadata)
			.set({
				averageTimeSpent: Math.round(newAverageTimeSpent),
				updatedAt: new Date()
			})
			.where(eq(scenarioMetadata.scenarioId, scenarioId))
			.returning();

		return result;
	}
};
