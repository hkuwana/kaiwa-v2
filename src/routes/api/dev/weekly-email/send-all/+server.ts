import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WeeklyUpdatesParserService } from '$lib/server/services/weekly-updates-parser.service';
import { WeeklyUpdatesEmailService } from '$lib/server/email/weekly-updates-email.service';
import type { WeeklyDigestOptions } from '$lib/server/email/weekly-updates-email.service';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check if user is logged in
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { date } = await request.json();
		if (!date) {
			return json({ error: 'Date parameter is required' }, { status: 400 });
		}

		// Get all available updates and find the one for the specified date
		const allUpdates = WeeklyUpdatesParserService.getAllWeeklyUpdates();
		const weeklyUpdate = allUpdates.find(update => update.date === date);
		
		if (!weeklyUpdate) {
			return json({ error: 'Weekly update not found for the specified date' }, { status: 404 });
		}

		// Build the email content
		const digestOptions: WeeklyDigestOptions = {
			updates: weeklyUpdate.updates,
			productHighlights: weeklyUpdate.highlights,
			upcoming: weeklyUpdate.upcoming,
			intro: weeklyUpdate.notes ? `Here's what we shipped at Kaiwa this week, and what we're working on next. ${weeklyUpdate.notes}` : undefined
		};

		// Send to all subscribers
		const result = await WeeklyUpdatesEmailService.sendWeeklyDigest(digestOptions);

		return json({
			success: true,
			sent: result.sent,
			skipped: result.skipped,
			weeklyUpdateDate: weeklyUpdate.date,
			message: 'Weekly product updates sent successfully'
		});
	} catch (error) {
		console.error('Error sending to all subscribers:', error);
		return json({ 
			success: false, 
			error: error instanceof Error ? error.message : 'Unknown error' 
		}, { status: 500 });
	}
};
