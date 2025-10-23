#!/usr/bin/env tsx

/**
 * Founder Email Sequence Script
 *
 * Sends personalized emails from the founder to users who haven't started practicing.
 * This script runs as a separate process, not an HTTP endpoint.
 *
 * Run manually:
 *   tsx scripts/send-founder-emails.ts
 *
 * Run via Fly.io scheduled machine:
 *   fly machine run --schedule "0 14 * * *" --entrypoint "pnpm" --cmd "tsx" --cmd "scripts/send-founder-emails.ts"
 */

import { FounderEmailService } from '../src/lib/server/email/founder-email.service';
import { userRepository } from '../src/lib/server/repositories';
import { conversationSessionsRepository } from '../src/lib/server/repositories/conversation-sessions.repository';
import { userSettingsRepository } from '../src/lib/server/repositories/user-settings.repository';
import { EmailPermissionService } from '../src/lib/server/email/email-permission.service';

interface FounderEmailStats {
	totalEligible: number;
	day1Sent: number;
	day2Sent: number;
	day3Sent: number;
	skipped: number;
	failed: number;
	errors: string[];
}

async function sendFounderEmails(): Promise<FounderEmailStats> {
	const stats: FounderEmailStats = {
		totalEligible: 0,
		day1Sent: 0,
		day2Sent: 0,
		day3Sent: 0,
		skipped: 0,
		failed: 0,
		errors: []
	};

	try {
		console.log('🚀 Starting founder email sequence...');

		// Get all users eligible for marketing emails based on database preferences
		const eligibleUserIds = await EmailPermissionService.getMarketingEligibleUsers();
		const usersToEmail = await Promise.all(
			eligibleUserIds.map(async (userId) => {
				const user = await userRepository.findUserById(userId);
				const settings = await userSettingsRepository.getSettingsByUserId(userId);
				return { user, settings };
			})
		).then((results) => results.filter((r) => r.user !== null));

		stats.totalEligible = usersToEmail.length;
		console.log(`📊 Found ${stats.totalEligible} eligible users`);

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
					if (success) {
						stats.day1Sent++;
						console.log(`✅ Day 1 email sent to ${user.email}`);
					}
				} else if (daysSinceSignup === 2) {
					// Day 2: Check-in
					success = await FounderEmailService.sendDay2CheckIn(user.id);
					if (success) {
						stats.day2Sent++;
						console.log(`✅ Day 2 email sent to ${user.email}`);
					}
				} else if (daysSinceSignup === 3) {
					// Day 3: Personal offer to talk
					success = await FounderEmailService.sendDay3PersonalOffer(user.id);
					if (success) {
						stats.day3Sent++;
						console.log(`✅ Day 3 email sent to ${user.email}`);
					}
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
					console.log(`❌ Failed to send email to ${user.email}`);
				}

				// Small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				console.error(`Error sending founder email to ${user.id}:`, error);
				stats.failed++;
				stats.errors.push(`User ${user.id}: ${error}`);
			}
		}

		console.log('🎉 Founder email sequence completed!');
		console.log(
			`📊 Stats: Day1=${stats.day1Sent}, Day2=${stats.day2Sent}, Day3=${stats.day3Sent}, Skipped=${stats.skipped}, Failed=${stats.failed}`
		);
	} catch (error) {
		console.error('💥 Fatal error in founder email process:', error);
		stats.errors.push(`Fatal error: ${error}`);
	}

	return stats;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	sendFounderEmails()
		.then((stats) => {
			console.log('\n📈 Final Statistics:');
			console.log(`Total eligible users: ${stats.totalEligible}`);
			console.log(`Day 1 emails sent: ${stats.day1Sent}`);
			console.log(`Day 2 emails sent: ${stats.day2Sent}`);
			console.log(`Day 3 emails sent: ${stats.day3Sent}`);
			console.log(`Skipped: ${stats.skipped}`);
			console.log(`Failed: ${stats.failed}`);

			if (stats.errors.length > 0) {
				console.log('\n❌ Errors:');
				stats.errors.forEach((error) => console.log(`  - ${error}`));
			}

			process.exit(stats.failed > 0 ? 1 : 0);
		})
		.catch((error) => {
			console.error('💥 Script failed:', error);
			process.exit(1);
		});
}

export { sendFounderEmails };
