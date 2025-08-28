import { eq, and, desc } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { userPreferences } from '$lib/server/db/schema';
import type { NewUserPreferences, UserPreferences } from '$lib/server/db/types';
import type { challengePreferenceEnum, learningMotivationEnum } from '../db/schema/userPreferences';

export class UserPreferencesRepository {
	/**
	 * Create user preferences
	 */
	async createPreferences(preferences: NewUserPreferences): Promise<UserPreferences> {
		const [created] = await db.insert(userPreferences).values(preferences).returning();
		return created;
	}

	/**
	 * Get user preferences by user ID
	 */
	async getPreferencesByUserId(userId: string): Promise<UserPreferences | null> {
		const result = await db
			.select()
			.from(userPreferences)
			.where(eq(userPreferences.userId, userId))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Get user preferences by user ID and target language
	 */
	async getPreferencesByUserAndLanguage(
		userId: string,
		targetLanguageId: string
	): Promise<UserPreferences | null> {
		const result = await db
			.select()
			.from(userPreferences)
			.where(
				and(
					eq(userPreferences.userId, userId),
					eq(userPreferences.targetLanguageId, targetLanguageId)
				)
			)
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Get all preferences for a user
	 */
	async getAllUserPreferences(userId: string): Promise<UserPreferences[]> {
		return await db
			.select()
			.from(userPreferences)
			.where(eq(userPreferences.userId, userId))
			.orderBy(desc(userPreferences.updatedAt));
	}

	/**
	 * Update user preferences
	 */
	async updatePreferences(
		userId: string,
		updates: Partial<NewUserPreferences>
	): Promise<UserPreferences | null> {
		const [updated] = await db
			.update(userPreferences)
			.set({
				...updates,
				updatedAt: new Date()
			})
			.where(eq(userPreferences.userId, userId))
			.returning();

		return updated || null;
	}

	/**
	 * Upsert user preferences (create if doesn't exist, update if it does)
	 */
	async upsertPreferences(preferences: NewUserPreferences): Promise<UserPreferences> {
		const existing = await this.getPreferencesByUserId(preferences.userId);

		if (existing) {
			// Update existing
			const [updated] = await db
				.update(userPreferences)
				.set({
					...preferences,
					updatedAt: new Date()
				})
				.where(eq(userPreferences.userId, preferences.userId))
				.returning();

			return updated;
		} else {
			// Create new
			return await this.createPreferences(preferences);
		}
	}

	/**
	 * Delete user preferences
	 */
	async deleteUserPreferences(userId: string): Promise<boolean> {
		const result = await db
			.delete(userPreferences)
			.where(eq(userPreferences.userId, userId))
			.returning({ id: userPreferences.id });

		return result.length > 0;
	}

	/**
	 * Get users by learning goal
	 */
	async getUsersByLearningGoal(
		learningGoal: (typeof learningMotivationEnum.enumValues)[number]
	): Promise<string[]> {
		const result = await db
			.select({ userId: userPreferences.userId })
			.from(userPreferences)
			.where(eq(userPreferences.learningGoal, learningGoal));

		return result.map((row) => row.userId);
	}

	/**
	 * Get users by challenge preference
	 */
	async getUsersByChallengePreference(
		challengePreference: (typeof challengePreferenceEnum.enumValues)[number]
	): Promise<string[]> {
		const result = await db
			.select({ userId: userPreferences.userId })
			.from(userPreferences)
			.where(eq(userPreferences.challengePreference, challengePreference));

		return result.map((row) => row.userId);
	}
}

// Export singleton instance
export const userPreferencesRepository = new UserPreferencesRepository();
