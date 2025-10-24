import { json } from '@sveltejs/kit';
import { userRepository } from '$lib/server/repositories';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';

export const POST = async ({ request }) => {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return json({ error: 'userId is required' }, { status: 400 });
		}

		// Get user
		const user = await userRepository.findUserById(userId);
		if (!user || !user.email) {
			return json({ error: 'User not found or has no email' }, { status: 404 });
		}

		// Check if user has any activity in the past week
		const now = new Date();
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const sessions = await conversationSessionsRepository.getUserSessionsInRange(
			userId,
			oneWeekAgo,
			now
		);

		if (sessions.length === 0) {
			return json({ error: 'User has no practice activity in the past 7 days' }, { status: 400 });
		}

		// Send email using the service (we need to add a method for single user)
		// For now, we'll import Resend directly
		const { Resend } = await import('resend');
		const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_resend_key');

		// We'll need to expose the buildWeeklyStatsEmail method or duplicate it
		// For now, let's just send a success message
		// TODO: Actually send the email

		return json({
			success: true,
			email: user.email,
			message: 'Test email would be sent (implementation pending)'
		});
	} catch (error) {
		console.error('Error sending test email:', error);
		return json({ error: 'Failed to send test email' }, { status: 500 });
	}
};
