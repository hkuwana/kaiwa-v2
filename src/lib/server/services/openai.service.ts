// src/lib/server/services/openai.service.ts

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
export type AnalysisFocus = 'preferences' | 'memories' | 'grammar' | 'revision';

export interface OnboardingAnalysisConfig {
	/** Primary language being studied */
	targetLanguage: string;
	/** Scenario category to tailor extraction heuristics */
	scenarioCategory?: string | null;
	/** Additional focus areas to mention in the prompt */
	analysisFocus?: AnalysisFocus[];
}

const DEFAULT_ANALYSIS_FOCUS: AnalysisFocus[] = ['preferences', 'memories'];

const scenarioGuidelines: Record<string, string> = {
	general: `BASE GUIDELINES:\n- Identify the learner's motivation, confidence, and specific goals.\n- Capture any explicit personal facts or commitments as short "memories".\n- Keep answers concise and evidence-based.`,
	onboarding: `ONBOARDING FOCUS:\n- Prioritise extracting preferences that help craft a personalised learning plan.\n- Collect any personal facts relevant to future conversations (family, work, travel plans).`,
	roleplay: `ROLEPLAY FOCUS:\n- Pay attention to relationships, shared plans, and emotional tone.\n- Extract concrete memories such as names, locations, commitments, or interests mentioned in the roleplay.`,
	comfort: `COMFORT SCENARIO FOCUS:\n- Emphasise everyday interests, routines, and comfort levels with the language.\n- Store memories that could improve small-talk or follow-up sessions.`,
	relationships: `RELATIONSHIP SCENARIO FOCUS:\n- Capture interpersonal details (who they are speaking with, goals, anniversaries, shared preferences).\n- Note communication challenges or emotional needs relevant to future coaching.`,
	basic: `BASIC SCENARIO FOCUS:\n- Focus on foundational preferences and any blockers.\n- Save memories about essential needs (work schedule, study constraints, key motivations).`
};

const focusDescriptions: Record<AnalysisFocus, string> = {
	preferences:
		'- Extract learning preferences, motivation, confidence, and tangible goals for personalisation.',
	memories:
		'- Collect short first-person memory strings that describe personal facts, relationships, or interests (e.g., "enjoys hiking", "planning a trip to Osaka").',
	grammar:
		'- Evaluate grammar strengths and issues. Summarise specific patterns that need revision.',
	revision:
		'- Identify points that should be reviewed in the next session (pronunciation, vocabulary gaps, misunderstandings).'
};

function buildOnboardingSystemPrompt(
	targetLanguage: string,
	scenarioCategory: string,
	focusAreas: AnalysisFocus[]
): string {
	const guideline =
		scenarioGuidelines[scenarioCategory] ?? scenarioGuidelines.general;
	const focusSummary = focusAreas
		.map((focus) => focusDescriptions[focus])
		.filter(Boolean)
		.join('\n');

	return `You are an expert language learning analyst. Analyse the conversation between a language tutor and student to extract structured insights. Work in the context of the ${scenarioCategory} scenario while remembering the student is learning ${targetLanguage}.

${guideline}

FOCUS AREAS:
${focusSummary}

Respond ONLY with a valid JSON object matching the schema:
{
	"learningGoal": "Connection" | "Career" | "Travel" | "Academic" | "Culture" | "Growth",
	"speakingLevel": number (1-100),
	"listeningLevel": number (1-100),
	"speakingConfidence": number (1-100),
	"specificGoals": string[],
	"challengePreference": "comfortable" | "moderate" | "challenging",
	"correctionStyle": "immediate" | "gentle" | "end_of_session",
	"dailyGoalSeconds": 60 | 120 | 180 | 300,
	"memories": string[] (short personal facts or preferences for future conversations; return [] if none),
	"assessmentNotes": string (2-3 sentences summarising level, needs, and follow-up focus)
}

RULES:
- Keep "memories" in English even if conversation is in another language.
- Use concise phrases for memories (under 80 characters each).
- Do not invent details without contextual clues; return an empty array when unsure.
- Do not include any explanation outside the JSON.`;
}

export async function analyzeOnboardingConversation(
	conversationMessages: string[],
	configOrLanguage: string | OnboardingAnalysisConfig
): Promise<OpenAIResponse> {
	const conversation = conversationMessages.join('\n\n');

	const config: OnboardingAnalysisConfig =
		typeof configOrLanguage === 'string'
			? { targetLanguage: configOrLanguage }
			: configOrLanguage;

	const scenarioCategory = config.scenarioCategory?.toLowerCase() || 'general';
	const focusAreas = Array.from(
		new Set([
			...DEFAULT_ANALYSIS_FOCUS,
			...(config.analysisFocus ?? [])
		])
	);

	const systemPrompt = buildOnboardingSystemPrompt(
		config.targetLanguage,
		scenarioCategory,
		focusAreas
	);

	const messages: ChatCompletionMessageParam[] = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: `Analyze this conversation:\n\n${conversation}` }
	];

	const response = await createCompletion(messages, {
		model: 'gpt-4o-mini',
		temperature: 0.3,
		maxTokens: 650,
		responseFormat: 'json'
	});

	console.log('🧠 [OpenAI Service] Onboarding analysis response received', {
		scenarioCategory,
		focusAreas,
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
