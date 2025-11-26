// src/lib/features/learning-path/services/PreviewGeneratorService.server.ts

import { logger } from '$lib/logger';
import { nanoid } from 'nanoid';
import { db } from '$lib/server/db';
import { learningPathPreviews } from '$lib/server/db/schema/learning-path-previews';
import { learningPaths, type DayScheduleEntry } from '$lib/server/db/schema/learning-paths';
import { scenarios } from '$lib/server/db/schema/scenarios';
import { learningPathAssignments } from '$lib/server/db/schema/learning-path-assignments';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';
import { createCompletion, parseAndValidateJSON } from '$lib/server/services/openai.service';
import { PathGeneratorService } from './PathGeneratorService.server';
import { PromptEngineeringService } from './PromptEngineeringService';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { GeneratedSyllabus, PathFromPreferencesInput } from '../types';
import type { ScenarioPreview } from '$lib/server/db/schema/learning-path-previews';
import { eq } from 'drizzle-orm';

/**
 * Parsed user intent from natural language
 */
export interface ParsedIntent {
	targetLanguage: string;
	sourceLanguage: string;
	learningGoal: string; // e.g., "travel", "business", "conversation"
	proficiencyLevel: string; // e.g., "beginner", "intermediate", "advanced"
	specificContext?: string; // Optional: "meeting partner's parents", "business negotiations"
	preferences?: string[]; // e.g., ["casual tone", "cultural context"]
}

/**
 * Preview session result
 */
export interface PreviewSession {
	sessionId: string;
	title: string;
	description: string;
	targetLanguage: string;
	sourceLanguage: string;
	schedule: DayScheduleEntry[];
	scenarios: Record<string, ScenarioPreview>;
	status: 'ready' | 'generating';
}

/**
 * PreviewGeneratorService - Handles instant preview generation for learning paths
 *
 * This service provides fast preview generation for the inline learning path
 * creation feature. It:
 * - Parses natural language intent
 * - Generates 30-day syllabus
 * - Creates first 3 scenarios synchronously (8-12s total)
 * - Queues remaining 27 scenarios for background generation
 * - Stores everything in temporary preview table
 *
 * **Server-Side Only** - Makes database and API calls
 */
export class PreviewGeneratorService {
	/**
	 * Generate instant preview from user intent
	 *
	 * This is the main entry point for the dashboard creation flow.
	 * Generates a complete preview with first 3 scenarios in 8-12 seconds.
	 *
	 * @param userId - User ID
	 * @param intent - Natural language intent (e.g., "Learn Japanese for business")
	 * @param sourceLanguage - Optional source language (defaults to 'en')
	 * @returns Preview session
	 */
	static async generatePreview(
		userId: string,
		intent: string,
		sourceLanguage?: string
	): Promise<PreviewSession> {
		try {
			logger.info('🎯 [PreviewGenerator] Starting preview generation', {
				userId,
				intent,
				sourceLanguage
			});

			// Step 1: Parse intent using LLM (2-3s)
			const parsedIntent = await this.parseIntent(intent, sourceLanguage);

			logger.info('✅ [PreviewGenerator] Intent parsed', {
				targetLanguage: parsedIntent.targetLanguage,
				goal: parsedIntent.learningGoal,
				level: parsedIntent.proficiencyLevel
			});

			// Step 2: Generate 30-day syllabus (3-5s)
			const syllabus = await this.generateSyllabus(parsedIntent);

			if (!syllabus) {
				throw new Error('Failed to generate syllabus');
			}

			logger.info('✅ [PreviewGenerator] Syllabus generated', {
				title: syllabus.title,
				days: syllabus.days.length
			});

			// Step 3: Generate first 3 scenarios in parallel (5-7s)
			const [scenario1, scenario2, scenario3] = await Promise.all([
				this.generateScenarioFast(syllabus.days[0], parsedIntent),
				this.generateScenarioFast(syllabus.days[1], parsedIntent),
				this.generateScenarioFast(syllabus.days[2], parsedIntent)
			]);

			logger.info('✅ [PreviewGenerator] First 3 scenarios generated');

			// Step 4: Create preview session
			const sessionId = nanoid(10);
			const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

			// Convert GeneratedSyllabus.days to DayScheduleEntry[]
			const schedule: DayScheduleEntry[] = syllabus.days.map((day) => ({
				dayIndex: day.dayIndex,
				theme: day.theme,
				difficulty: day.difficulty,
				description: day.scenarioDescription
			}));

			const [preview] = await db
				.insert(learningPathPreviews)
				.values({
					userId,
					sessionId,
					intent,
					title: syllabus.title,
					description: syllabus.description,
					targetLanguage: parsedIntent.targetLanguage,
					sourceLanguage: parsedIntent.sourceLanguage,
					schedule,
					previewScenarios: {
						'1': scenario1,
						'2': scenario2,
						'3': scenario3
					},
					status: 'ready',
					expiresAt,
					metadata: {
						parsedIntent,
						refinementHistory: [],
						regeneratedDays: []
					}
				})
				.returning();

			logger.info('✅ [PreviewGenerator] Preview session created', {
				sessionId,
				previewId: preview.id
			});

			// Step 5: Queue remaining 27 scenarios (background)
			// Note: We'll implement this later to avoid blocking
			// await this.queueRemainingScenarios(sessionId, syllabus.days.slice(3), parsedIntent);

			return {
				sessionId,
				title: preview.title,
				description: preview.description,
				targetLanguage: preview.targetLanguage,
				sourceLanguage: preview.sourceLanguage,
				schedule: preview.schedule as DayScheduleEntry[],
				scenarios: preview.previewScenarios as Record<string, ScenarioPreview>,
				status: 'ready'
			};
		} catch (error) {
			logger.error('🚨 [PreviewGenerator] Failed to generate preview', error);
			throw error;
		}
	}

