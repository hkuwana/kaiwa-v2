// src/lib/features/learning-path/services/CustomScenarioGenerationService.server.ts

import { logger } from '$lib/logger';
import { db } from '$lib/server/db';
import { adaptiveWeeks, scenarios } from '$lib/server/db/schema';
import type { ConversationSeed } from '$lib/server/db/schema/adaptive-weeks';
import type { NewScenario } from '$lib/server/db/types';
import { generateScenarioWithGPT } from '$lib/server/services/openai.service';
import { scenarioMetadataRepository } from '$lib/server/repositories/scenario-metadata.repository';
import { speakersRepository } from '$lib/server/repositories/speakers.repository';
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

		const weekStartTime = Date.now();

		try {
			logger.info('🎬 [CustomScenarioGen] Starting scenario generation for week', {
				weekId,
				userId,
				targetLanguage,
				timestamp: new Date().toISOString()
			});

			// Look up a default speaker for this language
			let defaultSpeakerId: string | null = null;
			try {
				const speakers = await speakersRepository.getActiveSpeakersByLanguage(targetLanguage);
				if (speakers.length > 0) {
					// Pick the first active speaker as default
					defaultSpeakerId = speakers[0].id;
					logger.info(`🔊 [CustomScenarioGen] Using default speaker for ${targetLanguage}`, {
						speakerId: defaultSpeakerId,
						speakerName: speakers[0].voiceName,
						totalAvailable: speakers.length
					});
				} else {
					logger.warn(`⚠️ [CustomScenarioGen] No active speakers found for ${targetLanguage}`);
				}
			} catch (speakerError) {
				logger.warn(`⚠️ [CustomScenarioGen] Failed to look up speakers for ${targetLanguage}`, {
					error: speakerError instanceof Error ? speakerError.message : 'Unknown error'
				});
			}

			// Get the adaptive week
			const dbStartTime = Date.now();
			const week = await db.query.adaptiveWeeks.findFirst({
				where: eq(adaptiveWeeks.id, weekId)
			});
			logger.info(`📊 [CustomScenarioGen] DB query took ${Date.now() - dbStartTime}ms`);

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

			const seedsToProcess = seeds.filter((s) => !s.scenarioId);
			const seedsAlreadyDone = seeds.filter((s) => s.scenarioId);

			logger.info(`📋 [CustomScenarioGen] Seed analysis:`, {
				totalSeeds: seeds.length,
				alreadyGenerated: seedsAlreadyDone.length,
				needsGeneration: seedsToProcess.length,
				seedTitles: seedsToProcess.map((s) => s.title)
			});

			// Generate scenarios for each seed
			const updatedSeeds: ConversationSeed[] = [];

			let processedCount = 0;
			for (const seed of seeds) {
				// Skip if scenario already exists
				if (seed.scenarioId) {
					logger.info(`⏭️ [CustomScenarioGen] Skipping seed ${seed.id} - scenario already exists`, {
						scenarioId: seed.scenarioId
					});
					updatedSeeds.push(seed);
					continue;
				}

				processedCount++;
				const seedStartTime = Date.now();

				logger.info(
					`🔄 [CustomScenarioGen] Generating scenario ${processedCount}/${seedsToProcess.length}`,
					{
						seedId: seed.id,
						seedTitle: seed.title,
						targetLanguage
					}
				);

				try {
					const scenario = await this.generateScenarioFromSeed(
						seed,
						week,
						userId,
						targetLanguage,
						defaultSpeakerId
					);

					const seedDuration = Date.now() - seedStartTime;

					// Update seed with scenario ID
					updatedSeeds.push({
						...seed,
						scenarioId: scenario.id
					});

					result.scenariosGenerated++;
					result.scenarioIds.push(scenario.id);

					logger.info(
						`✅ [CustomScenarioGen] Generated scenario ${processedCount}/${seedsToProcess.length} in ${seedDuration}ms`,
						{
							seedId: seed.id,
							seedTitle: seed.title,
							scenarioId: scenario.id,
							scenarioTitle: scenario.title,
							durationMs: seedDuration
						}
					);
				} catch (error) {
					const seedDuration = Date.now() - seedStartTime;
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					const errorStack = error instanceof Error ? error.stack : undefined;

					result.errors.push({ seedId: seed.id, error: errorMessage });
					updatedSeeds.push(seed); // Keep original seed without scenario

					logger.error(
						`❌ [CustomScenarioGen] Failed to generate scenario ${processedCount}/${seedsToProcess.length} after ${seedDuration}ms`,
						{
							seedId: seed.id,
							seedTitle: seed.title,
							error: errorMessage,
							stack: errorStack,
							durationMs: seedDuration
						}
					);
				}
			}

			// Update the week's conversation seeds with scenario IDs
			const dbUpdateStart = Date.now();
			await db
				.update(adaptiveWeeks)
				.set({
					conversationSeeds: updatedSeeds,
					updatedAt: new Date()
				})
				.where(eq(adaptiveWeeks.id, weekId));
			logger.info(`📊 [CustomScenarioGen] DB update took ${Date.now() - dbUpdateStart}ms`);

			const totalDuration = Date.now() - weekStartTime;
			logger.info('✅ [CustomScenarioGen] Week generation complete', {
				weekId,
				scenariosGenerated: result.scenariosGenerated,
				errors: result.errors.length,
				totalDurationMs: totalDuration,
				averagePerScenarioMs:
					result.scenariosGenerated > 0 ? Math.round(totalDuration / result.scenariosGenerated) : 0
			});

			result.success = result.errors.length === 0;
			return result;
		} catch (error) {
			const totalDuration = Date.now() - weekStartTime;
			logger.error('🚨 [CustomScenarioGen] Fatal error during generation', {
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				totalDurationMs: totalDuration
			});
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
		const assignmentStartTime = Date.now();

		try {
			logger.info('🎓 [CustomScenarioGen] Starting scenario generation for assignment', {
				pathId,
				userId,
				targetLanguage,
				timestamp: new Date().toISOString()
			});

			// Find active week(s) for this path
			const dbStartTime = Date.now();
			const activeWeeks = await db.query.adaptiveWeeks.findMany({
				where: and(eq(adaptiveWeeks.pathId, pathId), eq(adaptiveWeeks.status, 'active'))
			});
			logger.info(`📊 [CustomScenarioGen] Active weeks query took ${Date.now() - dbStartTime}ms`, {
				activeWeeksFound: activeWeeks.length,
				weekIds: activeWeeks.map((w) => w.id)
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

			// Log the total seeds we need to generate
			let totalSeedsToGenerate = 0;
			for (const week of activeWeeks) {
				const seeds = (week.conversationSeeds || []) as ConversationSeed[];
				const pending = seeds.filter((s) => !s.scenarioId).length;
				totalSeedsToGenerate += pending;
			}
			logger.info(
				`📋 [CustomScenarioGen] Total scenarios to generate: ${totalSeedsToGenerate} across ${activeWeeks.length} week(s)`
			);

			// Generate scenarios for each active week
			const allResults: CustomScenarioGenerationResult = {
				success: true,
				scenariosGenerated: 0,
				scenarioIds: [],
				errors: []
			};

			for (let i = 0; i < activeWeeks.length; i++) {
				const week = activeWeeks[i];
				logger.info(`🗓️ [CustomScenarioGen] Processing week ${i + 1}/${activeWeeks.length}`, {
					weekId: week.id,
					weekNumber: week.weekNumber,
					theme: week.theme
				});

				const weekResult = await this.generateScenariosForWeek(week.id, userId, targetLanguage);

				allResults.scenariosGenerated += weekResult.scenariosGenerated;
				allResults.scenarioIds.push(...weekResult.scenarioIds);
				allResults.errors.push(...weekResult.errors);

				if (!weekResult.success) {
					allResults.success = false;
				}
			}

			const totalDuration = Date.now() - assignmentStartTime;
			logger.info('✅ [CustomScenarioGen] Assignment scenario generation complete', {
				pathId,
				userId,
				totalGenerated: allResults.scenariosGenerated,
				totalErrors: allResults.errors.length,
				totalDurationMs: totalDuration,
				averagePerScenarioMs:
					allResults.scenariosGenerated > 0
						? Math.round(totalDuration / allResults.scenariosGenerated)
						: 0
			});

			return allResults;
		} catch (error) {
			const totalDuration = Date.now() - assignmentStartTime;
			logger.error('🚨 [CustomScenarioGen] Error generating scenarios for assignment', {
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				totalDurationMs: totalDuration
			});
			return {
				success: false,
				scenariosGenerated: 0,
				scenarioIds: [],
				errors: [
					{ seedId: 'global', error: error instanceof Error ? error.message : 'Unknown error' }
				]
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
		targetLanguage: string,
		defaultSpeakerId?: string | null
	): Promise<typeof scenarios.$inferSelect> {
		logger.info(`🏗️ [CustomScenarioGen] Building scenario from seed`, {
			seedId: seed.id,
			seedTitle: seed.title,
			weekTheme: week.theme
		});

		// Build description from seed
		const description = this.buildScenarioDescription(seed, week, targetLanguage);
		logger.debug(`📝 [CustomScenarioGen] Built prompt for GPT`, {
			promptLength: description.length,
			promptPreview: description.substring(0, 200) + '...'
		});

		// Generate scenario content using GPT
		const gptStartTime = Date.now();
		logger.info(`🤖 [CustomScenarioGen] Calling GPT for scenario generation...`);

		const { content: generatedContent, tokensUsed } = await generateScenarioWithGPT({
			description,
			mode: 'tutor',
			languageId: targetLanguage
		});

		const gptDuration = Date.now() - gptStartTime;
		logger.info(`🤖 [CustomScenarioGen] GPT response received in ${gptDuration}ms`, {
			tokensUsed,
			generatedTitle: generatedContent.title,
			generatedDifficulty: generatedContent.difficulty
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
			tags: [`week:${week.weekNumber}`, `seed:${seed.id}`, `path:${week.pathId}`],
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
			shareUrl: null,
			// Learning path integration fields
			targetLanguages: [targetLanguage], // Language-specific to the learning path
			defaultSpeakerId: defaultSpeakerId ?? null, // Use provided speaker or null
			learningPathSlug: week.pathId, // Group by learning path ID
			learningPathOrder: null // Seeds are a pool, not ordered days
		};

		// Insert scenario into database
		const dbInsertStart = Date.now();
		logger.info(`💾 [CustomScenarioGen] Inserting scenario into database...`, {
			scenarioId,
			title: newScenario.title
		});

		const [createdScenario] = await db
			.insert(scenarios)
			.values({
				...newScenario,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		logger.info(`💾 [CustomScenarioGen] Scenario inserted in ${Date.now() - dbInsertStart}ms`, {
			scenarioId: createdScenario.id
		});

		// Initialize metadata
		const metadataStart = Date.now();
		try {
			await scenarioMetadataRepository.initializeMetadata(createdScenario.id);
			logger.info(`📊 [CustomScenarioGen] Metadata initialized in ${Date.now() - metadataStart}ms`);
		} catch (error) {
			logger.warn(
				`⚠️ [CustomScenarioGen] Failed to initialize metadata for ${createdScenario.id}`,
				{
					error: error instanceof Error ? error.message : 'Unknown error',
					durationMs: Date.now() - metadataStart
				}
			);
		}

		return createdScenario;
	}

	/**
	 * Build a detailed description for scenario generation from conversation seed
	 *
	 * Now includes friction configuration to create realistic practice scenarios
	 * that prepare learners for real human unpredictability.
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
			parts.push(``);
		}

		// Add friction configuration for realistic practice
		const frictionLevel = seed.frictionLevel || this.inferFrictionLevel(week.weekNumber);
		parts.push(`REALISM LEVEL: ${frictionLevel.toUpperCase()}`);
		parts.push(``);

		if (frictionLevel === 'supportive') {
			parts.push(`CONVERSATION PARTNER BEHAVIOR:`);
			parts.push(`- Warm, patient, and encouraging`);
			parts.push(`- Speaks clearly and at a comfortable pace`);
			parts.push(`- Gives the learner time to respond`);
			parts.push(`- Offers gentle hints when the learner struggles`);
			parts.push(``);
		} else if (frictionLevel === 'realistic') {
			parts.push(`CONVERSATION PARTNER BEHAVIOR:`);
			parts.push(`- Generally friendly but not overly accommodating`);
			parts.push(`- May ask follow-up questions the learner didn't prepare for`);
			parts.push(`- Occasionally pauses, expecting the learner to continue`);
			parts.push(`- Uses natural speech patterns (not artificially slow)`);
			parts.push(`- May briefly change topics mid-conversation`);
			parts.push(``);
		} else if (frictionLevel === 'challenging') {
			parts.push(`CONVERSATION PARTNER BEHAVIOR:`);
			parts.push(`- Realistic human behavior - not artificially supportive`);
			parts.push(`- May express mild skepticism or ask probing questions`);
			parts.push(`- Uses indirect communication that requires interpretation`);
			parts.push(`- May test the learner's cultural knowledge`);
			parts.push(`- Creates moments where the learner must recover from small mistakes`);
			parts.push(`- Doesn't always fill silences - waits for the learner to continue`);
			parts.push(``);
		}

		// Add specific friction types if configured
		if (seed.frictionTypes && seed.frictionTypes.length > 0) {
			parts.push(`INCLUDE THESE REALISTIC MOMENTS:`);
			for (const friction of seed.frictionTypes) {
				parts.push(`- ${this.describeFrictionType(friction)}`);
			}
			parts.push(``);
		}

		// Add personality variant if configured
		if (seed.personalityVariant) {
			parts.push(`AI PARTNER PERSONALITY: ${seed.personalityVariant}`);
			parts.push(
				`The conversation partner should embody this personality throughout the scenario.`
			);
			parts.push(``);
		}

		parts.push(
			`Create a scenario that balances learning support with realistic human interaction.`,
			`The goal is to prepare the learner for real conversations, not just comfortable practice.`
		);

		return parts.join('\n');
	}

	/**
	 * Infer friction level based on week number if not explicitly set
	 */
	private static inferFrictionLevel(weekNumber: number): 'supportive' | 'realistic' | 'challenging' {
		if (weekNumber <= 1) return 'supportive';
		if (weekNumber <= 2) return 'realistic';
		return 'challenging';
	}

	/**
	 * Describe a friction type in natural language for the prompt
	 */
	private static describeFrictionType(friction: string): string {
		const descriptions: Record<string, string> = {
			unexpected_question:
				'Ask an unexpected personal question the learner may not have prepared for',
			awkward_silence:
				'Create a natural pause where the learner must decide how to continue',
			cultural_test:
				'Reference a cultural concept to see if the learner understands it',
			indirect_criticism:
				'Express mild skepticism or concern in a polite, indirect way',
			topic_change: 'Shift to a related but unexpected topic mid-conversation',
			misunderstanding:
				'Misinterpret something the learner says, requiring clarification',
			emotional_moment:
				'Express genuine emotion (joy, concern, nostalgia) that the learner must respond to',
			multiple_speakers: 'Have another person briefly join the conversation',
			interruption: 'Interrupt the learner naturally, as humans sometimes do',
			testing_commitment: "Probe the learner's intentions or seriousness about something"
		};
		return descriptions[friction] || friction;
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
export const generateScenariosForWeek =
	CustomScenarioGenerationService.generateScenariosForWeek.bind(CustomScenarioGenerationService);

export const generateScenariosForAssignment =
	CustomScenarioGenerationService.generateScenariosForAssignment.bind(
		CustomScenarioGenerationService
	);
