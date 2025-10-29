import { json } from '@sveltejs/kit';
import { userRepository } from '$lib/server/repositories/user.repository';
import { emailVerificationRepository } from '$lib/server/repositories/email-verification.repository';
import { sessionRepository } from '$lib/server/repositories/session.repository';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import { userUsageRepository } from '$lib/server/repositories/user-usage.repository';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { analyticsEventsRepository } from '$lib/server/repositories/analytics-events.repository';
import { subscriptionRepository } from '$lib/server/repositories/subscription.repository';
import { paymentRepository } from '$lib/server/repositories/payment.repository';
import { userSettingsRepository } from '$lib/server/repositories/user-settings.repository';

export const DELETE = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	if (locals.user.id !== params.id) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const userId = params.id;

		// Delete all user-related data in the correct order (respecting foreign key constraints)

		// 1. Delete email verification records
		await emailVerificationRepository.deleteVerificationByUserId(userId);

		// 2. Delete user sessions
		await sessionRepository.deleteAllSessionsForUser(userId);

		// 3. Delete user preferences
		try {
			await userPreferencesRepository.deleteUserPreferences(userId);
		} catch (error) {
			console.log('User preferences deletion skipped:', error);
		}

		// 4. Delete user settings
		try {
			await userSettingsRepository.deleteUserSettings(userId);
		} catch (error) {
			console.log('User settings deletion skipped:', error);
		}

		// 5. Delete user usage records
		try {
			await userUsageRepository.deleteUserUsage(userId);
		} catch (error) {
			console.log('User usage deletion skipped:', error);
		}

		// 6. Delete conversation sessions
		try {
			await conversationSessionsRepository.deleteUserSessions(userId);
		} catch (error) {
			console.log('Conversation sessions deletion skipped:', error);
		}

		// 7. Delete conversations (this also deletes messages via the repository)
		try {
			await conversationRepository.deleteUserConversations(userId);
		} catch (error) {
			console.log('Conversations deletion skipped:', error);
		}

		// 8. Delete analytics events
		try {
			await analyticsEventsRepository.deleteUserAnalyticsEvents(userId);
		} catch (error) {
			console.log('Analytics events deletion skipped:', error);
		}

		// 9. Delete scenario progress (user_scenario_progress & scenario_metadata via CASCADE)
		// This is automatically handled by CASCADE foreign keys on user_scenario_progress
		// No explicit deletion needed - will be cascade deleted when user is deleted

		// 10. Delete subscriptions
		try {
			await subscriptionRepository.deleteUserSubscriptions(userId);
		} catch (error) {
			console.log('Subscriptions deletion skipped:', error);
		}

		// 11. Delete payments
		try {
			await paymentRepository.deleteUserPayments(userId);
		} catch (error) {
			console.log('Payments deletion skipped:', error);
		}

		// 12. Finally, delete the user record
		await userRepository.deleteUser(userId);

		console.log(`Account permanently deleted for user: ${userId}`);

		return json({ success: true, message: 'Account deleted successfully' });
	} catch (error) {
		console.error('Error deleting account:', error);
		return json({ error: 'Failed to delete account' }, { status: 500 });
	}
};
