import { json, error } from '@sveltejs/kit';
import { userSettingsRepository } from '$lib/server/repositories/user-settings.repository';

export const GET = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const settings = await userSettingsRepository.getSettingsByUserId(locals.user.id);

		if (!settings) {
			// Return default preferences if no settings exist
			return json({
				receivePracticeReminders: true,
				practiceReminderFrequency: 'weekly', // Client-side only until DB migration
				preferredReminderDay: 'friday', // Client-side only until DB migration
				receiveFounderEmails: true,
				receiveProductUpdates: true,
				receiveProgressReports: true,
				receiveSecurityAlerts: true
			});
		}

		// Note: practiceReminderFrequency and preferredReminderDay are not yet in DB
		// These are sent to client for UI state, but not persisted until migration runs
		return json({
			receivePracticeReminders: settings.receivePracticeReminders,
			practiceReminderFrequency: (settings as any).practiceReminderFrequency || 'weekly',
			preferredReminderDay: (settings as any).preferredReminderDay || 'friday',
			receiveFounderEmails: settings.receiveFounderEmails,
			receiveProductUpdates: settings.receiveProductUpdates,
			receiveProgressReports: settings.receiveProgressReports,
			receiveSecurityAlerts: settings.receiveSecurityAlerts
		});
	} catch (err) {
		console.error('Error fetching email preferences:', err);
		throw error(500, 'Failed to fetch email preferences');
	}
};

export const POST = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const preferences = await request.json();

		// Note: Frequency and day preferences are validated but not saved to DB yet
		// They will be stored after the database migration is complete
		const validFrequencies = ['never', 'daily', 'weekly'];
		const frequency = validFrequencies.includes(preferences.practiceReminderFrequency)
			? preferences.practiceReminderFrequency
			: 'weekly';

		const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
		const day = validDays.includes(preferences.preferredReminderDay)
			? preferences.preferredReminderDay
			: 'friday';

		// Validate the preferences object (excluding frequency/day for now)
		const validPreferences = {
			receivePracticeReminders: Boolean(preferences.receivePracticeReminders),
			// practiceReminderFrequency: frequency, // TODO: Add after DB migration
			// preferredReminderDay: day, // TODO: Add after DB migration
			receiveFounderEmails: Boolean(preferences.receiveFounderEmails),
			receiveProductUpdates: Boolean(preferences.receiveProductUpdates),
			receiveProgressReports: Boolean(preferences.receiveProgressReports),
			receiveSecurityAlerts: Boolean(preferences.receiveSecurityAlerts)
		};

		const updatedSettings = await userSettingsRepository.updateEmailPreferences(
			locals.user.id,
			validPreferences
		);

		if (!updatedSettings) {
			throw error(500, 'Failed to update email preferences');
		}

		// Return the updated preferences, including the client-side frequency/day preferences
		return json({
			success: true,
			message: 'Email preferences updated successfully',
			preferences: {
				receivePracticeReminders: updatedSettings.receivePracticeReminders,
				practiceReminderFrequency: frequency, // Return validated value (not persisted yet)
				preferredReminderDay: day, // Return validated value (not persisted yet)
				receiveFounderEmails: updatedSettings.receiveFounderEmails,
				receiveProductUpdates: updatedSettings.receiveProductUpdates,
				receiveProgressReports: updatedSettings.receiveProgressReports,
				receiveSecurityAlerts: updatedSettings.receiveSecurityAlerts
			}
		});
	} catch (err) {
		console.error('Error updating email preferences:', err);
		throw error(500, 'Failed to update email preferences');
	}
};
