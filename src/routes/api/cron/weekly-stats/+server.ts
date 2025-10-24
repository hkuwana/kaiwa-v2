import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * HTTP endpoint for triggering weekly stats emails via external cron service
 *
 * Usage:
 *   curl "https://trykaiwa.com/api/cron/weekly-stats?secret=YOUR_SECRET"
 *
 * Schedule: Every Monday at 11:00 AM UTC
 */
export const GET: RequestHandler = async ({ url }) => {
	const secret = url.searchParams.get('secret');
	const cronSecret = process.env.CRON_SECRET;

	// Verify cron secret
	if (!cronSecret || secret !== cronSecret) {
		console.error('Unauthorized cron request - invalid secret');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		console.log('📈 Starting weekly stats cron job...');

		// Import dynamically to avoid issues with module resolution
		const { sendWeeklyStats } = await import('../../../../scripts/send-weekly-stats.js');

		const result = await sendWeeklyStats();

		console.log('✅ Weekly stats cron job completed', result);

		return json({
			success: true,
			sent: result?.sent || 0,
			skipped: result?.skipped || 0,
			errors: result?.errors?.length || 0,
			timestamp: new Date().toISOString()
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
