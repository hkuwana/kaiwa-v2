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
				receiveFounderEmails: true,
				receiveProductUpdates: true,
				receiveProgressReports: true,
				receiveSecurityAlerts: true
			});
		}

		return json({
			receivePracticeReminders: settings.receivePracticeReminders,
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

		// Validate the preferences object
		const validPreferences = {
			receivePracticeReminders: Boolean(preferences.receivePracticeReminders),
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

		return json({
			success: true,
			message: 'Email preferences updated successfully',
			preferences: {
				receivePracticeReminders: updatedSettings.receivePracticeReminders,
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
