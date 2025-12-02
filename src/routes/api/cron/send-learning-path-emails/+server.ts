import { logger } from '$lib/logger';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import { LearningPathEmailService } from '$lib/emails/campaigns/learning-path/learning-path.service';
import { userRepository } from '$lib/server/repositories';
import { trackServerEvent } from '$lib/server/posthog';

interface CronStats {
	total: number;
	sent: number;
	skipped: number;
	failed: number;
	dryRun: boolean;
	dryRunPreviews?: Array<{
		assignmentId: string;
		email: string;
		currentDay: number;
		pathTitle: string;
	}>;
}

/**
 * API endpoint for sending daily learning path reminder emails
 *
 * Should be called daily (e.g., 8:00 AM UTC)
 *
 * Usage:
 * - GET: Send reminders to all eligible users
 * - Protected by CRON_SECRET environment variable
 *
 * Query params:
 * - dryRun=true: Preview what would be sent without sending
 * - testEmails=email1,email2: Only send to specific emails (for testing)
 *
 * Example cron setup:
 * curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/send-learning-path-emails
 */
export const GET = async ({ request, url }) => {
	try {
		logger.info('Learning path email cron triggered');

		// Verify cron secret
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			logger.warn('Unauthorized access attempt to learning path cron');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Safety mode
		const enableAutomatedEmails = env.ENABLE_AUTOMATED_EMAILS === 'true';
		const dryRun = url.searchParams.get('dryRun') === 'true' || !enableAutomatedEmails;
		const testEmails =
			url.searchParams
				.get('testEmails')
				?.split(',')
				.map((e) => e.trim()) || null;

		if (!enableAutomatedEmails) {
			logger.info('SAFETY MODE: Automated emails disabled. Set ENABLE_AUTOMATED_EMAILS=true');
		}

		logger.info(`Learning path cron - dryRun: ${dryRun}, testEmails: ${testEmails?.join(', ')}`);

		const stats: CronStats = {
			total: 0,
			sent: 0,
			skipped: 0,
			failed: 0,
			dryRun,
			dryRunPreviews: []
		};

		// Get all assignments due for email
		const assignmentsDue = await learningPathAssignmentRepository.getAssignmentsDueForEmail();
		stats.total = assignmentsDue.length;

		logger.info(`Found ${assignmentsDue.length} assignments due for email`);

		for (const assignment of assignmentsDue) {
			try {
				// Get user for filtering
				const user = await userRepository.findUserById(assignment.userId);
				if (!user || !user.email) {
					stats.skipped++;
					continue;
				}

				// Filter by test emails if provided
				if (testEmails && !testEmails.includes(user.email)) {
					stats.skipped++;
					continue;
				}

				// Check if email was already sent today
				if (assignment.lastEmailSentAt) {
					const lastSent = new Date(assignment.lastEmailSentAt);
					const now = new Date();
					const hoursSinceLastEmail =
						(now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

					if (hoursSinceLastEmail < 20) {
						// Don't send more than once per 20 hours
						logger.info(
							`Skipping ${user.email} - email sent ${Math.round(hoursSinceLastEmail)}h ago`
						);
						stats.skipped++;
						continue;
					}
				}

				// Get email data for preview
				const emailData = await LearningPathEmailService.getLearningPathEmailData(assignment.id);
				if (!emailData) {
					stats.skipped++;
					continue;
				}

				if (dryRun) {
					// Just collect preview data
					stats.dryRunPreviews?.push({
						assignmentId: assignment.id,
						email: user.email,
						currentDay: emailData.currentDay,
						pathTitle: emailData.pathTitle
					});
					stats.sent++;
				} else {
					// Actually send the email
					const success = await LearningPathEmailService.sendDailyReminder(assignment.id);
					if (success) {
						stats.sent++;
						logger.info(`Sent learning path email to ${user.email} (Day ${emailData.currentDay})`);
					} else {
						stats.failed++;
						logger.error(`Failed to send learning path email to ${user.email}`);
					}
				}
			} catch (error) {
				logger.error(`Error processing assignment ${assignment.id}:`, error);
				stats.failed++;
			}
		}

		logger.info(
			`Learning path cron complete: ${stats.sent} sent, ${stats.skipped} skipped, ${stats.failed} failed`
		);

		// Track cron completion in PostHog
		if (!dryRun) {
			trackServerEvent('learning_path_cron_completed', 'system', {
				total_assignments: stats.total,
				emails_sent: stats.sent,
				emails_skipped: stats.skipped,
				emails_failed: stats.failed,
				success_rate: stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0
			});
		}

		return json({
			success: true,
			stats,
			message: dryRun
				? `Dry run complete. Would send ${stats.sent} emails.`
				: `Sent ${stats.sent} learning path reminder emails.`
		});
	} catch (error) {
		logger.error('Learning path cron error:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * POST endpoint for testing (same as GET but accepts body)
 */
export const POST = GET;
