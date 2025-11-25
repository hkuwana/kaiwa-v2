// src/routes/api/dev/learning-paths/prompt/preferences/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PromptEngineeringService } from '$lib/features/learning-path/services/PromptEngineeringService';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { userLevel, userGoal, targetLanguage, duration } = body;

		// Create mock user preferences for testing
		const mockPreferences: any = {
			targetLanguageId: targetLanguage || 'ja',
			currentLanguageLevel: userLevel || 'A2',
			learningGoal: userGoal || 'Connection',
			practicalLevel: 'intermediate',
			challengePreference: 'moderate',
			conversationContext: {
				learningReason: 'Want to communicate with family',
				occupation: 'Software Engineer'
			},
			specificGoals: ['Hold casual conversations', 'Understand native speakers']
		};

		const promptPayload = PromptEngineeringService.buildSyllabusPrompt({
			userPreferences: mockPreferences,
			preset: duration !== 28 ? { name: 'Custom Path', description: 'Custom learning path', duration } : undefined
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
