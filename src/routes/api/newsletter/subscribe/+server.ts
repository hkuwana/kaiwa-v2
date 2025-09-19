import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userPreferencesRepository } from '$lib/server/repositories/userPreferences.repository';

export const POST: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is authenticated
		if (!locals.user || !locals.user.id) {
			return json({ message: 'Authentication required' }, { status: 401 });
		}

		const userId = locals.user.id;

		// Get user's current preferences
		const preferences = await userPreferencesRepository.getPreferencesByUserId(userId);

		if (!preferences) {
			return json({ message: 'User preferences not found' }, { status: 404 });
		}

		// Check if already subscribed
		if (preferences.receiveMarketingEmails) {
			return json({ message: 'Already subscribed to newsletter' }, { status: 200 });
		}

		// Update preferences to subscribe to newsletter
		await userPreferencesRepository.updatePreferences(userId, {
			receiveMarketingEmails: true
		});

		return json({ message: 'Successfully subscribed to newsletter' }, { status: 200 });
	} catch (error) {
		console.error('Newsletter subscription error:', error);
		return json({ message: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is authenticated
		if (!locals.user || !locals.user.id) {
			return json({ message: 'Authentication required' }, { status: 401 });
		}

		const userId = locals.user.id;

		// Update preferences to unsubscribe from newsletter
		await userPreferencesRepository.updatePreferences(userId, {
			receiveMarketingEmails: false
		});

		return json({ message: 'Successfully unsubscribed from newsletter' }, { status: 200 });
	} catch (error) {
		console.error('Newsletter unsubscribe error:', error);
		return json({ message: 'Internal server error' }, { status: 500 });
	}
};
