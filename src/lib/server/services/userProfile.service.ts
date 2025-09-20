import { userPreferencesRepository } from '../repositories/userPreferences.repository';
import { userSettingsRepository } from '../repositories/userSettings.repository';
import type { UserSettings } from '$lib/server/db/types';

/**
 * User Profile Service
 * Coordinates between userPreferences (language-specific) and userSettings (global)
 * Provides a unified interface for managing all user data
 */
export class UserProfileService {
	/**
	 * Get complete user profile (preferences + settings)
	 */
	async getUserProfile(userId: string, languageId?: string) {
		const [preferences, settings] = await Promise.all([
			languageId
				? userPreferencesRepository.getPreferencesByUserAndLanguage(userId, languageId)
				: userPreferencesRepository.getPreferencesByUserId(userId),
			userSettingsRepository.getSettingsByUserId(userId)
		]);

		return {
			preferences,
			settings,
			languages: languageId
				? [languageId]
				: await userPreferencesRepository.getUserLanguages(userId)
		};
	}

	/**
	 * Get or create user settings with sensible defaults
	 */
	async getOrCreateUserSettings(userId: string): Promise<UserSettings> {
		let settings = await userSettingsRepository.getSettingsByUserId(userId);

		if (!settings) {
			settings = await userSettingsRepository.upsertSettings({
				userId,
				receiveMarketingEmails: true,
				receiveDailyReminderEmails: true,
				dailyReminderSentCount: 0,
				theme: 'system',
				notificationsEnabled: true
			});
		}

		return settings;
	}

	/**
	 * Get audio settings (with defaults if user settings don't exist)
	 */
	async getAudioSettings(userId: string) {
		const settings = await this.getOrCreateUserSettings(userId);
		return (
			settings.audioSettings || {
				mode: 'toggle' as const,
				pressBehavior: 'tap_toggle' as const,
				autoGreet: true,
				greetingMode: 'scenario' as const
			}
		);
	}

	/**
	 * Update audio settings
	 */
	async updateAudioSettings(
		userId: string,
		audioSettings: {
			mode?: 'toggle' | 'push_to_talk';
			pressBehavior?: 'tap_toggle' | 'press_hold';
			autoGreet?: boolean;
			greetingMode?: 'scenario' | 'generic';
		}
	) {
		return await userSettingsRepository.updateAudioSettings(userId, audioSettings);
	}

	/**
	 * Get email preferences
	 */
	async getEmailPreferences(userId: string) {
		const settings = await this.getOrCreateUserSettings(userId);
		return {
			receiveMarketingEmails: settings.receiveMarketingEmails,
			receiveDailyReminderEmails: settings.receiveDailyReminderEmails,
			dailyReminderSentCount: settings.dailyReminderSentCount,
			lastReminderSentAt: settings.lastReminderSentAt
		};
	}

	/**
	 * Update email preferences
	 */
	async updateEmailPreferences(
		userId: string,
		emailPreferences: {
			receiveMarketingEmails?: boolean;
			receiveDailyReminderEmails?: boolean;
		}
	) {
		return await userSettingsRepository.updateEmailPreferences(userId, emailPreferences);
	}

	/**
	 * Get user's preferred language (most recent)
	 */
	async getPreferredLanguage(userId: string): Promise<string | null> {
		return await userPreferencesRepository.getUserPreferredLanguage(userId);
	}

	/**
	 * Get all user languages
	 */
	async getUserLanguages(userId: string): Promise<string[]> {
		return await userPreferencesRepository.getUserLanguages(userId);
	}

	/**
	 * Check if user has completed onboarding for a language
	 */
	async hasCompletedOnboarding(userId: string, languageId: string): Promise<boolean> {
		return await userPreferencesRepository.hasPreferencesForLanguage(userId, languageId);
	}
}

// Export singleton instance
export const userProfileService = new UserProfileService();
