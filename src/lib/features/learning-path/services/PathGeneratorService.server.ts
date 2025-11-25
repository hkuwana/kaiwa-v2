// src/lib/features/learning-path/services/PathGeneratorService.server.ts

import { logger } from '$lib/logger';
import { nanoid } from 'nanoid';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { createCompletion, parseAndValidateJSON } from '$lib/server/services/openai.service';
import { PromptEngineeringService } from './PromptEngineeringService';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';
import type {
	PathFromPreferencesInput,
	PathFromCreatorBriefInput,
	GeneratedSyllabus
} from '../types';
import type { NewLearningPath } from '$lib/server/db/schema/learning-paths';
import type { UserPreferences } from '$lib/server/db/types';

/**
 * Result of path generation
 */
export interface PathGenerationResult {
	success: boolean;
	pathId?: string;
	path?: {
		id: string;
		title: string;
		description: string;
		targetLanguage: string;
		totalDays: number;
		status: string;
	};
	queuedJobs?: number;
	error?: string;
}

/**
 * PathGeneratorService - Orchestrates learning path creation
 *
 * This service is the main entry point for creating learning paths.
 * It coordinates between:
 * - PromptEngineeringService (generates prompts)
 * - OpenAI API (generates syllabus)
 * - LearningPathRepository (persists paths)
 * - ScenarioGenerationQueueRepository (enqueues scenario generation)
 *
 * **Server-Side Only** - This service makes database and API calls
 */
