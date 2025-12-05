// src/lib/features/learning-path/services/ScenarioGenerationJobService.server.ts

/**
 * ScenarioGenerationJobService - Background job processor for scenario generation
 *
 * This service handles the reliable generation of scenarios with:
 * - Non-blocking assignment (returns immediately, generates in background)
 * - Retry logic with exponential backoff
 * - Per-seed status tracking
 * - Timeout handling
 * - Dashboard auto-generation failsafe
 *
 * Architecture:
 * 1. Assignment queues a generation job (doesn't block)
 * 2. Dashboard polls for status and triggers generation if stuck
 * 3. Each seed is generated independently with retry
 * 4. Status is persisted so user can refresh and see progress
 */

import { logger } from '$lib/logger';
import { db } from '$lib/server/db';
import { adaptiveWeeks, scenarios } from '$lib/server/db/schema';
import type { ConversationSeed } from '$lib/server/db/schema/adaptive-weeks';
import type { NewScenario } from '$lib/server/db/types';
import { generateScenarioWithGPT } from '$lib/server/services/openai.service';
import { scenarioMetadataRepository } from '$lib/server/repositories/scenario-metadata.repository';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Types for tracking generation state
export interface SeedGenerationStatus {
	seedId: string;
	status: 'pending' | 'generating' | 'ready' | 'failed';
	scenarioId?: string;
	error?: string;
	retryCount: number;
	lastAttemptAt?: string;
}

export interface WeekGenerationStatus {
	weekId: string;
	pathId: string;
	totalSeeds: number;
	readyCount: number;
	pendingCount: number;
	failedCount: number;
	generatingCount: number;
	seeds: SeedGenerationStatus[];
	isComplete: boolean;
	hasFailures: boolean;
}

export interface GenerateSingleResult {
	success: boolean;
	seedId: string;
	scenarioId?: string;
	error?: string;
	shouldRetry: boolean;
}

// Constants
const MAX_RETRIES = 3;
const GENERATION_TIMEOUT_MS = 90000; // 90 seconds per scenario
const RETRY_DELAYS = [5000, 15000, 45000]; // 5s, 15s, 45s

/**
 * Extended seed type with generation metadata
 */
interface ExtendedConversationSeed extends ConversationSeed {
	_generationStatus?: 'pending' | 'generating' | 'ready' | 'failed';
	_retryCount?: number;
	_lastError?: string;
	_lastAttemptAt?: string;
}

export class ScenarioGenerationJobService {
	/**
	 * Get the current generation status for a week
	 */
	static async getWeekStatus(weekId: string): Promise<WeekGenerationStatus | null> {
		try {
			const week = await db.query.adaptiveWeeks.findFirst({
				where: eq(adaptiveWeeks.id, weekId)
			});

			if (!week) return null;

			const seeds = (week.conversationSeeds || []) as ExtendedConversationSeed[];

			const seedStatuses: SeedGenerationStatus[] = seeds.map((seed) => ({
				seedId: seed.id,
				status: seed.scenarioId ? 'ready' : seed._generationStatus || 'pending',
				scenarioId: seed.scenarioId,
				error: seed._lastError,
				retryCount: seed._retryCount || 0,
				lastAttemptAt: seed._lastAttemptAt
			}));

			const readyCount = seedStatuses.filter((s) => s.status === 'ready').length;
			const pendingCount = seedStatuses.filter((s) => s.status === 'pending').length;
			const failedCount = seedStatuses.filter((s) => s.status === 'failed').length;
			const generatingCount = seedStatuses.filter((s) => s.status === 'generating').length;

			return {
				weekId,
				pathId: week.pathId,
				totalSeeds: seeds.length,
				readyCount,
				pendingCount,
				failedCount,
				generatingCount,
				seeds: seedStatuses,
				isComplete: readyCount === seeds.length,
				hasFailures: failedCount > 0
			};
		} catch (error) {
			logger.error('[JobService] Error getting week status', { weekId, error });
			return null;
		}
	}

