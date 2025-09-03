// src/lib/server/services/openai.ts

import OpenAI from 'openai';
import { env } from '$env/dynamic/private';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { UserPreferences } from '$lib/server/db/types';

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

	try {
		const completion = await openai.chat.completions.create({
			model,
			messages,
			temperature,
			max_tokens: maxTokens,
			...(responseFormat === 'json' && {
				response_format: { type: 'json_object' }
			})
		});

		const content = completion.choices[0]?.message?.content || '';

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
		console.error('OpenAI API error:', error);
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
	targetLanguage: string
): Promise<OpenAIResponse> {
	const conversation = conversationMessages.join('\n\n');

	const systemPrompt = `You are an expert language learning analyst. Analyze the onboarding conversation between a language tutor and student to extract their learning preferences and assess their skill levels.

The student is learning ${targetLanguage}.

Respond ONLY with a valid JSON object containing the following structure:

{
	"learningMotivation": "Connection" | "Career" | "Travel" | "Academic" | "Culture" | "Growth",
	"speakingLevel": number (1-100),
	"listeningLevel": number (1-100),
	"speakingConfidence": number (1-100),
	"specificGoals": string[],
	"challengePreference": "comfortable" | "moderate" | "challenging",
	"correctionStyle": "immediate" | "gentle" | "end_of_session",
	"dailyGoalSeconds": 60 | 120 | 180 | 300  ,
	"assessmentNotes": string
}

ASSESSMENT GUIDELINES:
- speakingLevel: 1-20 (absolute beginner), 21-40 (basic phrases), 41-60 (conversational), 61-80 (fluent), 81-100 (advanced/native-like)
- listeningLevel: Based on comprehension of questions and instructions
- speakingConfidence: 1-30 (very shy), 31-60 (hesitant but willing), 61-100 (confident speaker)
- specificGoals: Extract concrete learning objectives like ["ordering food", "job interviews", "family conversations"]
- If information isn't explicitly stated, make reasonable inferences
- assessmentNotes: 2-3 sentence summary of their current level and key focus areas

Remember: Respond ONLY with valid JSON, no explanations or markdown.`;

	const messages: ChatCompletionMessageParam[] = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: `Analyze this conversation:\n\n${conversation}` }
	];

	return createCompletion(messages, {
		model: 'gpt-4o-mini',
		temperature: 0.3, // Lower temperature for more consistent analysis
		maxTokens: 500,
		responseFormat: 'json'
	});
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
		console.error('Failed to parse JSON from OpenAI response:', error);
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
