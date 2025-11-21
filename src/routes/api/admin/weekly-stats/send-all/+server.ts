import { json } from '@sveltejs/kit';
import { WeeklyStatsEmailService } from '$lib/emails/campaigns/weekly-stats/stats.service';

export const POST = async () => {
	try {
		const result = await WeeklyStatsEmailService.sendWeeklyStats();

		return json({
			sent: result.sent,
			skipped: result.skipped,
			errors: result.errors
		});
	} catch (error) {
		console.error('Error sending weekly stats:', error);
		return json({ error: 'Failed to send weekly stats' }, { status: 500 });
	}
};
