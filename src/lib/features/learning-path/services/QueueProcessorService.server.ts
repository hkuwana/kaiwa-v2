// src/lib/features/learning-path/services/QueueProcessorService.server.ts

import { logger } from '$lib/logger';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import type { ScenarioGenerationQueue } from '$lib/server/db/schema/scenario-generation-queue';

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

					// Handle retry logic
					if (job.retryCount < 3) {
						await scenarioGenerationQueueRepository.incrementRetryCount(job.id);
						logger.info(`🔁 [QueueProcessor] Job ${job.id} will be retried`, {
							jobId: job.id,
							retryCount: job.retryCount + 1
						});
					} else {
						await scenarioGenerationQueueRepository.markJobFailed(job.id, errorMessage);
						logger.error(`💀 [QueueProcessor] Job ${job.id} marked as failed after max retries`);
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
	 * Process a single queue job
	 *
	 * @param job - Queue job to process
	 */
	private static async processJob(job: ScenarioGenerationQueue): Promise<void> {
		// Mark job as processing
		await scenarioGenerationQueueRepository.markJobProcessing(job.id);

		try {
			// Fetch the learning path
			const path = await learningPathRepository.findPathById(job.pathId);

			if (!path) {
				throw new Error(`Learning path ${job.pathId} not found`);
			}

			// Find the day in the schedule
			const daySchedule = path.schedule.find((day) => day.dayIndex === job.dayIndex);

			if (!daySchedule) {
				throw new Error(
					`Day ${job.dayIndex} not found in path ${job.pathId} schedule`
				);
			}

			// TODO: Generate actual scenario using existing scenario generation service
			// For now, we'll mark it as ready with placeholder
			// In a future PR, this will call the actual scenario generation service

			logger.info(`🎬 [QueueProcessor] Scenario generation for path ${job.pathId} day ${job.dayIndex}`, {
				theme: daySchedule.theme,
				difficulty: daySchedule.difficulty,
				objectives: daySchedule.learningObjectives
			});

			// For now, just mark as ready
			// Future enhancement: Create actual scenario record and link it
			await scenarioGenerationQueueRepository.markJobReady(job.id, null);

			// Update path schedule to mark day as ready (scenario ready even if null for now)
			const updatedSchedule = path.schedule.map((day) =>
				day.dayIndex === job.dayIndex
					? { ...day, scenarioId: null, isUnlocked: true }
					: day
			);

			await learningPathRepository.updatePathSchedule(job.pathId, updatedSchedule);

			logger.info(`✅ [QueueProcessor] Job ${job.id} marked as ready`);
		} catch (error) {
			// If anything fails, the job stays in processing state
			// and will be picked up by retry logic in the main loop
			throw error;
		}
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
