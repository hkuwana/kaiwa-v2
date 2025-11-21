import { json } from '@sveltejs/kit';
import { EmailReminderService } from '$lib/emails/campaigns/reminders/reminder.service';

export const POST = async ({ request, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const { userId } = await request.json();

		// Validate user can only send reminder to themselves
		if (userId !== locals.user.id) {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}

		const success = await EmailReminderService.sendPracticeReminder(userId);

		if (!success) {
			return json({ error: 'Failed to send reminder' }, { status: 500 });
		}

		return json({ success: true, message: 'Practice reminder sent successfully' });
	} catch (error) {
		console.error('Error sending practice reminder:', error);
		return json({ error: 'Failed to send practice reminder' }, { status: 500 });
	}
};
