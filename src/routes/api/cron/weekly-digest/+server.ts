import { logger } from '$lib/logger';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WeeklyUpdatesEmailService } from '$lib/server/email/weekly-updates-email.service';
import type { WeeklyDigestOptions } from '$lib/server/email/weekly-updates-email.service';
import { WeeklyUpdatesParserService } from '$lib/server/services/weekly-updates-parser.service';
import { env } from '$env/dynamic/private';

/**
 * HTTP endpoint for triggering weekly digest emails via external cron service
 *
 * Usage:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/weekly-digest
 *
 * Schedule: Every Sunday at 10:00 AM UTC
 */
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Verify cron secret
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
					'Automated emails are disabled for safety. Set ENABLE_AUTOMATED_EMAILS=true to enable.'
			});
		}

		logger.info('📊 Starting weekly digest cron job...');

		// Load this week's content from markdown files
		const weeklyUpdate = WeeklyUpdatesParserService.getLatestWeeklyUpdate();

		let thisWeeksContent: WeeklyDigestOptions;

		if (!weeklyUpdate) {
			logger.warn('No weekly update file found, using fallback content');
			// Fallback to example content if no markdown file is found
			thisWeeksContent = {
				updates: [
					{
						title: 'Weekly Update System',
						summary:
							'Built an automated system to organize and send weekly newsletters with your code updates.',
						linkLabel: 'Learn more',
						linkUrl: 'https://trykaiwa.com/updates'
					}
				],
				productHighlights: [
					{
						title: 'Markdown Integration',
						summary:
							'Created a system to parse markdown files and automatically include them in the weekly digest.'
					}
				],
				upcoming: [
					{
						title: 'Enhanced Features',
						summary: 'More sophisticated parsing and template system coming soon.'
					}
				]
			};
		} else {
			// Use content from markdown file
			thisWeeksContent = {
				updates: weeklyUpdate.updates,
				productHighlights: weeklyUpdate.highlights,
				upcoming: weeklyUpdate.upcoming,
				intro: weeklyUpdate.notes
					? `Here's what we shipped at Kaiwa this week, and what we're working on next. ${weeklyUpdate.notes}`
					: undefined
			};
		}

		// Send the digest using the service
		const result = await WeeklyUpdatesEmailService.sendWeeklyDigest(thisWeeksContent);

		logger.info('✅ Weekly digest cron job completed!');
		logger.info(`📊 Stats: ${result.sent} sent, ${result.skipped} skipped`);

		return json({
			success: true,
			sent: result.sent,
			skipped: result.skipped,
			timestamp: new Date().toISOString(),
			message: 'Weekly digest emails sent successfully'
		});
	} catch (error) {
		logger.error('❌ Weekly digest cron job failed:', error);

		return json(
			{
				error: 'Failed to send weekly digest',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
