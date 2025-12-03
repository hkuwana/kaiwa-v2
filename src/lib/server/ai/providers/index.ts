/**
 * AI Provider Factory
 *
 * Creates and manages AI SDK provider instances.
 * Uses lazy initialization to avoid creating clients until needed.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { env } from '$env/dynamic/private';
import type { AIProviderType } from '../types';
import { logger } from '$lib/logger';

// Lazy-initialized provider instances
let _openaiProvider: ReturnType<typeof createOpenAI> | null = null;
let _anthropicProvider: ReturnType<typeof createAnthropic> | null = null;
let _googleProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

/**
 * Get or create OpenAI provider instance
 */
export function getOpenAIProvider() {
	if (!_openaiProvider) {
		const apiKey = env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error('OPENAI_API_KEY is not configured');
		}
		_openaiProvider = createOpenAI({
			apiKey,
			compatibility: 'strict'
		});
		logger.info('[AI Providers] OpenAI provider initialized');
	}
	return _openaiProvider;
}

/**
 * Get or create Anthropic provider instance
 */
export function getAnthropicProvider() {
	if (!_anthropicProvider) {
		const apiKey = env.ANTHROPIC_API_KEY;
		if (!apiKey) {
			throw new Error('ANTHROPIC_API_KEY is not configured');
		}
		_anthropicProvider = createAnthropic({
			apiKey
		});
		logger.info('[AI Providers] Anthropic provider initialized');
	}
	return _anthropicProvider;
}

/**
 * Get or create Google provider instance
 */
export function getGoogleProvider() {
	if (!_googleProvider) {
		const apiKey = env.GOOGLE_AI_API_KEY;
		if (!apiKey) {
			throw new Error('GOOGLE_AI_API_KEY is not configured');
		}
		_googleProvider = createGoogleGenerativeAI({
			apiKey
		});
		logger.info('[AI Providers] Google provider initialized');
	}
	return _googleProvider;
}

/**
 * Get a language model instance for the specified provider and model
 */
export function getLanguageModel(provider: AIProviderType, modelId: string) {
	switch (provider) {
		case 'openai':
			return getOpenAIProvider()(modelId);
		case 'anthropic':
			return getAnthropicProvider()(modelId);
		case 'google':
			return getGoogleProvider()(modelId);
		default:
			throw new Error(`Unknown provider: ${provider}`);
	}
}

/**
 * Check if a provider is configured and available
 */
export function isProviderConfigured(provider: AIProviderType): boolean {
	switch (provider) {
		case 'openai':
			return !!env.OPENAI_API_KEY;
		case 'anthropic':
			return !!env.ANTHROPIC_API_KEY;
		case 'google':
			return !!env.GOOGLE_AI_API_KEY;
		default:
			return false;
	}
}

/**
 * Reset all provider instances (useful for testing)
 */
export function resetProviders(): void {
	_openaiProvider = null;
	_anthropicProvider = null;
	_googleProvider = null;
}