export class PathGeneratorService {
	/**
	 * Create a learning path from user preferences
	 *
	 * This is the main flow for users creating personalized paths.
	 * Generates a syllabus based on their language level, goals, and context.
	 *
	 * @param userId - User ID (can be null for anonymous/template paths)
	 * @param input - User preferences and optional preset
	 * @returns Path generation result
	 */
	static async createPathFromPreferences(
		userId: string | null,
		input: PathFromPreferencesInput
	): Promise<PathGenerationResult> {
		try {
			logger.info('🎓 [PathGenerator] Creating path from preferences', {
				userId,
				level: input.userPreferences.currentLanguageLevel,
				goal: input.userPreferences.learningGoal,
				preset: input.preset?.name
			});

			// Step 1: Generate prompt using PromptEngineeringService
			const promptPayload = PromptEngineeringService.buildSyllabusPrompt(input);

			// Step 2: Call OpenAI to generate syllabus
			const syllabus = await this.generateSyllabus(promptPayload);

			if (!syllabus) {
				return {
					success: false,
					error: 'Failed to generate syllabus from OpenAI'
				};
			}

			// Step 3: Persist learning path
			const targetLanguage = input.userPreferences.targetLanguageId || 'ja';
			const path = await this.persistPath(userId, targetLanguage, syllabus);

			// Step 4: Enqueue scenario generation for all days
			const queuedJobs = await this.enqueueScenarioGeneration(path.id, syllabus.days.length);

			logger.info('✅ [PathGenerator] Path created successfully', {
				pathId: path.id,
				title: syllabus.title,
				days: syllabus.days.length,
				queuedJobs
			});

			return {
				success: true,
				pathId: path.id,
				path: {
					id: path.id,
					title: syllabus.title,
					description: syllabus.description,
					targetLanguage,
					totalDays: syllabus.days.length,
					status: path.status
				},
				queuedJobs
			};
		} catch (error) {
			logger.error('🚨 [PathGenerator] Failed to create path from preferences', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Create a learning path from creator brief
	 *
	 * This flow allows creators to design custom courses by providing
	 * a detailed brief in natural language.
	 *
	 * @param userId - Creator user ID (can be null for templates)
	 * @param input - Creator brief and course parameters
	 * @returns Path generation result
	 */
	static async createPathFromCreatorBrief(
		userId: string | null,
		input: PathFromCreatorBriefInput
	): Promise<PathGenerationResult> {
		try {
			logger.info('🎓 [PathGenerator] Creating path from creator brief', {
				userId,
				targetLanguage: input.targetLanguage,
				duration: input.duration,
				briefLength: input.brief.length
			});

			// Step 1: Generate prompt using PromptEngineeringService
			const promptPayload = PromptEngineeringService.buildCreatorPathPrompt(input);

			// Step 2: Call OpenAI to generate syllabus
			const syllabus = await this.generateSyllabus(promptPayload);

			if (!syllabus) {
				return {
					success: false,
					error: 'Failed to generate syllabus from OpenAI'
				};
			}

			// Step 3: Persist learning path
			const path = await this.persistPath(userId, input.targetLanguage, syllabus);

			// Step 4: Enqueue scenario generation for all days
			const queuedJobs = await this.enqueueScenarioGeneration(path.id, syllabus.days.length);

			logger.info('✅ [PathGenerator] Path created successfully from brief', {
				pathId: path.id,
				title: syllabus.title,
				days: syllabus.days.length,
				queuedJobs
			});

			return {
				success: true,
				pathId: path.id,
				path: {
					id: path.id,
					title: syllabus.title,
					description: syllabus.description,
					targetLanguage: input.targetLanguage,
					totalDays: syllabus.days.length,
					status: path.status
				},
				queuedJobs
			};
		} catch (error) {
			logger.error('🚨 [PathGenerator] Failed to create path from creator brief', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Generate syllabus using OpenAI
	 *
	 * @param promptPayload - System and user prompts
	 * @returns Generated syllabus or null if failed
	 */
	private static async generateSyllabus(
		promptPayload: { systemPrompt: string; userPrompt: string }
	): Promise<GeneratedSyllabus | null> {
		try {
			const messages: ChatCompletionMessageParam[] = [
				{ role: 'system', content: promptPayload.systemPrompt },
				{ role: 'user', content: promptPayload.userPrompt }
			];

			logger.info('🤖 [PathGenerator] Calling OpenAI to generate syllabus', {
				systemPromptLength: promptPayload.systemPrompt.length,
				userPromptLength: promptPayload.userPrompt.length
			});

			const response = await createCompletion(messages, {
				model: 'gpt-4o-mini',
				temperature: 0.7, // Balanced creativity and consistency
				maxTokens: 3000, // Allow for detailed syllabus
				responseFormat: 'json'
			});

			const syllabus = parseAndValidateJSON<GeneratedSyllabus>(response.content);

			if (!syllabus) {
				logger.error('🚨 [PathGenerator] Failed to parse JSON from OpenAI', {
					content: response.content
				});
				return null;
			}

			// Validate syllabus structure
			if (!syllabus.title || typeof syllabus.title !== 'string') {
				logger.error('🚨 [PathGenerator] Missing or invalid title', { syllabus });
				return null;
			}

			if (!Array.isArray(syllabus.days)) {
				logger.error('🚨 [PathGenerator] days is not an array', {
					daysType: typeof syllabus.days,
					days: syllabus.days,
					fullResponse: response.content
				});
				return null;
			}

			if (syllabus.days.length === 0) {
				logger.error('🚨 [PathGenerator] days array is empty', { syllabus });
				return null;
			}

			logger.info('✅ [PathGenerator] Syllabus generated successfully', {
				title: syllabus.title,
				daysCount: syllabus.days.length,
				category: syllabus.metadata?.category
			});

			return syllabus;
		} catch (error) {
			logger.error('🚨 [PathGenerator] Failed to generate syllabus', error);
			return null;
		}
	}

	/**
	 * Persist learning path to database
	 *
	 * @param userId - User ID or null for anonymous paths
	 * @param targetLanguage - Target language code
	 * @param syllabus - Generated syllabus
	 * @returns Created learning path
	 */
	private static async persistPath(
		userId: string | null,
		targetLanguage: string,
		syllabus: GeneratedSyllabus
	) {
		// Extra safety check
		if (!Array.isArray(syllabus.days)) {
			throw new Error('Invalid syllabus: days must be an array');
		}

		// Transform syllabus days into schedule format
		const schedule = syllabus.days.map((day) => ({
			dayIndex: day.dayIndex,
			theme: day.theme,
			difficulty: day.difficulty,
			learningObjectives: day.learningObjectives,
			scenarioDescription: day.scenarioDescription,
			scenarioId: null, // Will be filled when scenario is generated
			isUnlocked: day.dayIndex === 1, // Only first day unlocked initially
			completedAt: null
		}));

		const pathData: NewLearningPath = {
			id: `lp-${nanoid()}`,
			userId,
			title: syllabus.title,
			description: syllabus.description,
			targetLanguage,
			schedule,
			status: 'draft', // Starts as draft, becomes 'active' when first scenario ready
			isTemplate: false, // Can be marked as template later for publishing
			isPublic: false,
			shareSlug: null,
			estimatedMinutesPerDay: syllabus.metadata?.estimatedMinutesPerDay || 20,
			category: syllabus.metadata?.category || 'general',
			tags: syllabus.metadata?.tags || []
		};

		const path = await learningPathRepository.createPathForUser(pathData);

		logger.info('💾 [PathGenerator] Path persisted to database', {
			pathId: path.id,
			daysCount: schedule.length
		});

		return path;
	}

	/**
	 * Enqueue scenario generation for all days
	 *
	 * Creates background jobs to generate scenarios asynchronously.
	 * Scenarios are generated just-in-time based on targetGenerationDate.
	 *
	 * @param pathId - Learning path ID
	 * @param totalDays - Total number of days to enqueue
	 * @returns Number of jobs enqueued
	 */
	private static async enqueueScenarioGeneration(
		pathId: string,
		totalDays: number
	): Promise<number> {
		try {
			// Enqueue all days at once
			// The queue processor will handle them based on targetGenerationDate
			const now = new Date();

			// Create array of days to enqueue
			const daysToEnqueue = Array.from({ length: totalDays }, (_, i) => ({
				dayIndex: i + 1,
				targetDate: new Date(now.getTime() + i * 24 * 60 * 60 * 1000) // Stagger by one day each
			}));

			await scenarioGenerationQueueRepository.enqueuePathRange(pathId, daysToEnqueue);

			logger.info('📋 [PathGenerator] Enqueued scenario generation jobs', {
				pathId,
				totalDays,
				startDate: now.toISOString()
			});

			return totalDays;
		} catch (error) {
			logger.error('🚨 [PathGenerator] Failed to enqueue scenario generation', error);
			throw error;
		}
	}
}
