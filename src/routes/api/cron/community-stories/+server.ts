import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { CommunityStoryEmailService } from '$lib/server/email/community-story-email.service';

/**
 * HTTP endpoint for triggering community story spotlight emails
 *
 * Usage:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/community-stories
 *
 * Schedule: Every Friday at 10:00 AM UTC
 */
export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			console.error('Unauthorized cron request - invalid secret');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('🗞️ Starting community story cron job...');

		const result = await CommunityStoryEmailService.sendCommunityStories();

		console.log(
			`✅ Community story cron job completed! Sent: ${result.sent}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`
		);

		return json({
			success: true,
			sent: result.sent,
			skipped: result.skipped,
			errors: result.errors,
			timestamp: new Date().toISOString(),
			message: 'Community story emails sent successfully'
		});
	} catch (error) {
		console.error('❌ Community story cron job failed:', error);

		return json(
			{
				error: 'Failed to send community story emails',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
