import { pgTable, uuid, text, integer, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { learningPaths } from './learning-paths';

/**
 * Queue job status enumeration
 */
export const queueStatusEnum = pgEnum('queue_status', ['pending', 'processing', 'ready', 'failed']);

/**
 * 🔄 Scenario Generation Queue table - Manages async scenario generation for learning paths
 *
 * This table acts as a job queue for background scenario generation. When a learning
 * path is created, queue entries are created for each day that needs a scenario.
 * Background workers process these jobs, generate scenarios via LLM, and link them
 * back to the learning path schedule.
 *
 * **Key Features:**
 * - 📋 Job queue for scenario generation
 * - ⏰ Target generation dates (user timezone-aware)
 * - 🔄 Status tracking (pending → processing → ready/failed)
 * - ❌ Error handling and retry logic
 * - 📊 Per-day generation tracking
 * - 🎯 JIT or pre-generation support
 *
 * @example
 * ```typescript
 * // Enqueue a scenario for day 1 of a path
 * await db.insert(scenarioGenerationQueue).values({
 *   pathId: 'jp-business-path-abc123',
 *   dayIndex: 1,
 *   targetGenerationDate: new Date('2025-11-26T00:00:00Z'),
 *   status: 'pending'
 * });
 *
 * // Worker picks up pending job
 * await db.update(scenarioGenerationQueue)
 *   .set({ status: 'processing' })
 *   .where(eq(scenarioGenerationQueue.id, jobId));
 *
 * // After scenario generated
 * await db.update(scenarioGenerationQueue)
 *   .set({ status: 'ready' })
 *   .where(eq(scenarioGenerationQueue.id, jobId));
 * ```
 */
export const scenarioGenerationQueue = pgTable(
	'scenario_generation_queue',
	{
		// Unique job identifier
		id: uuid('id').primaryKey().defaultRandom().notNull(),

		// Reference to learning path
		pathId: text('path_id')
			.notNull()
			.references(() => learningPaths.id, { onDelete: 'cascade' }),

		// Day number in the schedule (1-based: 1, 2, 3, ..., 28)
		dayIndex: integer('day_index').notNull(),

		// When we want this scenario ready (user timezone-aware at app layer)
		targetGenerationDate: timestamp('target_generation_date').notNull(),

		// Current status of the job
		status: queueStatusEnum('status').default('pending').notNull(),

		// Last error message (for debugging failed jobs)
		lastError: text('last_error'),

		// Number of retry attempts (for exponential backoff)
		retryCount: integer('retry_count').default(0).notNull(),

		// When this job was last processed (for timeout detection)
		lastProcessedAt: timestamp('last_processed_at'),

		createdAt: timestamp('created_at').defaultNow().notNull(),

		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		// Performance indexes for queue processing
		index('scenario_queue_path_id_idx').on(table.pathId),
		index('scenario_queue_status_idx').on(table.status),
		index('scenario_queue_target_date_idx').on(table.targetGenerationDate),
		// Composite index for finding pending jobs in time window
		index('scenario_queue_pending_target_idx').on(table.status, table.targetGenerationDate),
		// Composite index for path day lookup
		index('scenario_queue_path_day_idx').on(table.pathId, table.dayIndex),
		// Index for failed jobs (debugging)
		index('scenario_queue_failed_idx').on(table.status, table.updatedAt)
	]
);
