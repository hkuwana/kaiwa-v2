#!/usr/bin/env tsx

/**
 * Manual script to send weekly product updates
 *
 * This replaces the automated cron job since weekly product updates
 * require manual content creation each week.
 *
 * Usage:
 *   pnpm run send-weekly-product-updates
 */

import { WeeklyUpdatesEmailService } from '../src/lib/server/email/weekly-updates-email.service';
import { WeeklyUpdatesParserService } from '../src/lib/server/services/weekly-updates-parser.service';
import type { WeeklyDigestOptions } from '../src/lib/server/email/weekly-updates-email.service';

interface WeeklyProductUpdatesStats {
	sent: number;
	skipped: number;
	errors: string[];
}

async function sendWeeklyProductUpdates(): Promise<WeeklyProductUpdatesStats> {
	const result: WeeklyProductUpdatesStats = {
		sent: 0,
		skipped: 0,
		errors: []
	};

	try {
		console.log('📊 Starting weekly product updates send...');
		console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
		console.log(`🕐 Time: ${new Date().toLocaleTimeString()}\n`);

		// Load this week's content from markdown files
		const weeklyUpdate = WeeklyUpdatesParserService.getLatestWeeklyUpdate();

		if (!weeklyUpdate) {
			console.error('❌ No weekly update file found!');
			console.log('\n📝 To create a weekly update file:');
			console.log('   pnpm run create-weekly-update');
			console.log('\n📝 Then edit the file with your weekly updates');
			result.errors.push('No weekly update file found');
			return result;
		}

		console.log(`📄 Using weekly update from: ${weeklyUpdate.date}`);
		console.log(`   Updates: ${weeklyUpdate.updates.length} items`);
		console.log(`   Highlights: ${weeklyUpdate.highlights.length} items`);
		console.log(`   Upcoming: ${weeklyUpdate.upcoming.length} items`);
		console.log(`   Notes: ${weeklyUpdate.notes ? 'Yes' : 'No'}\n`);

		// Use content from markdown file
		const thisWeeksContent: WeeklyDigestOptions = {
			updates: weeklyUpdate.updates,
			productHighlights: weeklyUpdate.highlights,
			upcoming: weeklyUpdate.upcoming,
			intro: weeklyUpdate.notes
				? `Here's what we shipped at Kaiwa this week, and what we're working on next. ${weeklyUpdate.notes}`
				: undefined
		};

		// Send the digest using the service
		const stats = await WeeklyUpdatesEmailService.sendWeeklyDigest(thisWeeksContent);

		result.sent = stats.sent;
		result.skipped = stats.skipped;

		console.log('\n🎉 Weekly product updates sent successfully!');
		console.log(`📊 Final Stats:`);
		console.log(`   ✅ Sent: ${result.sent}`);
		console.log(`   ⏭️  Skipped: ${result.skipped}`);
		console.log(`   ❌ Errors: ${result.errors.length}`);

		if (result.errors.length > 0) {
			console.log('\n❌ Errors encountered:');
			result.errors.forEach((error) => console.log(`   - ${error}`));
		}
	} catch (error) {
		console.error('💥 Fatal error in weekly product updates process:', error);
		result.errors.push(`Fatal error: ${error}`);
		throw error; // Re-throw to ensure non-zero exit code
	}

	return result;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	sendWeeklyProductUpdates()
		.then(() => {
			console.log('\n✅ Script completed successfully');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n❌ Script failed:', error);
			process.exit(1);
		});
}
