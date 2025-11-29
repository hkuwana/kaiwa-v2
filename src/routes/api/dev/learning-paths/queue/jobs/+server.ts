// src/routes/api/dev/learning-paths/queue/jobs/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';

const VALID_STATUSES = new Set(['pending', 'processing', 'ready', 'failed']);

/**
 * PATCH - Reset or retry a job
 */
export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const { jobId, action } = await request.json();

		if (!jobId) {
			return json({ success: false, error: 'jobId is required' }, { status: 400 });
		}

		if (action === 'retry') {
			const job = await scenarioGenerationQueueRepository.retryJob(jobId);
			if (!job) {
				return json({ success: false, error: 'Job not found' }, { status: 404 });
			}
			console.log(`[API] Job ${jobId} reset to pending for retry`);
			return json({ success: true, data: { job } });
		}

		return json({ success: false, error: 'Invalid action' }, { status: 400 });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error('[API] PATCH queue/jobs error:', error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
};

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
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
