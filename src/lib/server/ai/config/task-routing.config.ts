/**
 * Task Routing Configuration (Server-Side Only)
 *
 * Maps task types to specific providers and model tiers.
 * This allows optimizing cost/speed/quality per use case.
 *
 * Routing Strategy:
 * -----------------
 * - Fast tasks (JSON, grammar, extraction) → Claude Haiku / Gemini Flash
 * - Complex tasks (analysis, summaries) → GPT-5 Mini / Claude Sonnet
 * - Realtime/Voice → OpenAI Realtime (only option with full support)
 */

import type { TaskType, TaskRoute, AIProviderType, ModelTier } from '../types';
import { AI_PROVIDERS, MODEL_TIERS } from '../types';

/**
 * Task to provider/tier routing
 *
 * Update this mapping to change which provider handles each task type.
 * The routing is intentionally explicit for easy auditing and changes.
 */
export const TASK_ROUTING: Record<TaskType, TaskRoute> = {
	// Fast tasks → Claude Haiku (fast, reliable for structured output)
	grammarCorrection: {
		provider: AI_PROVIDERS.ANTHROPIC,
		tier: MODEL_TIERS.FAST
	},
	jsonGeneration: {
		provider: AI_PROVIDERS.ANTHROPIC,
		tier: MODEL_TIERS.FAST
	},
	structuredExtraction: {
		provider: AI_PROVIDERS.ANTHROPIC,
		tier: MODEL_TIERS.FAST
	},
	simpleTranslation: {
		provider: AI_PROVIDERS.GOOGLE, // Gemini is excellent for translation
		tier: MODEL_TIERS.FAST
	},
	scenarioGeneration: {
		provider: AI_PROVIDERS.ANTHROPIC,
		tier: MODEL_TIERS.FAST
	},
	pathwaySyllabus: {
		provider: AI_PROVIDERS.ANTHROPIC,
		tier: MODEL_TIERS.FAST
	},

	// Complex tasks → OpenAI GPT-5 Mini (good balance of speed/quality)
	detailedAnalysis: {
		provider: AI_PROVIDERS.OPENAI,
		tier: MODEL_TIERS.BALANCED
	},
	conversationSummary: {
		provider: AI_PROVIDERS.OPENAI,
		tier: MODEL_TIERS.BALANCED
	},
	nuancedFeedback: {
		provider: AI_PROVIDERS.OPENAI,
		tier: MODEL_TIERS.BALANCED
	},
	complexReasoning: {
		provider: AI_PROVIDERS.OPENAI,
		tier: MODEL_TIERS.BALANCED
	},

	// Realtime → OpenAI (only provider with proper realtime support)
	voiceConversation: {
		provider: AI_PROVIDERS.OPENAI,
		tier: MODEL_TIERS.REALTIME
	},
	realtimeChat: {
		provider: AI_PROVIDERS.OPENAI,
		tier: MODEL_TIERS.REALTIME
	}
};

/**
 * Get the routing for a specific task
 */
export function getTaskRoute(task: TaskType): TaskRoute {
	return TASK_ROUTING[task];
}

/**
 * Get all tasks routed to a specific provider
 */
export function getTasksForProvider(provider: AIProviderType): TaskType[] {
	return (Object.entries(TASK_ROUTING) as [TaskType, TaskRoute][])
		.filter(([, route]) => route.provider === provider)
		.map(([task]) => task);
}

/**
 * Get all tasks routed to a specific tier
 */
export function getTasksForTier(tier: ModelTier): TaskType[] {
	return (Object.entries(TASK_ROUTING) as [TaskType, TaskRoute][])
		.filter(([, route]) => route.tier === tier)
		.map(([task]) => task);
}

/**
 * Override routing for a task at runtime
 * Useful for A/B testing or emergency fallbacks
 */
export function createTaskRouteOverride(
	overrides: Partial<Record<TaskType, TaskRoute>>
): Record<TaskType, TaskRoute> {
	return {
		...TASK_ROUTING,
		...overrides
	};
}

/**
 * Default route when task type is not specified
 */
export const DEFAULT_TASK_ROUTE: TaskRoute = {
	provider: AI_PROVIDERS.ANTHROPIC,
	tier: MODEL_TIERS.FAST
};
