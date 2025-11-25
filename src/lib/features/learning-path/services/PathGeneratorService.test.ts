// src/lib/features/learning-path/services/PathGeneratorService.test.ts

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { PathGeneratorService } from './PathGeneratorService.server';
import type { PathFromPreferencesInput, PathFromCreatorBriefInput } from '../types';

// Mock SvelteKit environment - must be before any imports that use $env
vi.mock('$env/dynamic/private', () => ({
	env: {
		DATABASE_URL: process.env.DATABASE_URL,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		NODE_ENV: process.env.NODE_ENV || 'development'
	}
}));

// Only run these slow, external-integration tests when explicitly requested.
// They rely on a real database and OpenAI API.
const shouldRunIntegrationTests =
	process.env.RUN_PR4_TESTS === '1' ||
	process.env.RUN_PR4_TESTS === 'true' ||
	process.env.npm_lifecycle_event === 'test:pr4';

if (!shouldRunIntegrationTests) {
	// Mark the suite as skipped so Vitest reports it but CI stays fast and reliable.
	describe.skip('PathGeneratorService (integration)', () => {
		it('skipped unless RUN_PR4_TESTS is enabled or test:pr4 script is used', () => {
			// no-op
		});
	});
} else {
	describe('PathGeneratorService (integration)', () => {
		// Test user preferences (mock data)
		const testUserPreferences = {
			userId: 'test-user-123',
			targetLanguageId: 'ja',
			currentLanguageLevel: 'A2',
			practicalLevel: 'intermediate beginner',
			learningGoal: 'Connection',
			specificGoals: ['Have meaningful conversations', "Meet partner's family"],
			challengePreference: 'moderate' as const,
			correctionStyle: 'gentle' as const,
			conversationContext: {
				learningReason: "Planning to visit partner's family in Japan",
				occupation: 'Software Engineer'
			}
		};

		// Test creator brief (mock data)
		const testCreatorBrief: PathFromCreatorBriefInput = {
			brief: `Create a 7-day intensive course for preparing to meet your Japanese partner's parents
for the first time. The course should cover formal greetings, gift-giving etiquette,
dinner table conversation, showing respect, and handling common questions about your
relationship and future plans. Focus on keigo (polite language) and cultural nuances
that are critical in this high-stakes scenario.`,
			targetLanguage: 'ja',
			duration: 7,
			difficultyRange: {
				start: 'A2',
				end: 'B1'
			},
			primarySkill: 'conversation',
			metadata: {
				category: 'relationships',
				tags: ['family', 'formal', 'culture', 'etiquette']
			}
		};

		beforeAll(() => {
			// Verify environment variables are set
			if (!process.env.DATABASE_URL) {
				throw new Error('DATABASE_URL must be set to run tests');
			}
			if (!process.env.OPENAI_API_KEY) {
				throw new Error('OPENAI_API_KEY must be set to run tests');
			}
		});

		describe('createPathFromPreferences', () => {
			it(
				'should create a learning path from user preferences',
				async () => {
					const input: PathFromPreferencesInput = {
						userPreferences: testUserPreferences,
						preset: {
							name: 'Meet the Parents (Japanese)',
							description: "4-week intensive preparation for meeting partner's family",
							duration: 7 // Shorter for testing
						}
					};

					const result = await PathGeneratorService.createPathFromPreferences(null, input);

					// Assertions
					expect(result.success).toBe(true);
					expect(result.pathId).toBeDefined();
					expect(result.path).toBeDefined();
					expect(result.path?.title).toBeDefined();
					expect(result.path?.targetLanguage).toBe('ja');
					expect(result.path?.totalDays).toBe(7);
					expect(result.path?.status).toBe('draft');
					expect(result.queuedJobs).toBe(7);
				},
				30000
			); // 30 second timeout for OpenAI API call

			it(
				'should handle errors gracefully',
				async () => {
					const invalidInput: PathFromPreferencesInput = {
						userPreferences: {
							...testUserPreferences,
							targetLanguageId: '' // Invalid
						}
					};

					const result = await PathGeneratorService.createPathFromPreferences(
						null,
						invalidInput
					);

					// Should still succeed but with potentially degraded output
					// Or fail gracefully with an error message
					expect(result).toBeDefined();
					expect(typeof result.success).toBe('boolean');
				},
				30000
			);
		});

		describe('createPathFromCreatorBrief', () => {
			it(
				'should create a learning path from creator brief',
				async () => {
					const result = await PathGeneratorService.createPathFromCreatorBrief(
						null,
						testCreatorBrief
					);

					// Assertions
					expect(result.success).toBe(true);
					expect(result.pathId).toBeDefined();
					expect(result.path).toBeDefined();
					expect(result.path?.title).toBeDefined();
					expect(result.path?.targetLanguage).toBe('ja');
					expect(result.path?.totalDays).toBe(7);
					expect(result.path?.status).toBe('draft');
					expect(result.queuedJobs).toBe(7);
				},
				30000
			); // 30 second timeout for OpenAI API call

			it(
				'should respect the duration parameter',
				async () => {
					const customBrief: PathFromCreatorBriefInput = {
						...testCreatorBrief,
						duration: 5
					};

					const result = await PathGeneratorService.createPathFromCreatorBrief(
						null,
						customBrief
					);

					if (result.success) {
						expect(result.path?.totalDays).toBe(5);
						expect(result.queuedJobs).toBe(5);
					}
				},
				30000
			);
		});

		describe('Integration tests', () => {
			it(
				'should create valid database entries',
				async () => {
					const input: PathFromPreferencesInput = {
						userPreferences: testUserPreferences,
						preset: {
							name: 'Integration Test Path',
							description: 'Testing database integration',
							duration: 3 // Very short for fast testing
						}
					};

					const result = await PathGeneratorService.createPathFromPreferences(null, input);

					if (result.success && result.pathId) {
						// Import repositories here to avoid early import issues
						const { learningPathRepository } = await import(
							'$lib/server/repositories/learning-path.repository'
						);
						const { scenarioGenerationQueueRepository } = await import(
							'$lib/server/repositories/scenario-generation-queue.repository'
						);

						// Verify path exists in database
						const pathInDb = await learningPathRepository.findPathById(result.pathId);
						expect(pathInDb).toBeDefined();
						expect(pathInDb?.title).toBe(result.path?.title);
						expect(pathInDb?.schedule.length).toBe(3);

						// Verify queue jobs exist
						const queueJobs =
							await scenarioGenerationQueueRepository.getJobsForPath(result.pathId);
						expect(queueJobs.length).toBe(3);
						expect(queueJobs.every((job) => job.status === 'pending')).toBe(true);

						// Cleanup - delete test data
						await learningPathRepository.deletePath(result.pathId);
					}
				},
				30000
			);

			it(
				'should generate quality syllabuses',
				async () => {
					const input: PathFromPreferencesInput = {
						userPreferences: testUserPreferences,
						preset: {
							name: 'Quality Test',
							description: 'Testing syllabus quality',
							duration: 3
						}
					};

					const result = await PathGeneratorService.createPathFromPreferences(null, input);

					if (result.success && result.pathId) {
						const { learningPathRepository } = await import(
							'$lib/server/repositories/learning-path.repository'
						);

						const pathInDb = await learningPathRepository.findPathById(result.pathId);

						// Check syllabus quality
						expect(pathInDb?.schedule).toBeDefined();
						expect(pathInDb?.schedule.length).toBeGreaterThan(0);

						// Each day should have required fields
						pathInDb?.schedule.forEach((day, index) => {
							expect(day.dayIndex).toBe(index + 1);
							expect(day.theme).toBeDefined();
							expect(day.theme.length).toBeGreaterThan(0);
							expect(day.difficulty).toBeDefined();
							expect(day.learningObjectives).toBeDefined();
							expect(day.learningObjectives.length).toBeGreaterThan(0);
						});

						// Cleanup
						await learningPathRepository.deletePath(result.pathId);
					}
				},
				30000
			);
		});
	});
}
