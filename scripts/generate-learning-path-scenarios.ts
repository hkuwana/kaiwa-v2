// scripts/generate-learning-path-scenarios.ts
/**
 * Queue Processor Script - Generate scenarios for learning paths
 *
 * This script processes the scenario generation queue for learning paths.
 * It should be run periodically (e.g., every hour) via cron job.
 *
 * Usage:
 *   pnpm cron:generate-scenarios
 *   pnpm cron:generate-scenarios --limit 20
 *   pnpm cron:generate-scenarios --dry-run
 *
 * Environment:
 *   DATABASE_URL - Required
 *   OPENAI_API_KEY - Required (for future scenario generation)
 */

import { QueueProcessorService } from '../src/lib/features/learning-path/services/QueueProcessorService.server';

// Parse command line arguments
const args = process.argv.slice(2);
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 10;
const dryRun = args.includes('--dry-run');

async function main() {
	console.log('🚀 Learning Path Scenario Generator');
	console.log('=' .repeat(60));
	console.log(`Started at: ${new Date().toISOString()}`);
	console.log(`Limit: ${limit} jobs`);
	console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
	console.log('=' .repeat(60));
	console.log('');

	try {
		// Get initial queue stats
		const initialStats = await QueueProcessorService.getQueueStats();
		console.log('📊 Initial Queue Status:');
		console.log(`  - Pending: ${initialStats.pending}`);
		console.log(`  - Processing: ${initialStats.processing}`);
		console.log(`  - Ready: ${initialStats.ready}`);
		console.log(`  - Failed: ${initialStats.failed}`);
		console.log(`  - Total: ${initialStats.total}`);
		console.log('');

		if (initialStats.pending === 0) {
			console.log('✨ No pending jobs to process. Exiting.');
			process.exit(0);
		}

		// Process the queue
		console.log(`🔄 Processing up to ${limit} pending jobs...`);
		console.log('');

		const result = await QueueProcessorService.processPendingJobs(limit, dryRun);

		console.log('');
		console.log('=' .repeat(60));
		console.log('📊 Processing Results:');
		console.log(`  - Processed: ${result.processed}`);
		console.log(`  - Succeeded: ${result.succeeded}`);
		console.log(`  - Failed: ${result.failed}`);
		console.log(`  - Skipped: ${result.skipped} (not ready yet)`);
		console.log('');

		if (result.errors.length > 0) {
			console.log('❌ Errors:');
			result.errors.forEach(({ jobId, error }) => {
				console.log(`  - Job ${jobId}: ${error}`);
			});
			console.log('');
		}

		// Get final queue stats
		const finalStats = await QueueProcessorService.getQueueStats();
		console.log('📊 Final Queue Status:');
		console.log(`  - Pending: ${finalStats.pending}`);
		console.log(`  - Processing: ${finalStats.processing}`);
		console.log(`  - Ready: ${finalStats.ready}`);
		console.log(`  - Failed: ${finalStats.failed}`);
		console.log(`  - Total: ${finalStats.total}`);
		console.log('');

		console.log('=' .repeat(60));
		console.log(`Completed at: ${new Date().toISOString()}`);

		if (result.failed > 0) {
			console.log('⚠️  Some jobs failed. Check logs above.');
			process.exit(1);
		} else {
			console.log('✅ All jobs processed successfully!');
			process.exit(0);
		}
	} catch (error) {
		console.error('');
		console.error('=' .repeat(60));
		console.error('💥 Fatal Error:');
		console.error(error);
		console.error('=' .repeat(60));
		process.exit(1);
	}
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
	console.error('💥 Unhandled rejection:', error);
	process.exit(1);
});

// Run the script
main();
