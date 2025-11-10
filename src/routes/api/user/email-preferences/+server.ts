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
				receiveFounderEmails: true, // Founder Updates
				receiveProductUpdates: true, // Product Updates
				receiveProgressReports: true, // Your Statistics
				receiveSecurityAlerts: true // Security (always on)
			});
		}

		// Simplified to 3 email types + security
		return json({
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

		// Simplified to 3 email types + security
		// Security alerts cannot be disabled for account safety
		const validPreferences = {
			receiveFounderEmails: Boolean(preferences.receiveFounderEmails),
			receiveProductUpdates: Boolean(preferences.receiveProductUpdates),
			receiveProgressReports: Boolean(preferences.receiveProgressReports),
			receiveSecurityAlerts: true // Always true for security
		};

		const updatedSettings = await userSettingsRepository.updateEmailPreferences(
			locals.user.id,
			validPreferences
		);

		if (!updatedSettings) {
			throw error(500, 'Failed to update email preferences');
		}

		// Return the updated preferences
		return json({
			success: true,
			message: 'Email preferences updated successfully',
			preferences: {
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
