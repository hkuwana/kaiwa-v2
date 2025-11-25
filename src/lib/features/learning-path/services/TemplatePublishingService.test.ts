// src/lib/features/learning-path/services/TemplatePublishingService.test.ts

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { TemplatePublishingService } from './TemplatePublishingService.server';
import { PathGeneratorService } from './PathGeneratorService.server';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import type { PathFromPreferencesInput } from '../types';

// Mock SvelteKit environment
vi.mock('$env/dynamic/private', () => ({
	env: {
		DATABASE_URL: process.env.DATABASE_URL,
		OPENAI_API_KEY: process.env.OPENAI_API_KEY,
		NODE_ENV: process.env.NODE_ENV || 'development'
	}
}));

describe('TemplatePublishingService', () => {
	let testUserId: string;
	let testPathId: string;
	let otherUserId: string;
	let templateId: string;

	// Create test paths before running tests
	beforeAll(async () => {
		if (!process.env.DATABASE_URL) {
			throw new Error('DATABASE_URL must be set to run tests');
		}
		if (!process.env.OPENAI_API_KEY) {
			throw new Error('OPENAI_API_KEY must be set to run tests');
		}

		testUserId = 'test-user-template-publish-123';
		otherUserId = 'other-user-456';

		// Create a test path with PII for template publishing
		const testUserPreferences = {
			userId: testUserId,
			targetLanguageId: 'ja',
			currentLanguageLevel: 'A2',
			practicalLevel: 'intermediate beginner',
			learningGoal: 'Connection',
			specificGoals: ["Meeting Sarah's parents for the first time"],
			challengePreference: 'moderate' as const,
			correctionStyle: 'gentle' as const
		};

		const input: PathFromPreferencesInput = {
			userPreferences: testUserPreferences,
			preset: {
				name: "Meeting Your Partner's Parents",
				description: "Preparing for my girlfriend's family dinner",
				duration: 4 // Small number for faster testing
			}
		};

		const result = await PathGeneratorService.createPathFromPreferences(testUserId, input);
		if (!result.success || !result.pathId) {
			throw new Error('Failed to create test path for template publishing tests');
		}

		testPathId = result.pathId;
	}, 30000);

	// Clean up test data
	afterAll(async () => {
		if (testPathId) {
			await learningPathRepository.deletePath(testPathId);
		}
		if (templateId) {
			await learningPathRepository.deletePath(templateId);
		}
	});

	describe('createAnonymousTemplate', () => {
		it('should create a public template from user path', async () => {
			const result = await TemplatePublishingService.createAnonymousTemplate(
				testPathId,
				testUserId
			);

			expect(result.success).toBe(true);
			if (!result.success) return;

			expect(result.template).toBeDefined();
			expect(result.shareUrl).toBeDefined();

			// Save templateId for cleanup
			templateId = result.template.id;

			// Verify template properties
			expect(result.template.userId).toBeNull();
			expect(result.template.isTemplate).toBe(true);
			expect(result.template.isPublic).toBe(true);
			expect(result.template.status).toBe('active');
			expect(result.template.createdByUserId).toBe(testUserId);
		}, 10000);

		it('should scrub PII from title and description', async () => {
			const result = await TemplatePublishingService.createAnonymousTemplate(
				testPathId,
				testUserId
			);

			expect(result.success).toBe(true);
			if (!result.success) return;

			const { template } = result;

			// Should not contain "Sarah's" or "my girlfriend"
			expect(template.title).not.toMatch(/Sarah's/i);
			expect(template.title).not.toMatch(/my girlfriend/i);
			expect(template.description).not.toMatch(/Sarah's/i);
			expect(template.description).not.toMatch(/my girlfriend/i);

			// Should contain scrubbed versions
			expect(template.title.toLowerCase()).toMatch(/your|partner/);
			expect(template.description.toLowerCase()).toMatch(/your|partner/);
		}, 10000);

		it('should generate unique share slug', async () => {
			const result = await TemplatePublishingService.createAnonymousTemplate(
				testPathId,
				testUserId
			);

			expect(result.success).toBe(true);
			if (!result.success) return;

			const { template, shareUrl } = result;

			// Should have a share slug
			expect(template.shareSlug).toBeDefined();
			expect(typeof template.shareSlug).toBe('string');
			expect(template.shareSlug!.length).toBeGreaterThan(0);

			// Share slug should be URL-friendly (lowercase, hyphens, no special chars)
			expect(template.shareSlug).toMatch(/^[a-z0-9-]+$/);

			// Share URL should use the slug
			expect(shareUrl).toBe(`/program/${template.shareSlug}`);

			// Should start with language prefix
			expect(template.shareSlug).toMatch(/^ja-/);
		}, 10000);

		it('should fail if path not found', async () => {
			const result = await TemplatePublishingService.createAnonymousTemplate(
				'non-existent-path',
				testUserId
			);

			expect(result.success).toBe(false);
			if (result.success) return;

			expect(result.error).toMatch(/not found/i);
		});

		it('should fail if user does not own path', async () => {
			const result = await TemplatePublishingService.createAnonymousTemplate(
				testPathId,
				otherUserId
			);

			expect(result.success).toBe(false);
			if (result.success) return;

			expect(result.error).toMatch(/permission|authorized/i);
		});

		it('should fail if path is already a template', async () => {
			// First, create a template
			const firstResult = await TemplatePublishingService.createAnonymousTemplate(
				testPathId,
				testUserId
			);
			expect(firstResult.success).toBe(true);
			if (!firstResult.success) return;

			const newTemplateId = firstResult.template.id;

			// Try to create template from template (should fail)
			const secondResult = await TemplatePublishingService.createAnonymousTemplate(
				newTemplateId,
				testUserId
			);

			expect(secondResult.success).toBe(false);
			if (secondResult.success) return;

			expect(secondResult.error).toMatch(/already a template/i);

			// Clean up
			await learningPathRepository.deletePath(newTemplateId);
		}, 10000);

		it('should preserve schedule and metadata', async () => {
			const originalPath = await learningPathRepository.findPathById(testPathId);
			expect(originalPath).toBeDefined();
			if (!originalPath) return;

			const result = await TemplatePublishingService.createAnonymousTemplate(
				testPathId,
				testUserId
			);
			expect(result.success).toBe(true);
			if (!result.success) return;

			const { template } = result;

			// Schedule should be identical
			expect(template.schedule).toEqual(originalPath.schedule);
			expect(template.schedule.length).toBe(originalPath.schedule.length);

			// Target language should match
			expect(template.targetLanguage).toBe(originalPath.targetLanguage);

			// Metadata should be preserved
			if (originalPath.metadata) {
				expect(template.metadata).toEqual(originalPath.metadata);
			}
		}, 10000);
	});

	describe('PII Scrubbing edge cases', () => {
		it('should handle multiple PII patterns', async () => {
			// Create a path with multiple PII patterns
			const piiInput: PathFromPreferencesInput = {
				userPreferences: {
					userId: 'test-user-pii-789',
					targetLanguageId: 'es',
					currentLanguageLevel: 'B1',
					practicalLevel: 'intermediate',
					learningGoal: 'Connection',
					specificGoals: ["Meeting John's family and my girlfriend Maria"],
					challengePreference: 'moderate' as const,
					correctionStyle: 'gentle' as const
				},
				preset: {
					name: "Maria's Family Gathering",
					description: "I'm preparing to meet my boss and visit with Sarah",
					duration: 4
				}
			};

			const pathResult = await PathGeneratorService.createPathFromPreferences(
				'test-user-pii-789',
				piiInput
			);
			expect(pathResult.success).toBe(true);
			if (!pathResult.success) return;

			const piiPathId = pathResult.pathId;

			// Create template
			const result = await TemplatePublishingService.createAnonymousTemplate(
				piiPathId,
				'test-user-pii-789'
			);
			expect(result.success).toBe(true);
			if (!result.success) return;

			const { template } = result;

			// Should scrub all names
			expect(template.title).not.toMatch(/Maria|John|Sarah/);
			expect(template.description).not.toMatch(/Maria|John|Sarah/);

			// Should scrub possessives
			expect(template.title).not.toMatch(/Maria's|John's/);

			// Should scrub personal pronouns
			expect(template.description).not.toMatch(/I'm|my boss|my girlfriend/i);

			// Clean up
			await learningPathRepository.deletePath(piiPathId);
			await learningPathRepository.deletePath(template.id);
		}, 15000);
	});

	describe('Slug uniqueness', () => {
		it('should generate different slugs for duplicate titles', async () => {
			// Create two paths with similar titles
			const input1: PathFromPreferencesInput = {
				userPreferences: {
					userId: 'test-user-slug-1',
					targetLanguageId: 'ja',
					currentLanguageLevel: 'A2',
					practicalLevel: 'beginner',
					learningGoal: 'Connection',
					specificGoals: ['Basic conversation'],
					challengePreference: 'easy' as const,
					correctionStyle: 'gentle' as const
				},
				preset: {
					name: 'Japanese Basics for Beginners',
					description: 'Learning Japanese from scratch',
					duration: 4
				}
			};

			const path1Result = await PathGeneratorService.createPathFromPreferences(
				'test-user-slug-1',
				input1
			);
			expect(path1Result.success).toBe(true);
			if (!path1Result.success) return;

			// Create first template
			const template1Result = await TemplatePublishingService.createAnonymousTemplate(
				path1Result.pathId,
				'test-user-slug-1'
			);
			expect(template1Result.success).toBe(true);
			if (!template1Result.success) return;

			// Create second path with same title
			const path2Result = await PathGeneratorService.createPathFromPreferences(
				'test-user-slug-2',
				input1
			);
			expect(path2Result.success).toBe(true);
			if (!path2Result.success) return;

			// Create second template (should get unique slug)
			const template2Result = await TemplatePublishingService.createAnonymousTemplate(
				path2Result.pathId,
				'test-user-slug-2'
			);
			expect(template2Result.success).toBe(true);
			if (!template2Result.success) return;

			// Slugs should be different
			expect(template1Result.template.shareSlug).not.toBe(template2Result.template.shareSlug);

			// Both should start with language prefix
			expect(template1Result.template.shareSlug).toMatch(/^ja-/);
			expect(template2Result.template.shareSlug).toMatch(/^ja-/);

			// Clean up
			await learningPathRepository.deletePath(path1Result.pathId);
			await learningPathRepository.deletePath(path2Result.pathId);
			await learningPathRepository.deletePath(template1Result.template.id);
			await learningPathRepository.deletePath(template2Result.template.id);
		}, 20000);
	});
});
