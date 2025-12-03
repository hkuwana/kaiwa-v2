// src/lib/features/learning-path/services/PathGeneratorService.server.ts

import { logger } from '$lib/logger';
import { nanoid } from 'nanoid';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { createCompletion, parseAndValidateJSON } from '$lib/server/services/openai.service';
import { PromptEngineeringService } from './PromptEngineeringService';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import { getModelForTask } from '$lib/server/config/ai-models.config';
import { db } from '$lib/server/db';
import { adaptiveWeeks, weekProgress } from '$lib/server/db/schema';
import type { ConversationSeed } from '$lib/server/db/schema/adaptive-weeks';
import type {
	PathFromPreferencesInput,
	PathFromCreatorBriefInput,
	GeneratedSyllabus
} from '../types';
import type { LearningPath } from '$lib/server/db/types';

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

			// Step 3: Persist learning path as adaptive path with weeks
			const targetLanguage = input.userPreferences.targetLanguageId || 'ja';
			const { path, weeksCreated } = await this.persistPath(userId, targetLanguage, syllabus);

			// Step 4: Auto-enroll user if userId provided
			if (userId) {
				await this.createAssignmentForUser(userId, path.id);
			}

			// Note: No scenario queue for adaptive paths - scenarios are generated on-demand

			logger.info('✅ [PathGenerator] Adaptive path created successfully', {
				pathId: path.id,
				title: syllabus.title,
				weeks: weeksCreated,
				totalSeeds: syllabus.days.length,
				autoEnrolled: !!userId
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
				queuedJobs: 0 // No queue for adaptive paths
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

			// Step 3: Persist learning path as adaptive path with weeks
			const { path, weeksCreated } = await this.persistPath(userId, input.targetLanguage, syllabus);

			// Step 4: Auto-enroll user if userId provided
			if (userId) {
				await this.createAssignmentForUser(userId, path.id);
			}

			// Note: No scenario queue for adaptive paths - scenarios are generated on-demand

			logger.info('✅ [PathGenerator] Adaptive path created successfully from brief', {
				pathId: path.id,
				title: syllabus.title,
				weeks: weeksCreated,
				totalSeeds: syllabus.days.length,
				autoEnrolled: !!userId
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
				queuedJobs: 0 // No queue for adaptive paths
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
	private static async generateSyllabus(promptPayload: {
		systemPrompt: string;
		userPrompt: string;
	}): Promise<GeneratedSyllabus | null> {
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
				model: getModelForTask('pathwaySyllabus'), // Uses GPT-5 Nano for fast, cost-efficient generation
				temperature: 0.7, // Balanced creativity and consistency
				maxTokens: 16000, // Reasoning models need extra tokens for internal reasoning + output
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
	 * Persist learning path to database as adaptive path
	 *
	 * Creates the path with mode='adaptive' and generates weekly themes
	 * with conversation seeds from the syllabus days.
	 *
	 * @param userId - User ID or null for anonymous paths
	 * @param targetLanguage - Target language code
	 * @param syllabus - Generated syllabus
	 * @returns Created learning path and number of weeks created
	 */
	private static async persistPath(
		userId: string | null,
		targetLanguage: string,
		syllabus: GeneratedSyllabus
	): Promise<{ path: LearningPath; weeksCreated: number }> {
		// Extra safety check
		if (!Array.isArray(syllabus.days)) {
			throw new Error('Invalid syllabus: days must be an array');
		}

		// Group days into weeks (7 days per week)
		const weeks = this.groupDaysIntoWeeks(syllabus.days);

		// Calculate duration in weeks
		const durationWeeks = weeks.length;

		const pathData: Partial<LearningPath> = {
			id: `lp-${nanoid()}`,
			userId,
			title: syllabus.title,
			description: syllabus.description,
			targetLanguage,
			mode: 'adaptive', // Always create adaptive paths now
			durationWeeks,
			schedule: [], // Not used for adaptive paths
			status: 'active', // Adaptive paths are active immediately
			isTemplate: false,
			isPublic: false,
			shareSlug: null,
			estimatedMinutesPerDay: syllabus.metadata?.estimatedMinutesPerDay || 20,
			category: syllabus.metadata?.category || 'general',
			tags: syllabus.metadata?.tags || [],
			metadata: {
				cefrLevel: syllabus.days[0]?.difficulty || 'A2',
				suggestedSessionsPerWeek: 5,
				minimumSessionsPerWeek: 3,
				targetMinutesPerSession: 10
			}
		};

		const path = await learningPathRepository.createPathForUser(pathData);

		// Create adaptive weeks from grouped days
		for (let i = 0; i < weeks.length; i++) {
			const weekDays = weeks[i];
			const weekNumber = i + 1;
			const isFirstWeek = weekNumber === 1;

			// Determine week theme from the days
			const weekTheme = this.determineWeekTheme(weekDays);

			// Transform days into conversation seeds
			const conversationSeeds = this.daysToConversationSeeds(weekDays);

			// Get difficulty range from the week's days
			const difficulties = weekDays.map((d) => d.difficulty);
			const difficultyMin = difficulties[0] || 'A2';
			const difficultyMax = difficulties[difficulties.length - 1] || difficultyMin;

			await db.insert(adaptiveWeeks).values({
				pathId: path.id,
				weekNumber,
				theme: weekTheme,
				themeDescription: `Week ${weekNumber}: ${weekDays.map((d) => d.theme).slice(0, 3).join(', ')}`,
				difficultyMin,
				difficultyMax,
				status: isFirstWeek ? 'active' : 'locked',
				isAnchorWeek: isFirstWeek,
				conversationSeeds,
				focusAreas: [],
				leverageAreas: [],
				suggestedSessionCount: Math.min(weekDays.length, 5),
				minimumSessionCount: Math.min(weekDays.length, 3),
				startedAt: isFirstWeek ? new Date() : null
			});
		}

		logger.info('💾 [PathGenerator] Adaptive path persisted to database', {
			pathId: path.id,
			weeksCreated: weeks.length,
			totalSeeds: syllabus.days.length
		});

		return { path, weeksCreated: weeks.length };
	}

	/**
	 * Group syllabus days into weeks (7 days per week)
	 */
	private static groupDaysIntoWeeks(
		days: GeneratedSyllabus['days']
	): GeneratedSyllabus['days'][] {
		const weeks: GeneratedSyllabus['days'][] = [];
		const DAYS_PER_WEEK = 7;

		for (let i = 0; i < days.length; i += DAYS_PER_WEEK) {
			weeks.push(days.slice(i, i + DAYS_PER_WEEK));
		}

		return weeks;
	}

	/**
	 * Determine a theme for a week based on its days
	 */
	private static determineWeekTheme(days: GeneratedSyllabus['days']): string {
		// Use the most common theme or the first day's theme
		const themes = days.map((d) => d.theme);
		// Simple approach: use the first day's theme as the week theme
		return themes[0] || 'Practice Week';
	}

	/**
	 * Transform syllabus days into conversation seeds
	 */
	private static daysToConversationSeeds(days: GeneratedSyllabus['days']): ConversationSeed[] {
		return days.map((day) => ({
			id: `seed-day-${day.dayIndex}`,
			title: day.theme,
			description: day.scenarioDescription || day.learningObjectives?.join('. ') || day.theme,
			suggestedSessionTypes: ['quick-checkin', 'mini-roleplay'],
			vocabularyHints: day.learningObjectives?.slice(0, 3) || [],
			grammarHints: [],
			scenarioId: undefined // Will be populated when scenario is generated
		}));
	}

	/**
	 * Create assignment for user (auto-enrollment)
	 *
	 * Creates a learning path assignment so the user is automatically enrolled
	 * in the path when it's created. This allows the path to show up on their
	 * dashboard immediately, even before they click "start your first lesson".
	 *
	 * @param userId - User ID to enroll
	 * @param pathId - Learning path ID
	 */
	private static async createAssignmentForUser(userId: string, pathId: string): Promise<void> {
		try {
			// Check if assignment already exists
			const existingAssignment = await learningPathAssignmentRepository.findAssignment(
				userId,
				pathId
			);

			if (existingAssignment) {
				logger.info('ℹ️ [PathGenerator] Assignment already exists', {
					userId,
					pathId,
					assignmentId: existingAssignment.id
				});
				return;
			}

			// Create new assignment
			await learningPathAssignmentRepository.createAssignment({
				pathId,
				userId,
				status: 'active',
				currentDayIndex: 0,
				startsAt: new Date(),
				role: 'learner',
				emailRemindersEnabled: true
			});

			logger.info('✅ [PathGenerator] User auto-enrolled in path', {
				userId,
				pathId
			});
		} catch (error) {
			logger.error('🚨 [PathGenerator] Failed to create assignment', error);
			// Don't throw - assignment creation failure shouldn't fail path creation
		}
	}
}
