import { json } from '@sveltejs/kit';
import { userSettingsRepository } from '$lib/server/repositories/user-settings.repository';

export const POST = async ({ locals }) => {
	try {
		// Check if user is authenticated
		if (!locals.user || !locals.user.id) {
			return json({ message: 'Authentication required' }, { status: 401 });
		}

		const userId = locals.user.id;

		// Get user's current settings
		const settings = await userSettingsRepository.getSettingsByUserId(userId);

		if (!settings) {
			// Create default settings if they don't exist
			await userSettingsRepository.upsertSettings({
				userId,
				receiveMarketingEmails: true
			});
		} else if (settings.receiveMarketingEmails) {
			return json({ message: 'Already subscribed to newsletter' }, { status: 200 });
		} else {
			// Update settings to subscribe to newsletter
			await userSettingsRepository.updateEmailPreferences(userId, {
				receiveMarketingEmails: true
			});
		}

		return json({ message: 'Successfully subscribed to newsletter' }, { status: 200 });
	} catch (error) {
		console.error('Newsletter subscription error:', error);
		return json({ message: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE = async ({ locals }) => {
	try {
		// Check if user is authenticated
		if (!locals.user || !locals.user.id) {
			return json({ message: 'Authentication required' }, { status: 401 });
		}

		const userId = locals.user.id;

		// Update settings to unsubscribe from newsletter
		await userSettingsRepository.updateEmailPreferences(userId, {
			receiveMarketingEmails: false
		});

		return json({ message: 'Successfully unsubscribed from newsletter' }, { status: 200 });
	} catch (error) {
		console.error('Newsletter unsubscribe error:', error);
		return json({ message: 'Internal server error' }, { status: 500 });
	}
};
