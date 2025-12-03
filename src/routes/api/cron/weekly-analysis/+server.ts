// src/routes/api/cron/weekly-analysis/+server.ts

/**
 * Cron endpoint for weekly learning path analysis
 *
 * This endpoint processes weekly performance analysis for learning paths:
 * - Analyzes completed conversations from the past week
 * - Calculates performance metrics (completion, engagement, findings)
 * - Generates insights for adaptive content planning
 *
 * Security: Protected by CRON_SECRET environment variable
 *
 * Usage:
 *   curl -X POST https://your-app.com/api/cron/weekly-analysis \
 *     -H "Authorization: Bearer YOUR_CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"limit": 20}'
 *
 * Recommended schedule: Weekly on Sunday evenings (after the week ends)
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { WeeklyAnalysisService } from '$lib/features/learning-path/services/WeeklyAnalysisService.server';
import { logger } from '$lib/logger';

// Default processing limit per cron run
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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
		logger.warn(
			'⚠️ [WeeklyCron] CRON_SECRET not set - allowing unauthenticated access in dev mode'
		);
		return true;
	}

	return false;
}

export const POST: RequestHandler = async ({ request, url }) => {
	const startTime = Date.now();

	// Validate cron secret
	if (!validateCronSecret(request, url)) {
		logger.warn('🚫 [WeeklyCron] Unauthorized cron request attempted');
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Parse options from body or query params
		let limit = DEFAULT_LIMIT;
		let dryRun = false;

		try {
			const body = await request.json();
			limit = Math.min(body.limit || DEFAULT_LIMIT, MAX_LIMIT);
			dryRun = body.dryRun === true;
		} catch {
			// No body or invalid JSON - use query params
			const limitParam = url.searchParams.get('limit');
			if (limitParam) {
				limit = Math.min(parseInt(limitParam, 10) || DEFAULT_LIMIT, MAX_LIMIT);
			}
			dryRun = url.searchParams.get('dryRun') === 'true';
		}

		logger.info('🕐 [WeeklyCron] Starting weekly analysis processing', {
			limit,
			dryRun,
			timestamp: new Date().toISOString()
		});

		// Process the weekly analysis
		const result = await WeeklyAnalysisService.processWeeklyAnalysis(limit, dryRun);

		const durationMs = Date.now() - startTime;

		logger.info('✅ [WeeklyCron] Weekly analysis processing complete', {
			processed: result.processed,
			succeeded: result.succeeded,
			failed: result.failed,
			durationMs
		});

		return json({
			success: true,
			data: {
				processed: result.processed,
				succeeded: result.succeeded,
				failed: result.failed,
				errors: result.errors,
				durationMs,
				// Include summary metrics from results
				summary: result.results.map((r) => ({
					assignmentId: r.assignmentId,
					weekNumber: r.weekNumber,
					completionRate: r.completionRate,
					averageComfortRating: r.averageComfortRating,
					totalFindings: r.totalFindings,
					strengths: r.strengths.length,
					areasForImprovement: r.areasForImprovement.length
				}))
			}
		});
	} catch (error) {
		const durationMs = Date.now() - startTime;

		logger.error('❌ [WeeklyCron] Weekly analysis processing failed', {
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
export const GET: RequestHandler = async () => {
	try {
		// Get a quick count of assignments that might need analysis
		const candidates = await WeeklyAnalysisService.findAssignmentsNeedingAnalysis(5);

		return json({
			success: true,
			status: 'healthy',
			pendingAnalysis: candidates.length,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return json(
			{
				success: false,
				status: 'error',
				error: error instanceof Error ? error.message : 'Failed to check status'
			},
			{ status: 500 }
		);
	}
};