	/**
	 * Get status for all active weeks in a path
	 */
	static async getPathStatus(pathId: string): Promise<WeekGenerationStatus[]> {
		try {
			const activeWeeks = await db.query.adaptiveWeeks.findMany({
				where: and(eq(adaptiveWeeks.pathId, pathId), eq(adaptiveWeeks.status, 'active'))
			});

			const statuses: WeekGenerationStatus[] = [];
			for (const week of activeWeeks) {
				const status = await this.getWeekStatus(week.id);
				if (status) statuses.push(status);
			}

			return statuses;
		} catch (error) {
			logger.error('[JobService] Error getting path status', { pathId, error });
			return [];
		}
	}

	/**
	 * Generate the next pending scenario for a week
	 * This is designed to be called repeatedly until all scenarios are ready
	 * Returns immediately if nothing to do or after generating one scenario
	 */
	static async generateNextPending(
		weekId: string,
		userId: string,
		targetLanguage: string
	): Promise<GenerateSingleResult> {
		const startTime = Date.now();

		try {
			// Get the week
			const week = await db.query.adaptiveWeeks.findFirst({
				where: eq(adaptiveWeeks.id, weekId)
			});

			if (!week) {
				return {
					success: false,
					seedId: '',
					error: 'Week not found',
					shouldRetry: false
				};
			}

			const seeds = (week.conversationSeeds || []) as ExtendedConversationSeed[];

			// Find first pending seed that isn't currently being generated
			// and hasn't exceeded retry limit
			const pendingSeed = seeds.find((seed) => {
				if (seed.scenarioId) return false; // Already done
				if (seed._generationStatus === 'generating') {
					// Check if it's stale (been generating for > 2 minutes)
					const lastAttempt = seed._lastAttemptAt ? new Date(seed._lastAttemptAt).getTime() : 0;
					const isStale = Date.now() - lastAttempt > 120000;
					if (!isStale) return false;
				}
				if (seed._generationStatus === 'failed' && (seed._retryCount || 0) >= MAX_RETRIES) {
					return false; // Max retries exceeded
				}
				return true;
			});

			if (!pendingSeed) {
				// Nothing to generate
				return {
					success: true,
					seedId: '',
					error: 'No pending seeds',
					shouldRetry: false
				};
			}

			// Mark as generating
			const updatedSeeds = seeds.map((s) =>
				s.id === pendingSeed.id
					? {
							...s,
							_generationStatus: 'generating' as const,
							_lastAttemptAt: new Date().toISOString(),
							_retryCount: (s._retryCount || 0) + (s._generationStatus === 'failed' ? 1 : 0)
						}
					: s
			);

			await db
				.update(adaptiveWeeks)
				.set({ conversationSeeds: updatedSeeds, updatedAt: new Date() })
				.where(eq(adaptiveWeeks.id, weekId));

			logger.info('[JobService] Generating scenario for seed', {
				weekId,
				seedId: pendingSeed.id,
				seedTitle: pendingSeed.title,
				retryCount: pendingSeed._retryCount || 0
			});

			// Generate with timeout
			const timeoutPromise = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error('Generation timeout')), GENERATION_TIMEOUT_MS)
			);

			const generationPromise = this.generateScenarioFromSeed(
				pendingSeed,
				week,
				userId,
				targetLanguage
			);

			const scenario = await Promise.race([generationPromise, timeoutPromise]);

			// Update seed with scenario ID
			const finalSeeds = seeds.map((s) =>
				s.id === pendingSeed.id
					? {
							...s,
							scenarioId: scenario.id,
							_generationStatus: 'ready' as const,
							_lastError: undefined
						}
					: s
			);

			await db
				.update(adaptiveWeeks)
				.set({ conversationSeeds: finalSeeds, updatedAt: new Date() })
				.where(eq(adaptiveWeeks.id, weekId));

			const duration = Date.now() - startTime;
			logger.info('[JobService] Scenario generated successfully', {
				weekId,
				seedId: pendingSeed.id,
				scenarioId: scenario.id,
				durationMs: duration
			});

			return {
				success: true,
				seedId: pendingSeed.id,
				scenarioId: scenario.id,
				shouldRetry: false
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			const duration = Date.now() - startTime;

			logger.error('[JobService] Error generating scenario', {
				weekId,
				error: errorMessage,
				durationMs: duration
			});

			// Update seed status to failed
			try {
				const week = await db.query.adaptiveWeeks.findFirst({
					where: eq(adaptiveWeeks.id, weekId)
				});

				if (week) {
					const seeds = (week.conversationSeeds || []) as ExtendedConversationSeed[];
					const failedSeed = seeds.find((s) => s._generationStatus === 'generating');

					if (failedSeed) {
						const retryCount = (failedSeed._retryCount || 0) + 1;
						const shouldRetry = retryCount < MAX_RETRIES;

						const updatedSeeds = seeds.map((s) =>
							s.id === failedSeed.id
								? {
										...s,
										_generationStatus: 'failed' as const,
										_lastError: errorMessage,
										_retryCount: retryCount
									}
								: s
						);

						await db
							.update(adaptiveWeeks)
							.set({ conversationSeeds: updatedSeeds, updatedAt: new Date() })
							.where(eq(adaptiveWeeks.id, weekId));

						return {
							success: false,
							seedId: failedSeed.id,
							error: errorMessage,
							shouldRetry
						};
					}
				}
			} catch (updateError) {
				logger.error('[JobService] Error updating failed status', { updateError });
			}

			return {
				success: false,
				seedId: '',
				error: errorMessage,
				shouldRetry: true
			};
		}
	}

	/**
	 * Generate all pending scenarios for a week
	 * This runs until all scenarios are generated or max retries exceeded
	 */
	static async generateAllForWeek(
		weekId: string,
		userId: string,
		targetLanguage: string,
		onProgress?: (status: WeekGenerationStatus) => void
	): Promise<WeekGenerationStatus> {
		let attempts = 0;
		const maxAttempts = 50; // Safety limit

		while (attempts < maxAttempts) {
			attempts++;

			const status = await this.getWeekStatus(weekId);
			if (!status) {
				throw new Error('Week not found');
			}

			// Report progress
			onProgress?.(status);

			// Check if complete
			if (status.isComplete) {
				logger.info('[JobService] All scenarios generated', { weekId, attempts });
				return status;
			}

			// Check if all remaining are failed with max retries
			if (status.pendingCount === 0 && status.generatingCount === 0) {
				logger.warn('[JobService] All remaining seeds failed max retries', { weekId });
				return status;
			}

			// Generate next
			const result = await this.generateNextPending(weekId, userId, targetLanguage);

			if (!result.success && !result.shouldRetry) {
				// Fatal error or no more pending
				if (result.error === 'No pending seeds') {
					// All done
					return (await this.getWeekStatus(weekId))!;
				}
			}

			// Small delay between generations to avoid rate limits
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}

		// Safety limit reached
		const finalStatus = await this.getWeekStatus(weekId);
		logger.warn('[JobService] Max attempts reached', { weekId, attempts });
		return finalStatus!;
	}

	/**
	 * Reset failed seeds to pending for retry
	 */
	static async resetFailedSeeds(weekId: string): Promise<number> {
		try {
			const week = await db.query.adaptiveWeeks.findFirst({
				where: eq(adaptiveWeeks.id, weekId)
			});

			if (!week) return 0;

			const seeds = (week.conversationSeeds || []) as ExtendedConversationSeed[];
			let resetCount = 0;

			const updatedSeeds = seeds.map((s) => {
				if (s._generationStatus === 'failed') {
					resetCount++;
					return {
						...s,
						_generationStatus: 'pending' as const,
						_retryCount: 0,
						_lastError: undefined
					};
				}
				return s;
			});

			if (resetCount > 0) {
				await db
					.update(adaptiveWeeks)
					.set({ conversationSeeds: updatedSeeds, updatedAt: new Date() })
					.where(eq(adaptiveWeeks.id, weekId));
			}

			return resetCount;
		} catch (error) {
			logger.error('[JobService] Error resetting failed seeds', { weekId, error });
			return 0;
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
		const { content: generatedContent, tokensUsed } = await generateScenarioWithGPT({
			description,
			mode: 'tutor',
			languageId: targetLanguage
		});

		logger.debug('[JobService] GPT response received', { tokensUsed });

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
			visibility: 'public', // Make generated scenarios public so they can be shared
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
			estimatedDurationSeconds: 600,
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

		// Initialize metadata (best effort)
		try {
			await scenarioMetadataRepository.initializeMetadata(createdScenario.id);
		} catch (error) {
			logger.warn('[JobService] Failed to initialize metadata', { scenarioId: createdScenario.id });
		}

		return createdScenario;
	}

	/**
	 * Build a detailed description for scenario generation
	 * Includes friction configuration based on week number for realistic practice
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

		// Add friction configuration based on week number
		const frictionLevel = this.inferFrictionLevel(week.weekNumber);
		parts.push(`REALISM LEVEL: ${frictionLevel.toUpperCase()}`);
		parts.push(``);

		if (frictionLevel === 'supportive') {
			parts.push(`CONVERSATION PARTNER BEHAVIOR:`);
			parts.push(`- Warm, patient, and encouraging`);
			parts.push(`- Speaks clearly and at a comfortable pace`);
			parts.push(`- Gives the learner time to respond`);
			parts.push(``);
		} else if (frictionLevel === 'realistic') {
			parts.push(`CONVERSATION PARTNER BEHAVIOR:`);
			parts.push(`- Generally friendly but not overly accommodating`);
			parts.push(`- May ask follow-up questions the learner didn't prepare for`);
			parts.push(`- Occasionally pauses, expecting the learner to continue`);
			parts.push(`- Uses natural speech patterns`);
			parts.push(``);
		} else {
			parts.push(`CONVERSATION PARTNER BEHAVIOR:`);
			parts.push(`- Realistic human behavior - not artificially supportive`);
			parts.push(`- May express mild skepticism or ask probing questions`);
			parts.push(`- Uses indirect communication that requires interpretation`);
			parts.push(`- Creates moments where the learner must recover from small mistakes`);
			parts.push(``);
		}

		parts.push(
			`Create a scenario that balances learning support with realistic human interaction.`,
			`The goal is to prepare the learner for real conversations, not just comfortable practice.`
		);

		return parts.join('\n');
	}

	/**
	 * Infer friction level based on week number
	 */
	private static inferFrictionLevel(weekNumber: number): 'supportive' | 'realistic' | 'challenging' {
		if (weekNumber <= 1) return 'supportive';
		if (weekNumber <= 2) return 'realistic';
		return 'challenging';
	}

	private static mapCefrToDifficulty(cefr?: string): 'beginner' | 'intermediate' | 'advanced' {
		if (!cefr) return 'intermediate';
		const upper = cefr.toUpperCase();
		if (upper.startsWith('A')) return 'beginner';
		if (upper.startsWith('C')) return 'advanced';
		return 'intermediate';
	}

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

// Export convenience functions
export const getWeekStatus = ScenarioGenerationJobService.getWeekStatus.bind(
	ScenarioGenerationJobService
);
export const getPathStatus = ScenarioGenerationJobService.getPathStatus.bind(
	ScenarioGenerationJobService
);
export const generateNextPending = ScenarioGenerationJobService.generateNextPending.bind(
	ScenarioGenerationJobService
);
export const generateAllForWeek = ScenarioGenerationJobService.generateAllForWeek.bind(
	ScenarioGenerationJobService
);
export const resetFailedSeeds = ScenarioGenerationJobService.resetFailedSeeds.bind(
	ScenarioGenerationJobService
);
