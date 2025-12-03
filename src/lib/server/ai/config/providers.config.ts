/**
 * AI Providers Configuration (Server-Side Only)
 *
 * Defines available providers and their model mappings.
 * Keep this server-side to prevent API key exposure.
 *
 * Model Selection Guide:
 * ----------------------
 *
 * FAST TIER (for quick, structured tasks):
 * - Claude 3.5 Haiku: Fast, efficient ($0.80/1M input, $4/1M output)
 * - Gemini 2.0 Flash: Very fast, good for JSON ($0.10/1M input, $0.40/1M output)
 *
 * BALANCED TIER (for complex reasoning):
 * - GPT-5 Mini: Good reasoning ($0.25/1M input, $2/1M output)
 * - Claude 3.5 Sonnet: Excellent quality ($3/1M input, $15/1M output)
 *
 * PREMIUM TIER (for highest quality):
 * - Claude Opus 4: Best quality ($15/1M input, $75/1M output)
 * - GPT-5: Highest capability
 *
 * REALTIME TIER (for voice/streaming):
 * - GPT-5 Nano Realtime: Optimized for real-time audio
 */

import { env } from '$env/dynamic/private';
import type { AIProviderConfig, AIProviderType, ModelTier } from '../types';

/**
 * Provider configurations with model mappings
 */
export const PROVIDER_CONFIGS: Record<AIProviderType, AIProviderConfig> = {
	openai: {
		name: 'openai',
		displayName: 'OpenAI',
		models: {
			fast: 'gpt-5-nano-2025-08-07',
			balanced: 'gpt-5-mini-2025-08-07',
			premium: 'gpt-5-mini-2025-08-07', // Using mini as premium for now
			realtime: 'gpt-5-nano-realtime-preview-2024-12-17'
		},
		isAvailable: () => !!env.OPENAI_API_KEY
	},
	anthropic: {
		name: 'anthropic',
		displayName: 'Anthropic (Claude)',
		models: {
			fast: 'claude-3-5-haiku-20241022',
			balanced: 'claude-sonnet-4-20250514',
			premium: 'claude-opus-4-20250514',
			realtime: 'claude-sonnet-4-20250514' // No realtime, use balanced
		},
		isAvailable: () => !!env.ANTHROPIC_API_KEY
	},
	google: {
		name: 'google',
		displayName: 'Google (Gemini)',
		models: {
			fast: 'gemini-2.0-flash',
			balanced: 'gemini-1.5-pro',
			premium: 'gemini-1.5-pro',
			realtime: 'gemini-2.0-flash' // No realtime, use fast
		},
		isAvailable: () => !!env.GOOGLE_AI_API_KEY
	}
};

/**
 * Get the model ID for a provider and tier
 */
export function getModelForTier(provider: AIProviderType, tier: ModelTier): string {
	return PROVIDER_CONFIGS[provider].models[tier];
}

/**
 * Check if a provider is available (has API key configured)
 */
export function isProviderAvailable(provider: AIProviderType): boolean {
	return PROVIDER_CONFIGS[provider].isAvailable();
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): AIProviderType[] {
	return (Object.keys(PROVIDER_CONFIGS) as AIProviderType[]).filter(isProviderAvailable);
}

/**
 * Default provider to use when task routing isn't specified
 */
export const DEFAULT_PROVIDER: AIProviderType = 'openai';

/**
 * Default model tier
 */
export const DEFAULT_TIER: ModelTier = 'fast';

/**
 * Fallback chain when primary provider is unavailable
 * Order matters - first available is used
 */
export const PROVIDER_FALLBACK_CHAIN: Record<AIProviderType, AIProviderType[]> = {
	openai: ['anthropic', 'google'],
	anthropic: ['openai', 'google'],
	google: ['anthropic', 'openai']
};

/**
 * Get a fallback provider if primary is unavailable
 */
export function getFallbackProvider(primary: AIProviderType): AIProviderType | null {
	if (isProviderAvailable(primary)) {
		return primary;
	}

	const fallbacks = PROVIDER_FALLBACK_CHAIN[primary];
	for (const fallback of fallbacks) {
		if (isProviderAvailable(fallback)) {
			return fallback;
		}
	}

	return null;
}
