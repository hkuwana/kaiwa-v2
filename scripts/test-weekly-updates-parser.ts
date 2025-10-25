#!/usr/bin/env tsx

/**
 * Test script for the weekly updates parser
 *
 * Usage:
 *   pnpm run test-weekly-updates-parser
 */

import { WeeklyUpdatesParserService } from '../src/lib/server/services/weekly-updates-parser.service';

function testParser() {
	console.log('🧪 Testing Weekly Updates Parser...\n');

	try {
		// Test getting latest weekly update
		console.log('📄 Testing getLatestWeeklyUpdate()...');
		const latestUpdate = WeeklyUpdatesParserService.getLatestWeeklyUpdate();

		if (latestUpdate) {
			console.log('✅ Latest update found:');
			console.log(`   Date: ${latestUpdate.date}`);
			console.log(`   Updates: ${latestUpdate.updates.length} items`);
			console.log(`   Highlights: ${latestUpdate.highlights.length} items`);
			console.log(`   Upcoming: ${latestUpdate.upcoming.length} items`);
			console.log(`   Notes: ${latestUpdate.notes ? 'Yes' : 'No'}`);

			// Show sample content
			if (latestUpdate.updates.length > 0) {
				console.log('\n📝 Sample update:');
				console.log(`   Title: ${latestUpdate.updates[0].title}`);
				console.log(`   Summary: ${latestUpdate.updates[0].summary}`);
				if (latestUpdate.updates[0].linkUrl) {
					console.log(
						`   Link: ${latestUpdate.updates[0].linkLabel} -> ${latestUpdate.updates[0].linkUrl}`
					);
				}
			}
		} else {
			console.log('⚠️  No weekly update files found');
		}

		// Test getting all updates
		console.log('\n📚 Testing getAllWeeklyUpdates()...');
		const allUpdates = WeeklyUpdatesParserService.getAllWeeklyUpdates();
		console.log(`✅ Found ${allUpdates.length} weekly update files`);

		if (allUpdates.length > 0) {
			console.log('\n📅 Available updates:');
			allUpdates.forEach((update, index) => {
				console.log(`   ${index + 1}. ${update.date} (${update.updates.length} updates)`);
			});
		}

		console.log('\n🎉 Parser test completed successfully!');
	} catch (error) {
		console.error('❌ Parser test failed:', error);
		process.exit(1);
	}
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
	testParser();
}
