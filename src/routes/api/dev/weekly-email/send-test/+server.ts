import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { WeeklyUpdatesParserService } from '$lib/server/services/weekly-updates-parser.service';
import { WeeklyUpdatesEmailService } from '$lib/emails/campaigns/weekly-digest/digest.service';
import type { WeeklyDigestOptions } from '$lib/emails/campaigns/weekly-digest/digest.service';

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
		const weeklyUpdate = allUpdates.find((update) => update.date === date);

		if (!weeklyUpdate) {
			return json({ error: 'Weekly update not found for the specified date' }, { status: 404 });
		}

		// Build the email content
		const digestOptions: WeeklyDigestOptions = {
			updates: weeklyUpdate.updates,
			productHighlights: weeklyUpdate.highlights,
			upcoming: weeklyUpdate.upcoming,
			intro: weeklyUpdate.notes
				? `Here's what we shipped at Kaiwa this week, and what we're working on next. ${weeklyUpdate.notes}`
				: undefined
		};

		// Send test email to the current user
		const result = await WeeklyUpdatesEmailService.sendWeeklyDigest({
			...digestOptions,
			// Override to send only to current user for testing
			subject: `[TEST] Kaiwa Weekly Update – ${new Date(weeklyUpdate.date).toLocaleDateString(
				undefined,
				{
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				}
			)}`
		});

		return json({
			success: true,
			subject: `[TEST] Kaiwa Weekly Update – ${new Date(weeklyUpdate.date).toLocaleDateString(
				undefined,
				{
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				}
			)}`,
			sentTo: locals.user.email,
			sent: result.sent,
			skipped: result.skipped
		});
	} catch (error) {
		console.error('Error sending test email:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
