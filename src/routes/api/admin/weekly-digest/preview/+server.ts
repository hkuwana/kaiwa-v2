import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WeeklyUpdatesEmailService } from '$lib/server/email/weekly-updates-email.service';
import { userRepository } from '$lib/server/repositories';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const content = await request.json();

		// Get a sample user for preview (you, the founder)
		// You can change this to use your own user ID or email
		const users = await userRepository.getAllUsers();
		const sampleUser =
			users.find((u) => u.email?.includes('hiro')) || users[0] || {
				id: 'preview-user',
				email: 'preview@example.com',
				displayName: 'Preview User',
				createdAt: new Date()
			};

		// Generate preview HTML
		const html = WeeklyUpdatesEmailService.buildWeeklyDigestEmail(sampleUser as any, content);

		return json({ html });
	} catch (error) {
		console.error('Error generating preview:', error);
		return json({ error: 'Failed to generate preview' }, { status: 500 });
	}
};