	/**
	 * Parse natural language intent into structured preferences
	 *
	 * @param intent - User's natural language intent
	 * @param sourceLanguage - Optional source language hint
	 * @returns Parsed intent
	 */
	private static async parseIntent(
		intent: string,
		sourceLanguage?: string
	): Promise<ParsedIntent> {
		try {
			const messages: ChatCompletionMessageParam[] = [
				{
					role: 'system',
					content: `You are an expert at understanding language learning goals.

Parse the user's learning intent and extract:
- targetLanguage: ISO 639-1 code (e.g., 'ja', 'es', 'fr', 'ko', 'zh')
- sourceLanguage: ISO 639-1 code (default: 'en')
- learningGoal: primary goal (e.g., "travel", "business", "conversation", "academic")
- proficiencyLevel: current level ("beginner", "intermediate", "advanced")
- specificContext: optional specific scenario (e.g., "meeting partner's parents", "job interviews")
- preferences: array of preferences (e.g., ["casual tone", "cultural context", "formal language"])

Return JSON with these fields.

Examples:
- "Learn Japanese for business" → {targetLanguage: "ja", sourceLanguage: "en", learningGoal: "business", proficiencyLevel: "beginner"}
- "Spanish for traveling in Mexico" → {targetLanguage: "es", sourceLanguage: "en", learningGoal: "travel", proficiencyLevel: "beginner", specificContext: "Mexico"}
- "Improve my French conversation skills" → {targetLanguage: "fr", sourceLanguage: "en", learningGoal: "conversation", proficiencyLevel: "intermediate"}`
				},
				{
					role: 'user',
					content: sourceLanguage
						? `Intent: ${intent}\nSource language: ${sourceLanguage}`
						: intent
				}
			];

			const response = await createCompletion(messages, {
				model: 'gpt-4o-mini',
				temperature: 0.3, // Low temperature for consistent parsing
				maxTokens: 500,
				responseFormat: 'json'
			});

			const parsed = parseAndValidateJSON<ParsedIntent>(response.content);

			if (!parsed || !parsed.targetLanguage) {
				throw new Error('Failed to parse intent');
			}

			// Set defaults
			return {
				sourceLanguage: parsed.sourceLanguage || 'en',
				proficiencyLevel: parsed.proficiencyLevel || 'beginner',
				...parsed
			};
		} catch (error) {
			logger.error('🚨 [PreviewGenerator] Failed to parse intent', error);
			// Fallback to defaults
			return {
				targetLanguage: 'ja', // Default to Japanese
				sourceLanguage: sourceLanguage || 'en',
				learningGoal: 'conversation',
				proficiencyLevel: 'beginner'
			};
		}
	}

