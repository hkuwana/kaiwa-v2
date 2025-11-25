// scripts/test-pr4-path-generator.ts
/**
 * Test script for PR #4: Path Generator Service & API
 *
 * This script tests the PathGeneratorService directly without needing
 * to run the dev server. It verifies:
 *
 * 1. Path creation from user preferences
 * 2. Path creation from creator brief
 * 3. Database persistence
 * 4. Queue job creation
 *
 * Usage:
 *   pnpm tsx scripts/test-pr4-path-generator.ts
 */

import { PathGeneratorService } from '../src/lib/features/learning-path/services/PathGeneratorService.server';
import { learningPathRepository } from '../src/lib/server/repositories/learning-path.repository';
import { scenarioGenerationQueueRepository } from '../src/lib/server/repositories/scenario-generation-queue.repository';
import type {
	PathFromPreferencesInput,
	PathFromCreatorBriefInput
} from '../src/lib/features/learning-path/types';

// Test user preferences (mock data)
const testUserPreferences = {
	userId: 'test-user-123',
	targetLanguageId: 'ja',
	currentLanguageLevel: 'A2',
	practicalLevel: 'intermediate beginner',
	learningGoal: 'Connection',
	specificGoals: ['Have meaningful conversations', "Meet partner's family"],
	challengePreference: 'moderate' as const,
	correctionStyle: 'gentle' as const,
	conversationContext: {
		learningReason: "Planning to visit partner's family in Japan",
		occupation: 'Software Engineer'
	}
};

// Test creator brief (mock data)
const testCreatorBrief: PathFromCreatorBriefInput = {
	brief: `Create a 7-day intensive course for preparing to meet your Japanese partner's parents
for the first time. The course should cover formal greetings, gift-giving etiquette,
dinner table conversation, showing respect, and handling common questions about your
relationship and future plans. Focus on keigo (polite language) and cultural nuances
that are critical in this high-stakes scenario.`,
	targetLanguage: 'ja',
	duration: 7,
	difficultyRange: {
		start: 'A2',
		end: 'B1'
	},
	primarySkill: 'conversation',
	metadata: {
		category: 'relationships',
		tags: ['family', 'formal', 'culture', 'etiquette']
	}
};

