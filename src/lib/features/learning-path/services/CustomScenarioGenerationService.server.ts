// src/lib/features/learning-path/services/CustomScenarioGenerationService.server.ts

import { logger } from '$lib/logger';
import { db } from '$lib/server/db';
import { adaptiveWeeks, scenarios } from '$lib/server/db/schema';
import type { ConversationSeed } from '$lib/server/db/schema/adaptive-weeks';
import type { NewScenario } from '$lib/server/db/types';
import { generateScenarioWithGPT } from '$lib/server/services/openai.service';
import { scenarioMetadataRepository } from '$lib/server/repositories/scenario-metadata.repository';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Result of custom scenario generation
 */
export interface CustomScenarioGenerationResult {
	success: boolean;
	scenariosGenerated: number;
	scenarioIds: string[];
	errors: Array<{ seedId: string; error: string }>;
}

/**
 * CustomScenarioGenerationService - Generates personalized scenarios from conversation seeds
 *
 * This service handles the generation of custom scenarios for adaptive learning paths.
 * When a learning path is assigned to a user, this service:
 * 1. Takes the conversation seeds from the active week
 * 2. Generates a unique scenario for each seed using AI
 * 3. Links the scenarios back to the seeds
 *
 * These scenarios are private to the user and tailored to their learning context.
 *
 * **Server-Side Only** - This service makes database and API calls
 */
export class CustomScenarioGenerationService {
	/**
	 * Generate custom scenarios for all seeds in a week
	 *
	 * @param weekId - The adaptive week ID
	 * @param userId - The user ID (for scenario ownership)
	 * @param targetLanguage - The target language code
	 * @returns Generation result with stats and scenario IDs
	 */
	static async generateScenariosForWeek(
		weekId: string,
		userId: string,
		targetLanguage: string
	): Promise<CustomScenarioGenerationResult> {
		const result: CustomScenarioGenerationResult = {
			success: true,
			scenariosGenerated: 0,
			scenarioIds: [],
			errors: []
		};

		try {
			logger.info('🎬 [CustomScenarioGen] Starting scenario generation for week', {
				weekId,
				userId,
				targetLanguage
			});

			// Get the adaptive week
			const week = await db.query.adaptiveWeeks.findFirst({
				where: eq(adaptiveWeeks.id, weekId)
			});

			if (!week) {
				logger.error('🚨 [CustomScenarioGen] Week not found', { weekId });
				return {
					success: false,
					scenariosGenerated: 0,
					scenarioIds: [],
					errors: [{ seedId: 'unknown', error: `Week ${weekId} not found` }]
				};
			}

			const seeds = week.conversationSeeds as ConversationSeed[];

			if (!seeds || seeds.length === 0) {
				logger.warn('⚠️ [CustomScenarioGen] No conversation seeds in week', { weekId });
				return result;
			}

			logger.info(`📋 [CustomScenarioGen] Found ${seeds.length} seeds to process`);

			// Generate scenarios for each seed
			const updatedSeeds: ConversationSeed[] = [];

			for (const seed of seeds) {
				// Skip if scenario already exists
				if (seed.scenarioId) {
					logger.info(`⏭️ [CustomScenarioGen] Skipping seed ${seed.id} - scenario already exists`);
					updatedSeeds.push(seed);
					continue;
				}

				try {
					const scenario = await this.generateScenarioFromSeed(
						seed,
						week,
						userId,
						targetLanguage
					);

					// Update seed with scenario ID
					updatedSeeds.push({
						...seed,
						scenarioId: scenario.id
					});

					result.scenariosGenerated++;
					result.scenarioIds.push(scenario.id);

					logger.info(`✅ [CustomScenarioGen] Generated scenario for seed ${seed.id}`, {
						seedId: seed.id,
						scenarioId: scenario.id,
						title: scenario.title
					});
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					result.errors.push({ seedId: seed.id, error: errorMessage });
					updatedSeeds.push(seed); // Keep original seed without scenario

					logger.error(`❌ [CustomScenarioGen] Failed to generate scenario for seed ${seed.id}`, {
						seedId: seed.id,
						error: errorMessage
					});
				}
			}

			// Update the week's conversation seeds with scenario IDs
			await db
				.update(adaptiveWeeks)
				.set({
					conversationSeeds: updatedSeeds,
					updatedAt: new Date()
				})
				.where(eq(adaptiveWeeks.id, weekId));

			logger.info('✅ [CustomScenarioGen] Week updated with scenario IDs', {
				weekId,
				scenariosGenerated: result.scenariosGenerated,
				errors: result.errors.length
			});

			result.success = result.errors.length === 0;
			return result;
		} catch (error) {
			logger.error('🚨 [CustomScenarioGen] Fatal error during generation', error);
			return {
				success: false,
				scenariosGenerated: result.scenariosGenerated,
				scenarioIds: result.scenarioIds,
				errors: [
					...result.errors,
					{ seedId: 'global', error: error instanceof Error ? error.message : 'Unknown error' }
				]
			};
		}
	}

