#!/usr/bin/env tsx

/**
 * Weekly Stats Email Script
 *
 * Sends personalized weekly practice statistics to users who opted into weekly emails.
 * Includes: practice minutes, sessions, days active, most practiced language, and comparison to previous week.
 *
 * Run manually:
 *   tsx scripts/send-weekly-stats.ts
 *
 * Run via Fly.io scheduled machine:
 *   fly machine run --schedule weekly --schedule-weekday monday --schedule-time "11:00" \
 *     --entrypoint "pnpm" --cmd "tsx" --cmd "scripts/send-weekly-stats.ts"
 *   (Runs every Monday at 11:00 AM UTC)
 */

import { config } from 'dotenv';
import { WeeklyStatsEmailService } from '../src/lib/server/email/weekly-stats-email.service';

// Load environment variables from .env file
config();

interface WeeklyStatsScriptResult {
	sent: number;
	skipped: number;
	errors: string[];
}

async function sendWeeklyStats(): Promise<WeeklyStatsScriptResult> {
	const result: WeeklyStatsScriptResult = {
		sent: 0,
		skipped: 0,
		errors: []
	};

	try {
		console.log('📊 Starting weekly stats email process...');
		console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
		console.log(`🕐 Time: ${new Date().toLocaleTimeString()}\n`);

		// Send weekly stats to all eligible users
		const stats = await WeeklyStatsEmailService.sendWeeklyStats();

		result.sent = stats.sent;
		result.skipped = stats.skipped;
		result.errors = stats.errors;

		console.log('\n🎉 Weekly stats email process completed!');
		console.log(`📊 Final Stats:`);
		console.log(`   ✅ Sent: ${result.sent}`);
		console.log(`   ⏭️  Skipped: ${result.skipped}`);
		console.log(`   ❌ Errors: ${result.errors.length}`);

		if (result.errors.length > 0) {
			console.log('\n❌ Errors encountered:');
			result.errors.forEach((error) => console.log(`   - ${error}`));
		}
	} catch (error) {
		console.error('💥 Fatal error in weekly stats process:', error);
		result.errors.push(`Fatal error: ${error}`);
		throw error; // Re-throw to ensure non-zero exit code
	}

	return result;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	sendWeeklyStats()
		.then((result) => {
			console.log('\n✨ Script execution completed');

			// Exit with appropriate code
			// Exit 0 if any emails were sent successfully
			// Exit 1 if there were errors or nothing was sent
			if (result.sent > 0) {
				process.exit(0);
			} else if (result.errors.length > 0) {
				console.error('Exiting with error code due to failures');
				process.exit(1);
			} else {
				console.log('No emails sent (no active users this week)');
				process.exit(0);
			}
		})
		.catch((error) => {
			console.error('💥 Script failed:', error);
			process.exit(1);
		});
}

export { sendWeeklyStats };
