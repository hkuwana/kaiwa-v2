// src/lib/server/ai/config/task-routing.config.test.ts
// Unit tests for task routing configuration

import { describe, expect, it } from 'vitest';
import {
	TASK_ROUTING,
	getTaskRoute,
	getTasksForProvider,
	getTasksForTier,
	createTaskRouteOverride,
	DEFAULT_TASK_ROUTE
} from './task-routing.config';

describe('Task Routing Configuration', () => {
	describe('TASK_ROUTING', () => {
		it('should have routing for all defined task types', () => {
			const expectedTasks = [
				'grammarCorrection',
				'jsonGeneration',
				'structuredExtraction',
				'simpleTranslation',
				'scenarioGeneration',
				'pathwaySyllabus',
				'detailedAnalysis',
				'conversationSummary',
				'nuancedFeedback',
				'complexReasoning',
				'voiceConversation',
				'realtimeChat'
			];

			expectedTasks.forEach((task) => {
				expect(TASK_ROUTING[task as keyof typeof TASK_ROUTING]).toBeDefined();
			});
		});

		it('should route fast tasks to Anthropic', () => {
			expect(TASK_ROUTING.grammarCorrection.provider).toBe('anthropic');
			expect(TASK_ROUTING.jsonGeneration.provider).toBe('anthropic');
			expect(TASK_ROUTING.structuredExtraction.provider).toBe('anthropic');
			expect(TASK_ROUTING.scenarioGeneration.provider).toBe('anthropic');
			expect(TASK_ROUTING.pathwaySyllabus.provider).toBe('anthropic');
		});

		it('should route translation to Google', () => {
			expect(TASK_ROUTING.simpleTranslation.provider).toBe('google');
		});

		it('should route complex tasks to OpenAI', () => {
			expect(TASK_ROUTING.detailedAnalysis.provider).toBe('openai');
			expect(TASK_ROUTING.conversationSummary.provider).toBe('openai');
			expect(TASK_ROUTING.nuancedFeedback.provider).toBe('openai');
			expect(TASK_ROUTING.complexReasoning.provider).toBe('openai');
		});

		it('should route realtime tasks to OpenAI', () => {
			expect(TASK_ROUTING.voiceConversation.provider).toBe('openai');
			expect(TASK_ROUTING.voiceConversation.tier).toBe('realtime');
			expect(TASK_ROUTING.realtimeChat.provider).toBe('openai');
			expect(TASK_ROUTING.realtimeChat.tier).toBe('realtime');
		});

		it('should have valid tiers for all routes', () => {
			const validTiers = ['fast', 'balanced', 'premium', 'realtime'];

			Object.values(TASK_ROUTING).forEach((route) => {
				expect(validTiers).toContain(route.tier);
			});
		});
	});

	describe('getTaskRoute', () => {
		it('should return correct route for grammar correction', () => {
			const route = getTaskRoute('grammarCorrection');
			expect(route.provider).toBe('anthropic');
			expect(route.tier).toBe('fast');
		});

		it('should return correct route for detailed analysis', () => {
			const route = getTaskRoute('detailedAnalysis');
			expect(route.provider).toBe('openai');
			expect(route.tier).toBe('balanced');
		});

		it('should return correct route for voice conversation', () => {
			const route = getTaskRoute('voiceConversation');
			expect(route.provider).toBe('openai');
			expect(route.tier).toBe('realtime');
		});
	});

	describe('getTasksForProvider', () => {
		it('should return tasks routed to Anthropic', () => {
			const tasks = getTasksForProvider('anthropic');
			expect(tasks).toContain('grammarCorrection');
			expect(tasks).toContain('structuredExtraction');
			expect(tasks).toContain('scenarioGeneration');
			expect(tasks).not.toContain('detailedAnalysis');
		});

		it('should return tasks routed to OpenAI', () => {
			const tasks = getTasksForProvider('openai');
			expect(tasks).toContain('detailedAnalysis');
			expect(tasks).toContain('voiceConversation');
			expect(tasks).not.toContain('grammarCorrection');
		});

		it('should return tasks routed to Google', () => {
			const tasks = getTasksForProvider('google');
			expect(tasks).toContain('simpleTranslation');
		});
	});

	describe('getTasksForTier', () => {
		it('should return fast tier tasks', () => {
			const tasks = getTasksForTier('fast');
			expect(tasks).toContain('grammarCorrection');
			expect(tasks).toContain('jsonGeneration');
			expect(tasks).toContain('simpleTranslation');
		});

		it('should return balanced tier tasks', () => {
			const tasks = getTasksForTier('balanced');
			expect(tasks).toContain('detailedAnalysis');
			expect(tasks).toContain('conversationSummary');
		});

		it('should return realtime tier tasks', () => {
			const tasks = getTasksForTier('realtime');
			expect(tasks).toContain('voiceConversation');
			expect(tasks).toContain('realtimeChat');
		});
	});

	describe('createTaskRouteOverride', () => {
		it('should create routing with overrides', () => {
			const overrides = createTaskRouteOverride({
				grammarCorrection: { provider: 'openai', tier: 'balanced' }
			});

			expect(overrides.grammarCorrection.provider).toBe('openai');
			expect(overrides.grammarCorrection.tier).toBe('balanced');
			// Other routes should remain unchanged
			expect(overrides.detailedAnalysis).toEqual(TASK_ROUTING.detailedAnalysis);
		});

		it('should not modify original TASK_ROUTING', () => {
			createTaskRouteOverride({
				grammarCorrection: { provider: 'google', tier: 'premium' }
			});

			// Original should be unchanged
			expect(TASK_ROUTING.grammarCorrection.provider).toBe('anthropic');
		});
	});

	describe('DEFAULT_TASK_ROUTE', () => {
		it('should have sensible defaults', () => {
			expect(DEFAULT_TASK_ROUTE.provider).toBe('anthropic');
			expect(DEFAULT_TASK_ROUTE.tier).toBe('fast');
		});
	});
});
