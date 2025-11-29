// src/routes/api/dev/learning-paths/queue/[pathId]/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { pathId } = params;

		const jobs = await scenarioGenerationQueueRepository.getJobsForPath(pathId);

		return json({
			success: true,
			pathId,
			jobCount: jobs.length,
			jobs
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
