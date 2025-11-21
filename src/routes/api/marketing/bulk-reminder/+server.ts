import { json } from '@sveltejs/kit';
import { EmailReminderService } from '$lib/emails/campaigns/reminders/reminder.service';

/**
 * Bulk reminder endpoint - sends reminders to all eligible users
 *
 * Permissions are checked in EmailReminderService.sendBulkReminders(),
 * which uses EmailPermissionService to get only users who have opted in
 * to daily reminders and have verified emails.
 */
export const POST = async ({ locals }) => {
	// Check if user is authenticated and is admin (you can add admin check here)
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		// sendBulkReminders already checks database preferences via EmailPermissionService
		const result = await EmailReminderService.sendBulkReminders();

		return json({
			success: true,
			message: `Bulk reminders sent: ${result.sent} successful, ${result.failed} failed`,
			result
		});
	} catch (error) {
		console.error('Error sending bulk reminders:', error);
		return json({ error: 'Failed to send bulk reminders' }, { status: 500 });
	}
};
