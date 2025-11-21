import { logger } from '$lib/logger';
import { json } from '@sveltejs/kit';
import { EmailReminderService } from '$lib/emails/campaigns/reminders/reminder.service';
import { userRepository } from '$lib/server/repositories';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { userSettingsRepository } from '$lib/server/repositories/user-settings.repository';
import { EmailPermissionService } from '$lib/emails/shared/email-permission';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';
import type { User } from '$lib/server/db/types';

interface UserSegments {
	newUsers: User[];
	recentActive: User[];
	slightlyInactive: User[];
	moderatelyInactive: User[];
	highlyInactive: User[];
	dormant: User[];
}

interface CronStats {
	total: number;
	sent: number;
	skipped: number;
	failed: number;
	segments: Record<string, number>;
	dryRunPreviews?: Array<{
		userId: string;
		email: string;
		segment: string;
		subject: string;
	}>;
	dryRun: boolean;
	testMode?: { emails: string[] };
	emailsSent?: Array<{
		email: string;
		segment: string;
	}>;
}

/**
 * API endpoint for sending reminder emails
 *
 * Should be called on scheduled reminder days (currently Mondays & Thursdays at 9:00 AM UTC)
 *
 * Usage:
 * - Call with GET to send reminders to eligible users
 * - Protected by CRON_SECRET environment variable
 *
 * Example cron setup:
 * - Mondays & Thursdays at 9am UTC: curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/send-reminders
 */
