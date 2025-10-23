import { json } from '@sveltejs/kit';
import { EmailReminderService } from '$lib/server/email/email-reminder.service';
import { userRepository } from '$lib/server/repositories';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { userSettingsRepository } from '$lib/server/repositories/user-settings.repository';
import { EmailPermissionService } from '$lib/server/email/email-permission.service';
import { env } from '$env/dynamic/private';
import { Resend } from 'resend';

/**
 * API endpoint for sending reminder emails
 *
 * Should be called daily by a cron job (e.g., via Fly.io machines, GitHub Actions, or external service)
 *
 * Usage:
 * - Call with GET to send reminders to eligible users
 * - Protected by CRON_SECRET environment variable
 *
 * Example cron setup:
 * - Daily at 9am: curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/send-reminders
 */
export const GET = async ({ request, url }) => {
	try {
		console.log('🔍 Cron endpoint called - send-reminders');

		// Verify cron secret for security
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		console.log('🔐 Auth check:', { hasAuth: !!authHeader, hasSecret: !!env.CRON_SECRET });

		if (authHeader !== expectedAuth) {
			console.log('❌ Unauthorized access attempt');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const dryRun = url.searchParams.get('dryRun') === 'true';
		const testEmails =
			url.searchParams
				.get('testEmails')
				?.split(',')
				.map((e) => e.trim()) || null;
		console.log('✅ Authorized, dryRun:', dryRun, 'testEmails:', testEmails);

		// Get all users eligible for daily reminders based on database preferences
		console.log('📊 Fetching eligible users...');
		const eligibleUserIds = await EmailPermissionService.getDailyReminderEligibleUsers();
		console.log(`📊 Found ${eligibleUserIds.length} eligible user IDs`);
		let usersToRemind = await Promise.all(
			eligibleUserIds.map(async (userId) => {
				const user = await userRepository.findUserById(userId);
				return user;
			})
		).then((users) => users.filter((u) => u !== null));

		// Filter to test emails only if provided
		if (testEmails && testEmails.length > 0) {
			console.log(`🧪 TEST MODE: Filtering to only emails: ${testEmails.join(', ')}`);
			usersToRemind = usersToRemind.filter((u) => testEmails.includes(u.email));
			console.log(`🧪 Filtered to ${usersToRemind.length} test users`);
		}

		console.log(`👥 Found ${usersToRemind.length} users to process`);

		// Segment users by activity level
		console.log('🔄 Segmenting users...');
		const segmented = await segmentUsers(usersToRemind);
		console.log(
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
		console.log('📧 Starting to process users for reminders...');
		for (const segment of Object.keys(segmented)) {
			const users = segmented[segment as keyof typeof segmented];
			console.log(`Processing segment: ${segment} (${users.length} users)`);

			for (const user of users) {
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

		console.log(`✅ Processing complete! Sent: ${sent}, Skipped: ${skipped}, Failed: ${failed}`);

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
		console.error('Error in send-reminders cron:', error);
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
async function segmentUsers(users: any[]) {
	const now = new Date();
	const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
	const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
	const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
	const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

	const segmented = {
		newUsers: [] as any[], // Signed up but never practiced
		recentActive: [] as any[], // Practiced in last 24h (don't remind)
		slightlyInactive: [] as any[], // Last practice 1-3 days ago
		moderatelyInactive: [] as any[], // Last practice 3-7 days ago
		highlyInactive: [] as any[], // Last practice 7-30 days ago
		dormant: [] as any[] // Last practice 30+ days ago
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
 * Rate limiting: max 1 reminder per 24 hours
 */
async function shouldSendReminder(userId: string): Promise<boolean> {
	const settings = await userSettingsRepository.getSettingsByUserId(userId);

	if (!settings?.lastReminderSentAt) {
		return true;
	}

	const hoursSinceLastReminder =
		(Date.now() - settings.lastReminderSentAt.getTime()) / (1000 * 60 * 60);

	// Don't send more than once per 24 hours
	return hoursSinceLastReminder >= 24;
}

/**
 * Send summary email to admin after cron job completes
 */
async function sendCronSummaryEmail(stats: any): Promise<void> {
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
										.filter((e: any) => e.segment !== 'recentActive' && e.segment !== 'newUsers')
										.slice(0, 50)
										.map(
											(e: any) =>
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

		console.log('📧 Cron summary email sent to admin');
	} catch (error) {
		console.error('Failed to send cron summary email:', error);
		// Don't throw - we don't want to fail the cron job if email fails
	}
}
