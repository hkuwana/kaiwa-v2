import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WeeklyStatsEmailService } from '$lib/server/email/weekly-stats-email.service';
import { env } from '$env/dynamic/private';

/**
 * HTTP endpoint for triggering weekly stats emails via external cron service
 *
 * Usage:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/weekly-stats
 *
 * Schedule: Every Monday at 11:00 AM UTC
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

		console.log('📈 Starting weekly stats cron job...');

		// Send weekly stats to all eligible users
		const stats = await WeeklyStatsEmailService.sendWeeklyStats();

		console.log('✅ Weekly stats cron job completed!');
		console.log(
			`📊 Stats: ${stats.sent} sent, ${stats.skipped} skipped, ${stats.errors.length} errors`
		);

		return json({
			success: true,
			sent: stats.sent,
			skipped: stats.skipped,
			errors: stats.errors.length,
			timestamp: new Date().toISOString(),
			message: 'Weekly stats emails sent successfully'
		});
	} catch (error) {
		console.error('❌ Weekly stats cron job failed:', error);

		return json(
			{
				error: 'Failed to send weekly stats',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
