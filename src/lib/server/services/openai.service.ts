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
import { DEFAULT_MODEL, getModelForTask } from '../config/ai-models.config';

export type { AnalysisFocus, OnboardingAnalysisConfig } from './analysis-instruction.service';

// Lazy initialization of OpenAI client
let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
	if (!_openai) {
		_openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY || 'dummy-key-for-build'
		});
	}
	return _openai;
}

const openai = new Proxy({} as OpenAI, {
	get(_target, prop) {
		const client = getOpenAI();
		return client[prop as keyof OpenAI];
	}
});

export interface OpenAICompletionOptions {
	model?: string;
	temperature?: number;
	/**
	 * Maximum completion tokens for GPT-5 reasoning models.
	 * This includes BOTH reasoning tokens and output tokens.
	 *
	 * GPT-5 reasoning models can use 4000+ tokens just for internal reasoning
	 * before producing any output. Set this very high to ensure there's room
	 * for both reasoning and output.
	 *
	 * Default: 16000 (allows plenty of reasoning headroom + output)
	 */
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
		model = 'gpt-5-nano',
		maxTokens = 16000, // Very high default for reasoning models - they can use 4000+ tokens just for thinking
		responseFormat = 'text'
	} = options;

	// Build the request payload
	// For GPT-5 reasoning models, max_completion_tokens includes both reasoning and output
	// Set high enough to allow room for internal reasoning before producing output
	const requestPayload = {
		model,
		messages,
		max_completion_tokens: maxTokens,
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
		const finishReason = completion.choices[0]?.finish_reason;

		logger.info('🤖 [OpenAI Service] Raw Response from OpenAI:', {
			timestamp: new Date().toISOString(),
			fullResponse: JSON.stringify(completion, null, 2),
			extractedContent: content,
			usage: completion.usage,
			finishReason,
			responseContentLength: content.length
		});

		// Check for truncated response due to token limit
		// This is especially important for reasoning models (GPT-5 Nano/Mini)
		// which use internal reasoning tokens before producing output
		if (finishReason === 'length' && content.length === 0) {
			const usageDetails = completion.usage as {
				completion_tokens_details?: { reasoning_tokens?: number };
			};
			const reasoningTokens = usageDetails?.completion_tokens_details?.reasoning_tokens || 0;

			logger.error('🚨 [OpenAI Service] Response truncated - all tokens used for reasoning', {
				maxTokens,
				completionTokens: completion.usage?.completion_tokens,
				reasoningTokens,
				suggestion: 'Increase maxTokens to allow room for output after reasoning'
			});

			throw new Error(
				`OpenAI response truncated: model used ${reasoningTokens} reasoning tokens, leaving no room for output. Increase maxTokens (currently ${maxTokens}).`
			);
		}

		// Warn if response was truncated but still has some content
		if (finishReason === 'length' && content.length > 0) {
			logger.warn('⚠️ [OpenAI Service] Response may be truncated (finish_reason: length)', {
				contentLength: content.length,
				maxTokens
			});
		}

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
		model: getModelForTask('structuredExtraction'), // Analysis requires structured extraction
		temperature: 0.3,
		maxTokens: 2500, // Higher for reasoning models (includes reasoning + ~500 output tokens)
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
		model: DEFAULT_MODEL, // Use fast model for plan generation
		temperature: 0.8, // Higher temperature for more creative/engaging plans
		maxTokens: 2500 // Higher for reasoning models (includes reasoning + ~500 output tokens)
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
		maxTokens: 3000 // Higher for reasoning models (includes reasoning + ~800 output tokens)
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

export interface GenerateScenarioOptions {
	description?: string;
	memories?: string[];
	mode: 'tutor' | 'character';
	languageId?: string;
}

export interface GeneratedScenarioContent {
	title: string;
	description: string;
	instructions: string;
	context: string;
	expectedOutcome: string;
	learningGoal: string;
	learningObjectives: string[];
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	cefrLevel: string;
	persona: { title: string; introPrompt: string } | null;
}

const SCENARIO_JSON_SCHEMA = `{
  "title": "A concise, engaging title (max 60 chars)",
  "description": "A brief description of the scenario (1-2 sentences)",
  "instructions": "Detailed instructions for the AI conversation partner",
  "context": "The setting and background context",
  "expectedOutcome": "What the learner should accomplish",
  "learningGoal": "The main language learning objective",
  "learningObjectives": ["objective1", "objective2", "objective3"],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "cefrLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "persona": { "title": "Role name", "introPrompt": "Opening line" }
}`;

/**
 * Generate a scenario using GPT from description or memories
 */
export async function generateScenarioWithGPT(
	options: GenerateScenarioOptions
): Promise<{ content: GeneratedScenarioContent; tokensUsed: number }> {
	const { description, memories, mode, languageId } = options;
	const lang = languageId || 'Japanese';
	const modeText = mode === 'tutor' ? 'tutoring' : 'roleplay';
	const modeDesc =
		mode === 'tutor'
			? 'Language Tutor (supportive, corrective)'
			: 'Character Roleplay (realistic, immersive)';

	const hasMemories = memories && memories.length > 0;
	const context = hasMemories
		? `What I know about this learner:\n- ${memories.slice(0, 5).join('\n- ')}`
		: `Description: "${description}"`;

	const systemPrompt = `You are a language learning scenario designer for ${lang} learners.
${hasMemories ? "Create a personalized scenario connecting to the learner's interests." : 'Expand the description into a complete scenario.'}
Return JSON: ${SCENARIO_JSON_SCHEMA}
Guidelines: ${mode === 'tutor' ? 'Focus on teaching and gentle correction' : 'Focus on realistic roleplay'}. Include culturally appropriate elements.`;

	const userPrompt = `Create a ${modeText} scenario.\n${context}\nMode: ${modeDesc}`;

	const response = await createCompletion(
		[
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		],
		{
			model: getModelForTask('scenarioGeneration'), // Scenario generation uses NANO
			temperature: hasMemories ? 0.8 : 0.7,
			maxTokens: 16000, // Very high for reasoning models - they can use 4000+ tokens for thinking alone
			responseFormat: 'json'
		}
	);

	const parsed = parseAndValidateJSON<GeneratedScenarioContent>(response.content);
	if (!parsed) throw new Error('Failed to parse GPT scenario response');

	return { content: parsed, tokensUsed: response.usage?.totalTokens ?? 0 };
}

export default {
	createCompletion,
	analyzeOnboardingConversation,
	generateLearningPlan,
	generateLessonContent,
	parseAndValidateJSON,
	generateScenarioWithGPT
};
