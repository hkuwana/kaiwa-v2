import { logger } from '$lib/logger';
import { json } from '@sveltejs/kit';
import { FounderEmailService } from '$lib/server/email/founder-email.service';
import { userRepository } from '$lib/server/repositories';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { userSettingsRepository } from '$lib/server/repositories/user-settings.repository';
import { EmailPermissionService } from '$lib/server/email/email-permission.service';
import { env } from '$env/dynamic/private';

/**
 * Founder Personal Email Sequence Cron Job
 *
 * Runs every afternoon (2-4pm local time) to send personalized emails from founder
 *
 * Sequence:
 * - Day 1 (after signup, if no practice): Warm welcome
 * - Day 2 (if still no practice): Check-in, offer help
 * - Day 3 (if still no practice): Personal offer to talk (calendar link)
 *
 * Usage:
 * curl -H "Authorization: Bearer $CRON_SECRET" https://trykaiwa.com/api/cron/founder-emails
 */
export const GET = async ({ request }) => {
	try {
		// Verify cron secret
		const authHeader = request.headers.get('authorization');
		const expectedAuth = `Bearer ${env.CRON_SECRET || 'development_secret'}`;

		if (authHeader !== expectedAuth) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// SAFETY: Prevent automatic email sending until manually reviewed
		// Set ENABLE_AUTOMATED_EMAILS=true in environment to allow actual sending
		const enableAutomatedEmails = env.ENABLE_AUTOMATED_EMAILS === 'true';
		if (!enableAutomatedEmails) {
			logger.info(
				'⚠️  SAFETY MODE: Founder emails disabled. Set ENABLE_AUTOMATED_EMAILS=true to enable.'
			);
			return json({
				success: false,
				message:
					'Automated emails are disabled for safety. Set ENABLE_AUTOMATED_EMAILS=true to enable.',
				stats: {
					total_eligible: 0,
					day1_sent: 0,
					day2_sent: 0,
					day3_sent: 0,
					skipped: 0,
					failed: 0
				}
			});
		}

		const stats = {
			day1_sent: 0,
			day2_sent: 0,
			day3_sent: 0,
			skipped: 0,
			failed: 0
		};

		// Get all users eligible for marketing emails based on database preferences
		const eligibleUserIds = await EmailPermissionService.getFounderEmailEligibleUsers();
		const usersToEmail = await Promise.all(
			eligibleUserIds.map(async (userId) => {
				const user = await userRepository.findUserById(userId);
				const settings = await userSettingsRepository.getSettingsByUserId(userId);
				return { user, settings };
			})
		).then((results) => results.filter((r) => r.user !== null));

		for (const { user, settings } of usersToEmail) {
			try {
				// Calculate days since signup
				const daysSinceSignup = Math.floor(
					(Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
				);

				// Check if user has practiced
				const sessions = await conversationSessionsRepository.getUserSessions(user.id, 1);
				const hasPracticed = sessions.length > 0;

				// Skip if user has already practiced
				if (hasPracticed) {
					stats.skipped++;
					continue;
				}

				// Rate limiting: Don't send if already sent today
				if (settings?.lastReminderSentAt) {
					const hoursSinceLastEmail =
						(Date.now() - settings.lastReminderSentAt.getTime()) / (1000 * 60 * 60);
					if (hoursSinceLastEmail < 20) {
						// At least 20 hours between emails
						stats.skipped++;
						continue;
					}
				}

				// Send appropriate email based on days since signup
				let success = false;

				if (daysSinceSignup === 1) {
					// Day 1: Welcome email
					success = await FounderEmailService.sendDay1Welcome(user.id);
					if (success) stats.day1_sent++;
				} else if (daysSinceSignup === 2) {
					// Day 2: Check-in
					success = await FounderEmailService.sendDay2CheckIn(user.id);
					if (success) stats.day2_sent++;
				} else if (daysSinceSignup === 3) {
					// Day 3: Personal offer to talk
					success = await FounderEmailService.sendDay3PersonalOffer(user.id);
					if (success) stats.day3_sent++;
				} else {
					// Don't send emails after Day 3 (respect user's inbox)
					stats.skipped++;
					continue;
				}

				if (success) {
					// Update last reminder sent timestamp
					await userSettingsRepository.updateSettings(user.id, {
						lastReminderSentAt: new Date(),
						dailyReminderSentCount: (settings?.dailyReminderSentCount || 0) + 1
					});
				} else {
					stats.failed++;
				}

				// Small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				logger.error(`Error sending founder email to ${user.id}:`, error);
				stats.failed++;
			}
		}

		return json({
			success: true,
			stats: {
				total_eligible: usersToEmail.length,
				...stats
			},
			message: 'Founder emails sent successfully'
		});
	} catch (error) {
		logger.error('Error in founder-emails cron:', error);
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
	// Same logic as GET, but allows testing with specific user IDs
	const { userId } = await request.json();

	if (!userId) {
		return json({ error: 'userId required' }, { status: 400 });
	}

	try {
		const user = await userRepository.findUserById(userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const daysSinceSignup = Math.floor(
			(Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
		);

		let success = false;
		let emailType = '';

		if (daysSinceSignup <= 1) {
			success = await FounderEmailService.sendDay1Welcome(userId);
			emailType = 'day1_welcome';
		} else if (daysSinceSignup <= 2) {
			success = await FounderEmailService.sendDay2CheckIn(userId);
			emailType = 'day2_checkin';
		} else {
			success = await FounderEmailService.sendDay3PersonalOffer(userId);
			emailType = 'day3_offer';
		}

		return json({
			success,
			emailType,
			daysSinceSignup,
			sentTo: user.email
		});
	} catch (error) {
		logger.error('Error sending test email:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
