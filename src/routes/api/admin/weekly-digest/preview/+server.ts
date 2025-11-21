import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WeeklyUpdatesEmailService } from '$lib/emails/campaigns/weekly-digest/digest.service';
import { userRepository } from '$lib/server/repositories';
import type { User } from '$lib/server/db/types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const content = await request.json();

		// Get a sample user for preview (you, the founder)
		// You can change this to use your own user ID or email
		const users = await userRepository.getAllUsers();
		const sampleUser: User = users.find((u) => u.email?.includes('hiro')) ||
			users[0] || {
				id: 'preview-user',
				email: 'preview@example.com',
				displayName: 'Preview User',
				createdAt: new Date(),
				updatedAt: new Date(),
				stripeCustomerId: null,
				emailVerified: null,
				emailVerificationToken: null,
				passwordHash: null,
				googleId: null,
				githubId: null,
				lastLogin: null,
				accountStatus: 'active',
				deletedAt: null
			};

		// Generate preview HTML
		const html = WeeklyUpdatesEmailService.buildWeeklyDigestEmail(sampleUser, content);

		return json({ html });
	} catch (error) {
		console.error('Error generating preview:', error);
		return json({ error: 'Failed to generate preview' }, { status: 500 });
	}
};
