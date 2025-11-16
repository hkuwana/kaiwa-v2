import { logger } from '$lib/server/logger';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { CommunityStoryEmailService } from '$lib/server/email/community-story-email.service';

/**
 * HTTP endpoint for triggering community story spotlight emails
 *
 * Usage:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/community-stories
 *
 * Schedule: Every Friday at 10:00 AM UTC
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

		logger.info('🗞️ Starting community story cron job...');

		const result = await CommunityStoryEmailService.sendCommunityStories();

		logger.info(
			`✅ Community story cron job completed! Sent: ${result.sent}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`
		);

		return json({
			success: true,
			sent: result.sent,
			skipped: result.skipped,
			errors: result.errors,
			timestamp: new Date().toISOString(),
			message: 'Community story emails sent successfully'
		});
	} catch (error) {
		logger.error('❌ Community story cron job failed:', error);

		return json(
			{
				error: 'Failed to send community story emails',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
