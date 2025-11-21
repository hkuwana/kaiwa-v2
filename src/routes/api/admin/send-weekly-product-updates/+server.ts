import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WeeklyUpdatesEmailService } from '$lib/emails/campaigns/weekly-digest/digest.service';
import { WeeklyUpdatesParserService } from '$lib/server/services/weekly-updates-parser.service';
import type { WeeklyDigestOptions } from '$lib/emails/campaigns/weekly-digest/digest.service';

/**
 * Manual endpoint for sending weekly product updates
 *
 * This replaces the automated cron job for weekly product updates
 * since they require manual content creation each week.
 *
 * Usage:
 *   POST /api/admin/send-weekly-product-updates
 *   Authorization: Bearer {ADMIN_TOKEN}
 */
export const POST: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is admin (you can add proper admin auth later)
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('📊 Starting manual weekly product updates send...');

		// Load this week's content from markdown files
		const weeklyUpdate = WeeklyUpdatesParserService.getLatestWeeklyUpdate();

		if (!weeklyUpdate) {
			return json(
				{
					error: 'No weekly update file found',
					message: 'Create a weekly update file using: pnpm run create-weekly-update'
				},
				{ status: 400 }
			);
		}

		// Use content from markdown file
		const thisWeeksContent: WeeklyDigestOptions = {
			updates: weeklyUpdate.updates,
			productHighlights: weeklyUpdate.highlights,
			upcoming: weeklyUpdate.upcoming,
			intro: weeklyUpdate.notes
				? `Here's what we shipped at Kaiwa this week, and what we're working on next. ${weeklyUpdate.notes}`
				: undefined
		};

		// Send the digest using the service
		const result = await WeeklyUpdatesEmailService.sendWeeklyDigest(thisWeeksContent);

		console.log('✅ Weekly product updates sent successfully!');
		console.log(`📊 Stats: ${result.sent} sent, ${result.skipped} skipped`);

		return json({
			success: true,
			sent: result.sent,
			skipped: result.skipped,
			timestamp: new Date().toISOString(),
			message: 'Weekly product updates sent successfully',
			contentSource: 'markdown file',
			weeklyUpdateDate: weeklyUpdate.date
		});
	} catch (error) {
		console.error('❌ Weekly product updates send failed:', error);

		return json(
			{
				error: 'Failed to send weekly product updates',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
