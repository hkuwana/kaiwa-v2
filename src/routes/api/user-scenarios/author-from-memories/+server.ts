import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { createErrorResponse } from '$lib/types/api';
import { generateScenarioFromMemories } from '$lib/server/services/scenarios/user-scenarios.server';

const authorFromMemoriesSchema = z.object({
	memories: z.array(z.string()).optional().default([]),
	mode: z.enum(['tutor', 'character']).default('character'),
	languageId: z.string().optional()
});

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;
	if (!user) {
		return json(createErrorResponse('Unauthorized'), { status: 401 });
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json(createErrorResponse('Invalid JSON body'), { status: 400 });
	}

	const parsed = authorFromMemoriesSchema.safeParse(payload);
	if (!parsed.success) {
		console.warn('Invalid memory-based authoring request', parsed.error.flatten());
		return json(createErrorResponse('Invalid request body'), { status: 400 });
	}

	try {
		const response = await generateScenarioFromMemories(parsed.data);
		return json(response);
	} catch (error) {
		console.error('Failed to generate scenario from memories', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};
