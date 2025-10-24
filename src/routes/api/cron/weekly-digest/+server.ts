import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * HTTP endpoint for triggering weekly digest emails via external cron service
 *
 * Usage:
 *   curl "https://trykaiwa.com/api/cron/weekly-digest?secret=YOUR_SECRET"
 *
 * Schedule: Every Monday at 10:00 AM UTC
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
		console.log('📊 Starting weekly digest cron job...');

		// Import dynamically to avoid issues with module resolution
		const { sendWeeklyDigest } = await import('../../../../scripts/send-weekly-digest.js');

		const result = await sendWeeklyDigest();

		console.log('✅ Weekly digest cron job completed', result);

		return json({
			success: true,
			sent: result?.sent || 0,
			timestamp: new Date().toISOString()
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
