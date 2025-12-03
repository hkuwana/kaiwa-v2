// src/routes/api/admin/learning-paths/queue/process/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { QueueProcessorService } from '$lib/features/learning-path/services/QueueProcessorService.server';
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

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check admin access
	const user = locals.user;
	if (!user || !isUserAdmin(user.email)) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		const { limit = 10, dryRun = false } = (await request.json().catch(() => ({}))) as {
			limit?: number;
			dryRun?: boolean;
		};

		const result = await QueueProcessorService.processPendingJobs(limit, dryRun);
		const stats = await scenarioGenerationQueueRepository.getQueueStats();

		return json({
			success: true,
			data: {
				...result,
				queueStats: stats
			}
		});
	} catch (error) {
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to process queue'
			},
			{ status: 500 }
		);
	}
};
