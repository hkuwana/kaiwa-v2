// src/routes/api/dev/learning-paths/create/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { learningPathRepository, scenarioGenerationQueueRepository } from '$lib/server/repositories';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { userId, title, targetLanguage, duration = 7 } = body;

		// Generate a unique path ID
		const pathId = `test-path-${Date.now()}`;

		// Create a simple test schedule
		const schedule = Array.from({ length: duration }, (_, i) => ({
			dayIndex: i + 1,
			theme: `Day ${i + 1} Theme`,
			difficulty: i < 3 ? 'A1' : i < 5 ? 'A2' : 'B1',
			learningObjectives: [`Objective 1 for day ${i + 1}`, `Objective 2 for day ${i + 1}`]
		}));

		// Create the learning path
		const path = await learningPathRepository.createPathForUser({
			id: pathId,
			userId: userId || null,
			title: title || 'Test Learning Path',
			description: 'A test learning path for development',
			targetLanguage: targetLanguage || 'ja',
			schedule,
			isTemplate: false,
			isPublic: false,
			status: 'active'
		});

		// Enqueue generation jobs for each day
		const queueJobs = await scenarioGenerationQueueRepository.enqueuePathRange(
			pathId,
			schedule.map((day) => ({
				dayIndex: day.dayIndex,
				targetDate: new Date(Date.now() + day.dayIndex * 24 * 60 * 60 * 1000) // One day apart
			}))
		);

		return json({
			success: true,
			pathId: path.id,
			path,
			queueJobsCreated: queueJobs.length
		});
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
