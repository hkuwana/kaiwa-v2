// src/routes/api/cron/process-scenarios/+server.ts

/**
 * Cron endpoint for processing scenario generation queue
 *
 * This endpoint is designed to be called by external cron services:
 * - Fly.io scheduled machines
 * - GitHub Actions
 * - External cron services (cron-job.org, etc.)
 * - Manual curl commands
 *
 * Security: Protected by CRON_SECRET environment variable
 *
 * Usage:
 *   curl -X POST https://your-app.com/api/cron/process-scenarios \
 *     -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"limit": 10}'
 *
 * Or via query params:
 *   curl -X POST "https://your-app.com/api/cron/process-scenarios?secret=YOUR_CRON_SECRET&limit=10"
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { QueueProcessorService } from '$lib/features/learning-path/services/QueueProcessorService.server';
import { scenarioGenerationQueueRepository } from '$lib/server/repositories/scenario-generation-queue.repository';
import { logger } from '$lib/logger';

// Default processing limit per cron run
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

/**
 * Validate the cron secret from request
 */
function validateCronSecret(request: Request, url: URL): boolean {
	// Check Authorization header first
	const authHeader = request.headers.get('Authorization');
	if (authHeader) {
		const token = authHeader.replace('Bearer ', '');
		if (token === env.CRON_SECRET) return true;
	}

	// Fall back to query param (for simpler integrations)
	const secretParam = url.searchParams.get('secret');
	if (secretParam === env.CRON_SECRET) return true;

	// In development without CRON_SECRET, allow access
	if (!env.CRON_SECRET || env.CRON_SECRET === '') {
		logger.warn('⚠️ [Cron] CRON_SECRET not set - allowing unauthenticated access in dev mode');
		return true;
	}

	return false;
}

export const POST: RequestHandler = async ({ request, url }) => {
	const startTime = Date.now();

	// Validate cron secret
	if (!validateCronSecret(request, url)) {
		logger.warn('🚫 [Cron] Unauthorized cron request attempted');
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Parse options from body or query params
		let limit = DEFAULT_LIMIT;
		let prioritizeDay1 = true;

		try {
			const body = await request.json();
			limit = Math.min(body.limit || DEFAULT_LIMIT, MAX_LIMIT);
			prioritizeDay1 = body.prioritizeDay1 !== false;
		} catch {
			// No body or invalid JSON - use query params
			const limitParam = url.searchParams.get('limit');
			if (limitParam) {
				limit = Math.min(parseInt(limitParam, 10) || DEFAULT_LIMIT, MAX_LIMIT);
			}
		}

		logger.info('🕐 [Cron] Starting scenario queue processing', {
			limit,
			prioritizeDay1,
			timestamp: new Date().toISOString()
		});

		// Get queue stats before processing
		const statsBefore = await scenarioGenerationQueueRepository.getQueueStats();

		// Process the queue
		const result = await QueueProcessorService.processPendingJobs(limit, false);

		// Get queue stats after processing
		const statsAfter = await scenarioGenerationQueueRepository.getQueueStats();

		const durationMs = Date.now() - startTime;

		logger.info('✅ [Cron] Scenario queue processing complete', {
			processed: result.processed,
			succeeded: result.succeeded,
			failed: result.failed,
			skipped: result.skipped,
			durationMs,
			queueBefore: statsBefore,
			queueAfter: statsAfter
		});

		return json({
			success: true,
			data: {
				processed: result.processed,
				succeeded: result.succeeded,
				failed: result.failed,
				skipped: result.skipped,
				errors: result.errors,
				durationMs,
				queue: {
					before: statsBefore,
					after: statsAfter
				}
			}
		});
	} catch (error) {
		const durationMs = Date.now() - startTime;

		logger.error('❌ [Cron] Scenario queue processing failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
			durationMs
		});

		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Processing failed',
				durationMs
			},
			{ status: 500 }
		);
	}
};

/**
 * GET endpoint for health check / status
 */
export const GET: RequestHandler = async ({ url }) => {
	// Allow unauthenticated status checks
	try {
		const stats = await scenarioGenerationQueueRepository.getQueueStats();

		return json({
			success: true,
			status: 'healthy',
			queue: stats,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return json(
			{
				success: false,
				status: 'error',
				error: error instanceof Error ? error.message : 'Failed to get queue stats'
			},
			{ status: 500 }
		);
	}
};
