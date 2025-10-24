import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WeeklyUpdatesEmailService } from '$lib/server/email/weekly-updates-email.service';
import type { WeeklyDigestOptions } from '$lib/server/email/weekly-updates-email.service';
import { env } from '$env/dynamic/private';

/**
 * HTTP endpoint for triggering weekly digest emails via external cron service
 *
 * Usage:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/weekly-digest
 *
 * Schedule: Every Monday at 10:00 AM UTC
 */
export const GET: RequestHandler = async ({ request }) => {
	try {
		// Verify cron secret
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			console.error('Unauthorized cron request - invalid secret');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('📊 Starting weekly digest cron job...');

		// Define this week's content (UPDATE THIS EVERY WEEK)
		const thisWeeksContent: WeeklyDigestOptions = {
			updates: [
				{
					title: 'Example: New audio mode',
					summary:
						'Push-to-talk mode is live. Press and hold to speak, release to get feedback. Perfect for rapid-fire practice sessions.',
					linkLabel: 'Try it out',
					linkUrl: 'https://trykaiwa.com/practice'
				},
				{
					title: 'Example: Faster responses',
					summary:
						"AI responses are now 2x faster thanks to streaming. You'll notice the difference immediately.",
					linkLabel: 'Learn more',
					linkUrl: 'https://trykaiwa.com/updates'
				}
			],
			productHighlights: [
				{
					title: 'Example: Mobile experience improvements',
					summary:
						'Better touch targets, smoother animations, and clearer error messages on mobile devices.'
				}
			],
			upcoming: [
				{
					title: 'Example: Vocabulary tracking',
					summary:
						"We're building a system to track words you've learned and suggest review sessions."
				}
			]
		};

		// Send the digest using the service
		const result = await WeeklyUpdatesEmailService.sendWeeklyDigest(thisWeeksContent);

		console.log('✅ Weekly digest cron job completed!');
		console.log(`📊 Stats: ${result.sent} sent, ${result.skipped} skipped`);

		return json({
			success: true,
			sent: result.sent,
			skipped: result.skipped,
			timestamp: new Date().toISOString(),
			message: 'Weekly digest emails sent successfully'
		});
	} catch (error) {
		console.error('❌ Weekly digest cron job failed:', error);

		return json(
			{
				error: 'Failed to send weekly digest',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
