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
				receiveMarketingEmails: true,
				receiveDailyReminderEmails: true,
				receiveProductUpdates: true,
				receiveWeeklyDigest: true,
				receiveSecurityAlerts: true
			});
		}

		return json({
			receiveMarketingEmails: settings.receiveMarketingEmails,
			receiveDailyReminderEmails: settings.receiveDailyReminderEmails,
			receiveProductUpdates: settings.receiveProductUpdates,
			receiveWeeklyDigest: settings.receiveWeeklyDigest,
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
			receiveMarketingEmails: Boolean(preferences.receiveMarketingEmails),
			receiveDailyReminderEmails: Boolean(preferences.receiveDailyReminderEmails),
			receiveProductUpdates: Boolean(preferences.receiveProductUpdates),
			receiveWeeklyDigest: Boolean(preferences.receiveWeeklyDigest),
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
				receiveMarketingEmails: updatedSettings.receiveMarketingEmails,
				receiveDailyReminderEmails: updatedSettings.receiveDailyReminderEmails,
				receiveProductUpdates: updatedSettings.receiveProductUpdates,
				receiveWeeklyDigest: updatedSettings.receiveWeeklyDigest,
				receiveSecurityAlerts: updatedSettings.receiveSecurityAlerts
			}
		});
	} catch (err) {
		console.error('Error updating email preferences:', err);
		throw error(500, 'Failed to update email preferences');
	}
};
