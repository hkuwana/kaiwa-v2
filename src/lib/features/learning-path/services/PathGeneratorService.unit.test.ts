// src/lib/features/learning-path/services/PathGeneratorService.unit.test.ts
// Fast, dependency-injected unit tests that avoid real DB and OpenAI calls.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GeneratedSyllabus } from '../types';

const mockCreateCompletion = vi.fn();
const mockCreatePathForUser = vi.fn();
const mockEnqueuePathRange = vi.fn();

vi.mock('$lib/logger', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn()
	}
}));

vi.mock('$lib/server/services/openai.service', async () => {
	const actual = await vi.importActual<typeof import('$lib/server/services/openai.service')>(
		'$lib/server/services/openai.service'
	);

	return {
		...actual,
		createCompletion: mockCreateCompletion
	};
});

vi.mock('$lib/server/repositories/learning-path.repository', () => ({
	learningPathRepository: {
		createPathForUser: mockCreatePathForUser
	}
}));

vi.mock('$lib/server/repositories/scenario-generation-queue.repository', () => ({
	scenarioGenerationQueueRepository: {
		enqueuePathRange: mockEnqueuePathRange
	}
}));

import { PathGeneratorService } from './PathGeneratorService.server';

describe('PathGeneratorService (unit)', () => {
	beforeEach(() => {
		mockCreateCompletion.mockReset();
		mockCreatePathForUser.mockReset();
		mockEnqueuePathRange.mockReset();
	});

	it('creates a learning path and enqueues jobs when OpenAI returns a valid syllabus', async () => {
		const syllabus: GeneratedSyllabus = {
			title: 'Test Path',
			description: 'Test path description',
			days: [
				{
					dayIndex: 1,
					theme: 'Day 1 Theme',
					difficulty: 'A2',
					learningObjectives: ['Objective 1'],
					scenarioDescription: 'Scenario for day 1'
				},
				{
					dayIndex: 2,
					theme: 'Day 2 Theme',
					difficulty: 'A2',
					learningObjectives: ['Objective 2']
				}
			],
			metadata: {
				estimatedMinutesPerDay: 20,
				category: 'relationships',
				tags: ['family']
			}
		};

		mockCreateCompletion.mockResolvedValueOnce({
			content: JSON.stringify(syllabus)
		});

		mockCreatePathForUser.mockImplementation(async (input: any) => ({
			...input,
			id: input.id,
			status: input.status ?? 'draft'
		}));

		mockEnqueuePathRange.mockResolvedValueOnce([]);

		const result = await PathGeneratorService.createPathFromPreferences('user-123', {
			userPreferences: {
				userId: 'user-123',
				targetLanguageId: 'ja',
				currentLanguageLevel: 'A2',
				learningGoal: 'Connection'
			} as any,
			preset: {
				name: 'Test Preset',
				description: 'Short test preset',
				duration: 2
			}
		});

		expect(result.success).toBe(true);
		expect(result.pathId).toBeDefined();
		expect(result.path).toBeDefined();
		expect(result.path?.title).toBe('Test Path');
		expect(result.path?.targetLanguage).toBe('ja');
		expect(result.path?.totalDays).toBe(2);
		expect(result.queuedJobs).toBe(2);

		expect(mockCreateCompletion).toHaveBeenCalledTimes(1);
		expect(mockCreatePathForUser).toHaveBeenCalledTimes(1);
		expect(mockEnqueuePathRange).toHaveBeenCalledTimes(1);

		const [pathId, days] = mockEnqueuePathRange.mock.calls[0];
		expect(typeof pathId).toBe('string');
		expect(days).toHaveLength(2);
		expect(days[0].dayIndex).toBe(1);
		expect(days[1].dayIndex).toBe(2);
	});

	it('returns a failure result when the syllabus cannot be parsed from OpenAI response', async () => {
		mockCreateCompletion.mockResolvedValueOnce({
			content: 'not-json'
		});

		const result = await PathGeneratorService.createPathFromPreferences(null, {
			userPreferences: {
				userId: 'user-123',
				targetLanguageId: 'ja',
				currentLanguageLevel: 'A2',
				learningGoal: 'Connection'
			} as any
		});

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
		expect(mockCreatePathForUser).not.toHaveBeenCalled();
		expect(mockEnqueuePathRange).not.toHaveBeenCalled();
	});
});

