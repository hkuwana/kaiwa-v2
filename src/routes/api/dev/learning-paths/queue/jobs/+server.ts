// src/routes/api/dev/learning-paths/queue/jobs/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';

const VALID_STATUSES = new Set(['pending', 'processing', 'ready', 'failed']);

export const GET: RequestHandler = async ({ url }) => {
	const status = (url.searchParams.get('status') || 'pending') as
		| 'pending'
		| 'processing'
		| 'ready'
		| 'failed';

	if (!VALID_STATUSES.has(status)) {
		return json({ success: false, error: 'Invalid status value' }, { status: 400 });
	}

	const limitParam = url.searchParams.get('limit');
	const limit = limitParam ? Math.min(200, Math.max(1, Number(limitParam))) : 50;

	try {
		const jobs =
			status === 'pending'
				? await scenarioGenerationQueueRepository.getPendingJobs({ limit })
				: await scenarioGenerationQueueRepository.getJobsByStatus(status, { limit });

		return json({
			success: true,
			data: {
				status,
				limit,
				count: jobs.length,
				jobs
			}
		});
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
