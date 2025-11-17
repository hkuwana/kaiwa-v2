import { logger } from '$lib/logger';
// src/lib/server/services/openai.service.ts

import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { UserPreferences } from '$lib/server/db/types';
import {
	buildOnboardingInstructions,
	type OnboardingAnalysisConfig
} from './analysis-instruction.service';

export type { AnalysisFocus, OnboardingAnalysisConfig } from './analysis-instruction.service';

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: env.OPENAI_API_KEY
});

export interface OpenAICompletionOptions {
	model?: string;
	temperature?: number;
	maxTokens?: number;
	responseFormat?: 'text' | 'json';
}

export interface OpenAIResponse {
	content: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

/**
 * Send a completion request to OpenAI
 */
export async function createCompletion(
	messages: ChatCompletionMessageParam[],
	options: OpenAICompletionOptions = {}
): Promise<OpenAIResponse> {
	const {
		model = 'gpt-4o-mini',
		temperature = 0.7,
		maxTokens = 1000,
		responseFormat = 'text'
	} = options;

	const requestPayload = {
		model,
		messages,
		temperature,
		max_tokens: maxTokens,
		...(responseFormat === 'json' && {
			response_format: { type: 'json_object' as const }
		})
	};

	logger.info('🤖 [OpenAI Service] Raw Request to OpenAI:', {
		timestamp: new Date().toISOString(),
		requestPayload: JSON.stringify(requestPayload, null, 2),
		messagesCount: messages.length,
		totalPromptChars: messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0)
	});

	try {
		const completion = await openai.chat.completions.create(requestPayload);

		const content = completion.choices[0]?.message?.content || '';

		logger.info('🤖 [OpenAI Service] Raw Response from OpenAI:', {
			timestamp: new Date().toISOString(),
			fullResponse: JSON.stringify(completion, null, 2),
			extractedContent: content,
			usage: completion.usage,
			finishReason: completion.choices[0]?.finish_reason,
			responseContentLength: content.length
		});

		return {
			content,
			usage: completion.usage
				? {
						promptTokens: completion.usage.prompt_tokens,
						completionTokens: completion.usage.completion_tokens,
						totalTokens: completion.usage.total_tokens
					}
				: undefined
		};
	} catch (error) {
		logger.error('🚨 [OpenAI Service] API Error:', {
			timestamp: new Date().toISOString(),
			error: error,
			requestPayload: requestPayload,
			errorMessage: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error(
			`OpenAI completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Analyze onboarding conversation and extract user preferences
 */
export async function analyzeOnboardingConversation(
	conversationMessages: string[],
	configOrLanguage: string | OnboardingAnalysisConfig
): Promise<OpenAIResponse> {
	const conversation = conversationMessages.join('\n\n');

	const config: OnboardingAnalysisConfig =
		typeof configOrLanguage === 'string' ? { targetLanguage: configOrLanguage } : configOrLanguage;

	const instructions = buildOnboardingInstructions(conversation, config);

	const messages: ChatCompletionMessageParam[] = [
		{ role: 'system', content: instructions.systemPrompt },
		{ role: 'user', content: instructions.userPrompt }
	];

	const response = await createCompletion(messages, {
		model: 'gpt-4o-mini',
		temperature: 0.3,
		maxTokens: 650,
		responseFormat: 'json'
	});

	logger.info('🧠 [OpenAI Service] Onboarding analysis response received', {
		scenarioCategory: instructions.scenarioCategory,
		focusAreas: instructions.focusAreas,
		content: response.content
	});

	return response;
}

/**
 * Generate a personalized learning plan based on extracted data
 */
export async function generateLearningPlan(
	extractedData: UserPreferences,
	targetLanguage: string
): Promise<OpenAIResponse> {
	const systemPrompt = `You are a language learning expert creating a personalized learning plan. Generate an encouraging and specific plan based on the student's profile.`;

	const userPrompt = `Create a personalized learning plan for this ${targetLanguage} student:

STUDENT PROFILE:
- Learning goal: ${extractedData.learningGoal}
- Speaking level: ${extractedData.speakingLevel}/100
- Confidence: ${extractedData.speakingConfidence}/100
- Specific goals: ${extractedData.specificGoals?.join(', ') || 'General conversation'}
- Prefers ${extractedData.challengePreference} difficulty
- Likes ${extractedData.correctionStyle} corrections
- Daily goal: ${extractedData.dailyGoalSeconds} seconds

Create a motivating summary that includes:
1. Positive assessment of their current level
2. 3-4 specific learning objectives for the next month
3. Recommended lesson structure and topics
4. Encouragement about their learning journey

Keep it personal, specific, and motivating. Write in an encouraging, professional tone.`;

	const messages: ChatCompletionMessageParam[] = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt }
	];

	return createCompletion(messages, {
		model: 'gpt-4o-mini',
		temperature: 0.8, // Higher temperature for more creative/engaging plans
		maxTokens: 600
	});
}

/**
 * Generate lesson content based on user preferences
 */
export async function generateLessonContent(
	topic: string,
	userPreferences: UserPreferences,
	targetLanguage: string
): Promise<OpenAIResponse> {
	const systemPrompt = `You are a ${targetLanguage} language tutor creating lesson content tailored to the student's level and preferences.`;

	const userPrompt = `Create lesson content for: "${topic}"

STUDENT CONTEXT:
- Speaking level: ${userPreferences.speakingLevel}/100
- Confidence: ${userPreferences.speakingConfidence}/100
- Challenge preference: ${userPreferences.challengePreference}
- Correction style: ${userPreferences.correctionStyle}

Include:
1. Learning objectives for this lesson
2. Key vocabulary (appropriate to their level)
3. Practice exercises or conversation starters
4. Assessment criteria

Adapt complexity to their level and preferences.`;

	const messages: ChatCompletionMessageParam[] = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt }
	];

	return createCompletion(messages, {
		temperature: 0.7,
		maxTokens: 800
	});
}

/**
 * Validate and clean JSON response from OpenAI
 */
export function parseAndValidateJSON<T>(jsonString: string): T | null {
	try {
		// Clean potential markdown formatting
		const cleanJson = jsonString
			.replace(/```json\n?/g, '')
			.replace(/```\n?/g, '')
			.trim();

		return JSON.parse(cleanJson);
	} catch (error) {
		logger.error('Failed to parse JSON from OpenAI response:', error);
		return null;
	}
}

export default {
	createCompletion,
	analyzeOnboardingConversation,
	generateLearningPlan,
	generateLessonContent,
	parseAndValidateJSON
};
