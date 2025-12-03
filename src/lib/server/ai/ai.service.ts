/**
 * Unified AI Service
 *
 * Main entry point for all AI completions across providers.
 * Uses Vercel AI SDK for consistent interface across OpenAI, Anthropic, and Google.
 *
 * Features:
 * - Task-based routing to optimal provider/model
 * - Automatic fallback when provider is unavailable
 * - Consistent response format across all providers
 * - Support for text and JSON response formats
 * - Tool/function calling support (for future use)
 */

import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { logger } from '$lib/logger';
import type {
	AIMessage,
	AICompletionOptions,
	AIResponse,
	TaskType,
	AIProviderType,
	ModelTier,
	CoreMessage,
	AICompletionWithToolsOptions
} from './types';
import { getLanguageModel, isProviderConfigured } from './providers';
import {
	getModelForTier,
	getFallbackProvider,
	DEFAULT_PROVIDER,
	DEFAULT_TIER
} from './config/providers.config';
import { getTaskRoute, DEFAULT_TASK_ROUTE } from './config/task-routing.config';

/**
 * Extended completion options with task-based routing
 */
export interface CreateCompletionOptions extends AICompletionOptions {
	/** Task type for automatic provider/model routing */
	task?: TaskType;
	/** Override provider (ignores task routing) */
	provider?: AIProviderType;
	/** Override model tier */
	tier?: ModelTier;
}

/**
 * Convert simple AIMessage to CoreMessage format
 */
function toCoreMesages(messages: AIMessage[]): CoreMessage[] {
	return messages.map((msg) => ({
		role: msg.role,
		content: msg.content
	}));
}

/**
 * Resolve provider and model based on options
 */
function resolveProviderAndModel(options: CreateCompletionOptions): {
	provider: AIProviderType;
	model: string;
} {
	// If model is explicitly specified, use default provider
	if (options.model) {
		const provider = options.provider ?? DEFAULT_PROVIDER;
		return { provider, model: options.model };
	}

	// Get routing from task or use defaults
	const route = options.task ? getTaskRoute(options.task) : DEFAULT_TASK_ROUTE;

	// Apply overrides
	const requestedProvider = options.provider ?? route.provider;
	const tier = options.tier ?? route.tier;

	// Check availability and get fallback if needed
	const provider = getFallbackProvider(requestedProvider);
	if (!provider) {
		throw new Error(
			`No AI provider available. Requested: ${requestedProvider}. ` +
				`Please configure at least one of: OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_AI_API_KEY`
		);
	}

	// Warn if using fallback
	if (provider !== requestedProvider) {
		logger.warn(`[AI Service] Provider ${requestedProvider} unavailable, using fallback: ${provider}`);
	}

	const model = getModelForTier(provider, tier);
	return { provider, model };
}

/**
 * Create a completion using the AI SDK
 *
 * This is the main function for generating AI responses.
 * Supports task-based routing, automatic fallbacks, and both text/JSON formats.
 *
 * @example
 * // Simple text completion
 * const response = await createCompletion(
 *   [{ role: 'user', content: 'Hello!' }],
 *   { task: 'grammarCorrection' }
 * );
 *
 * @example
 * // JSON response
 * const response = await createCompletion(
 *   [{ role: 'system', content: 'Return JSON' }, { role: 'user', content: 'List 3 colors' }],
 *   { task: 'jsonGeneration', responseFormat: 'json' }
 * );
 */
