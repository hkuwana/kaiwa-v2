import { eq, and, desc } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { userPreferences } from '$lib/server/db/schema';
import type { NewUserPreferences, UserPreferences } from '$lib/server/db/types';
import type { challengePreferenceEnum, learningMotivationEnum } from '../db/schema/userPreferences';

function cleanUpdate<T extends Record<string, unknown>>(data: T, omit: (keyof T)[] = []) {
	return Object.fromEntries(
		Object.entries(data).filter(([key, value]) => !omit.includes(key as keyof T) && value !== undefined)
	) as Partial<T>;
}

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
			.set(
				cleanUpdate(
					{
						...updates,
						updatedAt: new Date()
					},
					['id', 'userId', 'targetLanguageId']
				)
			)
			.where(eq(userPreferences.userId, userId))
			.returning();

		return updated || null;
	}

	/**
	 * Upsert user preferences for specific language (create if doesn't exist, update if it does)
	 */
	async upsertPreferencesForLanguage(preferences: NewUserPreferences): Promise<UserPreferences> {
		const [result] = await db
			.insert(userPreferences)
			.values(preferences)
			.onConflictDoUpdate({
				target: [userPreferences.userId, userPreferences.targetLanguageId],
				set: cleanUpdate(
					{
						...preferences,
						updatedAt: new Date()
					},
					['id', 'userId', 'targetLanguageId']
				)
			})
			.returning();

		return result;
	}

	/**
	 * Update user preferences for specific language
	 */
	async updatePreferencesForLanguage(
		userId: string,
		targetLanguageId: string,
		updates: Partial<NewUserPreferences>
	): Promise<UserPreferences | null> {
		const [updated] = await db
			.update(userPreferences)
			.set(
				cleanUpdate(
					{
						...updates,
						updatedAt: new Date()
					},
					['id', 'userId', 'targetLanguageId']
				)
			)
			.where(
				and(
					eq(userPreferences.userId, userId),
					eq(userPreferences.targetLanguageId, targetLanguageId)
				)
			)
			.returning();

		return updated || null;
	}

	/**
	 * Get user's preferred/default language (most recently updated preference)
	 */
	async getUserPreferredLanguage(userId: string): Promise<string | null> {
		const result = await db
			.select({ targetLanguageId: userPreferences.targetLanguageId })
			.from(userPreferences)
			.where(eq(userPreferences.userId, userId))
			.orderBy(desc(userPreferences.updatedAt))
			.limit(1);

		return result[0]?.targetLanguageId || null;
	}

	/**
	 * Check if user has preferences for specific language
	 */
	async hasPreferencesForLanguage(userId: string, targetLanguageId: string): Promise<boolean> {
		const result = await this.getPreferencesByUserAndLanguage(userId, targetLanguageId);
		return result !== null;
	}

	/**
	 * Get user languages (all languages user has preferences for)
	 */
	async getUserLanguages(userId: string): Promise<string[]> {
		const result = await db
			.select({ targetLanguageId: userPreferences.targetLanguageId })
			.from(userPreferences)
			.where(eq(userPreferences.userId, userId))
			.orderBy(desc(userPreferences.updatedAt));

		return result.map((row) => row.targetLanguageId);
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

	// Note: Email marketing methods moved to userSettingsRepository
}

// Export singleton instance
export const userPreferencesRepository = new UserPreferencesRepository();
