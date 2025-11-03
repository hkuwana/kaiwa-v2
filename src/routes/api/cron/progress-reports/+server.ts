import { json } from '@sveltejs/kit';
import { ProgressReportsEmailService } from '$lib/server/email/progress-reports-email.service';
import { env } from '$env/dynamic/private';

/**
 * Cron endpoint for sending weekly progress reports
 *
 * Sends progress report emails to all users who have opted into progress reports.
 * Should be run on Saturday mornings (e.g., 9:00 AM UTC).
 *
 * Usage:
 * curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/progress-reports
 *
 * Schedule (GitHub Actions):
 * - Saturdays at 9:00 AM UTC
 */
export const GET = async ({ request, url }) => {
	try {
		console.log('🔍 Cron endpoint called - progress-reports');

		// Verify cron secret for security
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		console.log('🔐 Auth check:', { hasAuth: !!authHeader, hasSecret: !!env.CRON_SECRET });

		if (authHeader !== expectedAuth) {
			console.log('❌ Unauthorized access attempt');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const dryRun = url.searchParams.get('dryRun') === 'true';

		console.log('✅ Authorized, dryRun:', dryRun);

		if (dryRun) {
			console.log('📧 DRY RUN: Would send progress reports to all eligible users');
			return json({
				success: true,
				dryRun: true,
				message: 'Dry run mode - no emails sent'
			});
		}

		console.log('📧 Sending progress reports to users who practiced this week...');

		const stats = await ProgressReportsEmailService.sendProgressReports();

		console.log(
			`✅ Progress reports sent: ${stats.sent} emails, ${stats.failed} failed, ${stats.skipped} skipped`
		);

		return json({
			success: true,
			message: 'Progress reports sent successfully',
			stats: {
				sent: stats.sent,
				skipped: stats.skipped,
				failed: stats.failed,
				note: 'Only users with practice sessions this week receive reports'
			}
		});
	} catch (error) {
		console.error('Error in progress-reports cron:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * POST endpoint for manual trigger (testing)
 */
export const POST = async ({ request }) => {
	const { userId } = (await request.json().catch(() => ({}))) as { userId?: string };

	if (!userId) {
		return json({ error: 'userId required in body' }, { status: 400 });
	}

	try {
		const success = await ProgressReportsEmailService.sendProgressReportToUser(userId);

		return json({
			success,
			message: success ? 'Progress report sent' : 'No sessions this week or user not eligible',
			userId
		});
	} catch (error) {
		console.error('Error sending test progress report:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
