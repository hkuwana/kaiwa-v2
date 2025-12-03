/**
 * AI Module Type Definitions
 *
 * Common interfaces for multi-provider AI abstraction.
 * All providers implement these interfaces for consistency.
 */

import type { CoreMessage } from 'ai';

// Re-export CoreMessage from AI SDK for convenience
export type { CoreMessage };

/**
 * Simplified message type for internal use
 * Maps to CoreMessage but easier to construct
 */
export interface AIMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

/**
 * Options for AI completion requests
 */
export interface AICompletionOptions {
	/** Specific model to use (overrides task-based routing) */
	model?: string;
	/** Temperature for response randomness (0-1) */
	temperature?: number;
	/** Maximum tokens to generate */
	maxTokens?: number;
	/** Response format - 'json' enables structured output */
	responseFormat?: 'text' | 'json';
}

/**
 * Token usage statistics
 */
export interface AITokenUsage {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
}

/**
 * Response from AI completion
 */
export interface AIResponse {
	/** Generated content */
	content: string;
	/** Provider that handled the request */
	provider: AIProviderType;
	/** Model that was used */
	model: string;
	/** Token usage statistics (if available) */
	usage?: AITokenUsage;
	/** Finish reason (e.g., 'stop', 'length') */
	finishReason?: string;
}

/**
 * Supported AI providers
 */
export const AI_PROVIDERS = {
	OPENAI: 'openai',
	ANTHROPIC: 'anthropic',
	GOOGLE: 'google'
} as const;

export type AIProviderType = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

/**
 * Model tiers for task routing
 */
export const MODEL_TIERS = {
	/** Fast, cheap - for simple tasks */
	FAST: 'fast',
	/** Balanced speed/quality */
	BALANCED: 'balanced',
	/** Premium quality */
	PREMIUM: 'premium',
	/** Real-time/voice */
	REALTIME: 'realtime'
} as const;

export type ModelTier = (typeof MODEL_TIERS)[keyof typeof MODEL_TIERS];

/**
 * Task types that can be routed to different providers/models
 */
export type TaskType =
	| 'grammarCorrection'
	| 'jsonGeneration'
	| 'structuredExtraction'
	| 'simpleTranslation'
	| 'scenarioGeneration'
	| 'detailedAnalysis'
	| 'conversationSummary'
	| 'nuancedFeedback'
	| 'complexReasoning'
	| 'voiceConversation'
	| 'realtimeChat'
	| 'pathwaySyllabus';

/**
 * Task routing configuration
 */
export interface TaskRoute {
	provider: AIProviderType;
	tier: ModelTier;
}

/**
 * Tool definition for function calling
 * Based on AI SDK's tool format
 */
export interface AITool {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
	execute?: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Options for completion with tools
 */
export interface AICompletionWithToolsOptions extends AICompletionOptions {
	tools?: AITool[];
	/** Maximum number of tool call iterations */
	maxSteps?: number;
}

/**
 * Provider configuration
 */
export interface AIProviderConfig {
	name: string;
	displayName: string;
	models: Record<ModelTier, string>;
	isAvailable: () => boolean;
}