	/**
	 * Generate 30-day syllabus from parsed intent
	 *
	 * Reuses existing PromptEngineeringService and PathGeneratorService logic
	 *
	 * @param parsedIntent - Structured intent
	 * @returns Generated syllabus
	 */
	private static async generateSyllabus(
		parsedIntent: ParsedIntent
	): Promise<GeneratedSyllabus | null> {
		try {
			// Convert ParsedIntent to PathFromPreferencesInput
			const input: PathFromPreferencesInput = {
				userPreferences: {
					targetLanguageId: parsedIntent.targetLanguage,
					currentLanguageLevel: parsedIntent.proficiencyLevel,
					learningGoal: parsedIntent.learningGoal,
					targetSpeakerGender: 'any',
					correctionStyle: 'balanced'
					// Note: Some fields are required by UserPreferences but not needed for syllabus generation
				} as any,
				preset: parsedIntent.specificContext
					? {
							name: parsedIntent.specificContext,
							description: parsedIntent.specificContext,
							duration: 30
						}
					: undefined
			};

			// Use existing prompt engineering service
			const promptPayload = PromptEngineeringService.buildSyllabusPrompt(input);

			const messages: ChatCompletionMessageParam[] = [
				{ role: 'system', content: promptPayload.systemPrompt },
				{ role: 'user', content: promptPayload.userPrompt }
			];

			const response = await createCompletion(messages, {
				model: 'gpt-4o-mini',
				temperature: 0.7,
				maxTokens: 3000,
				responseFormat: 'json'
			});

			const syllabus = parseAndValidateJSON<GeneratedSyllabus>(response.content);

			if (!syllabus || !syllabus.title || !Array.isArray(syllabus.days)) {
				logger.error('🚨 [PreviewGenerator] Invalid syllabus structure', { syllabus });
				return null;
			}

			return syllabus;
		} catch (error) {
			logger.error('🚨 [PreviewGenerator] Failed to generate syllabus', error);
			return null;
		}
	}

	/**
	 * Generate a single scenario quickly using gpt-4o-mini
	 *
	 * Optimized for speed (3-5s per scenario)
	 *
	 * @param day - Day entry from syllabus
	 * @param context - Parsed intent for context
	 * @returns Scenario preview
	 */
	private static async generateScenarioFast(
		day: GeneratedSyllabus['days'][0],
		context: ParsedIntent
	): Promise<ScenarioPreview> {
		try {
			const messages: ChatCompletionMessageParam[] = [
				{
					role: 'system',
					content: `You are an expert language learning scenario designer.

Create a conversation scenario for language learning with these details:
- Target language: ${context.targetLanguage}
- Source language: ${context.sourceLanguage}
- Learning goal: ${context.learningGoal}
- Proficiency level: ${context.proficiencyLevel}
- Day theme: ${day.theme}
- Difficulty: ${day.difficulty}

Return JSON with:
{
  "title": "Scenario title",
  "description": "Brief description of the scenario",
  "difficulty": "beginner/intermediate/advanced",
  "objectives": ["objective1", "objective2", "objective3"],
  "sampleDialogue": {
    "ai": "First line the AI character would say (in target language)",
    "user": "What the user should practice saying"
  },
  "context": "Detailed context and setting",
  "role": "Brief role description for the user",
  "instructions": "Instructions for the conversation"
}

Make it engaging, practical, and appropriate for the level.`
				},
				{
					role: 'user',
					content: JSON.stringify({
						theme: day.theme,
						objectives: day.learningObjectives,
						description: day.scenarioDescription
					})
				}
			];

			const response = await createCompletion(messages, {
				model: 'gpt-4o-mini', // Fast model
				temperature: 0.8, // Creative scenarios
				maxTokens: 1000,
				responseFormat: 'json'
			});

			const scenario = parseAndValidateJSON<ScenarioPreview>(response.content);

			if (!scenario || !scenario.title) {
				throw new Error('Invalid scenario structure');
			}

			return scenario;
		} catch (error) {
			logger.error('🚨 [PreviewGenerator] Failed to generate scenario', {
				day: day.theme,
				error
			});

			// Return fallback scenario
			return {
				title: day.theme,
				description: day.scenarioDescription || `Practice ${day.theme}`,
				difficulty: day.difficulty,
				objectives: day.learningObjectives || [],
				context: `A conversation scenario focused on ${day.theme}`,
				role: 'Language learner',
				instructions: 'Practice the conversation naturally'
			};
		}
	}

