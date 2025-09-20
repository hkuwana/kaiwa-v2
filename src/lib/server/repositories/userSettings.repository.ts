import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { userSettings } from '$lib/server/db/schema';
import type { NewUserSettings, UserSettings } from '$lib/server/db/types';

export class UserSettingsRepository {
	/**
	 * Create user settings
	 */
	async createSettings(settings: NewUserSettings): Promise<UserSettings> {
		const [created] = await db.insert(userSettings).values(settings).returning();
		return created;
	}

	/**
	 * Get user settings by user ID
	 */
	async getSettingsByUserId(userId: string): Promise<UserSettings | null> {
		const result = await db
			.select()
			.from(userSettings)
			.where(eq(userSettings.userId, userId))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Update user settings
	 */
	async updateSettings(
		userId: string,
		updates: Partial<NewUserSettings>
	): Promise<UserSettings | null> {
		const [updated] = await db
			.update(userSettings)
			.set({
				...updates,
				updatedAt: new Date()
			})
			.where(eq(userSettings.userId, userId))
			.returning();

		return updated || null;
	}

	/**
	 * Upsert user settings (create if doesn't exist, update if it does)
	 */
	async upsertSettings(settings: NewUserSettings): Promise<UserSettings> {
		const existing = await this.getSettingsByUserId(settings.userId);

		if (existing) {
			// Update existing
			const [updated] = await db
				.update(userSettings)
				.set({
					...settings,
					updatedAt: new Date()
				})
				.where(eq(userSettings.userId, settings.userId))
				.returning();

			return updated;
		} else {
			// Create new with defaults
			const defaultSettings: NewUserSettings = {
				receiveMarketingEmails: true,
				receiveDailyReminderEmails: true,
				dailyReminderSentCount: 0,
				theme: 'system',
				notificationsEnabled: true,
				...settings
			};
			return await this.createSettings(defaultSettings);
		}
	}

	/**
	 * Delete user settings
	 */
	async deleteUserSettings(userId: string): Promise<boolean> {
		const result = await db
			.delete(userSettings)
			.where(eq(userSettings.userId, userId))
			.returning({ userId: userSettings.userId });

		return result.length > 0;
	}

	/**
	 * Update audio settings only
	 */
	async updateAudioSettings(
		userId: string,
		audioSettings: {
			mode?: 'toggle' | 'push_to_talk';
			pressBehavior?: 'tap_toggle' | 'press_hold';
			autoGreet?: boolean;
			greetingMode?: 'scenario' | 'generic';
		}
	): Promise<UserSettings | null> {
		return await this.updateSettings(userId, { audioSettings });
	}

	/**
	 * Update email preferences only
	 */
	async updateEmailPreferences(
		userId: string,
		emailPreferences: {
			receiveMarketingEmails?: boolean;
			receiveDailyReminderEmails?: boolean;
		}
	): Promise<UserSettings | null> {
		return await this.updateSettings(userId, emailPreferences);
	}

	/**
	 * Update theme preference only
	 */
	async updateTheme(
		userId: string,
		theme: 'light' | 'dark' | 'system'
	): Promise<UserSettings | null> {
		return await this.updateSettings(userId, { theme });
	}

	/**
	 * Increment daily reminder count
	 */
	async incrementDailyReminderCount(userId: string): Promise<UserSettings | null> {
		const current = await this.getSettingsByUserId(userId);
		if (!current) return null;

		return await this.updateSettings(userId, {
			dailyReminderSentCount: current.dailyReminderSentCount + 1,
			lastReminderSentAt: new Date()
		});
	}

	/**
	 * Reset daily reminder count (typically monthly)
	 */
	async resetDailyReminderCount(userId: string): Promise<UserSettings | null> {
		return await this.updateSettings(userId, {
			dailyReminderSentCount: 0
		});
	}

	/**
	 * Get all users who have opted in to marketing emails
	 */
	async getMarketingEmailSubscribers(): Promise<UserSettings[]> {
		return await db
			.select()
			.from(userSettings)
			.where(eq(userSettings.receiveMarketingEmails, true));
	}

	/**
	 * Get all users who have opted in to daily reminder emails
	 */
	async getDailyReminderSubscribers(): Promise<UserSettings[]> {
		return await db
			.select()
			.from(userSettings)
			.where(eq(userSettings.receiveDailyReminderEmails, true));
	}
}

// Export singleton instance
export const userSettingsRepository = new UserSettingsRepository();
