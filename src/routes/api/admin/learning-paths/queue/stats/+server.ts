// src/routes/api/admin/learning-paths/queue/stats/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';

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

export const GET: RequestHandler = async ({ locals }) => {
	// Check admin access
	const user = locals.user;
	if (!user || !isUserAdmin(user.email)) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		const stats = await scenarioGenerationQueueRepository.getQueueStats();

		return json({
			success: true,
			data: stats,
			stats // keep legacy key for callers using .stats
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
