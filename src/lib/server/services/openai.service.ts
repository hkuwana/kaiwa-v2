/**
 * OpenAI Service (Migrated to Multi-Provider AI Module)
 *
 * This service now uses the unified AI module which supports
 * multiple providers (OpenAI, Anthropic/Claude, Google/Gemini).
 *
 * The external API remains unchanged for backward compatibility.
 * Internally, calls are routed to the optimal provider based on task type.
 *
 * @see src/lib/server/ai/ for the underlying implementation
 */

import { logger } from '$lib/logger';
import type { UserPreferences } from '$lib/server/db/types';
import {
	buildOnboardingInstructions,
	type OnboardingAnalysisConfig
} from './analysis-instruction.service';
import {
	createCompletion as aiCreateCompletion,
	parseAndValidateJSON as aiParseAndValidateJSON,
	type AIMessage,
	type AIResponse
} from '$lib/server/ai';

// Re-export types for backward compatibility
export type { AnalysisFocus, OnboardingAnalysisConfig } from './analysis-instruction.service';

/**
 * Legacy completion options (backward compatible)
 */
export interface OpenAICompletionOptions {
	model?: string;
	temperature?: number;
	maxTokens?: number;
	responseFormat?: 'text' | 'json';
}

/**
 * Legacy response type (backward compatible)
 */
export interface OpenAIResponse {
	content: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

/**
 * Convert AIResponse to legacy OpenAIResponse format
 */
function toOpenAIResponse(response: AIResponse): OpenAIResponse {
	return {
		content: response.content,
		usage: response.usage
	};
}

/**
 * Send a completion request
 *
 * Now routes to the appropriate provider based on configuration.
 * Default behavior uses task-based routing from the AI module.
 *
 * @deprecated Consider using `createCompletion` from '$lib/server/ai' directly
 * with task-based routing for better provider selection.
 */
export async function createCompletion(
	messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
	options: OpenAICompletionOptions = {}
): Promise<OpenAIResponse> {
	const { model, maxTokens = 1000, responseFormat = 'text', temperature } = options;

	// Use the new AI module with explicit model if provided
	// Otherwise, let task routing decide (caller should use task-based API)
	const response = await aiCreateCompletion(messages as AIMessage[], {
		model,
		maxTokens,
		responseFormat,
		temperature
	});

	return toOpenAIResponse(response);
}

/**
 * Analyze onboarding conversation and extract user preferences
 *
 * Uses task-based routing: structuredExtraction → Claude Haiku
 */
export async function analyzeOnboardingConversation(
	conversationMessages: string[],
	configOrLanguage: string | OnboardingAnalysisConfig
): Promise<OpenAIResponse> {
	const conversation = conversationMessages.join('\n\n');

	const config: OnboardingAnalysisConfig =
		typeof configOrLanguage === 'string' ? { targetLanguage: configOrLanguage } : configOrLanguage;

	const instructions = buildOnboardingInstructions(conversation, config);

	const messages: AIMessage[] = [
		{ role: 'system', content: instructions.systemPrompt },
		{ role: 'user', content: instructions.userPrompt }
	];

	const response = await aiCreateCompletion(messages, {
		task: 'structuredExtraction', // Routes to Claude Haiku
		temperature: 0.3,
		maxTokens: 650,
		responseFormat: 'json'
	});

	logger.info('[OpenAI Service] Onboarding analysis response received', {
		scenarioCategory: instructions.scenarioCategory,
		focusAreas: instructions.focusAreas,
		provider: response.provider,
		model: response.model
	});

	return toOpenAIResponse(response);
}

/**
 * Generate a personalized learning plan based on extracted data
 *
 * Uses task-based routing: pathwaySyllabus → Claude Haiku
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

	const messages: AIMessage[] = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt }
	];

	const response = await aiCreateCompletion(messages, {
		task: 'pathwaySyllabus', // Routes to Claude Haiku
		temperature: 0.8,
		maxTokens: 600
	});

	return toOpenAIResponse(response);
}

/**
 * Generate lesson content based on user preferences
 *
 * Uses task-based routing: scenarioGeneration → Claude Haiku
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

	const messages: AIMessage[] = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: userPrompt }
	];

	const response = await aiCreateCompletion(messages, {
		task: 'scenarioGeneration', // Routes to Claude Haiku
		temperature: 0.7,
		maxTokens: 800
	});

	return toOpenAIResponse(response);
}

/**
 * Validate and clean JSON response
 *
 * @deprecated Use `createStructuredCompletion` from '$lib/server/ai' with
 * a Zod schema for better type safety and validation.
 */
export function parseAndValidateJSON<T>(jsonString: string): T | null {
	return aiParseAndValidateJSON<T>(jsonString);
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
 * Generate a scenario from description or memories
 *
 * Uses task-based routing: scenarioGeneration → Claude Haiku
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

	const response = await aiCreateCompletion(
		[
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userPrompt }
		],
		{
			task: 'scenarioGeneration', // Routes to Claude Haiku
			temperature: hasMemories ? 0.8 : 0.7,
			maxTokens: 1000,
			responseFormat: 'json'
		}
	);

	const parsed = parseAndValidateJSON<GeneratedScenarioContent>(response.content);
	if (!parsed) throw new Error('Failed to parse scenario response');

	logger.info('[OpenAI Service] Scenario generated', {
		provider: response.provider,
		model: response.model,
		tokensUsed: response.usage?.totalTokens
	});

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
