import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { createErrorResponse } from '$lib/types/api';
import { generateScenarioDraft } from '$lib/server/services/scenarios/user-scenarios.server';

const authorSchema = z.object({
	description: z.string().min(10).max(650),
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

	const parsed = authorSchema.safeParse(payload);
	if (!parsed.success) {
		console.warn('Invalid authoring request', parsed.error.flatten());
		return json(createErrorResponse('Invalid request body'), { status: 400 });
	}

	try {
		const response = await generateScenarioDraft(parsed.data);
		return json(response);
	} catch (error) {
		console.error('Failed to generate scenario draft', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};
