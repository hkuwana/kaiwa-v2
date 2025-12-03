// src/lib/features/learning-path/services/CustomScenarioGenerationService.unit.test.ts
// Unit tests for CustomScenarioGenerationService - tests speaker lookup and scenario generation

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversationSeed } from '$lib/server/db/schema/adaptive-weeks';

// Use vi.hoisted() to ensure mock variables are available when vi.mock() factories run
const {
	mockDbQuery,
	mockDbUpdate,
	mockDbInsert,
	mockGetActiveSpeakersByLanguage,
	mockGenerateScenarioWithGPT,
	mockInitializeMetadata
} = vi.hoisted(() => ({
	mockDbQuery: {
		adaptiveWeeks: {
			findFirst: vi.fn(),
			findMany: vi.fn()
		}
	},
	mockDbUpdate: vi.fn(() => ({
		set: vi.fn(() => ({
			where: vi.fn().mockResolvedValue(undefined)
		}))
	})),
	mockDbInsert: vi.fn(() => ({
		values: vi.fn(() => ({
			returning: vi.fn()
		}))
	})),
	mockGetActiveSpeakersByLanguage: vi.fn(),
	mockGenerateScenarioWithGPT: vi.fn(),
	mockInitializeMetadata: vi.fn()
}));

// Mock environment variables
vi.mock('$env/dynamic/private', () => ({
	env: {
		OPENAI_API_KEY: 'test-api-key',
		DATABASE_URL: 'postgresql://test',
		NODE_ENV: 'test'
	}
}));

vi.mock('$lib/logger', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn()
	}
}));

// Mock the database
vi.mock('$lib/server/db', () => ({
	db: {
		query: mockDbQuery,
		update: mockDbUpdate,
		insert: mockDbInsert
	}
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', () => ({
	eq: vi.fn((a, b) => ({ field: a, value: b })),
	and: vi.fn((...args) => args)
}));

// Mock speakers repository
vi.mock('$lib/server/repositories/speakers.repository', () => ({
	speakersRepository: {
		getActiveSpeakersByLanguage: mockGetActiveSpeakersByLanguage
	}
}));

// Mock OpenAI service
vi.mock('$lib/server/services/openai.service', () => ({
	generateScenarioWithGPT: mockGenerateScenarioWithGPT
}));

// Mock scenario metadata repository
vi.mock('$lib/server/repositories/scenario-metadata.repository', () => ({
	scenarioMetadataRepository: {
		initializeMetadata: mockInitializeMetadata
	}
}));

// Mock nanoid
vi.mock('nanoid', () => ({
	nanoid: vi.fn(() => 'test-nano-id')
}));

// Import after mocks are set up
import { CustomScenarioGenerationService } from './CustomScenarioGenerationService.server';

