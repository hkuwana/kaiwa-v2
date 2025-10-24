#!/usr/bin/env tsx

/**
 * Automated Email Reminder Script (Legacy)
 *
 * DEPRECATED: This script is no longer used for scheduled runs.
 * Cron jobs have been migrated to GitHub Actions with HTTP endpoints.
 *
 * The HTTP endpoint version runs via:
 *   GET /api/cron/send-reminders (Daily at 9:00 AM UTC)
 *
 * This script can still be run manually for testing:
 *   tsx scripts/send-reminders.ts
 *
 * See .github/cron/ for documentation on the new GitHub Actions setup.
 */

import { EmailReminderService } from '../src/lib/server/email/email-reminder.service';
import { userRepository } from '../src/lib/server/repositories';
import { scenarioAttemptsRepository } from '../src/lib/server/repositories/scenario-attempts.repository';
import { conversationSessionsRepository } from '../src/lib/server/repositories/conversation-sessions.repository';

interface ReminderStats {
	totalUsers: number;
	eligibleUsers: number;
	remindersSent: number;
	remindersFailed: number;
	errors: string[];
}

async function sendReminders(): Promise<ReminderStats> {
	const stats: ReminderStats = {
		totalUsers: 0,
		eligibleUsers: 0,
		remindersSent: 0,
		remindersFailed: 0,
		errors: []
	};

	try {
		console.log('🚀 Starting automated email reminder process...');

		// Get all users with verified emails
		const users = await userRepository.getAllUsers();
		const verifiedUsers = users.filter((u) => u.emailVerified);
		stats.totalUsers = verifiedUsers.length;

		console.log(`📊 Found ${stats.totalUsers} verified users`);

		// Filter users who should receive reminders
		const eligibleUsers = [];
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - 3); // 3 days ago

		for (const user of verifiedUsers) {
			try {
				// Check if user has practiced recently
				const recentSessions = await conversationSessionsRepository.getUserSessionsInRange(
					user.id,
					cutoffDate,
					new Date()
				);

				const recentAttempts = await scenarioAttemptsRepository.getScenarioAttemptsInDateRange(
					user.id,
					cutoffDate,
					new Date()
				);

				// If no recent activity, they're eligible for a reminder
				if (recentSessions.length === 0 && recentAttempts.length === 0) {
					eligibleUsers.push(user);
				}
			} catch (error) {
				stats.errors.push(`Error checking user ${user.id}: ${error}`);
			}
		}

		stats.eligibleUsers = eligibleUsers.length;
		console.log(`📧 ${stats.eligibleUsers} users eligible for reminders`);

		// Send reminders to eligible users
		for (const user of eligibleUsers) {
			try {
				const success = await EmailReminderService.sendPracticeReminder(user.id);

				if (success) {
					stats.remindersSent++;
					console.log(`✅ Reminder sent to ${user.email}`);
				} else {
					stats.remindersFailed++;
					console.log(`❌ Failed to send reminder to ${user.email}`);
				}

				// Small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				stats.remindersFailed++;
				stats.errors.push(`Error sending reminder to ${user.email}: ${error}`);
				console.log(`❌ Error sending reminder to ${user.email}: ${error}`);
			}
		}

		console.log('🎉 Reminder process completed!');
		console.log(`📊 Stats: ${stats.remindersSent} sent, ${stats.remindersFailed} failed`);
	} catch (error) {
		console.error('💥 Fatal error in reminder process:', error);
		stats.errors.push(`Fatal error: ${error}`);
	}

	return stats;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	sendReminders()
		.then((stats) => {
			console.log('\n📈 Final Statistics:');
			console.log(`Total users: ${stats.totalUsers}`);
			console.log(`Eligible users: ${stats.eligibleUsers}`);
			console.log(`Reminders sent: ${stats.remindersSent}`);
			console.log(`Reminders failed: ${stats.remindersFailed}`);

			if (stats.errors.length > 0) {
				console.log('\n❌ Errors:');
				stats.errors.forEach((error) => console.log(`  - ${error}`));
			}

			process.exit(stats.remindersFailed > 0 ? 1 : 0);
		})
		.catch((error) => {
			console.error('💥 Script failed:', error);
			process.exit(1);
		});
}

export { sendReminders };
