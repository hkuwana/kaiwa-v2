#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface SmokeTestConfig {
	name: string;
	command: string;
	description: string;
}

const smokeTestConfigs: SmokeTestConfig[] = [
	{
		name: 'local',
		command: 'pnpm run smoke:test',
		description: 'Local development smoke tests'
	},
	{
		name: 'production',
		command: 'pnpm run smoke:test:prod',
		description: 'Production environment smoke tests'
	},
	{
		name: 'headed',
		command: 'pnpm run smoke:test:headed',
		description: 'Local smoke tests with browser UI'
	}
];

async function runSmokeTests() {
	console.log('🚀 Starting Kaiwa Smoke Test Suite\n');

	// Check if we're in the right directory
	if (!existsSync('package.json') || !existsSync('e2e/smoke.spec.ts')) {
		console.error('❌ Error: Must run from project root directory');
		process.exit(1);
	}

	// Check if dependencies are installed
	if (!existsSync('node_modules')) {
		console.log('📦 Installing dependencies...');
		try {
			execSync('pnpm install', { stdio: 'inherit' });
		} catch (error) {
			console.error('❌ Failed to install dependencies');
			process.exit(1);
		}
	}

	// Check if Playwright browsers are installed
	if (!existsSync(join('node_modules', '.cache', 'playwright'))) {
		console.log('🌐 Installing Playwright browsers...');
		try {
			execSync('pnpm exec playwright install --with-deps', { stdio: 'inherit' });
		} catch (error) {
			console.error('❌ Failed to install Playwright browsers');
			process.exit(1);
		}
	}

	let passedTests = 0;
	let failedTests = 0;

	for (const config of smokeTestConfigs) {
		console.log(`\n🔍 Running ${config.name} smoke tests...`);
		console.log(`📝 ${config.description}\n`);

		try {
			execSync(config.command, {
				stdio: 'inherit',
				env: { ...process.env, CI: 'false' }
			});
			console.log(`✅ ${config.name} smoke tests passed!\n`);
			passedTests++;
		} catch (error) {
			console.error(`❌ ${config.name} smoke tests failed!\n`);
			failedTests++;
		}
	}

	// Summary
	console.log('📊 Smoke Test Summary');
	console.log('=====================');
	console.log(`✅ Passed: ${passedTests}`);
	console.log(`❌ Failed: ${failedTests}`);
	console.log(`📈 Success Rate: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);

	if (failedTests > 0) {
		console.log('\n⚠️  Some smoke tests failed. Please check the output above.');
		process.exit(1);
	} else {
		console.log('\n🎉 All smoke tests passed! Your application is ready for deployment.');
	}
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`
Kaiwa Smoke Test Runner

Usage: tsx scripts/run-smoke-tests.ts [options]

Options:
  --help, -h     Show this help message
  --local        Run only local smoke tests
  --prod         Run only production smoke tests
  --headed       Run only headed smoke tests

Examples:
  tsx scripts/run-smoke-tests.ts           # Run all smoke tests
  tsx scripts/run-smoke-tests.ts --local   # Run only local tests
  tsx scripts/run-smoke-tests.ts --prod    # Run only production tests
`);
	process.exit(0);
}

if (args.includes('--local')) {
	smokeTestConfigs.splice(1); // Keep only local tests
} else if (args.includes('--prod')) {
	smokeTestConfigs.splice(0, 2); // Keep only production tests
} else if (args.includes('--headed')) {
	smokeTestConfigs.splice(0, 2); // Keep only headed tests
}

runSmokeTests().catch((error) => {
	console.error('❌ Unexpected error:', error);
	process.exit(1);
});
