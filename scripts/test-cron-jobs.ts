#!/usr/bin/env tsx

/**
 * Comprehensive Cron Job Testing & Debugging Tool
 *
 * This script helps you test and debug your cron jobs both locally and in production.
 *
 * Usage:
 *   pnpm tsx scripts/test-cron-jobs.ts [command]
 *
 * Commands:
 *   local-reminders      - Test reminders locally (dry run)
 *   local-founder        - Test founder emails locally (dry run)
 *   local-all            - Test all cron jobs locally
 *   remote-reminders     - Test reminders via production HTTP endpoint
 *   remote-founder       - Test founder emails via production HTTP endpoint
 *   check-fly-machines   - Check Fly.io machine status
 *   check-fly-logs       - Check recent Fly.io logs for cron jobs
 *   deploy-check         - Verify deployment is ready
 */

import { sendReminders } from './send-reminders';
import { sendFounderEmails } from './send-founder-emails';

const PRODUCTION_URL = 'https://trykaiwa.com';

// Color codes for terminal output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	red: '\x1b[31m',
	cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title: string) {
	console.log('\n' + '='.repeat(60));
	log(title, 'bright');
	console.log('='.repeat(60) + '\n');
}

async function testLocalReminders() {
	section('📧 Testing Daily Reminders (Local - Dry Run)');

	log('Running send-reminders.ts...', 'cyan');
	try {
		const stats = await sendReminders();

		log('\n✅ Test completed successfully!', 'green');
		log(`📊 Results:`, 'bright');
		console.log(`   Total users: ${stats.totalUsers}`);
		console.log(`   Eligible users: ${stats.eligibleUsers}`);
		console.log(`   Reminders sent: ${stats.remindersSent}`);
		console.log(`   Reminders failed: ${stats.remindersFailed}`);

		if (stats.errors.length > 0) {
			log('\n⚠️  Errors encountered:', 'yellow');
			stats.errors.forEach((error) => console.log(`   - ${error}`));
		}

		return stats.remindersFailed === 0;
	} catch (error) {
		log(`\n❌ Test failed: ${error}`, 'red');
		return false;
	}
}

async function testLocalFounderEmails() {
	section('👋 Testing Founder Emails (Local - Dry Run)');

	log('Running send-founder-emails.ts...', 'cyan');
	try {
		const stats = await sendFounderEmails();

		log('\n✅ Test completed successfully!', 'green');
		log(`📊 Results:`, 'bright');
		console.log(`   Total eligible users: ${stats.totalEligible}`);
		console.log(`   Day 1 emails sent: ${stats.day1Sent}`);
		console.log(`   Day 2 emails sent: ${stats.day2Sent}`);
		console.log(`   Day 3 emails sent: ${stats.day3Sent}`);
		console.log(`   Skipped: ${stats.skipped}`);
		console.log(`   Failed: ${stats.failed}`);

		if (stats.errors.length > 0) {
			log('\n⚠️  Errors encountered:', 'yellow');
			stats.errors.forEach((error) => console.log(`   - ${error}`));
		}

		return stats.failed === 0;
	} catch (error) {
		log(`\n❌ Test failed: ${error}`, 'red');
		return false;
	}
}