	/**
	 * Generate custom scenarios for a user's assignment
	 *
	 * This is the main entry point when assigning a path to a user.
	 * It finds the active week and generates scenarios for all seeds.
	 *
	 * @param pathId - The learning path ID
	 * @param userId - The user ID
	 * @param targetLanguage - The target language code
	 * @returns Generation result
	 */
	static async generateScenariosForAssignment(
		pathId: string,
		userId: string,
		targetLanguage: string
	): Promise<CustomScenarioGenerationResult> {
		try {
			logger.info('🎓 [CustomScenarioGen] Generating scenarios for assignment', {
				pathId,
				userId,
				targetLanguage
			});

			// Find active week(s) for this path
			const activeWeeks = await db.query.adaptiveWeeks.findMany({
				where: and(
					eq(adaptiveWeeks.pathId, pathId),
					eq(adaptiveWeeks.status, 'active')
				)
			});

			if (activeWeeks.length === 0) {
				logger.warn('⚠️ [CustomScenarioGen] No active weeks found for path', { pathId });
				return {
					success: true,
					scenariosGenerated: 0,
					scenarioIds: [],
					errors: []
				};
			}

			// Generate scenarios for each active week
			const allResults: CustomScenarioGenerationResult = {
				success: true,
				scenariosGenerated: 0,
				scenarioIds: [],
				errors: []
			};

			for (const week of activeWeeks) {
				const weekResult = await this.generateScenariosForWeek(week.id, userId, targetLanguage);

				allResults.scenariosGenerated += weekResult.scenariosGenerated;
				allResults.scenarioIds.push(...weekResult.scenarioIds);
				allResults.errors.push(...weekResult.errors);

				if (!weekResult.success) {
					allResults.success = false;
				}
			}

			logger.info('✅ [CustomScenarioGen] Assignment scenario generation complete', {
				pathId,
				userId,
				totalGenerated: allResults.scenariosGenerated,
				totalErrors: allResults.errors.length
			});

			return allResults;
		} catch (error) {
			logger.error('🚨 [CustomScenarioGen] Error generating scenarios for assignment', error);
			return {
				success: false,
				scenariosGenerated: 0,
				scenarioIds: [],
				errors: [{ seedId: 'global', error: error instanceof Error ? error.message : 'Unknown error' }]
			};
		}
	}

