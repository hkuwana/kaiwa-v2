// src/routes/api/admin/users/search/+server.ts
// Search users by email for admin autocomplete

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { ilike, or } from 'drizzle-orm';

// Admin domains that get automatic access
const ADMIN_DOMAINS = ['trykaiwa.com', 'kaiwa.app'];
const ADMIN_EMAILS = ['hiro.kuwana@gmail.com'];

function isUserAdmin(email: string | null | undefined): boolean {
	if (!email) return false;
	const normalizedEmail = email.toLowerCase().trim();
	const emailDomain = normalizedEmail.split('@')[1];
	if (emailDomain && ADMIN_DOMAINS.includes(emailDomain)) return true;
	if (ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalizedEmail)) return true;
	return false;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	// Check admin access
	const user = locals.user;
	if (!user || !isUserAdmin(user.email)) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const query = url.searchParams.get('q')?.trim();

	if (!query || query.length < 2) {
		return json({ users: [] });
	}

	try {
		// Search by email or display name (case insensitive)
		const searchPattern = `%${query}%`;

		const results = await db
			.select({
				id: users.id,
				email: users.email,
				displayName: users.displayName,
				avatarUrl: users.avatarUrl
			})
			.from(users)
			.where(
				or(
					ilike(users.email, searchPattern),
					ilike(users.displayName, searchPattern)
				)
			)
			.limit(10);

		return json({
			users: results.map(u => ({
				id: u.id,
				email: u.email,
				displayName: u.displayName,
				avatarUrl: u.avatarUrl
			}))
		});
	} catch (error) {
		console.error('Error searching users:', error);
		return json({ error: 'Failed to search users' }, { status: 500 });
	}
};
