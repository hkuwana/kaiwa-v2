import { logger } from '$lib/server/logger';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { ScenarioInspirationEmailService } from '$lib/server/email/scenario-inspiration-email.service';

/**
 * HTTP endpoint for triggering scenario inspiration emails
 *
 * Usage:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/scenario-inspiration
 *
 * Schedule: Every Tuesday at 10:00 AM UTC
 */
export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			logger.error('Unauthorized cron request - invalid secret');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// SAFETY: Prevent automatic email sending until manually reviewed
		const enableAutomatedEmails = env.ENABLE_AUTOMATED_EMAILS === 'true';
		if (!enableAutomatedEmails) {
			logger.info(
				'⚠️  SAFETY MODE: Automated emails disabled. Set ENABLE_AUTOMATED_EMAILS=true to enable.'
			);
			return json({
				success: false,
				message:
					'Automated emails are disabled for safety. Set ENABLE_AUTOMATED_EMAILS=true to enable.',
				sent: 0,
				skipped: 0,
				errors: []
			});
		}

		logger.debug('🎯 Starting scenario inspiration cron job...');

		const result = await ScenarioInspirationEmailService.sendScenarioInspiration();

		logger.info(
			`✅ Scenario inspiration cron job completed! Sent: ${result.sent}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`
		);

		return json({
			success: true,
			sent: result.sent,
			skipped: result.skipped,
			errors: result.errors,
			timestamp: new Date().toISOString(),
			message: 'Scenario inspiration emails sent successfully'
		});
	} catch (error) {
		logger.error('❌ Scenario inspiration cron job failed:', error);

		return json(
			{
				error: 'Failed to send scenario inspiration emails',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
