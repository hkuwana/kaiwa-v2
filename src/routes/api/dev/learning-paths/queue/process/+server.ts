// src/routes/api/dev/learning-paths/queue/process/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { QueueProcessorService } from '$lib/features/learning-path/services/QueueProcessorService.server';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';

export const POST: RequestHandler = async ({ request }) => {
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
