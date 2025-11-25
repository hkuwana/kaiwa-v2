// src/lib/server/repositories/scenario-generation-queue.repository.ts

import { db } from '$lib/server/db/index';
import { scenarioGenerationQueue } from '$lib/server/db/schema';
import type { NewScenarioGenerationQueue, ScenarioGenerationQueue } from '$lib/server/db/types';
import { eq, and, lt, gte, inArray, sql } from 'drizzle-orm';

export const scenarioGenerationQueueRepository = {
	// CREATE
	async enqueueDay(input: NewScenarioGenerationQueue): Promise<ScenarioGenerationQueue> {
		const [queueItem] = await db
			.insert(scenarioGenerationQueue)
			.values({
				...input,
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		return queueItem;
	},

	async enqueuePathRange(
		pathId: string,
		days: Array<{ dayIndex: number; targetDate: Date }>
	): Promise<ScenarioGenerationQueue[]> {
		const items = days.map((day) => ({
			pathId,
			dayIndex: day.dayIndex,
			targetGenerationDate: day.targetDate,
			status: 'pending' as const,
			retryCount: 0,
			createdAt: new Date(),
			updatedAt: new Date()
		}));

		return db.insert(scenarioGenerationQueue).values(items).returning();
	},

	// READ
	async findJobById(jobId: string): Promise<ScenarioGenerationQueue | undefined> {
		return db.query.scenarioGenerationQueue.findFirst({
			where: eq(scenarioGenerationQueue.id, jobId)
		});
	},

	async findJobForDay(
		pathId: string,
		dayIndex: number
	): Promise<ScenarioGenerationQueue | undefined> {
		return db.query.scenarioGenerationQueue.findFirst({
			where: and(
				eq(scenarioGenerationQueue.pathId, pathId),
				eq(scenarioGenerationQueue.dayIndex, dayIndex)
			)
		});
	},

	async getPendingJobs(options: {
		limit?: number;
		windowStart?: Date;
		windowEnd?: Date;
	}): Promise<ScenarioGenerationQueue[]> {
		const { limit = 10, windowStart, windowEnd } = options;

		const conditions = [eq(scenarioGenerationQueue.status, 'pending')];

		if (windowStart) {
			conditions.push(gte(scenarioGenerationQueue.targetGenerationDate, windowStart));
		}

		if (windowEnd) {
			conditions.push(lt(scenarioGenerationQueue.targetGenerationDate, windowEnd));
		}

		return db.query.scenarioGenerationQueue.findMany({
			where: and(...conditions),
			orderBy: [scenarioGenerationQueue.targetGenerationDate],
			limit
		});
	},

	async getJobsForPath(
		pathId: string,
		status?: 'pending' | 'processing' | 'ready' | 'failed'
	): Promise<ScenarioGenerationQueue[]> {
		const conditions = [eq(scenarioGenerationQueue.pathId, pathId)];

		if (status) {
			conditions.push(eq(scenarioGenerationQueue.status, status));
		}

		return db.query.scenarioGenerationQueue.findMany({
			where: and(...conditions),
			orderBy: [scenarioGenerationQueue.dayIndex]
		});
	},

	async getFailedJobs(limit: number = 50): Promise<ScenarioGenerationQueue[]> {
		return db.query.scenarioGenerationQueue.findMany({
			where: eq(scenarioGenerationQueue.status, 'failed'),
			orderBy: [scenarioGenerationQueue.updatedAt],
			limit
		});
	},

	// UPDATE
	async markJobProcessing(jobId: string): Promise<ScenarioGenerationQueue | undefined> {
		const [updatedJob] = await db
			.update(scenarioGenerationQueue)
			.set({
				status: 'processing',
				lastProcessedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(scenarioGenerationQueue.id, jobId))
			.returning();

		return updatedJob;
	},

	async markJobReady(jobId: string): Promise<ScenarioGenerationQueue | undefined> {
		const [updatedJob] = await db
			.update(scenarioGenerationQueue)
			.set({
				status: 'ready',
				lastError: null,
				updatedAt: new Date()
			})
			.where(eq(scenarioGenerationQueue.id, jobId))
			.returning();

		return updatedJob;
	},

	async markJobFailed(jobId: string, error: string): Promise<ScenarioGenerationQueue | undefined> {
		const job = await this.findJobById(jobId);
		if (!job) return undefined;

		const [updatedJob] = await db
			.update(scenarioGenerationQueue)
			.set({
				status: 'failed',
				lastError: error,
				retryCount: (job.retryCount || 0) + 1,
				updatedAt: new Date()
			})
			.where(eq(scenarioGenerationQueue.id, jobId))
			.returning();

		return updatedJob;
	},

	async retryJob(jobId: string): Promise<ScenarioGenerationQueue | undefined> {
		const [updatedJob] = await db
			.update(scenarioGenerationQueue)
			.set({
				status: 'pending',
				lastProcessedAt: null,
				updatedAt: new Date()
			})
			.where(eq(scenarioGenerationQueue.id, jobId))
			.returning();

		return updatedJob;
	},

	async updateJobStatus(
		jobId: string,
		status: 'pending' | 'processing' | 'ready' | 'failed',
		error?: string
	): Promise<ScenarioGenerationQueue | undefined> {
		const updateData: any = {
			status,
			updatedAt: new Date()
		};

		if (error) {
			updateData.lastError = error;
		}

		const [updatedJob] = await db
			.update(scenarioGenerationQueue)
			.set(updateData)
			.where(eq(scenarioGenerationQueue.id, jobId))
			.returning();

		return updatedJob;
	},

	// DELETE
	async deleteJob(jobId: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(scenarioGenerationQueue)
			.where(eq(scenarioGenerationQueue.id, jobId))
			.returning({ id: scenarioGenerationQueue.id });

		return { success: result.length > 0 };
	},

	async deleteJobsForPath(pathId: string): Promise<number> {
		const result = await db
			.delete(scenarioGenerationQueue)
			.where(eq(scenarioGenerationQueue.pathId, pathId))
			.returning({ id: scenarioGenerationQueue.id });

		return result.length;
	},

	// UTILITY
	async getQueueStats(): Promise<{
		pending: number;
		processing: number;
		ready: number;
		failed: number;
		total: number;
	}> {
		const [stats] = await db
			.select({
				pending: sql<number>`count(*) filter (where ${scenarioGenerationQueue.status} = 'pending')`,
				processing: sql<number>`count(*) filter (where ${scenarioGenerationQueue.status} = 'processing')`,
				ready: sql<number>`count(*) filter (where ${scenarioGenerationQueue.status} = 'ready')`,
				failed: sql<number>`count(*) filter (where ${scenarioGenerationQueue.status} = 'failed')`,
				total: sql<number>`count(*)`
			})
			.from(scenarioGenerationQueue);

		return {
			pending: Number(stats?.pending) || 0,
			processing: Number(stats?.processing) || 0,
			ready: Number(stats?.ready) || 0,
			failed: Number(stats?.failed) || 0,
			total: Number(stats?.total) || 0
		};
	}
};
