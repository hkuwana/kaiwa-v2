// src/routes/api/dev/learning-paths/queue/stats/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories';

export const GET: RequestHandler = async () => {
	try {
		const stats = await scenarioGenerationQueueRepository.getQueueStats();

		return json({
			success: true,
			stats
		});
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
