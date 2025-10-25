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
	 * Check if user can receive founder emails (Day 1-3 welcome sequence)
	 * Returns false if:
	 * - User not found
	 * - User opted out of founder emails
	 */
	static async canReceiveFounderEmails(userId: string): Promise<boolean> {
		const user = await userRepository.findUserById(userId);
		if (!user) {
			return false;
		}

		const settings = await userSettingsRepository.getSettingsByUserId(userId);
		// Default to true if settings don't exist yet
		return settings?.receiveFounderEmails ?? true;
	}

	/**
	 * Check if user can receive practice reminder emails (daily reminders to inactive users)
	 * Returns false if:
	 * - User not found
	 * - User opted out of practice reminders
	 */
	static async canReceivePracticeReminders(userId: string): Promise<boolean> {
		const user = await userRepository.findUserById(userId);
		if (!user) {
			return false;
		}

		const settings = await userSettingsRepository.getSettingsByUserId(userId);
		// Default to true if settings don't exist yet
		return settings?.receivePracticeReminders ?? true;
	}

	/**
	 * Get all users eligible for founder emails
	 * Returns users who have opted in to founder emails (or haven't set preference yet)
	 */
	static async getFounderEmailEligibleUsers(): Promise<string[]> {
		const allUsers = await userRepository.getAllUsers();
		const eligible: string[] = [];

		for (const user of allUsers) {
			if (await this.canReceiveFounderEmails(user.id)) {
				eligible.push(user.id);
			}
		}

		return eligible;
	}

	/**
	 * Check if user can receive product update emails
	 * Returns false if:
	 * - User not found
	 * - User opted out of product updates
	 */
	static async canReceiveProductUpdates(userId: string): Promise<boolean> {
		const user = await userRepository.findUserById(userId);
		if (!user) {
			return false;
		}

		const settings = await userSettingsRepository.getSettingsByUserId(userId);
		// Default to true if settings don't exist yet
		return settings?.receiveProductUpdates ?? true;
	}

	/**
	 * Check if user can receive progress report emails (weekly stats)
	 * Returns false if:
	 * - User not found
	 * - User opted out of progress reports
	 */
	static async canReceiveProgressReports(userId: string): Promise<boolean> {
		const user = await userRepository.findUserById(userId);
		if (!user) {
			return false;
		}

		const settings = await userSettingsRepository.getSettingsByUserId(userId);
		// Default to true if settings don't exist yet
		return settings?.receiveProgressReports ?? true;
	}

	/**
	 * Check if user can receive security alert emails
	 * Returns false if:
	 * - User not found
	 * - User opted out of security alerts
	 */
	static async canReceiveSecurityAlerts(userId: string): Promise<boolean> {
		const user = await userRepository.findUserById(userId);
		if (!user) {
			return false;
		}

		const settings = await userSettingsRepository.getSettingsByUserId(userId);
		// Default to true if settings don't exist yet
		return settings?.receiveSecurityAlerts ?? true;
	}

	/**
	 * Get all users eligible for product updates
	 * Returns users who have opted in to product updates (or haven't set preference yet)
	 */
	static async getProductUpdateEligibleUsers(): Promise<string[]> {
		const allUsers = await userRepository.getAllUsers();
		const eligible: string[] = [];

		for (const user of allUsers) {
			if (await this.canReceiveProductUpdates(user.id)) {
				eligible.push(user.id);
			}
		}

		return eligible;
	}

	/**
	 * Get all users eligible for progress reports
	 * Returns users who have opted in to progress reports (or haven't set preference yet)
	 */
	static async getProgressReportEligibleUsers(): Promise<string[]> {
		const allUsers = await userRepository.getAllUsers();
		const eligible: string[] = [];

		for (const user of allUsers) {
			if (await this.canReceiveProgressReports(user.id)) {
				eligible.push(user.id);
			}
		}

		return eligible;
	}

	/**
	 * Get all users eligible for security alerts
	 * Returns users who have opted in to security alerts (or haven't set preference yet)
	 */
	static async getSecurityAlertEligibleUsers(): Promise<string[]> {
		const allUsers = await userRepository.getAllUsers();
		const eligible: string[] = [];

		for (const user of allUsers) {
			if (await this.canReceiveSecurityAlerts(user.id)) {
				eligible.push(user.id);
			}
		}

		return eligible;
	}

	/**
	 * Get all users eligible for practice reminder emails
	 * Returns users who have opted in to practice reminders (or haven't set preference yet)
	 *
	 * OPTIMIZED: Uses efficient database queries instead of N+1 pattern
	 * - Gets users who explicitly opted in (settings = true)
	 * - Gets users who have no settings (default = true)
	 */
	static async getPracticeReminderEligibleUsers(): Promise<string[]> {
		// Get all users who have explicitly opted in
		const optedInSettings = await userSettingsRepository.getPracticeReminderSubscribers();
		const optedInUserIds = new Set(optedInSettings.map((s) => s.userId));

		// Get all users who have explicitly opted OUT
		const allUsers = await userRepository.getAllUsers();
		const allUserIds = new Set(allUsers.map((u) => u.id));

		// Get all settings (including those who opted out)
		const allSettings = await userSettingsRepository.getAllSettings();
		const usersWithSettings = new Set(allSettings.map((s) => s.userId));

		// Users without settings should be included (default opt-in)
		const usersWithoutSettings = [...allUserIds].filter((id) => !usersWithSettings.has(id));

		// Combine opted-in users and users without settings
		const eligible = [...optedInUserIds, ...usersWithoutSettings];

		return eligible;
	}
}
