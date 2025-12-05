// src/routes/api/internal/generate-scenarios/+server.ts
/**
 * Internal endpoint for async scenario generation
 *
 * This endpoint is called in a "fire-and-forget" manner from the assign endpoint.
 * It runs the scenario generation in the background and sends error notifications
 * to admin if generation fails.
 *
 * Security: Protected by CRON_SECRET - only internal calls allowed
 */

import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';
import { CustomScenarioGenerationService } from '$lib/features/learning-path/services/CustomScenarioGenerationService.server';
import type { RequestHandler } from './$types';

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');
const ADMIN_EMAIL = 'hiro@trykaiwa.com';

/**
 * POST /api/internal/generate-scenarios
 *
 * Request body:
 * {
 *   pathId: string;
 *   userId: string;
 *   targetLanguage: string;
 *   assignmentId: string;
 *   userEmail: string;
 * }
 *
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 */
export const POST: RequestHandler = async ({ request }) => {
	const startTime = Date.now();

	try {
		// Verify internal call authorization
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			logger.warn('[InternalGenerate] Unauthorized request attempt');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { pathId, userId, targetLanguage, assignmentId, userEmail, pathTitle } = body;

		if (!pathId || !userId || !targetLanguage) {
			return json(
				{ error: 'Missing required fields: pathId, userId, targetLanguage' },
				{ status: 400 }
			);
		}

		logger.info('[InternalGenerate] Starting async scenario generation', {
			pathId,
			userId,
			targetLanguage,
			assignmentId
		});

		// Run scenario generation
		const generationResult = await CustomScenarioGenerationService.generateScenariosForAssignment(
			pathId,
			userId,
			targetLanguage
		);

		const duration = Date.now() - startTime;

		if (generationResult.errors.length > 0) {
			logger.error('[InternalGenerate] Scenario generation had errors', {
				pathId,
				errors: generationResult.errors,
				scenariosGenerated: generationResult.scenariosGenerated,
				durationMs: duration
			});

			// Send error notification email to admin
			await sendErrorNotification({
				pathId,
				pathTitle: pathTitle || 'Unknown Path',
				userId,
				userEmail: userEmail || 'Unknown',
				assignmentId,
				errors: generationResult.errors,
				scenariosGenerated: generationResult.scenariosGenerated,
				durationMs: duration
			});

			return json({
				success: false,
				scenariosGenerated: generationResult.scenariosGenerated,
				errors: generationResult.errors,
				durationMs: duration
			});
		}

		logger.info('[InternalGenerate] Scenario generation completed successfully', {
			pathId,
			scenariosGenerated: generationResult.scenariosGenerated,
			durationMs: duration
		});

		return json({
			success: true,
			scenariosGenerated: generationResult.scenariosGenerated,
			scenarioIds: generationResult.scenarioIds,
			durationMs: duration
		});
	} catch (error) {
		const duration = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const errorStack = error instanceof Error ? error.stack : undefined;

		logger.error('[InternalGenerate] Fatal error during scenario generation', {
			error: errorMessage,
			stack: errorStack,
			durationMs: duration
		});

		// Try to send error notification
		try {
			const body = await request
				.clone()
				.json()
				.catch(() => ({}));
			await sendErrorNotification({
				pathId: body.pathId || 'Unknown',
				pathTitle: body.pathTitle || 'Unknown Path',
				userId: body.userId || 'Unknown',
				userEmail: body.userEmail || 'Unknown',
				assignmentId: body.assignmentId || 'Unknown',
				errors: [{ seedId: 'fatal', error: errorMessage }],
				scenariosGenerated: 0,
				durationMs: duration,
				isFatal: true
			});
		} catch (notifyError) {
			logger.error('[InternalGenerate] Failed to send error notification', {
				error: notifyError instanceof Error ? notifyError.message : 'Unknown'
			});
		}

		return json(
			{
				success: false,
				error: errorMessage,
				durationMs: duration
			},
			{ status: 500 }
		);
	}
};

