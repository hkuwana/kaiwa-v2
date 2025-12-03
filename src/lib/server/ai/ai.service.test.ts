// src/lib/server/ai/ai.service.test.ts
// Comprehensive unit tests for the multi-provider AI service

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

// Use vi.hoisted() to ensure mock variables are available when vi.mock() factories run
const {
	mockGenerateText,
	mockGenerateObject,
	mockOpenAIProvider,
	mockAnthropicProvider,
	mockGoogleProvider
} = vi.hoisted(() => ({
	mockGenerateText: vi.fn(),
	mockGenerateObject: vi.fn(),
	mockOpenAIProvider: vi.fn(() => 'openai-model-instance'),
	mockAnthropicProvider: vi.fn(() => 'anthropic-model-instance'),
	mockGoogleProvider: vi.fn(() => 'google-model-instance')
}));

// Mock generateText and generateObject from AI SDK
vi.mock('ai', () => ({
	generateText: mockGenerateText,
	generateObject: mockGenerateObject
}));

// Mock environment variables
vi.mock('$env/dynamic/private', () => ({
	env: {
		OPENAI_API_KEY: 'test-openai-key',
		ANTHROPIC_API_KEY: 'test-anthropic-key',
		GOOGLE_AI_API_KEY: 'test-google-key'
	}
}));

// Mock logger
vi.mock('$lib/logger', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn()
	}
}));

// Mock provider SDK functions
vi.mock('@ai-sdk/openai', () => ({
	createOpenAI: vi.fn(() => mockOpenAIProvider)
}));

vi.mock('@ai-sdk/anthropic', () => ({
	createAnthropic: vi.fn(() => mockAnthropicProvider)
}));

vi.mock('@ai-sdk/google', () => ({
	createGoogleGenerativeAI: vi.fn(() => mockGoogleProvider)
}));

// Import after mocks
import {
	createCompletion,
	createStructuredCompletion,
	createCompletionWithTools,
	parseAndValidateJSON,
	getAvailableProviders
} from './ai.service';