export async function createCompletion(
	messages: AIMessage[],
	options: CreateCompletionOptions = {}
): Promise<AIResponse> {
	const { temperature = 0.7, maxTokens = 1000, responseFormat = 'text' } = options;

	const { provider, model } = resolveProviderAndModel(options);
	const languageModel = getLanguageModel(provider, model);

	const startTime = Date.now();

	logger.info('[AI Service] Request:', {
		provider,
		model,
		task: options.task,
		messagesCount: messages.length,
		responseFormat,
		temperature,
		maxTokens
	});

	try {
		const result = await generateText({
			model: languageModel,
			messages: toCoreMesages(messages),
			temperature,
			maxTokens
		});

		const duration = Date.now() - startTime;

		logger.info('[AI Service] Response:', {
			provider,
			model,
			durationMs: duration,
			finishReason: result.finishReason,
			usage: result.usage
		});

		// Check for truncated response
		if (result.finishReason === 'length' && !result.text) {
			throw new Error(
				`Response truncated: model exhausted token limit (${maxTokens}) without producing output. Increase maxTokens.`
			);
		}

		if (result.finishReason === 'length') {
			logger.warn('[AI Service] Response may be truncated (finish_reason: length)', {
				contentLength: result.text.length,
				maxTokens
			});
		}

		return {
			content: result.text,
			provider,
			model,
			finishReason: result.finishReason,
			usage: result.usage
				? {
						promptTokens: result.usage.promptTokens,
						completionTokens: result.usage.completionTokens,
						totalTokens: result.usage.totalTokens
					}
				: undefined
		};
	} catch (error) {
		logger.error('[AI Service] Error:', {
			provider,
			model,
			task: options.task,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error(
			`AI completion failed (${provider}/${model}): ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Generate a structured JSON object using AI SDK's generateObject
 *
 * This uses AI SDK's native schema validation for reliable JSON output.
 *
 * @example
 * const result = await createStructuredCompletion(
 *   [{ role: 'user', content: 'Analyze this text' }],
 *   z.object({ sentiment: z.string(), score: z.number() }),
 *   { task: 'structuredExtraction' }
 * );
 */
export async function createStructuredCompletion<T>(
	messages: AIMessage[],
	schema: z.ZodSchema<T>,
	options: CreateCompletionOptions = {}
): Promise<{ data: T; provider: AIProviderType; model: string; usage?: AIResponse['usage'] }> {
	const { temperature = 0.3, maxTokens = 1000 } = options;

	const { provider, model } = resolveProviderAndModel(options);
	const languageModel = getLanguageModel(provider, model);

	const startTime = Date.now();

	logger.info('[AI Service] Structured Request:', {
		provider,
		model,
		task: options.task,
		messagesCount: messages.length
	});

	try {
		const result = await generateObject({
			model: languageModel,
			messages: toCoreMesages(messages),
			schema,
			temperature,
			maxTokens
		});

		const duration = Date.now() - startTime;

		logger.info('[AI Service] Structured Response:', {
			provider,
			model,
			durationMs: duration,
			finishReason: result.finishReason,
			usage: result.usage
		});

		return {
			data: result.object,
			provider,
			model,
			usage: result.usage
				? {
						promptTokens: result.usage.promptTokens,
						completionTokens: result.usage.completionTokens,
						totalTokens: result.usage.totalTokens
					}
				: undefined
		};
	} catch (error) {
		logger.error('[AI Service] Structured Error:', {
			provider,
			model,
			task: options.task,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error(
			`Structured AI completion failed (${provider}/${model}): ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Create a completion with tool/function calling support
 *
 * This enables the AI to call defined tools during the conversation.
 * Useful for actions like fetching current events, database lookups, etc.
 *
 * @example
 * const response = await createCompletionWithTools(
 *   [{ role: 'user', content: 'What is the weather?' }],
 *   {
 *     task: 'realtimeChat',
 *     tools: [{
 *       name: 'getWeather',
 *       description: 'Get current weather',
 *       parameters: { location: { type: 'string' } },
 *       execute: async ({ location }) => fetchWeather(location)
 *     }],
 *     maxSteps: 3
 *   }
 * );
 */
export async function createCompletionWithTools(
	messages: AIMessage[],
	options: AICompletionWithToolsOptions & CreateCompletionOptions
): Promise<AIResponse & { toolCalls?: Array<{ name: string; args: unknown; result: unknown }> }> {
	const { temperature = 0.7, maxTokens = 1000, tools = [], maxSteps = 5 } = options;

	const { provider, model } = resolveProviderAndModel(options);
	const languageModel = getLanguageModel(provider, model);

	// Convert our tool format to AI SDK format
	const aiSdkTools: Record<string, { description: string; parameters: z.ZodTypeAny; execute?: (args: unknown) => Promise<unknown> }> = {};
	for (const tool of tools) {
		aiSdkTools[tool.name] = {
			description: tool.description,
			parameters: z.object(tool.parameters as z.ZodRawShape),
			execute: tool.execute as (args: unknown) => Promise<unknown>
		};
	}

	const startTime = Date.now();

	logger.info('[AI Service] Tools Request:', {
		provider,
		model,
		task: options.task,
		toolCount: tools.length,
		toolNames: tools.map((t) => t.name)
	});

	try {
		const result = await generateText({
			model: languageModel,
			messages: toCoreMesages(messages),
			tools: aiSdkTools,
			maxSteps,
			temperature,
			maxTokens
		});

		const duration = Date.now() - startTime;

		// Extract tool calls from steps
		const toolCalls = result.steps
			?.flatMap((step) =>
				step.toolCalls?.map((tc) => ({
					name: tc.toolName,
					args: tc.args,
					result: step.toolResults?.find((tr) => tr.toolCallId === tc.toolCallId)?.result
				}))
			)
			.filter(Boolean) as Array<{ name: string; args: unknown; result: unknown }> | undefined;

		logger.info('[AI Service] Tools Response:', {
			provider,
			model,
			durationMs: duration,
			stepsCount: result.steps?.length,
			toolCallsCount: toolCalls?.length ?? 0
		});

		return {
			content: result.text,
			provider,
			model,
			finishReason: result.finishReason,
			usage: result.usage
				? {
						promptTokens: result.usage.promptTokens,
						completionTokens: result.usage.completionTokens,
						totalTokens: result.usage.totalTokens
					}
				: undefined,
			toolCalls
		};
	} catch (error) {
		logger.error('[AI Service] Tools Error:', {
			provider,
			model,
			error: error instanceof Error ? error.message : 'Unknown error'
		});
		throw new Error(
			`AI completion with tools failed (${provider}/${model}): ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

/**
 * Validate and clean JSON response (backward compatibility helper)
 *
 * Use createStructuredCompletion with a Zod schema instead when possible.
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
		logger.error('[AI Service] Failed to parse JSON:', error);
		return null;
	}
}

/**
 * Check which providers are currently available
 */
export function getAvailableProviders(): AIProviderType[] {
	const providers: AIProviderType[] = ['openai', 'anthropic', 'google'];
	return providers.filter(isProviderConfigured);
}