/**
 * Send error notification email to admin
 */
async function sendErrorNotification(params: {
	pathId: string;
	pathTitle: string;
	userId: string;
	userEmail: string;
	assignmentId?: string;
	errors: Array<{ seedId: string; error: string }>;
	scenariosGenerated: number;
	durationMs: number;
	isFatal?: boolean;
}): Promise<void> {
	if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
		logger.warn('[InternalGenerate] RESEND_API_KEY not configured, skipping error notification');
		return;
	}

	const {
		pathId,
		pathTitle,
		userId,
		userEmail,
		assignmentId,
		errors,
		scenariosGenerated,
		durationMs,
		isFatal
	} = params;

	const subject = isFatal
		? `[FATAL] Learning Path Scenario Generation Failed`
		: `[Warning] Learning Path Scenario Generation Had Errors`;

	const errorList = errors.map((e) => `<li><strong>${e.seedId}</strong>: ${e.error}</li>`).join('');

	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
		.container { background: white; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0; }
		.header { background: ${isFatal ? '#fee2e2' : '#fef3c7'}; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
		.header h1 { margin: 0; color: ${isFatal ? '#dc2626' : '#d97706'}; font-size: 18px; }
		.meta { background: #f8fafc; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
		.meta-row { display: flex; margin-bottom: 8px; }
		.meta-label { font-weight: 600; width: 140px; color: #64748b; }
		.meta-value { color: #1e293b; }
		.errors { background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; }
		.errors h3 { margin: 0 0 12px 0; color: #dc2626; font-size: 14px; }
		.errors ul { margin: 0; padding-left: 20px; }
		.errors li { margin-bottom: 8px; color: #7f1d1d; }
		.footer { margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>${isFatal ? 'Fatal Error' : 'Generation Errors'} - Scenario Generation</h1>
		</div>

		<div class="meta">
			<div class="meta-row">
				<span class="meta-label">Path:</span>
				<span class="meta-value">${pathTitle}</span>
			</div>
			<div class="meta-row">
				<span class="meta-label">Path ID:</span>
				<span class="meta-value"><code>${pathId}</code></span>
			</div>
			<div class="meta-row">
				<span class="meta-label">User Email:</span>
				<span class="meta-value">${userEmail}</span>
			</div>
			<div class="meta-row">
				<span class="meta-label">User ID:</span>
				<span class="meta-value"><code>${userId}</code></span>
			</div>
			${
				assignmentId
					? `
			<div class="meta-row">
				<span class="meta-label">Assignment ID:</span>
				<span class="meta-value"><code>${assignmentId}</code></span>
			</div>
			`
					: ''
			}
			<div class="meta-row">
				<span class="meta-label">Scenarios Generated:</span>
				<span class="meta-value">${scenariosGenerated}</span>
			</div>
			<div class="meta-row">
				<span class="meta-label">Duration:</span>
				<span class="meta-value">${(durationMs / 1000).toFixed(2)}s</span>
			</div>
		</div>

		<div class="errors">
			<h3>Errors (${errors.length})</h3>
			<ul>${errorList}</ul>
		</div>

		<div class="footer">
			<p>This notification was sent by the Kaiwa background job system.</p>
			<p>Timestamp: ${new Date().toISOString()}</p>
		</div>
	</div>
</body>
</html>
`;

	try {
		const result = await resend.emails.send({
			from: 'Kaiwa System <noreply@trykaiwa.com>',
			to: [ADMIN_EMAIL],
			subject,
			html
		});

		if (result.error) {
			logger.error('[InternalGenerate] Failed to send error notification email', {
				error: result.error
			});
		} else {
			logger.info('[InternalGenerate] Error notification sent', {
				emailId: result.data?.id
			});
		}
	} catch (emailError) {
		logger.error('[InternalGenerate] Exception sending error notification', {
			error: emailError instanceof Error ? emailError.message : 'Unknown'
		});
	}
}
