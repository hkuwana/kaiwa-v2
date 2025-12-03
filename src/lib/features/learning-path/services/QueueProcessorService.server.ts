// src/lib/features/learning-path/services/QueueProcessorService.server.ts

import { logger } from '$lib/logger';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { scenarioRepository } from '$lib/server/repositories';
import type { ScenarioGenerationQueue } from '$lib/server/db/schema/scenario-generation-queue';
import { generateScenarioWithGPT } from '$lib/server/services/openai.service';
import { randomUUID } from 'crypto';
import type { NewScenario } from '$lib/server/db/types';

/**
 * QueueProcessorService - Processes scenario generation queue
 *
 * This service handles the background job of processing queued scenario
 * generation tasks for learning paths.
 *
 * **Responsibilities:**
 * - Fetch pending queue items
 * - Process items ready for generation (based on targetGenerationDate)
 * - Generate/retrieve scenarios for each day
 * - Update path schedule with scenario IDs
 * - Mark queue items as ready or failed
 * - Handle retry logic for failed items
 *
 * **Server-Side Only** - Runs as background job
 */
export class QueueProcessorService {
	/**
	 * Process all pending queue items that are ready for generation
	 *
	 * @param limit - Maximum number of items to process in this run
	 * @param dryRun - If true, log what would happen without making changes
	 * @returns Processing result with stats
	 */
	static async processPendingJobs(
		limit = 10,
		dryRun = false
	): Promise<{
		processed: number;
		succeeded: number;
		failed: number;
		skipped: number;
		errors: Array<{ jobId: string; error: string }>;
	}> {
		const stats = {
			processed: 0,
			succeeded: 0,
			failed: 0,
			skipped: 0,
			errors: [] as Array<{ jobId: string; error: string }>
		};

		try {
			logger.info('🔄 [QueueProcessor] Starting queue processing', {
				limit,
				dryRun,
				timestamp: new Date().toISOString()
			});

			// Fetch pending jobs that are ready to process
			const pendingJobs = await scenarioGenerationQueueRepository.getPendingJobs({ limit });

			if (pendingJobs.length === 0) {
				logger.info('✨ [QueueProcessor] No pending jobs to process');
				return stats;
			}

			logger.info(`📋 [QueueProcessor] Found ${pendingJobs.length} pending jobs to process`);

			// Process each job
			for (const job of pendingJobs) {
				stats.processed++;

				try {
					// Check if job is ready based on targetGenerationDate
					const now = new Date();
					const targetDate = new Date(job.targetGenerationDate);

					if (targetDate > now) {
						logger.info(`⏭️  [QueueProcessor] Skipping job ${job.id} - not ready yet`, {
							jobId: job.id,
							pathId: job.pathId,
							dayIndex: job.dayIndex,
							targetDate: targetDate.toISOString(),
							now: now.toISOString()
						});
						stats.skipped++;
						continue;
					}

					if (dryRun) {
						logger.info(`🔍 [QueueProcessor] DRY RUN - Would process job ${job.id}`, {
							jobId: job.id,
							pathId: job.pathId,
							dayIndex: job.dayIndex
						});
						stats.succeeded++;
						continue;
					}

					// Process the job
					await this.processJob(job);
					stats.succeeded++;

					logger.info(`✅ [QueueProcessor] Successfully processed job ${job.id}`, {
						jobId: job.id,
						pathId: job.pathId,
						dayIndex: job.dayIndex
					});
				} catch (error) {
					stats.failed++;
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					stats.errors.push({ jobId: job.id, error: errorMessage });

					logger.error(`❌ [QueueProcessor] Failed to process job ${job.id}`, {
						jobId: job.id,
						pathId: job.pathId,
						dayIndex: job.dayIndex,
						error: errorMessage,
						retryCount: job.retryCount
					});

					// Handle retry logic - reset to pending so it can be picked up again
					if (job.retryCount < 3) {
						// Reset job to pending status AND increment retry count
						await scenarioGenerationQueueRepository.resetJobForRetry(job.id, errorMessage);
						logger.info(`🔁 [QueueProcessor] Job ${job.id} reset to pending for retry`, {
							jobId: job.id,
							retryCount: job.retryCount + 1,
							error: errorMessage
						});
					} else {
						await scenarioGenerationQueueRepository.markJobFailed(job.id, errorMessage);
						logger.error(`💀 [QueueProcessor] Job ${job.id} marked as failed after max retries`, {
							jobId: job.id,
							error: errorMessage
						});
					}
				}
			}

			logger.info('🎉 [QueueProcessor] Queue processing complete', {
				...stats,
				timestamp: new Date().toISOString()
			});

			return stats;
		} catch (error) {
			logger.error('🚨 [QueueProcessor] Fatal error during queue processing', error);
			throw error;
		}
	}