async function testRemoteEndpoint(endpoint: string, name: string) {
	section(`🌐 Testing ${name} (Remote HTTP Endpoint)`);

	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret) {
		log('❌ CRON_SECRET environment variable not set!', 'red');
		log('Set it with: export CRON_SECRET=your_secret_here', 'yellow');
		return false;
	}

	const url = `${PRODUCTION_URL}${endpoint}?dryRun=true`;
	log(`Calling: ${url}`, 'cyan');
	log('Using Authorization header with CRON_SECRET', 'cyan');

	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${cronSecret}`
			}
		});

		if (!response.ok) {
			log(`\n❌ HTTP ${response.status}: ${response.statusText}`, 'red');
			const text = await response.text();
			console.log(text);
			return false;
		}

		const data = await response.json();

		log('\n✅ Remote endpoint responded successfully!', 'green');
		log('📊 Response:', 'bright');
		console.log(JSON.stringify(data, null, 2));

		return true;
	} catch (error) {
		log(`\n❌ Request failed: ${error}`, 'red');
		return false;
	}
}

async function checkFlyMachines() {
	section('🛫 Checking Fly.io Machines');

	log('Running: fly machines list --app kaiwa', 'cyan');
	console.log('');

	try {
		const { execSync } = await import('child_process');
		const output = execSync('fly machines list --app kaiwa', { encoding: 'utf-8' });
		console.log(output);

		log('\n💡 Expected machines:', 'bright');
		console.log('   1. Main web app (started)');
		console.log('   2. cron-daily-reminders (stopped - runs on schedule)');
		console.log('   3. cron-founder-emails (stopped - runs on schedule)');
		console.log('   4. cron-weekly-digest (stopped - runs on schedule)');

		log('\n📝 Note: Cron machines show as "stopped" when not actively running.', 'yellow');
		log('   They automatically start at their scheduled time.', 'yellow');

		return true;
	} catch (error: any) {
		if (error.message?.includes('unauthorized')) {
			log('❌ Not authenticated with Fly.io', 'red');
			log('\n💡 To authenticate:', 'bright');
			console.log('   1. Run: fly auth login');
			console.log('   2. Follow the browser authentication flow');
			console.log('   3. Try this command again');
		} else if (error.message?.includes('not found')) {
			log('❌ Fly CLI not installed', 'red');
			log('\n💡 To install:', 'bright');
			console.log('   Visit: https://fly.io/docs/hands-on/install-flyctl/');
		} else {
			log(`❌ Error: ${error.message}`, 'red');
		}
		return false;
	}
}

async function checkFlyLogs() {
	section('📋 Checking Fly.io Logs (Last 24 hours)');

	log('Running: fly logs --app kaiwa | grep -E "(cron|reminders|founder)" | tail -100', 'cyan');
	console.log('');

	try {
		const { execSync } = await import('child_process');
		const output = execSync(
			'fly logs --app kaiwa | grep -E "(cron|reminders|founder)" | tail -100',
			{ encoding: 'utf-8' }
		);

		if (output.trim() === '') {
			log('⚠️  No cron-related logs found', 'yellow');
			log('\nPossible reasons:', 'bright');
			console.log("   1. Cron jobs haven't run yet (check schedule)");
			console.log('   2. Cron machines not deployed');
			console.log('   3. Logs have rotated out (>24 hours old)');
		} else {
			console.log(output);
			log('\n✅ Found cron logs', 'green');
		}

		return true;
	} catch (error: any) {
		if (error.message?.includes('unauthorized')) {
			log('❌ Not authenticated with Fly.io', 'red');
			log('\n💡 Run: fly auth login', 'yellow');
		} else {
			log(`❌ Error: ${error.message}`, 'red');
		}
		return false;
	}
}

async function deploymentCheck() {
	section('🔍 Deployment Readiness Check');

	const checks = [
		{
			name: 'Scripts exist',
			check: async () => {
				const fs = await import('fs');
				const scriptsExist =
					fs.existsSync('./scripts/send-reminders.ts') &&
					fs.existsSync('./scripts/send-founder-emails.ts') &&
					fs.existsSync('./scripts/deploy-cron-jobs.sh');
				return scriptsExist;
			}
		},
		{
			name: 'Deploy script is executable',
			check: async () => {
				const fs = await import('fs');
				const { mode } = fs.statSync('./scripts/deploy-cron-jobs.sh');
				return (mode & 0o111) !== 0; // Check if executable bit is set
			}
		},
		{
			name: 'Database connection',
			check: async () => {
				try {
					const { userRepository } = await import('../src/lib/server/repositories');
					await userRepository.getAllUsers();
					return true;
				} catch {
					return false;
				}
			}
		},
		{
			name: 'Resend API configured',
			check: async () => {
				return !!process.env.RESEND_API_KEY;
			}
		},
		{
			name: 'Fly CLI available',
			check: async () => {
				try {
					const { execSync } = await import('child_process');
					execSync('fly --version', { stdio: 'ignore' });
					return true;
				} catch {
					return false;
				}
			}
		},
		{
			name: 'Fly authenticated',
			check: async () => {
				try {
					const { execSync } = await import('child_process');
					execSync('fly auth whoami', { stdio: 'ignore' });
					return true;
				} catch {
					return false;
				}
			}
		}
	];

	let allPassed = true;

	for (const check of checks) {
		try {
			const passed = await check.check();
			if (passed) {
				log(`✅ ${check.name}`, 'green');
			} else {
				log(`❌ ${check.name}`, 'red');
				allPassed = false;
			}
		} catch (error) {
			log(`❌ ${check.name} (error: ${error})`, 'red');
			allPassed = false;
		}
	}

	console.log('');

	if (allPassed) {
		log('✅ All checks passed! Ready to deploy.', 'green');
		log('\nNext steps:', 'bright');
		console.log('   1. Deploy main app: fly deploy');
		console.log('   2. Deploy cron jobs: pnpm cron:deploy');
		console.log('   3. Verify: fly machines list');
	} else {
		log('⚠️  Some checks failed. Fix the issues above before deploying.', 'yellow');
	}

	return allPassed;
}

async function showHelp() {
	section('📖 Cron Job Testing & Debugging Tool');

	log('Available Commands:', 'bright');
	console.log('');
	console.log("  🧪 LOCAL TESTING (Safe - Won't Send Real Emails)");
	console.log('     local-reminders      Test daily reminders locally');
	console.log('     local-founder        Test founder emails locally');
	console.log('     local-all            Test all cron jobs locally');
	console.log('');
	console.log('  🌐 REMOTE TESTING (Production - Requires CRON_SECRET)');
	console.log('     remote-reminders     Test reminders via HTTP endpoint');
	console.log('     remote-founder       Test founder emails via HTTP endpoint');
	console.log('');
	console.log('  ✈️  FLY.IO DEBUGGING (Requires Fly CLI + Authentication)');
	console.log('     check-fly-machines   Show deployed Fly.io machines');
	console.log('     check-fly-logs       Show recent cron logs from Fly.io');
	console.log('');
	console.log('  🔍 DEPLOYMENT');
	console.log('     deploy-check         Verify deployment readiness');
	console.log('');
	log('Examples:', 'bright');
	console.log('  pnpm tsx scripts/test-cron-jobs.ts local-all');
	console.log('  pnpm tsx scripts/test-cron-jobs.ts check-fly-machines');
	console.log('  CRON_SECRET=xxx pnpm tsx scripts/test-cron-jobs.ts remote-reminders');
	console.log('');
}

// Main entry point
const command = process.argv[2];

(async () => {
	switch (command) {
		case 'local-reminders':
			await testLocalReminders();
			break;

		case 'local-founder':
			await testLocalFounderEmails();
			break;

		case 'local-all':
			await testLocalReminders();
			await testLocalFounderEmails();
			break;

		case 'remote-reminders':
			await testRemoteEndpoint('/api/cron/send-reminders', 'Daily Reminders');
			break;

		case 'remote-founder':
			await testRemoteEndpoint('/api/cron/founder-emails', 'Founder Emails');
			break;

		case 'check-fly-machines':
			await checkFlyMachines();
			break;

		case 'check-fly-logs':
			await checkFlyLogs();
			break;

		case 'deploy-check':
			await deploymentCheck();
			break;

		default:
			await showHelp();
			break;
	}
})().catch((error) => {
	log(`\n💥 Fatal error: ${error}`, 'red');
	console.error(error);
	process.exit(1);
});
