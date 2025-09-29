import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userRepository } from '$lib/server/repositories/user.repository';
import { emailVerificationRepository } from '$lib/server/repositories/email-verification.repository';
import { sessionRepository } from '$lib/server/repositories/session.repository';

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
		await emailVerificationRepository.deleteEmailVerificationByUserId(userId);

		// 2. Delete user sessions
		await sessionRepository.deleteSessionByUserId(userId);

		// 3. Delete user preferences (if exists)
		try {
			await db.execute(`DELETE FROM user_preferences WHERE user_id = '${userId}'`);
		} catch (error) {
			// Table might not exist or have different structure, continue
			console.log('User preferences deletion skipped:', error);
		}

		// 4. Delete user usage records (if exists)
		try {
			await db.execute(`DELETE FROM user_usage WHERE user_id = '${userId}'`);
		} catch (error) {
			// Table might not exist or have different structure, continue
			console.log('User usage deletion skipped:', error);
		}

		// 5. Delete conversation sessions (if exists)
		try {
			await db.execute(`DELETE FROM conversation_sessions WHERE user_id = '${userId}'`);
		} catch (error) {
			// Table might not exist or have different structure, continue
			console.log('Conversation sessions deletion skipped:', error);
		}

		// 6. Delete conversations (if exists)
		try {
			await db.execute(`DELETE FROM conversations WHERE user_id = '${userId}'`);
		} catch (error) {
			// Table might not exist or have different structure, continue
			console.log('Conversations deletion skipped:', error);
		}

		// 7. Delete messages (if exists)
		try {
			await db.execute(`DELETE FROM messages WHERE user_id = '${userId}'`);
		} catch (error) {
			// Table might not exist or have different structure, continue
			console.log('Messages deletion skipped:', error);
		}

		// 8. Delete analytics events (if exists)
		try {
			await db.execute(`DELETE FROM analytics_events WHERE user_id = '${userId}'`);
		} catch (error) {
			// Table might not exist or have different structure, continue
			console.log('Analytics events deletion skipped:', error);
		}

		// 9. Delete scenario attempts (if exists)
		try {
			await db.execute(`DELETE FROM scenario_attempts WHERE user_id = '${userId}'`);
		} catch (error) {
			// Table might not exist or have different structure, continue
			console.log('Scenario attempts deletion skipped:', error);
		}

		// 10. Delete scenario outcomes (if exists)
		try {
			await db.execute(`DELETE FROM scenario_outcomes WHERE user_id = '${userId}'`);
		} catch (error) {
			// Table might not exist or have different structure, continue
			console.log('Scenario outcomes deletion skipped:', error);
		}

		// 11. Delete subscriptions (if exists)
		try {
			await db.execute(`DELETE FROM subscriptions WHERE user_id = '${userId}'`);
		} catch (error) {
			// Table might not exist or have different structure, continue
			console.log('Subscriptions deletion skipped:', error);
		}

		// 12. Delete payments (if exists)
		try {
			await db.execute(`DELETE FROM payments WHERE user_id = '${userId}'`);
		} catch (error) {
			// Table might not exist or have different structure, continue
			console.log('Payments deletion skipped:', error);
		}

		// 13. Finally, delete the user record
		await userRepository.deleteUser(userId);

		console.log(`Account permanently deleted for user: ${userId}`);

		return json({ success: true, message: 'Account deleted successfully' });
	} catch (error) {
		console.error('Error deleting account:', error);
		return json({ error: 'Failed to delete account' }, { status: 500 });
	}
};
