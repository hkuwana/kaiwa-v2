import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WeeklyUpdatesEmailService } from '$lib/emails/campaigns/weekly-digest/digest.service';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const content = await request.json();

		// Validate content
		if (!content.updates || content.updates.length === 0) {
			return json({ error: 'At least one update is required' }, { status: 400 });
		}

		// Send the digest
		const result = await WeeklyUpdatesEmailService.sendWeeklyDigest(content);

		return json({
			sent: result.sent,
			skipped: result.skipped,
			message: `Successfully sent to ${result.sent} users`
		});
	} catch (error) {
		console.error('Error sending weekly digest:', error);
		return json({ error: 'Failed to send digest' }, { status: 500 });
	}
};
