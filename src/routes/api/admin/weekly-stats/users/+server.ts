import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { userRepository } from '$lib/server/repositories';

export const GET: RequestHandler = async () => {
	try {
		// Get all users with email addresses
		const allUsers = await userRepository.getAllUsers();
		const usersWithEmails = allUsers
			.filter((u) => u.email && u.emailVerified)
			.map((u) => ({
				id: u.id,
				email: u.email,
				displayName: u.displayName || 'Unknown User'
			}))
			.sort((a, b) => a.displayName.localeCompare(b.displayName));

		return json({ users: usersWithEmails });
	} catch (error) {
		console.error('Error loading users:', error);
		return json({ error: 'Failed to load users' }, { status: 500 });
	}
};
