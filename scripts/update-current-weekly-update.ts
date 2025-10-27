#!/usr/bin/env tsx

/**
 * Update the current weekly update file
 *
 * This script updates the "current" weekly update file with the latest
 * git commits, so you can always edit and send the most recent version.
 *
 * Usage:
 *   pnpm run update-current-weekly-update
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

interface GitCommit {
	hash: string;
	date: string;
	message: string;
	files: string[];
}

function getCurrentWeekDate(): string {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	const year = now.getFullYear();
	return `${month}-${day}-${year}`;
}

function getCurrentWeekFilename(): string {
	const dateStr = getCurrentWeekDate();
	return `Updates-${dateStr}.md`;
}

function getCurrentWeekFilePath(): string {
	return join(process.cwd(), 'weekly-updates', getCurrentWeekFilename());
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

function generateUpdateFromCommits(commits: GitCommit[], date: string): string {
	const { features, fixes, improvements } = categorizeCommits(commits);

	const dateStr = new Date(date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	let markdown = `# Week of ${dateStr}\n\n`;

	// What Shipped section
	if (features.length > 0) {
		markdown += `## What Shipped\n`;
		for (const commit of features.slice(0, 4)) {
			// Limit to top 4
			const title = commit.message
				.replace(/^(feat|feature|add):\s*/i, '')
				.replace(/^./, (c) => c.toUpperCase());
			markdown += `- **${title}**: Implemented in commit ${commit.hash}\n`;
		}
		markdown += `\n`;
	}

	// Highlights section
	const highlights = [...fixes, ...improvements].slice(0, 4);
	if (highlights.length > 0) {
		markdown += `## Highlights\n`;
		for (const commit of highlights) {
			const title = commit.message
				.replace(/^(fix|bug|improve|optimize|enhance|update):\s*/i, '')
				.replace(/^./, (c) => c.toUpperCase());
			markdown += `- **${title}**: ${commit.message.includes('fix') ? 'Fixed' : 'Improved'} in commit ${commit.hash}\n`;
		}
		markdown += `\n`;
	}

	// Coming Up Next section
	markdown += `## Coming Up Next\n`;
	markdown += `- **Continued development**: Working on the next set of features and improvements\n`;
	markdown += `- **User feedback integration**: Implementing suggestions from our community\n`;
	markdown += `\n`;

	// Notes section
	markdown += `## Notes\n`;
	markdown += `Generated automatically from ${commits.length} commits this week. `;
	markdown += `You can edit this file and use the dev interface at /dev/weekly-email to preview and send.\n`;

	return markdown;
}

async function updateCurrentWeeklyUpdate(): Promise<void> {
	try {
		const filename = getCurrentWeekFilename();
		const filePath = getCurrentWeekFilePath();

		console.log('🔄 Updating current weekly update...');
		console.log(`📁 File: ${filename}`);

		// Get commits from the past 7 days
		const since = new Date();
		since.setDate(since.getDate() - 7);
		const sinceStr = since.toISOString().split('T')[0];

		console.log(`🔍 Analyzing commits since: ${sinceStr}`);

		const commits = await getGitCommits(sinceStr);

		if (commits.length === 0) {
			console.log('⚠️  No commits found in the past 7 days.');
			console.log('   Creating a template file instead...');

			// Create a basic template
			const dateStr = new Date().toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});

			const template = `# Week of ${dateStr}

## What Shipped
- **Your updates here**: Describe what you shipped this week

## Highlights
- **Improvements**: Any improvements or optimizations

## Coming Up Next
- **Next features**: What you're working on next

## Notes
Edit this file and use the dev interface at /dev/weekly-email to preview and send.
`;

			writeFileSync(filePath, template);
			console.log(`✅ Created template file: ${filename}`);
			return;
		}

		console.log(`📊 Found ${commits.length} commits:`);
		const { features, fixes, improvements, other } = categorizeCommits(commits);
		console.log(`   Features: ${features.length}`);
		console.log(`   Fixes: ${fixes.length}`);
		console.log(`   Improvements: ${improvements.length}`);
		console.log(`   Other: ${other.length}\n`);

		// Generate the update
		const currentDate = new Date().toISOString().split('T')[0];
		const markdown = generateUpdateFromCommits(commits, currentDate);

		// Write the file (overwrite if exists)
		writeFileSync(filePath, markdown);

		console.log(`✅ Updated weekly update file: ${filename}`);
		console.log(`📁 Location: ${filePath}`);
		console.log('\n📝 Next steps:');
		console.log('1. Edit the file if needed');
		console.log('2. Preview and send via: /dev/weekly-email');
		console.log('3. Or send directly: pnpm run send-weekly-product-updates');
	} catch (error) {
		console.error('❌ Error updating current weekly update:', error);
		process.exit(1);
	}
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	updateCurrentWeeklyUpdate();
}