	/**
	 * Process a single queue job - generates a scenario for a learning path day
	 *
	 * @param job - Queue job to process
	 */
	private static async processJob(job: ScenarioGenerationQueue): Promise<void> {
		// Mark job as processing
		await scenarioGenerationQueueRepository.markJobProcessing(job.id);

		// Fetch the learning path
		const path = await learningPathRepository.findPathById(job.pathId);

		if (!path) {
			throw new Error(`Learning path ${job.pathId} not found`);
		}

		// Find the day in the schedule
		const daySchedule = path.schedule.find((day) => day.dayIndex === job.dayIndex);

		if (!daySchedule) {
			throw new Error(`Day ${job.dayIndex} not found in path ${job.pathId} schedule`);
		}

		// Check if scenario already exists for this day
		if (daySchedule.scenarioId) {
			logger.info(
				`⏭️ [QueueProcessor] Scenario already exists for path ${job.pathId} day ${job.dayIndex}`,
				{
					scenarioId: daySchedule.scenarioId,
					theme: daySchedule.theme
				}
			);
			// Mark job as ready since scenario already exists
			await scenarioGenerationQueueRepository.markJobReady(job.id);
			return;
		}

		logger.info(
			`🎬 [QueueProcessor] Generating scenario for path ${job.pathId} day ${job.dayIndex}`,
			{
				theme: daySchedule.theme,
				difficulty: daySchedule.difficulty,
				objectives: daySchedule.learningObjectives
			}
		);

		// Build a description for scenario generation from the day's content
		const scenarioDescription = this.buildScenarioDescription(daySchedule, path.targetLanguage);

		// Generate the scenario using GPT
		const { content: generatedContent } = await generateScenarioWithGPT({
			description: scenarioDescription,
			mode: 'tutor',
			languageId: path.targetLanguage
		});

		// Create the scenario in the database
		const scenarioId = `lp-sc-${randomUUID()}`;
		const now = new Date();

		const newScenario: NewScenario = {
			id: scenarioId,
			title: generatedContent.title || daySchedule.theme,
			description: generatedContent.description || daySchedule.scenarioDescription || '',
			role: 'tutor',
			difficulty: this.mapCefrToDifficulty(daySchedule.difficulty),
			difficultyRating: this.getDifficultyRating(daySchedule.difficulty),
			cefrLevel: daySchedule.difficulty?.toUpperCase() || 'A2',
			cefrRecommendation: daySchedule.difficulty?.toUpperCase() || 'A2',
			learningGoal: generatedContent.learningGoal || daySchedule.learningObjectives?.[0] || null,
			instructions: generatedContent.instructions,
			context: generatedContent.context,
			expectedOutcome: generatedContent.expectedOutcome,
			learningObjectives:
				daySchedule.learningObjectives || generatedContent.learningObjectives || [],
			persona: generatedContent.persona,
			visibility: 'private', // Learning path scenarios are private by default
			createdByUserId: path.userId,
			usageCount: 0,
			isActive: true,
			// Link to learning path
			categories: [path.category || 'learning-path'],
			tags: [`learning-path:${job.pathId}`, `day:${job.dayIndex}`],
			primarySkill: 'conversation',
			comfortIndicators: null,
			searchKeywords: null,
			thumbnailUrl: null,
			estimatedDurationSeconds: (path.estimatedMinutesPerDay || 15) * 60,
			authorDisplayName: null,
			shareSlug: null,
			shareUrl: null
		};

		const createdScenario = await scenarioRepository.createScenario(newScenario);

		logger.info(
			`✅ [QueueProcessor] Created scenario ${createdScenario.id} for day ${job.dayIndex}`
		);

		// Update path schedule to link the scenario
		const updatedSchedule = path.schedule.map((day) =>
			day.dayIndex === job.dayIndex
				? { ...day, scenarioId: createdScenario.id, isUnlocked: day.dayIndex === 1 }
				: day
		);

		await learningPathRepository.updatePathSchedule(job.pathId, updatedSchedule);

		// Mark job as ready
		await scenarioGenerationQueueRepository.markJobReady(job.id);

		// Check if this is the first scenario - if so, activate the path
		if (job.dayIndex === 1 && path.status === 'draft') {
			await learningPathRepository.updatePathStatus(job.pathId, 'active');
			logger.info(`🚀 [QueueProcessor] Path ${job.pathId} activated - first scenario ready`);
		}

		logger.info(`✅ [QueueProcessor] Job ${job.id} completed successfully`);
	}

	/**
	 * Build a detailed description for scenario generation from day schedule
	 */
	private static buildScenarioDescription(
		daySchedule: {
			theme: string;
			difficulty: string;
			learningObjectives?: string[];
			scenarioDescription?: string;
		},
		targetLanguage: string
	): string {
		const parts = [
			`Create a ${targetLanguage.toUpperCase()} language learning scenario.`,
			`Theme: ${daySchedule.theme}`,
			`Difficulty: ${daySchedule.difficulty}`
		];

		if (daySchedule.learningObjectives?.length) {
			parts.push(`Learning objectives: ${daySchedule.learningObjectives.join(', ')}`);
		}

		if (daySchedule.scenarioDescription) {
			parts.push(`Scenario context: ${daySchedule.scenarioDescription}`);
		}

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

	/**
	 * Get current queue statistics
	 *
	 * @returns Queue stats
	 */
	static async getQueueStats() {
		return await scenarioGenerationQueueRepository.getQueueStats();
	}

	/**
	 * Clean up old completed/failed jobs
	 *
	 * @param olderThanDays - Delete jobs older than this many days
	 * @returns Number of jobs deleted
	 */
	static async cleanupOldJobs(olderThanDays = 30): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		logger.info(`🧹 [QueueProcessor] Cleaning up jobs older than ${olderThanDays} days`, {
			cutoffDate: cutoffDate.toISOString()
		});

		// TODO: Implement cleanup in repository
		// For now, return 0
		return 0;
	}
}
