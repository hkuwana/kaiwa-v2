#!/usr/bin/env tsx
/**
 * Email System Migration Script
 *
 * Reorganizes email files from scattered structure to unified campaign-based structure.
 *
 * Usage:
 *   npx tsx scripts/migrate-email-files.ts
 *
 * What it does:
 *   1. Creates new directory structure
 *   2. Moves files (preserving git history)
 *   3. Updates imports across codebase
 *   4. Generates migration report
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Color output
const colors = {
	reset: '\x1b[0m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	red: '\x1b[31m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

// Migration mappings
const migrations = [
	// Campaigns
	{
		from: 'src/lib/server/email/email-reminder.service.ts',
		to: 'src/lib/emails/campaigns/reminders/reminder.service.ts',
		type: 'campaign'
	},
	{
		from: 'src/lib/server/email/founder-email.service.ts',
		to: 'src/lib/emails/campaigns/founder-sequence/founder.service.ts',
		type: 'campaign'
	},
	{
		from: 'src/lib/server/email/weekly-stats-email.service.ts',
		to: 'src/lib/emails/campaigns/weekly-stats/stats.service.ts',
		type: 'campaign'
	},
	{
		from: 'src/lib/server/email/product-updates-email.service.ts',
		to: 'src/lib/emails/campaigns/product-updates/update.service.ts',
		type: 'campaign'
	},
	{
		from: 'src/lib/server/email/scenario-inspiration-email.service.ts',
		to: 'src/lib/emails/campaigns/scenario-inspiration/inspiration.service.ts',
		type: 'campaign'
	},
	{
		from: 'src/lib/server/email/community-story-email.service.ts',
		to: 'src/lib/emails/campaigns/community-stories/story.service.ts',
		type: 'campaign'
	},
	{
		from: 'src/lib/server/email/progress-reports-email.service.ts',
		to: 'src/lib/emails/campaigns/progress-reports/progress.service.ts',
		type: 'campaign'
	},
	{
		from: 'src/lib/server/email/weekly-updates-email.service.ts',
		to: 'src/lib/emails/campaigns/weekly-digest/digest.service.ts',
		type: 'campaign'
	},

	// Shared utilities
	{
		from: 'src/lib/server/email/email-send-guard.service.ts',
		to: 'src/lib/emails/shared/email-guard.ts',
		type: 'shared'
	},
	{
		from: 'src/lib/server/email/email-permission.service.ts',
		to: 'src/lib/emails/shared/email-permission.ts',
		type: 'shared'
	},
	{
		from: 'src/lib/server/services/email-service.ts',
		to: 'src/lib/emails/shared/email-sender.ts',
		type: 'shared'
	}
];

// Import replacements
const importReplacements = [
	{
		from: "from '$lib/server/email/email-reminder.service'",
		to: "from '$lib/emails/campaigns/reminders/reminder.service'"
	},
	{
		from: "from '$lib/server/email/founder-email.service'",
		to: "from '$lib/emails/campaigns/founder-sequence/founder.service'"
	},
	{
		from: "from '$lib/server/email/weekly-stats-email.service'",
		to: "from '$lib/emails/campaigns/weekly-stats/stats.service'"
	},
	{
		from: "from '$lib/server/email/product-updates-email.service'",
		to: "from '$lib/emails/campaigns/product-updates/update.service'"
	},
	{
		from: "from '$lib/server/email/scenario-inspiration-email.service'",
		to: "from '$lib/emails/campaigns/scenario-inspiration/inspiration.service'"
	},
	{
		from: "from '$lib/server/email/community-story-email.service'",
		to: "from '$lib/emails/campaigns/community-stories/story.service'"
	},
	{
		from: "from '$lib/server/email/progress-reports-email.service'",
		to: "from '$lib/emails/campaigns/progress-reports/progress.service'"
	},
	{
		from: "from '$lib/server/email/weekly-updates-email.service'",
		to: "from '$lib/emails/campaigns/weekly-digest/digest.service'"
	},
	{
		from: "from '$lib/server/email/email-send-guard.service'",
		to: "from '$lib/emails/shared/email-guard'"
	},
	{
		from: "from '$lib/server/email/email-permission.service'",
		to: "from '$lib/emails/shared/email-permission'"
	},
	{
		from: "from '$lib/server/services/email-service'",
		to: "from '$lib/emails/shared/email-sender'"
	}
];

async function main() {
	log('========================================', 'blue');
	log('EMAIL SYSTEM MIGRATION', 'blue');
	log('========================================\n', 'blue');

	// Step 1: Create directory structure
	log('Step 1: Creating new directory structure...', 'yellow');

	const dirs = [
		'src/lib/emails',
		'src/lib/emails/campaigns',
		'src/lib/emails/shared',
		'src/lib/emails/templates',
		'src/lib/emails/campaigns/reminders',
		'src/lib/emails/campaigns/founder-sequence',
		'src/lib/emails/campaigns/weekly-stats',
		'src/lib/emails/campaigns/product-updates',
		'src/lib/emails/campaigns/scenario-inspiration',
		'src/lib/emails/campaigns/community-stories',
		'src/lib/emails/campaigns/progress-reports',
		'src/lib/emails/campaigns/weekly-digest'
	];

	dirs.forEach((dir) => {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
			log(`  ✓ Created ${dir}`, 'green');
		} else {
			log(`  - ${dir} already exists`, 'yellow');
		}
	});

	log('');

	// Step 2: Move files (preserve git history)
	log('Step 2: Moving files...', 'yellow');

	let movedCount = 0;
	let skippedCount = 0;

	migrations.forEach(({ from, to, type }) => {
		if (existsSync(from)) {
			try {
				// Create parent directory if needed
				const toDir = to.substring(0, to.lastIndexOf('/'));
				if (!existsSync(toDir)) {
					mkdirSync(toDir, { recursive: true });
				}

				// Use git mv to preserve history
				execSync(`git mv "${from}" "${to}"`, { stdio: 'pipe' });
				log(`  ✓ Moved ${from} → ${to}`, 'green');
				movedCount++;
			} catch (error) {
				log(`  ✗ Failed to move ${from}: ${error.message}`, 'red');
			}
		} else {
			log(`  - Skipped ${from} (doesn't exist)`, 'yellow');
			skippedCount++;
		}
	});

	log(`\n  Moved: ${movedCount} files`, 'green');
	log(`  Skipped: ${skippedCount} files\n`, 'yellow');

	// Step 3: Update imports
	log('Step 3: Updating imports across codebase...', 'yellow');

	const filesToUpdate = findTypeScriptFiles('src');
	let updatedFiles = 0;
	let totalReplacements = 0;

	filesToUpdate.forEach((file) => {
		let content = readFileSync(file, 'utf-8');
		let fileChanged = false;
		let fileReplacements = 0;

		importReplacements.forEach(({ from, to }) => {
			if (content.includes(from)) {
				content = content.replace(new RegExp(from, 'g'), to);
				fileChanged = true;
				fileReplacements++;
			}
		});

		if (fileChanged) {
			writeFileSync(file, content, 'utf-8');
			log(`  ✓ Updated ${file} (${fileReplacements} replacements)`, 'green');
			updatedFiles++;
			totalReplacements += fileReplacements;
		}
	});

	log(`\n  Updated: ${updatedFiles} files`, 'green');
	log(`  Total replacements: ${totalReplacements}\n`, 'green');

	// Step 4: Verify no old imports remain
	log('Step 4: Verifying migration...', 'yellow');

	const oldImports = execSync('grep -r "lib/server/email" src/ 2>/dev/null || true', {
		encoding: 'utf-8'
	}).trim();

	if (oldImports) {
		log('  ⚠ Warning: Found old imports still in use:', 'yellow');
		log(oldImports, 'yellow');
	} else {
		log('  ✓ No old imports found!', 'green');
	}

	log('');

	// Step 5: Generate migration report
	log('Step 5: Generating migration report...', 'yellow');

	const report = `
# Email System Migration Report
Generated: ${new Date().toISOString()}

## Summary
- Files moved: ${movedCount}
- Files skipped: ${skippedCount}
- Files updated: ${updatedFiles}
- Import replacements: ${totalReplacements}

## Migration Mappings

${migrations
	.map(
		({ from, to, type }) => `
### ${type === 'campaign' ? '📧' : '🔧'} ${from}
→ ${to}
Status: ${existsSync(to) ? '✅ Moved' : '❌ Not found'}
`
	)
	.join('\n')}

## Next Steps

1. **Test locally**:
   \`\`\`bash
   pnpm dev
   # Verify no import errors
   \`\`\`

2. **Run type check**:
   \`\`\`bash
   pnpm check
   \`\`\`

3. **Test email endpoints**:
   \`\`\`bash
   curl http://localhost:5173/api/cron/send-reminders?secret=test
   \`\`\`

4. **Commit changes**:
   \`\`\`bash
   git status
   git commit -m "Reorganize email system into campaign structure"
   \`\`\`

5. **Deploy**:
   \`\`\`bash
   git push origin main
   fly deploy
   \`\`\`

## Verification Checklist

- [ ] No TypeScript errors
- [ ] All cron endpoints work
- [ ] Email dashboard loads
- [ ] Preview functionality works
- [ ] Test send works
- [ ] GitHub Actions still trigger
`;

	writeFileSync('migration-report.md', report);
	log('  ✓ Report saved to migration-report.md\n', 'green');

	// Done!
	log('========================================', 'blue');
	log('MIGRATION COMPLETE!', 'green');
	log('========================================\n', 'blue');

	log('Next steps:', 'yellow');
	log('  1. Review migration-report.md', 'reset');
	log('  2. Run: pnpm check', 'reset');
	log('  3. Test locally: pnpm dev', 'reset');
	log('  4. Commit: git commit -m "Reorganize email system"', 'reset');
	log('  5. Deploy: fly deploy\n', 'reset');
}

// Helper: Find all TypeScript files
function findTypeScriptFiles(dir: string): string[] {
	const files: string[] = [];

	function walk(currentDir: string) {
		const entries = readdirSync(currentDir, { withFileTypes: true });

		entries.forEach((entry) => {
			const fullPath = join(currentDir, entry.name);

			if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
				walk(fullPath);
			} else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.svelte'))) {
				files.push(fullPath);
			}
		});
	}

	walk(dir);
	return files;
}

// Run migration
main().catch((error) => {
	log(`\n✗ Migration failed: ${error.message}`, 'red');
	process.exit(1);
});
