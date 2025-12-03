/**
 * AI Module Public API
 *
 * Main entry point for the multi-provider AI abstraction.
 *
 * @example
 * import { createCompletion, createStructuredCompletion } from '$lib/server/ai';
 *
 * // Task-based routing (automatic provider selection)
 * const response = await createCompletion(
 *   [{ role: 'user', content: 'Hello!' }],
 *   { task: 'grammarCorrection' }
 * );
 *
 * // Structured JSON with schema validation
 * const result = await createStructuredCompletion(
 *   [{ role: 'user', content: 'Analyze sentiment' }],
 *   z.object({ sentiment: z.enum(['positive', 'negative', 'neutral']) }),
 *   { task: 'structuredExtraction' }
 * );
 */

// Main service functions
export {
	createCompletion,
	createStructuredCompletion,
	createCompletionWithTools,
	parseAndValidateJSON,
	getAvailableProviders,
	type CreateCompletionOptions
} from './ai.service';

// Types
export type {
	AIMessage,
	AICompletionOptions,
	AIResponse,
	AITokenUsage,
	AIProviderType,
	TaskType,
	ModelTier,
	TaskRoute,
	AITool,
	AICompletionWithToolsOptions,
	CoreMessage
} from './types';

export { AI_PROVIDERS, MODEL_TIERS } from './types';

// Configuration (for advanced use cases)
export {
	PROVIDER_CONFIGS,
	getModelForTier,
	isProviderAvailable,
	getAvailableProviders as getAvailableProvidersFromConfig,
	DEFAULT_PROVIDER,
	DEFAULT_TIER
} from './config/providers.config';

export {
	TASK_ROUTING,
	getTaskRoute,
	getTasksForProvider,
	getTasksForTier,
	createTaskRouteOverride
} from './config/task-routing.config';

// Provider factory (for direct provider access)
export {
	getLanguageModel,
	getOpenAIProvider,
	getAnthropicProvider,
	getGoogleProvider,
	isProviderConfigured,
	resetProviders
} from './providers';
