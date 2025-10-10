import { json } from '@sveltejs/kit';
import { EmailReminderService } from '$lib/server/email/email-reminder.service';
import { userRepository } from '$lib/server/repositories';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { userSettingsRepository } from '$lib/server/repositories/user-settings.repository';
import { EmailPermissionService } from '$lib/server/email/email-permission.service';
import { env } from '$env/dynamic/private';

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
		// Verify cron secret for security
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const dryRun = url.searchParams.get('dryRun') === 'true';

		// Get all users eligible for daily reminders based on database preferences
		const eligibleUserIds = await EmailPermissionService.getDailyReminderEligibleUsers();
		const usersToRemind = await Promise.all(
			eligibleUserIds.map(async (userId) => {
				const user = await userRepository.findUserById(userId);
				return user;
			})
		).then((users) => users.filter((u) => u !== null));

		// Segment users by activity level
		const segmented = await segmentUsers(usersToRemind);

		let sent = 0;
		let skipped = 0;
		let failed = 0;
		const dryRunPreviews: Array<{
			userId: string;
			email: string;
			segment: string;
			subject: string;
		}> = [];

		// Send appropriate emails based on user segment
		for (const segment of Object.keys(segmented)) {
			const users = segmented[segment as keyof typeof segmented];

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

		return json({
			success: true,
			stats: {
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
				dryRun
			}
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
