#!/usr/bin/env tsx

/**
 * Generate weekly update from git commits
 *
 * This script analyzes git commits from the past week and generates
 * a weekly update markdown file automatically.
 *
 * Usage:
 *   pnpm run generate-weekly-update-from-git
 *   pnpm run generate-weekly-update-from-git -- --since 2025-01-20
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

interface GitCommit {
	hash: string;
	date: string;
	message: string;
	files: string[];
}

interface WeeklyUpdateData {
	date: string;
	updates: Array<{
		title: string;
		summary: string;
		linkLabel?: string;
		linkUrl?: string;
	}>;
	highlights: Array<{
		title: string;
		summary: string;
	}>;
	upcoming: Array<{
		title: string;
		summary: string;
	}>;
	notes?: string;
}

function parseArgs(): { since?: string; dryRun?: boolean } {
	const args = process.argv.slice(2);
	const options: { since?: string; dryRun?: boolean } = {};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--since' && i + 1 < args.length) {
			options.since = args[i + 1];
			i++; // Skip next argument
		} else if (args[i] === '--dry-run') {
			options.dryRun = true;
		}
	}

	return options;
}

function getDateRange(since?: string): { start: Date; end: Date; sinceStr: string } {
	const end = new Date();
	end.setHours(23, 59, 59, 999); // End of today

	let start: Date;
	let sinceStr: string;

	if (since) {
		start = new Date(since);
		sinceStr = since;
	} else {
		// Default to 7 days ago
		start = new Date();
		start.setDate(start.getDate() - 7);
		start.setHours(0, 0, 0, 0); // Start of day
		sinceStr = start.toISOString().split('T')[0];
	}

	return { start, end, sinceStr };
}

async function getGitCommits(since: string): Promise<GitCommit[]> {
	try {
		// Get commits with file changes
		const { stdout } = await execAsync(
			`git log --since="${since}" --pretty=format:"%H|%ad|%s" --name-only --date=short`
		);

		const commits: GitCommit[] = [];
		const lines = stdout.trim().split('\n');

		let currentCommit: Partial<GitCommit> = {};

		for (const line of lines) {
			if (line.includes('|')) {
				// Save previous commit if exists
				if (currentCommit.hash) {
					commits.push(currentCommit as GitCommit);
				}

				// Parse new commit
				const [hash, date, message] = line.split('|');
				currentCommit = {
					hash: hash.substring(0, 8), // Short hash
					date,
					message,
					files: []
				};
			} else if (line.trim() && currentCommit.hash) {
				// Add file to current commit
				currentCommit.files = currentCommit.files || [];
				currentCommit.files.push(line.trim());
			}
		}

		// Add the last commit
		if (currentCommit.hash) {
			commits.push(currentCommit as GitCommit);
		}

		return commits;
	} catch (error) {
		console.error('Error getting git commits:', error);
		return [];
	}
}

function categorizeCommits(commits: GitCommit[]): {
	features: GitCommit[];
	fixes: GitCommit[];
	improvements: GitCommit[];
	other: GitCommit[];
} {
	const features: GitCommit[] = [];
	const fixes: GitCommit[] = [];
	const improvements: GitCommit[] = [];
	const other: GitCommit[] = [];

	for (const commit of commits) {
		const message = commit.message.toLowerCase();

		if (message.includes('feat') || message.includes('feature') || message.includes('add')) {
			features.push(commit);
		} else if (message.includes('fix') || message.includes('bug') || message.includes('error')) {
			fixes.push(commit);
		} else if (
			message.includes('improve') ||
			message.includes('optimize') ||
			message.includes('enhance') ||
			message.includes('update')
		) {
			improvements.push(commit);
		} else {
			other.push(commit);
		}
	}

	return { features, fixes, improvements, other };
}

function generateUpdateFromCommits(commits: GitCommit[], date: string): WeeklyUpdateData {
	const { features, fixes, improvements } = categorizeCommits(commits);

	const updates: Array<{ title: string; summary: string; linkLabel?: string; linkUrl?: string }> =
		[];
	const highlights: Array<{ title: string; summary: string }> = [];
	const upcoming: Array<{ title: string; summary: string }> = [];

	// Process features as main updates
	for (const commit of features.slice(0, 3)) {
		// Limit to top 3
		const title = commit.message
			.replace(/^(feat|feature|add):\s*/i, '')
			.replace(/^./, (c) => c.toUpperCase());
		updates.push({
			title,
			summary: `Implemented in commit ${commit.hash}.`,
			linkLabel: 'View commit',
			linkUrl: `https://github.com/your-repo/commit/${commit.hash}`
		});
	}

	// Process fixes as highlights
	for (const commit of fixes.slice(0, 2)) {
		// Limit to top 2
		const title = commit.message
			.replace(/^(fix|bug):\s*/i, '')
			.replace(/^./, (c) => c.toUpperCase());
		highlights.push({
			title,
			summary: `Fixed in commit ${commit.hash}.`
		});
	}

	// Process improvements as highlights
	for (const commit of improvements.slice(0, 2)) {
		// Limit to top 2
		const title = commit.message
			.replace(/^(improve|optimize|enhance|update):\s*/i, '')
			.replace(/^./, (c) => c.toUpperCase());
		highlights.push({
			title,
			summary: `Improved in commit ${commit.hash}.`
		});
	}

	// Add some upcoming items (you can customize this)
	upcoming.push({
		title: 'Continued development',
		summary: 'Working on the next set of features and improvements.'
	});

	const notes = `Generated automatically from ${commits.length} commits this week.`;

	return {
		date,
		updates,
		highlights,
		upcoming,
		notes
	};
}