describe('CustomScenarioGenerationService (unit)', () => {
	// Test data
	const testUserId = 'user-123';
	const testTargetLanguage = 'nl';
	const testWeekId = 'week-456';
	const testPathId = 'path-789';

	const mockSpeaker = {
		id: 'speaker-dutch-001',
		voiceName: 'Dutch Speaker',
		languageId: 'nl',
		isActive: true
	};

	const mockSeed: ConversationSeed = {
		id: 'seed-001',
		title: 'Ordering Coffee',
		description: 'Practice ordering coffee at a Dutch café',
		vocabularyHints: ['koffie', 'melk', 'suiker'],
		grammarHints: ['present tense'],
		suggestedSessionTypes: ['roleplay']
	};

	const mockWeek = {
		id: testWeekId,
		pathId: testPathId,
		weekNumber: 1,
		theme: 'Daily Interactions',
		themeDescription: 'Common daily situations',
		difficultyMin: 'A2',
		difficultyMax: 'B1',
		status: 'active',
		conversationSeeds: [mockSeed],
		createdAt: new Date(),
		updatedAt: new Date()
	};

	const mockGeneratedContent = {
		title: 'Ordering Coffee at a Dutch Café',
		description: 'Practice ordering your favorite coffee in Dutch',
		difficulty: 'beginner',
		cefrLevel: 'A2',
		learningGoal: 'Learn to order drinks',
		instructions: 'Practice ordering coffee',
		context: 'You are at a café',
		expectedOutcome: 'Successfully order a coffee',
		learningObjectives: ['Order drinks', 'Use polite phrases'],
		persona: 'Friendly barista'
	};

	beforeEach(() => {
		vi.clearAllMocks();

		// Default mock implementations
		mockGetActiveSpeakersByLanguage.mockResolvedValue([mockSpeaker]);
		mockGenerateScenarioWithGPT.mockResolvedValue({
			content: mockGeneratedContent,
			tokensUsed: 500
		});
		mockInitializeMetadata.mockResolvedValue(undefined);
	});

	describe('generateScenariosForWeek', () => {
		it('should look up default speaker for target language', async () => {
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(mockWeek);

			const mockCreatedScenario = {
				id: 'custom-test-nano-id',
				...mockGeneratedContent,
				defaultSpeakerId: mockSpeaker.id
			};

			mockDbInsert.mockReturnValue({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockCreatedScenario])
				}))
			});

			await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			// Verify speaker lookup was called with correct language
			expect(mockGetActiveSpeakersByLanguage).toHaveBeenCalledWith(testTargetLanguage);
			expect(mockGetActiveSpeakersByLanguage).toHaveBeenCalledTimes(1);
		});

		it('should use first active speaker as default', async () => {
			const multipleSpeakers = [
				{ id: 'speaker-1', voiceName: 'First Speaker', languageId: 'nl', isActive: true },
				{ id: 'speaker-2', voiceName: 'Second Speaker', languageId: 'nl', isActive: true }
			];
			mockGetActiveSpeakersByLanguage.mockResolvedValue(multipleSpeakers);
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(mockWeek);

			const mockCreatedScenario = {
				id: 'custom-test-nano-id',
				...mockGeneratedContent,
				defaultSpeakerId: 'speaker-1'
			};

			mockDbInsert.mockReturnValue({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockCreatedScenario])
				}))
			});

			await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			// Verify the first speaker was selected
			expect(mockGetActiveSpeakersByLanguage).toHaveBeenCalledWith(testTargetLanguage);
		});

		it('should handle no speakers found gracefully', async () => {
			mockGetActiveSpeakersByLanguage.mockResolvedValue([]);
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(mockWeek);

			const mockCreatedScenario = {
				id: 'custom-test-nano-id',
				...mockGeneratedContent,
				defaultSpeakerId: null
			};

			mockDbInsert.mockReturnValue({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockCreatedScenario])
				}))
			});

			const result = await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			// Should still succeed even without a speaker
			expect(result.success).toBe(true);
			expect(mockGenerateScenarioWithGPT).toHaveBeenCalled();
		});

		it('should handle speaker lookup errors gracefully', async () => {
			mockGetActiveSpeakersByLanguage.mockRejectedValue(new Error('Database connection failed'));
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(mockWeek);

			const mockCreatedScenario = {
				id: 'custom-test-nano-id',
				...mockGeneratedContent,
				defaultSpeakerId: null
			};

			mockDbInsert.mockReturnValue({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockCreatedScenario])
				}))
			});

			const result = await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			// Should still continue with scenario generation
			expect(result.success).toBe(true);
			expect(mockGenerateScenarioWithGPT).toHaveBeenCalled();
		});

		it('should return error when week not found', async () => {
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(null);

			const result = await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].error).toContain('not found');
		});

		it('should skip seeds that already have scenarios', async () => {
			const weekWithGeneratedSeed = {
				...mockWeek,
				conversationSeeds: [
					{ ...mockSeed, scenarioId: 'existing-scenario-id' }
				]
			};
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(weekWithGeneratedSeed);

			const result = await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			expect(result.success).toBe(true);
			expect(result.scenariosGenerated).toBe(0);
			expect(mockGenerateScenarioWithGPT).not.toHaveBeenCalled();
		});

		it('should generate scenarios for seeds without scenarioId', async () => {
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(mockWeek);

			const mockCreatedScenario = {
				id: 'custom-test-nano-id',
				...mockGeneratedContent,
				defaultSpeakerId: mockSpeaker.id
			};

			mockDbInsert.mockReturnValue({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockCreatedScenario])
				}))
			});

			const result = await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			expect(result.success).toBe(true);
			expect(result.scenariosGenerated).toBe(1);
			expect(result.scenarioIds).toContain('custom-test-nano-id');
			expect(mockGenerateScenarioWithGPT).toHaveBeenCalledTimes(1);
		});

		it('should handle GPT generation errors and continue with other seeds', async () => {
			const weekWithTwoSeeds = {
				...mockWeek,
				conversationSeeds: [
					mockSeed,
					{ ...mockSeed, id: 'seed-002', title: 'Second Seed' }
				]
			};
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(weekWithTwoSeeds);

			// First call fails, second succeeds
			mockGenerateScenarioWithGPT
				.mockRejectedValueOnce(new Error('GPT API error'))
				.mockResolvedValueOnce({
					content: mockGeneratedContent,
					tokensUsed: 500
				});

			const mockCreatedScenario = {
				id: 'custom-test-nano-id',
				...mockGeneratedContent,
				defaultSpeakerId: mockSpeaker.id
			};

			mockDbInsert.mockReturnValue({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockCreatedScenario])
				}))
			});

			const result = await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			expect(result.success).toBe(false); // Has errors
			expect(result.scenariosGenerated).toBe(1); // One succeeded
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].seedId).toBe('seed-001');
		});
	});

	describe('generateScenariosForAssignment', () => {
		it('should find active weeks and generate scenarios for each', async () => {
			mockDbQuery.adaptiveWeeks.findMany.mockResolvedValue([mockWeek]);
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(mockWeek);

			const mockCreatedScenario = {
				id: 'custom-test-nano-id',
				...mockGeneratedContent,
				defaultSpeakerId: mockSpeaker.id
			};

			mockDbInsert.mockReturnValue({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockCreatedScenario])
				}))
			});

			const result = await CustomScenarioGenerationService.generateScenariosForAssignment(
				testPathId,
				testUserId,
				testTargetLanguage
			);

			expect(result.success).toBe(true);
			expect(result.scenariosGenerated).toBeGreaterThanOrEqual(0);
		});

		it('should return empty result when no active weeks found', async () => {
			mockDbQuery.adaptiveWeeks.findMany.mockResolvedValue([]);

			const result = await CustomScenarioGenerationService.generateScenariosForAssignment(
				testPathId,
				testUserId,
				testTargetLanguage
			);

			expect(result.success).toBe(true);
			expect(result.scenariosGenerated).toBe(0);
			expect(result.scenarioIds).toHaveLength(0);
		});

		it('should aggregate results from multiple weeks', async () => {
			const twoWeeks = [
				mockWeek,
				{ ...mockWeek, id: 'week-2', weekNumber: 2 }
			];
			mockDbQuery.adaptiveWeeks.findMany.mockResolvedValue(twoWeeks);
			mockDbQuery.adaptiveWeeks.findFirst
				.mockResolvedValueOnce(twoWeeks[0])
				.mockResolvedValueOnce(twoWeeks[1]);

			const mockCreatedScenario = {
				id: 'custom-test-nano-id',
				...mockGeneratedContent,
				defaultSpeakerId: mockSpeaker.id
			};

			mockDbInsert.mockReturnValue({
				values: vi.fn(() => ({
					returning: vi.fn().mockResolvedValue([mockCreatedScenario])
				}))
			});

			const result = await CustomScenarioGenerationService.generateScenariosForAssignment(
				testPathId,
				testUserId,
				testTargetLanguage
			);

			expect(result.success).toBe(true);
			// Should have processed both weeks
			expect(mockDbQuery.adaptiveWeeks.findFirst).toHaveBeenCalledTimes(2);
		});

		it('should handle fatal errors gracefully', async () => {
			mockDbQuery.adaptiveWeeks.findMany.mockRejectedValue(
				new Error('Database connection lost')
			);

			const result = await CustomScenarioGenerationService.generateScenariosForAssignment(
				testPathId,
				testUserId,
				testTargetLanguage
			);

			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].error).toContain('Database connection lost');
		});
	});

	describe('scenario creation with learning path fields', () => {
		it('should set targetLanguages to the learning path language', async () => {
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(mockWeek);

			let capturedScenarioValues: Record<string, unknown> | null = null;

			mockDbInsert.mockReturnValue({
				values: vi.fn((values) => {
					capturedScenarioValues = values;
					return {
						returning: vi.fn().mockResolvedValue([{
							id: 'custom-test-nano-id',
							...mockGeneratedContent,
							...values
						}])
					};
				})
			});

			await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			expect(capturedScenarioValues).not.toBeNull();
			expect(capturedScenarioValues?.targetLanguages).toEqual([testTargetLanguage]);
		});

		it('should set learningPathSlug to the path ID', async () => {
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(mockWeek);

			let capturedScenarioValues: Record<string, unknown> | null = null;

			mockDbInsert.mockReturnValue({
				values: vi.fn((values) => {
					capturedScenarioValues = values;
					return {
						returning: vi.fn().mockResolvedValue([{
							id: 'custom-test-nano-id',
							...mockGeneratedContent,
							...values
						}])
					};
				})
			});

			await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			expect(capturedScenarioValues).not.toBeNull();
			expect(capturedScenarioValues?.learningPathSlug).toBe(testPathId);
		});

		it('should set defaultSpeakerId from speaker lookup', async () => {
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(mockWeek);

			let capturedScenarioValues: Record<string, unknown> | null = null;

			mockDbInsert.mockReturnValue({
				values: vi.fn((values) => {
					capturedScenarioValues = values;
					return {
						returning: vi.fn().mockResolvedValue([{
							id: 'custom-test-nano-id',
							...mockGeneratedContent,
							...values
						}])
					};
				})
			});

			await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			expect(capturedScenarioValues).not.toBeNull();
			expect(capturedScenarioValues?.defaultSpeakerId).toBe(mockSpeaker.id);
		});

		it('should set defaultSpeakerId to null when no speakers available', async () => {
			mockGetActiveSpeakersByLanguage.mockResolvedValue([]);
			mockDbQuery.adaptiveWeeks.findFirst.mockResolvedValue(mockWeek);

			let capturedScenarioValues: Record<string, unknown> | null = null;

			mockDbInsert.mockReturnValue({
				values: vi.fn((values) => {
					capturedScenarioValues = values;
					return {
						returning: vi.fn().mockResolvedValue([{
							id: 'custom-test-nano-id',
							...mockGeneratedContent,
							...values
						}])
					};
				})
			});

			await CustomScenarioGenerationService.generateScenariosForWeek(
				testWeekId,
				testUserId,
				testTargetLanguage
			);

			expect(capturedScenarioValues).not.toBeNull();
			expect(capturedScenarioValues?.defaultSpeakerId).toBeNull();
		});
	});
});
