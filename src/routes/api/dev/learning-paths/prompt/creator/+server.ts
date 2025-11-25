// src/routes/api/dev/learning-paths/prompt/creator/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PromptEngineeringService } from '$lib/features/learning-path/services/PromptEngineeringService';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { brief, targetLanguage, duration } = body;

		if (!brief) {
			return json({ success: false, error: 'Brief is required' }, { status: 400 });
		}

		const promptPayload = PromptEngineeringService.buildCreatorPathPrompt({
			brief,
			targetLanguage: targetLanguage || 'ja',
			duration: duration || 30,
			difficultyRange: { start: 'A2', end: 'B1' },
			primarySkill: 'conversation',
			metadata: { category: 'custom', tags: [] }
		});

		return json({
			success: true,
			prompt: promptPayload,
			preview: {
				systemPromptLength: promptPayload.systemPrompt.length,
				userPromptLength: promptPayload.userPrompt.length
			}
		});
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
