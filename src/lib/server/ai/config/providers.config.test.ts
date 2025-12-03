// src/lib/server/ai/config/providers.config.test.ts
// Unit tests for provider configuration

import { describe, expect, it, vi } from 'vitest';

// Mock environment variables - using inline object since env is static
vi.mock('$env/dynamic/private', () => ({
	env: {
		OPENAI_API_KEY: 'test-openai-key',
		ANTHROPIC_API_KEY: 'test-anthropic-key',
		GOOGLE_AI_API_KEY: 'test-google-key'
	}
}));

// Import after mock
import {
	PROVIDER_CONFIGS,
	getModelForTier,
	isProviderAvailable,
	getAvailableProviders,
	getFallbackProvider,
	DEFAULT_PROVIDER,
	DEFAULT_TIER
} from './providers.config';

describe('Provider Configuration', () => {
	describe('PROVIDER_CONFIGS', () => {
		it('should have configuration for all three providers', () => {
			expect(PROVIDER_CONFIGS.openai).toBeDefined();
			expect(PROVIDER_CONFIGS.anthropic).toBeDefined();
			expect(PROVIDER_CONFIGS.google).toBeDefined();
		});

		it('should have model mappings for all tiers', () => {
			const tiers = ['fast', 'balanced', 'premium', 'realtime'] as const;

			Object.values(PROVIDER_CONFIGS).forEach((config) => {
				tiers.forEach((tier) => {
					expect(config.models[tier]).toBeDefined();
					expect(typeof config.models[tier]).toBe('string');
				});
			});
		});

		it('should have correct OpenAI model names', () => {
			expect(PROVIDER_CONFIGS.openai.models.fast).toContain('gpt-5');
			expect(PROVIDER_CONFIGS.openai.models.realtime).toContain('realtime');
		});

		it('should have correct Anthropic model names', () => {
			expect(PROVIDER_CONFIGS.anthropic.models.fast).toContain('claude');
			expect(PROVIDER_CONFIGS.anthropic.models.fast).toContain('haiku');
		});

		it('should have correct Google model names', () => {
			expect(PROVIDER_CONFIGS.google.models.fast).toContain('gemini');
		});
	});

	describe('getModelForTier', () => {
		it('should return correct model for OpenAI fast tier', () => {
			const model = getModelForTier('openai', 'fast');
			expect(model).toBe(PROVIDER_CONFIGS.openai.models.fast);
		});

		it('should return correct model for Anthropic balanced tier', () => {
			const model = getModelForTier('anthropic', 'balanced');
			expect(model).toBe(PROVIDER_CONFIGS.anthropic.models.balanced);
		});

		it('should return correct model for Google premium tier', () => {
			const model = getModelForTier('google', 'premium');
			expect(model).toBe(PROVIDER_CONFIGS.google.models.premium);
		});
	});

	describe('isProviderAvailable', () => {
		it('should return true when API key is configured', () => {
			expect(isProviderAvailable('openai')).toBe(true);
			expect(isProviderAvailable('anthropic')).toBe(true);
			expect(isProviderAvailable('google')).toBe(true);
		});
	});

	describe('getAvailableProviders', () => {
		it('should return all providers when all keys are configured', () => {
			const providers = getAvailableProviders();
			expect(providers).toContain('openai');
			expect(providers).toContain('anthropic');
			expect(providers).toContain('google');
			expect(providers).toHaveLength(3);
		});
	});

	describe('getFallbackProvider', () => {
		it('should return primary provider when available', () => {
			expect(getFallbackProvider('openai')).toBe('openai');
			expect(getFallbackProvider('anthropic')).toBe('anthropic');
			expect(getFallbackProvider('google')).toBe('google');
		});
	});

	describe('defaults', () => {
		it('should have sensible default provider', () => {
			expect(DEFAULT_PROVIDER).toBe('openai');
		});

		it('should have sensible default tier', () => {
			expect(DEFAULT_TIER).toBe('fast');
		});
	});
});