describe('AI Service', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createCompletion', () => {
		it('should route grammarCorrection task to Anthropic provider', async () => {
			mockGenerateText.mockResolvedValueOnce({
				text: 'Test response',
				finishReason: 'stop',
				usage: {
					promptTokens: 10,
					completionTokens: 20,
					totalTokens: 30
				}
			});

			const response = await createCompletion(
				[{ role: 'user', content: 'Hello' }],
				{ task: 'grammarCorrection' }
			);

			expect(response.content).toBe('Test response');
			expect(response.provider).toBe('anthropic');
			expect(response.usage?.totalTokens).toBe(30);
			expect(mockGenerateText).toHaveBeenCalledTimes(1);
		});

		it('should route detailedAnalysis task to OpenAI provider', async () => {
			mockGenerateText.mockResolvedValueOnce({
				text: 'Analysis result',
				finishReason: 'stop',
				usage: {
					promptTokens: 50,
					completionTokens: 100,
					totalTokens: 150
				}
			});

			const response = await createCompletion(
				[
					{ role: 'system', content: 'Analyze this' },
					{ role: 'user', content: 'Text to analyze' }
				],
				{ task: 'detailedAnalysis' }
			);

			expect(response.content).toBe('Analysis result');
			expect(response.provider).toBe('openai');
		});

		it('should use default routing when no task specified', async () => {
			mockGenerateText.mockResolvedValueOnce({
				text: 'Default response',
				finishReason: 'stop'
			});

			const response = await createCompletion([
				{ role: 'user', content: 'Hello' }
			]);

			expect(response.content).toBe('Default response');
			// Default should route to anthropic (fast tier)
			expect(response.provider).toBe('anthropic');
		});

		it('should respect explicit model override', async () => {
			mockGenerateText.mockResolvedValueOnce({
				text: 'Custom model response',
				finishReason: 'stop'
			});

			const response = await createCompletion(
				[{ role: 'user', content: 'Hello' }],
				{ model: 'custom-model-id' }
			);

			expect(response.content).toBe('Custom model response');
		});

		it('should throw error when response is truncated with no content', async () => {
			mockGenerateText.mockResolvedValueOnce({
				text: '',
				finishReason: 'length',
				usage: {
					promptTokens: 100,
					completionTokens: 1000,
					totalTokens: 1100
				}
			});

			await expect(
				createCompletion(
					[{ role: 'user', content: 'Long request' }],
					{ maxTokens: 1000 }
				)
			).rejects.toThrow('Response truncated');
		});

		it('should handle API errors gracefully', async () => {
			mockGenerateText.mockRejectedValueOnce(new Error('API rate limit exceeded'));

			await expect(
				createCompletion([{ role: 'user', content: 'Hello' }])
			).rejects.toThrow('AI completion failed');
		});
	});

	describe('createStructuredCompletion', () => {
		it('should return validated structured data', async () => {
			const testSchema = z.object({
				name: z.string(),
				score: z.number()
			});

			mockGenerateObject.mockResolvedValueOnce({
				object: { name: 'Test', score: 85 },
				finishReason: 'stop',
				usage: {
					promptTokens: 20,
					completionTokens: 10,
					totalTokens: 30
				}
			});

			const result = await createStructuredCompletion(
				[{ role: 'user', content: 'Analyze' }],
				testSchema,
				{ task: 'structuredExtraction' }
			);

			expect(result.data).toEqual({ name: 'Test', score: 85 });
			expect(result.provider).toBe('anthropic');
		});

		it('should handle schema validation errors', async () => {
			const testSchema = z.object({
				required_field: z.string()
			});

			mockGenerateObject.mockRejectedValueOnce(
				new Error('Schema validation failed')
			);

			await expect(
				createStructuredCompletion(
					[{ role: 'user', content: 'Invalid' }],
					testSchema
				)
			).rejects.toThrow('Structured AI completion failed');
		});
	});

	describe('createCompletionWithTools', () => {
		it('should handle tool calls and return results', async () => {
			mockGenerateText.mockResolvedValueOnce({
				text: 'Used tool to get weather',
				finishReason: 'stop',
				steps: [
					{
						toolCalls: [
							{
								toolCallId: 'call-1',
								toolName: 'getWeather',
								args: { location: 'Tokyo' }
							}
						],
						toolResults: [
							{
								toolCallId: 'call-1',
								result: { temp: 25, condition: 'sunny' }
							}
						]
					}
				],
				usage: {
					promptTokens: 30,
					completionTokens: 50,
					totalTokens: 80
				}
			});

			const response = await createCompletionWithTools(
				[{ role: 'user', content: 'What is the weather in Tokyo?' }],
				{
					task: 'realtimeChat',
					tools: [
						{
							name: 'getWeather',
							description: 'Get weather for a location',
							parameters: { location: { type: 'string' } }
						}
					]
				}
			);

			expect(response.content).toBe('Used tool to get weather');
			expect(response.toolCalls).toHaveLength(1);
			expect(response.toolCalls?.[0].name).toBe('getWeather');
			expect(response.toolCalls?.[0].result).toEqual({
				temp: 25,
				condition: 'sunny'
			});
		});
	});

	describe('parseAndValidateJSON', () => {
		it('should parse valid JSON', () => {
			const result = parseAndValidateJSON<{ key: string }>('{"key": "value"}');
			expect(result).toEqual({ key: 'value' });
		});

		it('should handle JSON with markdown code blocks', () => {
			const result = parseAndValidateJSON<{ key: string }>(
				'```json\n{"key": "value"}\n```'
			);
			expect(result).toEqual({ key: 'value' });
		});

		it('should return null for invalid JSON', () => {
			const result = parseAndValidateJSON('not valid json');
			expect(result).toBeNull();
		});
	});

	describe('getAvailableProviders', () => {
		it('should return all providers when all API keys are configured', () => {
			const providers = getAvailableProviders();
			expect(providers).toContain('openai');
			expect(providers).toContain('anthropic');
			expect(providers).toContain('google');
		});
	});
});

describe('Task Routing', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGenerateText.mockResolvedValue({
			text: 'Response',
			finishReason: 'stop'
		});
	});

	const taskToProviderTests = [
		{ task: 'grammarCorrection', expectedProvider: 'anthropic' },
		{ task: 'jsonGeneration', expectedProvider: 'anthropic' },
		{ task: 'structuredExtraction', expectedProvider: 'anthropic' },
		{ task: 'simpleTranslation', expectedProvider: 'google' },
		{ task: 'scenarioGeneration', expectedProvider: 'anthropic' },
		{ task: 'pathwaySyllabus', expectedProvider: 'anthropic' },
		{ task: 'detailedAnalysis', expectedProvider: 'openai' },
		{ task: 'conversationSummary', expectedProvider: 'openai' },
		{ task: 'nuancedFeedback', expectedProvider: 'openai' },
		{ task: 'complexReasoning', expectedProvider: 'openai' },
		{ task: 'voiceConversation', expectedProvider: 'openai' },
		{ task: 'realtimeChat', expectedProvider: 'openai' }
	] as const;

	taskToProviderTests.forEach(({ task, expectedProvider }) => {
		it(`should route ${task} to ${expectedProvider}`, async () => {
			const response = await createCompletion(
				[{ role: 'user', content: 'Test' }],
				{ task }
			);
			expect(response.provider).toBe(expectedProvider);
		});
	});
});