export const GET = async ({ request, url }) => {
	try {
		logger.debug('🔍 Cron endpoint called - send-reminders');

		// Verify cron secret for security
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		logger.info('🔐 Auth check:', { hasAuth: !!authHeader, hasSecret: !!env.CRON_SECRET });

		if (authHeader !== expectedAuth) {
			logger.info('❌ Unauthorized access attempt');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// SAFETY: Force dry run mode until manually reviewed
		// Set ENABLE_AUTOMATED_EMAILS=true in environment to allow actual sending
		const enableAutomatedEmails = env.ENABLE_AUTOMATED_EMAILS === 'true';
		const dryRun = url.searchParams.get('dryRun') === 'true' || !enableAutomatedEmails;
		const testEmails =
			url.searchParams
				.get('testEmails')
				?.split(',')
				.map((e) => e.trim()) || null;

		if (!enableAutomatedEmails) {
			logger.info(
				'⚠️  SAFETY MODE: Automated emails disabled. Set ENABLE_AUTOMATED_EMAILS=true to enable.'
			);
		}
		logger.info('✅ Authorized, dryRun:', dryRun, 'testEmails:', testEmails);

		// Get all users eligible for daily reminders based on database preferences
		logger.info('📊 Fetching eligible users...');
		const eligibleUserIds = await EmailPermissionService.getPracticeReminderEligibleUsers();
		logger.info(`📊 Found ${eligibleUserIds.length} eligible user IDs`);
		let usersToRemind = await Promise.all(
			eligibleUserIds.map(async (userId) => {
				const user = await userRepository.findUserById(userId);
				return user;
			})
		).then((users) => users.filter((u) => u !== null));

		// Filter to test emails only if provided
		if (testEmails && testEmails.length > 0) {
			logger.info(`🧪 TEST MODE: Filtering to only emails: ${testEmails.join(', ')}`);
			usersToRemind = usersToRemind.filter((u) => testEmails.includes(u.email));
			logger.info(`🧪 Filtered to ${usersToRemind.length} test users`);
		}

		logger.info(`👥 Found ${usersToRemind.length} users to process`);

		// Segment users by activity level
		logger.info('🔄 Segmenting users...');
		const segmented = await segmentUsers(usersToRemind);
		logger.info(
			'✅ Users segmented:',
			Object.keys(segmented).reduce(
				(acc, key) => ({
					...acc,
					[key]: segmented[key as keyof typeof segmented].length
				}),
				{}
			)
		);

		let sent = 0;
		let skipped = 0;
		let failed = 0;
		const dryRunPreviews: Array<{
			userId: string;
			email: string;
			segment: string;
			subject: string;
		}> = [];
		const emailsSent: Array<{
			email: string;
			segment: string;
		}> = [];

		// Send appropriate emails based on user segment
		logger.info('📧 Starting to process users for reminders...');
		const today = new Date();
		const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'lowercase' });

		for (const segment of Object.keys(segmented)) {
			const users = segmented[segment as keyof typeof segmented];
			logger.info(`Processing segment: ${segment} (${users.length} users)`);

			for (const user of users) {
				// TODO: After DB migration, uncomment this to use user preferences
				// For now, use default: weekly on Friday
				const settings = await userSettingsRepository.getSettingsByUserId(user.id);
				const frequency =
					(settings?.practiceReminderFrequency as 'daily' | 'weekly' | 'never' | null) || 'weekly';
				const preferredDay = (settings?.preferredReminderDay as string | null) || 'friday';

				// Skip if user has set frequency to 'never' (when DB migration is complete)
				if (frequency === 'never') {
					skipped++;
					continue;
				}

				// For weekly reminders, only send on the preferred day (default: Friday)
				if (frequency === 'weekly' && dayOfWeek !== preferredDay) {
					skipped++;
					continue;
				}

				// Check if we should send reminder (rate limiting)
				const shouldSend = await shouldSendReminder(user.id);

				if (!shouldSend) {
					skipped++;
					continue;
				}

				if (dryRun) {
					const reminderData = await EmailReminderService.getPracticeReminderData(user.id);
					const subject = reminderData
						? EmailReminderService.getReminderSubject(reminderData)
						: 'No reminder data';

					dryRunPreviews.push({
						userId: user.id,
						email: user.email,
						segment,
						subject
					});
					sent++;
					continue;
				}

				// Send reminder based on segment
				const success = await EmailReminderService.sendPracticeReminder(user.id);

				if (success) {
					sent++;
					emailsSent.push({
						email: user.email,
						segment
					});
					// Update last reminder sent timestamp
					const currentSettings = await userSettingsRepository.getSettingsByUserId(user.id);
					await userSettingsRepository.updateSettings(user.id, {
						lastReminderSentAt: new Date(),
						dailyReminderSentCount: (currentSettings?.dailyReminderSentCount || 0) + 1
					});
				} else {
					failed++;
				}

				// Small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}

		logger.info(`✅ Processing complete! Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed}`);

		const stats = {
			total: usersToRemind.length,
			sent,
			skipped,
			failed,
			segments: Object.keys(segmented).reduce(
				(acc, key) => ({
					...acc,
					[key]: segmented[key as keyof typeof segmented].length
				}),
				{}
			),
			dryRunPreviews: dryRun ? dryRunPreviews : undefined,
			dryRun,
			testMode: testEmails ? { emails: testEmails } : undefined,
			emailsSent: emailsSent.length > 0 ? emailsSent : undefined
		};

		// Send summary email to admin (only if not in dry run and actually sent emails)
		if (!dryRun && sent > 0) {
			await sendCronSummaryEmail(stats);
		}

		return json({
			success: true,
			stats
		});
	} catch (error) {
		logger.error('Error in send-reminders cron:', error);
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
 * Segment users by activity level
 */
async function segmentUsers(users: User[]): Promise<UserSegments> {
	const now = new Date();
	const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const segmented: UserSegments = {
		newUsers: [], // Signed up but never practiced
		recentActive: [], // Practiced in last 24h (don't remind)
		slightlyInactive: [], // Last practice 1-3 days ago
		moderatelyInactive: [], // Last practice 3-7 days ago
		highlyInactive: [], // Last practice 7-30 days ago
		dormant: [] // Last practice 30+ days ago
	};

	for (const user of users) {
		const sessions = await conversationSessionsRepository.getUserSessions(user.id, 1);
		const lastSession = sessions[0];

		if (!lastSession) {
			// User has never practiced
			segmented.newUsers.push(user);
		} else {
			const lastPractice = lastSession.startTime;

			if (lastPractice > oneDayAgo) {
				segmented.recentActive.push(user);
			} else if (lastPractice > threeDaysAgo) {
				segmented.slightlyInactive.push(user);
			} else if (lastPractice > sevenDaysAgo) {
				segmented.moderatelyInactive.push(user);
			} else if (lastPractice > thirtyDaysAgo) {
				segmented.highlyInactive.push(user);
			} else {
				segmented.dormant.push(user);
			}
		}
	}

	return segmented;
}

/**
 * Determine if we should send a reminder to this user
 * Rate limiting:
 * - Daily frequency: max 1 reminder per 24 hours
 * - Weekly frequency: max 1 reminder per 7 days (default until DB migration)
 */
async function shouldSendReminder(userId: string): Promise<boolean> {
	const settings = await userSettingsRepository.getSettingsByUserId(userId);

	if (!settings?.lastReminderSentAt) {
		return true;
	}

	// TODO: After DB migration, use actual frequency from DB
	// For now, default to weekly (7 days)
	const frequency =
		(settings?.practiceReminderFrequency as 'daily' | 'weekly' | 'never' | null) || 'weekly';
	const hoursSinceLastReminder =
		(Date.now() - settings.lastReminderSentAt.getTime()) / (1000 * 60 * 60);

	// Daily: Don't send more than once per 24 hours
	if (frequency === 'daily') {
		return hoursSinceLastReminder >= 24;
	}

	// Weekly: Don't send more than once per 7 days (168 hours)
	if (frequency === 'weekly') {
		return hoursSinceLastReminder >= 168;
	}

	// Never: Should never get here as we filter these out earlier
	return false;
}

/**
 * Send summary email to admin after cron job completes
 */
async function sendCronSummaryEmail(stats: CronStats): Promise<void> {
	try {
		const resend = new Resend(env.RESEND_API_KEY);

		const timestamp = new Date().toISOString();
		const testModeText = stats.testMode
			? `<p style="background: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b;"><strong>🧪 TEST MODE:</strong> Sent only to: ${stats.testMode.emails.join(', ')}</p>`
			: '';

		await resend.emails.send({
			from: 'Kaiwa Cron <hiro@trykaiwa.com>',
			to: ['hiro@trykaiwa.com'],
			subject: `✅ Daily Reminders Sent - ${stats.sent} emails`,
			html: `
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="utf-8">
					<style>
						body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
						.container { max-width: 600px; margin: 0 auto; padding: 20px; }
						.header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
						.content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
						.stat { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #2563eb; }
						.success { border-left-color: #10b981; }
						.warning { border-left-color: #f59e0b; }
						.error { border-left-color: #ef4444; }
					</style>
				</head>
				<body>
					<div class="container">
						<div class="header">
							<h2 style="margin: 0;">📧 Daily Reminder Cron Job Summary</h2>
							<p style="margin: 5px 0 0 0; opacity: 0.9;">${timestamp}</p>
						</div>
						<div class="content">
							${testModeText}

							<div class="stat success">
								<strong>✅ Sent:</strong> ${stats.sent} emails
							</div>

							<div class="stat warning">
								<strong>⏭️ Skipped:</strong> ${stats.skipped} users (sent within 24h)
							</div>

							${stats.failed > 0 ? `<div class="stat error"><strong>❌ Failed:</strong> ${stats.failed} emails</div>` : ''}

							<div class="stat">
								<strong>👥 Total Eligible:</strong> ${stats.total} users
							</div>

							<h3>User Segments:</h3>
							<div class="stat">
								<strong>New Users:</strong> ${stats.segments.newUsers || 0} (never practiced)<br>
								<strong>Slightly Inactive:</strong> ${stats.segments.slightlyInactive || 0} (1-3 days ago)<br>
								<strong>Moderately Inactive:</strong> ${stats.segments.moderatelyInactive || 0} (3-7 days ago)<br>
								<strong>Highly Inactive:</strong> ${stats.segments.highlyInactive || 0} (7-30 days ago)<br>
								<strong>Dormant:</strong> ${stats.segments.dormant || 0} (30+ days ago)
							</div>

							${
								stats.emailsSent && stats.emailsSent.length > 0
									? `
							<h3>Inactive Users Sent (First 50):</h3>
							<div class="stat" style="max-height: 300px; overflow-y: auto; font-size: 13px;">
								${
									stats.emailsSent
										.filter((e) => e.segment !== 'recentActive' && e.segment !== 'newUsers')
										.slice(0, 50)
										.map(
											(e) =>
												`<div style="padding: 4px 0;">${e.email} <span style="color: #666;">(${e.segment})</span></div>`
										)
										.join('') || '<em>No inactive users</em>'
								}
							</div>
							`
									: ''
							}

							<p style="margin-top: 20px; font-size: 14px; color: #666;">
								This is an automated summary from your Kaiwa cron job.
								<a href="https://trykaiwa.com/api/cron/send-reminders?dryRun=true">Test the endpoint</a>
							</p>
						</div>
					</div>
				</body>
				</html>
			`
		});

		logger.info('📧 Cron summary email sent to admin');
	} catch (error) {
		logger.error('Failed to send cron summary email:', error);
		// Don't throw - we don't want to fail the cron job if email fails
	}
}