	/**
	 * Generate a single scenario from a conversation seed
	 */
	private static async generateScenarioFromSeed(
		seed: ConversationSeed,
		week: typeof adaptiveWeeks.$inferSelect,
		userId: string,
		targetLanguage: string
	): Promise<typeof scenarios.$inferSelect> {
		// Build description from seed
		const description = this.buildScenarioDescription(seed, week, targetLanguage);

		// Generate scenario content using GPT
		const { content: generatedContent } = await generateScenarioWithGPT({
			description,
			mode: 'tutor',
			languageId: targetLanguage
		});

		// Create scenario ID
		const scenarioId = `custom-${nanoid(10)}`;

		// Build scenario record
		const newScenario: NewScenario = {
			id: scenarioId,
			title: generatedContent.title || seed.title,
			description: generatedContent.description || seed.description,
			role: 'tutor',
			difficulty: generatedContent.difficulty || this.mapCefrToDifficulty(week.difficultyMin),
			difficultyRating: this.getDifficultyRating(week.difficultyMin),
			cefrLevel: generatedContent.cefrLevel || week.difficultyMin,
			cefrRecommendation: week.difficultyMax,
			learningGoal: generatedContent.learningGoal,
			instructions: generatedContent.instructions,
			context: generatedContent.context,
			expectedOutcome: generatedContent.expectedOutcome,
			learningObjectives: generatedContent.learningObjectives || [],
			persona: generatedContent.persona,
			visibility: 'private', // Custom scenarios are private to the user
			createdByUserId: userId,
			usageCount: 0,
			isActive: true,
			categories: ['learning-path', 'custom'],
			tags: [
				`week:${week.weekNumber}`,
				`seed:${seed.id}`,
				`path:${week.pathId}`
			],
			primarySkill: 'conversation',
			comfortIndicators: {
				confidence: 3,
				engagement: 4,
				understanding: 3
			},
			searchKeywords: seed.vocabularyHints,
			thumbnailUrl: null,
			estimatedDurationSeconds: 600, // 10 minutes default
			authorDisplayName: null,
			shareSlug: null,
			shareUrl: null
		};

		// Insert scenario into database
		const [createdScenario] = await db
			.insert(scenarios)
			.values({
				...newScenario,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		// Initialize metadata
		try {
			await scenarioMetadataRepository.initializeMetadata(createdScenario.id);
		} catch (error) {
			logger.warn(`⚠️ [CustomScenarioGen] Failed to initialize metadata for ${createdScenario.id}`, error);
		}

		return createdScenario;
	}

	/**
	 * Build a detailed description for scenario generation from conversation seed
	 */
	private static buildScenarioDescription(
		seed: ConversationSeed,
		week: typeof adaptiveWeeks.$inferSelect,
		targetLanguage: string
	): string {
		const parts = [
			`Create a personalized ${targetLanguage.toUpperCase()} language learning scenario.`,
			``,
			`CONVERSATION TOPIC: ${seed.title}`,
			`${seed.description}`,
			``,
			`WEEKLY THEME: ${week.theme}`,
			`${week.themeDescription}`,
			``,
			`TARGET DIFFICULTY: ${week.difficultyMin} to ${week.difficultyMax}`,
			``
		];

		if (seed.vocabularyHints && seed.vocabularyHints.length > 0) {
			parts.push(`KEY VOCABULARY TO PRACTICE:`);
			parts.push(`- ${seed.vocabularyHints.join(', ')}`);
			parts.push(``);
		}

		if (seed.grammarHints && seed.grammarHints.length > 0) {
			parts.push(`GRAMMAR FOCUS:`);
			parts.push(`- ${seed.grammarHints.join(', ')}`);
			parts.push(``);
		}

		if (seed.suggestedSessionTypes && seed.suggestedSessionTypes.length > 0) {
			parts.push(`SESSION STYLE: ${seed.suggestedSessionTypes.join(' or ')}`);
		}

		parts.push(``, `Create a warm, encouraging scenario that helps the learner practice this topic naturally.`);

		return parts.join('\n');
	}

	/**
	 * Map CEFR level to difficulty enum
	 */
	private static mapCefrToDifficulty(cefr?: string): 'beginner' | 'intermediate' | 'advanced' {
		if (!cefr) return 'intermediate';
		const upper = cefr.toUpperCase();
		if (upper.startsWith('A')) return 'beginner';
		if (upper.startsWith('C')) return 'advanced';
		return 'intermediate';
	}

	/**
	 * Get numeric difficulty rating from CEFR
	 */
	private static getDifficultyRating(cefr?: string): number {
		if (!cefr) return 3;
		const upper = cefr.toUpperCase();
		if (upper === 'A1') return 1;
		if (upper === 'A2') return 2;
		if (upper === 'B1') return 3;
		if (upper === 'B2') return 4;
		if (upper.startsWith('C')) return 5;
		return 3;
	}
}

// Export singleton-style functions for convenience
export const generateScenariosForWeek = CustomScenarioGenerationService.generateScenariosForWeek.bind(
	CustomScenarioGenerationService
);

export const generateScenariosForAssignment = CustomScenarioGenerationService.generateScenariosForAssignment.bind(
	CustomScenarioGenerationService
);