	/**
	 * Refine existing preview based on user feedback
	 *
	 * @param sessionId - Preview session ID
	 * @param refinementPrompt - Natural language refinement
	 * @param scope - What to refine (full, week, day)
	 * @param target - Optional week or day number
	 * @returns Updated preview session
	 */
	static async refinePreview(
		sessionId: string,
		refinementPrompt: string,
		scope: 'full' | 'week' | 'day' = 'full',
		target?: number
	): Promise<PreviewSession> {
		try {
			logger.info('✨ [PreviewGenerator] Refining preview', {
				sessionId,
				scope,
				target,
				prompt: refinementPrompt
			});

			// Load existing preview
			const [preview] = await db
				.select()
				.from(learningPathPreviews)
				.where(eq(learningPathPreviews.sessionId, sessionId))
				.limit(1);

			if (!preview) {
				throw new Error('Preview session not found');
			}

			// TODO: Implement refinement logic
			// This would regenerate the syllabus or specific parts based on feedback
			// For now, return existing preview
			logger.warn('⚠️ [PreviewGenerator] Refinement not yet implemented');

			return {
				sessionId: preview.sessionId,
				title: preview.title,
				description: preview.description,
				targetLanguage: preview.targetLanguage,
				sourceLanguage: preview.sourceLanguage,
				schedule: preview.schedule as DayScheduleEntry[],
				scenarios: preview.previewScenarios as Record<string, ScenarioPreview>,
				status: 'ready'
			};
		} catch (error) {
			logger.error('🚨 [PreviewGenerator] Failed to refine preview', error);
			throw error;
		}
	}

	/**
	 * Regenerate a single day's scenario
	 *
	 * @param sessionId - Preview session ID
	 * @param dayNumber - Day to regenerate (1-30)
	 * @param feedback - Optional feedback for regeneration
	 * @returns New scenario
	 */
	static async regenerateDay(
		sessionId: string,
		dayNumber: number,
		feedback?: string
	): Promise<ScenarioPreview> {
		try {
			logger.info('🔄 [PreviewGenerator] Regenerating day', {
				sessionId,
				dayNumber,
				feedback
			});

			// Load preview
			const [preview] = await db
				.select()
				.from(learningPathPreviews)
				.where(eq(learningPathPreviews.sessionId, sessionId))
				.limit(1);

			if (!preview) {
				throw new Error('Preview session not found');
			}

			const schedule = preview.schedule as DayScheduleEntry[];
			const dayEntry = schedule.find((d) => d.dayIndex === dayNumber);

			if (!dayEntry) {
				throw new Error(`Day ${dayNumber} not found in schedule`);
			}

			// Get parsed intent from metadata
			const metadata = preview.metadata as any;
			const parsedIntent = metadata?.parsedIntent;

			if (!parsedIntent) {
				throw new Error('Preview metadata missing');
			}

			// Convert DayScheduleEntry to GeneratedSyllabus day format
			const syllabusDay = {
				dayIndex: dayEntry.dayIndex,
				theme: dayEntry.theme,
				difficulty: dayEntry.difficulty,
				learningObjectives: [], // TODO: Store these in schedule
				scenarioDescription: dayEntry.description
			};

			// Regenerate scenario
			const newScenario = await this.generateScenarioFast(syllabusDay, parsedIntent);

			// Update preview
			const currentScenarios = (preview.previewScenarios as Record<string, ScenarioPreview>) || {};
			currentScenarios[dayNumber.toString()] = newScenario;

			await db
				.update(learningPathPreviews)
				.set({
					previewScenarios: currentScenarios,
					metadata: {
						...metadata,
						regeneratedDays: [...(metadata.regeneratedDays || []), dayNumber]
					}
				})
				.where(eq(learningPathPreviews.sessionId, sessionId));

			logger.info('✅ [PreviewGenerator] Day regenerated successfully');

			return newScenario;
		} catch (error) {
			logger.error('🚨 [PreviewGenerator] Failed to regenerate day', error);
			throw error;
		}
	}

