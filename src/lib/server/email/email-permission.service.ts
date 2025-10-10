import { userRepository } from '$lib/server/repositories';
import { userSettingsRepository } from '$lib/server/repositories/user-settings.repository';

/**
 * Email Permission Service
 *
 * Central service for checking email permissions from database.
 * All email-sending services should use this to ensure database is source of truth.
 */
export class EmailPermissionService {
	/**
	 * Check if user can receive marketing/founder emails
	 * Returns false if:
	 * - User not found
	 * - User opted out of marketing emails
	 */
	static async canReceiveMarketingEmail(userId: string): Promise<boolean> {
		const user = await userRepository.findUserById(userId);
		if (!user) {
			return false;
		}

		const settings = await userSettingsRepository.getSettingsByUserId(userId);
		// Default to true if settings don't exist yet
		return settings?.receiveMarketingEmails ?? true;
	}

	/**
	 * Check if user can receive daily reminder emails
	 * Returns false if:
	 * - User not found
	 * - User opted out of daily reminders
	 */
	static async canReceiveDailyReminder(userId: string): Promise<boolean> {
		const user = await userRepository.findUserById(userId);
		if (!user) {
			return false;
		}

		const settings = await userSettingsRepository.getSettingsByUserId(userId);
		// Default to true if settings don't exist yet
		return settings?.receiveDailyReminderEmails ?? true;
	}

	/**
	 * Get all users eligible for marketing emails
	 * Returns users who have opted in to marketing emails (or haven't set preference yet)
	 */
	static async getMarketingEligibleUsers(): Promise<string[]> {
		const allUsers = await userRepository.getAllUsers();
		const eligible: string[] = [];

		for (const user of allUsers) {
			if (await this.canReceiveMarketingEmail(user.id)) {
				eligible.push(user.id);
			}
		}

		return eligible;
	}

	/**
	 * Get all users eligible for daily reminders
	 * Returns users who have opted in to daily reminders (or haven't set preference yet)
	 */
	static async getDailyReminderEligibleUsers(): Promise<string[]> {
		const allUsers = await userRepository.getAllUsers();
		const eligible: string[] = [];

		for (const user of allUsers) {
			if (await this.canReceiveDailyReminder(user.id)) {
				eligible.push(user.id);
			}
		}

		return eligible;
	}
}