async function testPathFromPreferences() {
	console.log('\n🧪 TEST 1: Creating path from user preferences');
	console.log('='.repeat(60));

	try {
		const input: PathFromPreferencesInput = {
			userPreferences: testUserPreferences,
			preset: {
				name: 'Meet the Parents (Japanese)',
				description: "4-week intensive preparation for meeting partner's family",
				duration: 7 // Shorter for testing
			}
		};

		console.log('📤 Input:', JSON.stringify(input, null, 2));

		const result = await PathGeneratorService.createPathFromPreferences(null, input);

		if (result.success) {
			console.log('\n✅ SUCCESS: Path created from preferences');
			console.log('📋 Result:', JSON.stringify(result, null, 2));

			// Verify in database
			if (result.pathId) {
				const pathInDb = await learningPathRepository.findPathById(result.pathId);
				console.log('\n💾 Database verification:');
				console.log('  - Path exists in DB:', !!pathInDb);
				console.log('  - Title:', pathInDb?.title);
				console.log('  - Days:', pathInDb?.schedule.length);
				console.log('  - Status:', pathInDb?.status);

				// Check queue entries
				const queueJobs = await scenarioGenerationQueueRepository.getJobsForPath(result.pathId);
				console.log('\n📋 Queue verification:');
				console.log('  - Jobs created:', queueJobs.length);
				console.log('  - Expected jobs:', result.queuedJobs);
				console.log('  - Match:', queueJobs.length === result.queuedJobs ? '✅' : '❌');

				return { success: true, pathId: result.pathId };
			}
		} else {
			console.log('\n❌ FAILED: Path creation failed');
			console.log('Error:', result.error);
			return { success: false, error: result.error };
		}
	} catch (error) {
		console.log('\n💥 EXCEPTION:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

async function testPathFromCreatorBrief() {
	console.log('\n🧪 TEST 2: Creating path from creator brief');
	console.log('='.repeat(60));

	try {
		console.log('📤 Input:', JSON.stringify(testCreatorBrief, null, 2));

		const result = await PathGeneratorService.createPathFromCreatorBrief(null, testCreatorBrief);

		if (result.success) {
			console.log('\n✅ SUCCESS: Path created from creator brief');
			console.log('📋 Result:', JSON.stringify(result, null, 2));

			// Verify in database
			if (result.pathId) {
				const pathInDb = await learningPathRepository.findPathById(result.pathId);
				console.log('\n💾 Database verification:');
				console.log('  - Path exists in DB:', !!pathInDb);
				console.log('  - Title:', pathInDb?.title);
				console.log('  - Days:', pathInDb?.schedule.length);
				console.log('  - Status:', pathInDb?.status);

				// Check queue entries
				const queueJobs = await scenarioGenerationQueueRepository.getJobsForPath(result.pathId);
				console.log('\n📋 Queue verification:');
				console.log('  - Jobs created:', queueJobs.length);
				console.log('  - Expected jobs:', result.queuedJobs);
				console.log('  - Match:', queueJobs.length === result.queuedJobs ? '✅' : '❌');

				return { success: true, pathId: result.pathId };
			}
		} else {
			console.log('\n❌ FAILED: Path creation failed');
			console.log('Error:', result.error);
			return { success: false, error: result.error };
		}
	} catch (error) {
		console.log('\n💥 EXCEPTION:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

async function testQueueStats() {
	console.log('\n🧪 TEST 3: Checking queue statistics');
	console.log('='.repeat(60));

	try {
		const stats = await scenarioGenerationQueueRepository.getQueueStats();
		console.log('\n📊 Queue Statistics:');
		console.log('  - Pending:', stats.pending);
		console.log('  - Processing:', stats.processing);
		console.log('  - Ready:', stats.ready);
		console.log('  - Failed:', stats.failed);
		console.log('  - Total:', stats.total);

		return { success: true, stats };
	} catch (error) {
		console.log('\n💥 EXCEPTION:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

async function main() {
	console.log('\n🚀 PR #4 Testing Suite');
	console.log('='.repeat(60));
	console.log('Testing PathGeneratorService and related functionality\n');

	const results = {
		test1: { success: false, pathId: null as string | null },
		test2: { success: false, pathId: null as string | null },
		test3: { success: false }
	};

	// Test 1: Path from preferences
	const test1Result = await testPathFromPreferences();
	results.test1 = test1Result as any;

	// Wait a bit between tests
	await new Promise((resolve) => setTimeout(resolve, 2000));

	// Test 2: Path from creator brief
	const test2Result = await testPathFromCreatorBrief();
	results.test2 = test2Result as any;

	// Wait a bit
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Test 3: Queue stats
	const test3Result = await testQueueStats();
	results.test3 = test3Result;

	// Summary
	console.log('\n' + '='.repeat(60));
	console.log('📊 TEST SUMMARY');
	console.log('='.repeat(60));
	console.log('Test 1 (Preferences):', results.test1.success ? '✅ PASS' : '❌ FAIL');
	console.log('Test 2 (Creator Brief):', results.test2.success ? '✅ PASS' : '❌ FAIL');
	console.log('Test 3 (Queue Stats):', results.test3.success ? '✅ PASS' : '❌ FAIL');

	const allPassed = results.test1.success && results.test2.success && results.test3.success;

	console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));
	console.log('='.repeat(60));

	if (results.test1.pathId) {
		console.log('\n📝 Created test paths:');
		console.log('  - From preferences:', results.test1.pathId);
	}
	if (results.test2.pathId) {
		console.log('  - From creator brief:', results.test2.pathId);
	}

	console.log('\n💡 Next steps:');
	console.log('  - View paths in Supabase dashboard');
	console.log('  - Check scenario_generation_queue table for jobs');
	console.log('  - Proceed to PR #5 if all tests passed');

	process.exit(allPassed ? 0 : 1);
}

// Run tests
main().catch((error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