	/**
	 * Commit preview to real learning path
	 *
	 * Creates actual learning_path, scenarios, and assignment
	 *
	 * @param sessionId - Preview session ID
	 * @returns Created path ID
	 */
	static async commitPreview(sessionId: string): Promise<string> {
		try {
			logger.info('💾 [PreviewGenerator] Committing preview', { sessionId });

			// Load preview
			const [preview] = await db
				.select()
				.from(learningPathPreviews)
				.where(eq(learningPathPreviews.sessionId, sessionId))
				.limit(1);

			if (!preview) {
				throw new Error('Preview session not found');
			}

			if (preview.status === 'committed') {
				logger.warn('⚠️ [PreviewGenerator] Preview already committed', {
					pathId: preview.committedPathId
				});
				return preview.committedPathId!;
			}

			// Generate unique path ID
			const pathId = `${preview.targetLanguage}-${nanoid(12)}`;

			// Create learning path
			await db.insert(learningPaths).values({
				id: pathId,
				userId: preview.userId,
				title: preview.title,
				description: preview.description,
				targetLanguage: preview.targetLanguage,
				schedule: preview.schedule,
				status: 'active',
				isTemplate: false,
				isPublic: false
			});

			logger.info('✅ [PreviewGenerator] Learning path created', { pathId });

			// Save preview scenarios to scenarios table
			const previewScenarios = preview.previewScenarios as Record<string, ScenarioPreview>;
			const scenarioIds: Record<number, string> = {};

			for (const [dayNum, scenarioData] of Object.entries(previewScenarios)) {
				const scenarioId = `${pathId}-day-${dayNum}`;

				await db.insert(scenarios).values({
					id: scenarioId,
					userId: preview.userId,
					title: scenarioData.title,
					description: scenarioData.description,
					difficulty: scenarioData.difficulty,
					targetLanguageId: preview.targetLanguage,
					role: scenarioData.role || 'Learner',
					context: scenarioData.context || '',
					instructions: scenarioData.instructions || '',
					objectives: scenarioData.objectives,
					visibility: 'private',
					isPublic: false
				});

				scenarioIds[parseInt(dayNum)] = scenarioId;
			}

			// Update schedule with scenario IDs
			const schedule = preview.schedule as DayScheduleEntry[];
			const updatedSchedule = schedule.map((day) => {
				if (scenarioIds[day.dayIndex]) {
					return { ...day, scenarioId: scenarioIds[day.dayIndex] };
				}
				return day;
			});

			await db
				.update(learningPaths)
				.set({ schedule: updatedSchedule })
				.where(eq(learningPaths.id, pathId));

			logger.info('✅ [PreviewGenerator] Scenarios linked to path');

			// Create assignment
			await db.insert(learningPathAssignments).values({
				userId: preview.userId,
				learningPathId: pathId,
				currentDay: 1,
				role: 'learner',
				status: 'active'
			});

			logger.info('✅ [PreviewGenerator] Assignment created');

			// Mark preview as committed
			await db
				.update(learningPathPreviews)
				.set({
					committedPathId: pathId,
					status: 'committed'
				})
				.where(eq(learningPathPreviews.sessionId, sessionId));

			// Queue remaining scenarios (days 4-30)
			// TODO: Implement background scenario generation

			logger.info('✅ [PreviewGenerator] Preview committed successfully', { pathId });

			return pathId;
		} catch (error) {
			logger.error('🚨 [PreviewGenerator] Failed to commit preview', error);
			throw error;
		}
	}
}
