// src/routes/api/cron/generate-scenarios/+server.ts

import { logger } from '$lib/logger';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { QueueProcessorService } from '$lib/features/learning-path/services/QueueProcessorService.server';
import type { RequestHandler } from './$types';

/**
 * API endpoint for processing learning path scenario generation queue
 *
 * This endpoint processes pending scenario generation jobs for learning paths.
 * Should be called periodically (e.g., every hour) via cron job.
 *
 * Usage:
 * - Call with GET to process pending queue jobs
 * - Protected by CRON_SECRET environment variable
 * - Supports query parameters:
 *   - limit: Max jobs to process (default: 10)
 *   - dryRun: If 'true', simulate processing without changes
 *
 * Example cron setup:
 * - Every hour: curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/generate-scenarios
 * - With limit: curl -H "Authorization: Bearer $CRON_SECRET" "https://trykaiwa.com/api/cron/generate-scenarios?limit=20"
 * - Dry run: curl -H "Authorization: Bearer $CRON_SECRET" "https://trykaiwa.com/api/cron/generate-scenarios?dryRun=true"
 *
 * GitHub Actions workflow:
 * ```yaml
 * name: Generate Learning Path Scenarios
 * on:
 *   schedule:
 *     - cron: '0 * * * *'  # Every hour
 * jobs:
 *   generate:
 *     runs-on: ubuntu-latest
 *     steps:
 *       - name: Trigger scenario generation
 *         run: |
 *           curl -X GET \
 *             -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
 *             "${{ secrets.APP_URL }}/api/cron/generate-scenarios"
 * ```
 */
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		logger.info('🔍 [Cron] Scenario generation endpoint called', {
			timestamp: new Date().toISOString()
		});

		// Verify cron secret for security
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			logger.warn('❌ [Cron] Unauthorized access attempt to generate-scenarios endpoint');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Parse query parameters
		const limitParam = url.searchParams.get('limit');
		const limit = limitParam ? parseInt(limitParam, 10) : 10;
		const dryRun = url.searchParams.get('dryRun') === 'true';

		logger.info('⚙️  [Cron] Processing queue with parameters', {
			limit,
			dryRun,
			timestamp: new Date().toISOString()
		});

		// Get initial stats
		const initialStats = await QueueProcessorService.getQueueStats();

		logger.info('📊 [Cron] Initial queue status', initialStats);

		if (initialStats.pending === 0) {
			logger.info('✨ [Cron] No pending jobs to process');
			return json({
				success: true,
				message: 'No pending jobs to process',
				initialStats,
				finalStats: initialStats,
				result: {
					processed: 0,
					succeeded: 0,
					failed: 0,
					skipped: 0,
					errors: []
				},
				dryRun,
				timestamp: new Date().toISOString()
			});
		}

		// Process the queue
		const result = await QueueProcessorService.processPendingJobs(limit, dryRun);

		// Get final stats
		const finalStats = await QueueProcessorService.getQueueStats();

		logger.info('✅ [Cron] Queue processing complete', {
			result,
			finalStats,
			timestamp: new Date().toISOString()
		});

		return json({
			success: true,
			message: `Processed ${result.processed} jobs`,
			initialStats,
			finalStats,
			result,
			dryRun,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		logger.error('🚨 [Cron] Error processing scenario generation queue', error);

		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		);
	}
};