function generateMarkdown(updateData: WeeklyUpdateData): string {
	const dateStr = new Date(updateData.date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	let markdown = `# Week of ${dateStr}\n\n`;

	if (updateData.updates.length > 0) {
		markdown += `## What Shipped\n`;
		for (const update of updateData.updates) {
			markdown += `- **${update.title}**: ${update.summary}`;
			if (update.linkUrl) {
				markdown += ` [${update.linkLabel || 'View'}](${update.linkUrl})`;
			}
			markdown += `\n`;
		}
		markdown += `\n`;
	}

	if (updateData.highlights.length > 0) {
		markdown += `## Highlights\n`;
		for (const highlight of updateData.highlights) {
			markdown += `- **${highlight.title}**: ${highlight.summary}\n`;
		}
		markdown += `\n`;
	}

	if (updateData.upcoming.length > 0) {
		markdown += `## Coming Up Next\n`;
		for (const upcoming of updateData.upcoming) {
			markdown += `- **${upcoming.title}**: ${upcoming.summary}\n`;
		}
		markdown += `\n`;
	}

	if (updateData.notes) {
		markdown += `## Notes\n${updateData.notes}\n`;
	}

	return markdown;
}

async function generateWeeklyUpdateFromGit(): Promise<void> {
	try {
		const options = parseArgs();
		const { start, end, sinceStr } = getDateRange(options.since);

		console.log('🔍 Analyzing git commits...');
		console.log(`📅 Date range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
		console.log(`🔍 Since: ${sinceStr}\n`);

		const commits = await getGitCommits(sinceStr);

		if (commits.length === 0) {
			console.log('⚠️  No commits found in the specified date range.');
			return;
		}

		console.log(`📊 Found ${commits.length} commits:`);
		const { features, fixes, improvements, other } = categorizeCommits(commits);
		console.log(`   Features: ${features.length}`);
		console.log(`   Fixes: ${fixes.length}`);
		console.log(`   Improvements: ${improvements.length}`);
		console.log(`   Other: ${other.length}\n`);

		const updateData = generateUpdateFromCommits(commits, end.toISOString().split('T')[0]);
		const markdown = generateMarkdown(updateData);

		if (options.dryRun) {
			console.log('📝 Generated markdown (dry run):\n');
			console.log(markdown);
			return;
		}

		// Generate filename
		const month = String(end.getMonth() + 1).padStart(2, '0');
		const day = String(end.getDate()).padStart(2, '0');
		const year = end.getFullYear();
		const filename = `Updates-${month}-${day}-${year}.md`;
		const filePath = join(process.cwd(), 'weekly-updates', filename);

		// Check if file already exists
		if (existsSync(filePath)) {
			console.log(`⚠️  File already exists: ${filename}`);
			console.log('   Use a different date or delete the existing file first.');
			return;
		}

		// Write the file
		writeFileSync(filePath, markdown);

		console.log(`✅ Generated weekly update file: ${filename}`);
		console.log(`📁 Location: ${filePath}`);
		console.log(`📅 Date: ${dateStr}`);
		console.log('\n📝 Next steps:');
		console.log('1. Review and edit the generated file if needed');
		console.log('2. Use the dev interface to preview and send: /dev/weekly-email');
		console.log('3. Or send directly: pnpm run send-weekly-product-updates');
	} catch (error) {
		console.error('❌ Error generating weekly update from git:', error);
		process.exit(1);
	}
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	generateWeeklyUpdateFromGit();
}
