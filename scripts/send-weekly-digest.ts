#!/usr/bin/env tsx

/**
 * Weekly Digest Email Script (Legacy)
 *
 * DEPRECATED: This script is no longer used for scheduled runs.
 * Cron jobs have been migrated to GitHub Actions with HTTP endpoints.
 *
 * The HTTP endpoint version runs via:
 *   GET /api/cron/weekly-digest (Every Sunday at 10:00 AM UTC)
 *
 * This script can still be run manually for testing:
 *   tsx scripts/send-weekly-digest.ts
 *
 * To update weekly digest content, edit:
 *   src/routes/api/cron/weekly-digest/+server.ts
 *
 * See .github/cron/ for documentation on the new GitHub Actions setup.
 */

import { WeeklyUpdatesEmailService } from '../src/lib/server/email/weekly-updates-email.service';
import type { WeeklyDigestOptions } from '../src/lib/server/email/weekly-updates-email.service';

interface WeeklyDigestStats {
	sent: number;
	skipped: number;
	errors: string[];
}

/**
 * 📝 UPDATE THIS SECTION EVERY WEEK
 *
 * Each weekend before the Sunday morning send, update the content below
 * with what shipped this week and what's coming up next.
 *
 * Keep it conversational, brief, and focused on the "why" not the "what".
 */
const THIS_WEEKS_CONTENT: WeeklyDigestOptions = {
	// Main updates - what shipped this week (2-4 items)
	updates: [
		{
			title: 'Example: New audio mode',
			summary:
				'Push-to-talk mode is live. Press and hold to speak, release to get feedback. Perfect for rapid-fire practice sessions.',
			linkLabel: 'Try it out',
			linkUrl: 'https://trykaiwa.com/practice'
		},
		{
			title: 'Example: Faster responses',
			summary:
				"AI responses are now 2x faster thanks to streaming. You'll notice the difference immediately.",
			linkLabel: 'Learn more',
			linkUrl: 'https://trykaiwa.com/updates'
		}
	],

	// Product highlights - noteworthy improvements (0-2 items, optional)
	productHighlights: [
		{
			title: 'Example: Mobile experience improvements',
			summary:
				'Better touch targets, smoother animations, and clearer error messages on mobile devices.'
		}
	],

	// Coming up next - what you're working on (0-3 items, optional)
	upcoming: [
		{
			title: 'Example: Vocabulary tracking',
			summary: "We're building a system to track words you've learned and suggest review sessions."
		}
	],

	// Custom intro message (optional - defaults to standard message)
	intro:
		"Here's what we shipped at Kaiwa this week, and what we're working on next. Reply to this email if you want to see something different.",

	// Custom subject line (optional - defaults to "Kaiwa Weekly Update – [Date]")
	subject: undefined // Leave undefined to use default
};

async function sendWeeklyDigest(): Promise<WeeklyDigestStats> {
	const stats: WeeklyDigestStats = {
		sent: 0,
		skipped: 0,
		errors: []
	};

	try {
		console.log('📊 Starting weekly digest process...');
		console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
		console.log(`📝 Updates: ${THIS_WEEKS_CONTENT.updates.length} items`);

		// Send the digest using the service
		const result = await WeeklyUpdatesEmailService.sendWeeklyDigest(THIS_WEEKS_CONTENT);

		stats.sent = result.sent;
		stats.skipped = result.skipped;

		console.log('\n🎉 Weekly digest completed!');
		console.log(`📊 Stats: ${stats.sent} sent, ${stats.skipped} skipped`);

		// Log a reminder to update next week's content
		console.log('\n📝 REMINDER: Update THIS_WEEKS_CONTENT in scripts/send-weekly-digest.ts');
		console.log('   Next run: Next Sunday at 10:00 AM UTC');
	} catch (error) {
		console.error('💥 Fatal error in weekly digest process:', error);
		stats.errors.push(`Fatal error: ${error}`);
	}

	return stats;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	sendWeeklyDigest()
		.then((stats) => {
			console.log('\n📈 Final Statistics:');
			console.log(`Emails sent: ${stats.sent}`);
			console.log(`Skipped: ${stats.skipped}`);

			if (stats.errors.length > 0) {
				console.log('\n❌ Errors:');
				stats.errors.forEach((error) => console.log(`  - ${error}`));
			}

			process.exit(stats.skipped > 0 && stats.sent === 0 ? 1 : 0);
		})
		.catch((error) => {
			console.error('💥 Script failed:', error);
			process.exit(1);
		});
}

export { sendWeeklyDigest };
