/**
 * AI Models Configuration (Server-Side Only)
 *
 * This file defines the OpenAI models used throughout the application.
 * Keep this server-side to prevent users from switching models.
 *
 * Model Selection Guide:
 * ----------------------
 *
 * GPT-5-NANO (gpt-5-nano-2025-08-07)
 * - Fastest, most cost-efficient ($0.05/1M input, $0.40/1M output)
 * - 400K context window, 128K max output
 * - Use for: JSON generation, grammar corrections, pathway syllabus,
 *   simple transformations, structured data extraction
 *
 * GPT-5-MINI (gpt-5-mini-2025-08-07)
 * - Mid-tier speed/quality ($0.25/1M input, $2.00/1M output)
 * - 400K context window, 128K max output
 * - Use for: Complex reasoning, detailed analysis, nuanced content generation
 *
 * GPT-4O-MINI-REALTIME (gpt-5-nano-realtime-preview-2024-12-17)
 * - Optimized for realtime audio/text ($0.60/1M input, $2.40/1M output)
 * - 16K context window, 4K max output
 * - Use for: Voice conversations, real-time interactions
 */

// Model identifiers
export const AI_MODELS = {
	/** Fastest, cheapest - for JSON, grammar, quick tasks */
	NANO: 'gpt-5-nano-2025-08-07',

	/** Mid-tier - for complex reasoning and analysis */
	MINI: 'gpt-5-mini-2025-08-07',

	/** Realtime - for voice conversations */
	REALTIME: 'gpt-5-nano-realtime-preview-2024-12-17'
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];

/**
 * Model configuration with pricing and limits
 */
export const MODEL_CONFIG = {
	[AI_MODELS.NANO]: {
		name: 'GPT-5 Nano',
		description: 'Fastest, most cost-efficient for well-defined tasks',
		pricing: {
			inputPer1M: 0.05,
			cachedInputPer1M: 0.01,
			outputPer1M: 0.4
		},
		limits: {
			contextWindow: 400_000,
			maxOutputTokens: 128_000
		},
		knowledgeCutoff: '2024-05-31'
	},
	[AI_MODELS.MINI]: {
		name: 'GPT-5 Mini',
		description: 'Balanced speed and reasoning for complex tasks',
		pricing: {
			inputPer1M: 0.25,
			cachedInputPer1M: 0.03,
			outputPer1M: 2.0
		},
		limits: {
			contextWindow: 400_000,
			maxOutputTokens: 128_000
		},
		knowledgeCutoff: '2024-05-31'
	},
	[AI_MODELS.REALTIME]: {
		name: 'GPT-4o Mini Realtime',
		description: 'Optimized for real-time audio and text',
		pricing: {
			inputPer1M: 0.6,
			cachedInputPer1M: 0.3,
			outputPer1M: 2.4
		},
		limits: {
			contextWindow: 16_000,
			maxOutputTokens: 4_096
		},
		knowledgeCutoff: '2023-10-01'
	}
} as const;

/**
 * Recommended model for each use case
 *
 * This maps feature areas to the appropriate model.
 * Update this as you add new features or as model capabilities change.
 */
export const MODEL_FOR_TASK = {
	// Quick, structured tasks -> NANO
	grammarCorrection: AI_MODELS.NANO,
	jsonGeneration: AI_MODELS.NANO,
	pathwaySyllabus: AI_MODELS.NANO,
	structuredExtraction: AI_MODELS.NANO,
	simpleTranslation: AI_MODELS.NANO,
	scenarioGeneration: AI_MODELS.NANO,

	// Complex reasoning tasks -> MINI
	detailedAnalysis: AI_MODELS.MINI,
	conversationSummary: AI_MODELS.MINI,
	nuancedFeedback: AI_MODELS.MINI,
	complexReasoning: AI_MODELS.MINI,

	// Voice/realtime -> REALTIME
	voiceConversation: AI_MODELS.REALTIME,
	realtimeChat: AI_MODELS.REALTIME
} as const;

export type TaskType = keyof typeof MODEL_FOR_TASK;

/**
 * Get the recommended model for a specific task
 */
export function getModelForTask(task: TaskType): AIModel {
	return MODEL_FOR_TASK[task];
}

/**
 * Default model for general use (when task type is unknown)
 * Using NANO as default since most tasks are structured/quick
 */
export const DEFAULT_MODEL = AI_MODELS.NANO;
