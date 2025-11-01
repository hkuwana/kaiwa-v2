#!/usr/bin/env tsx

/**
 * Generate weekly update from git commits
 *
 * This script analyzes git commits from the past week and generates
 * a user-friendly weekly update markdown file automatically.
 *
 * Usage:
 *   pnpm run generate-weekly-update-from-git
 *   pnpm run generate-weekly-update-from-git -- --since 2025-01-20
 *   pnpm run generate-weekly-update-from-git -- --dry-run
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

interface FeatureGroup {
	title: string;
	commits: GitCommit[];
	description: string;
	link?: {
		url: string;
		label: string;
	};
	importance: 'major' | 'minor' | 'internal';
}

function parseArgs(): { since?: string; dryRun?: boolean } {
	const args = process.argv.slice(2);
	const options: { since?: string; dryRun?: boolean } = {};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--since' && i + 1 < args.length) {
			options.since = args[i + 1];
			i++;
		} else if (args[i] === '--dry-run') {
			options.dryRun = true;
		}
	}

	return options;
}

function getDateRange(since?: string): { start: Date; end: Date; sinceStr: string } {
	const end = new Date();
	end.setHours(23, 59, 59, 999);

	let start: Date;
	let sinceStr: string;

	if (since) {
		start = new Date(since);
		sinceStr = since;
	} else {
		// Default to 7 days ago
		start = new Date();
		start.setDate(start.getDate() - 7);
		start.setHours(0, 0, 0, 0);
		sinceStr = start.toISOString().split('T')[0];
	}

	return { start, end, sinceStr };
}

async function getGitCommits(since: string): Promise<GitCommit[]> {
	try {
		const { stdout } = await execAsync(
			`git log --since="${since}" --pretty=format:"%H|%ad|%s" --name-only --date=short`
		);

		const commits: GitCommit[] = [];
		const lines = stdout.trim().split('\n');

		let currentCommit: Partial<GitCommit> = {};

		for (const line of lines) {
			if (line.includes('|')) {
				if (currentCommit.hash) {
					commits.push(currentCommit as GitCommit);
				}

				const [hash, date, message] = line.split('|');
				currentCommit = {
					hash: hash.substring(0, 8),
					date,
					message,
					files: []
				};
			} else if (line.trim() && currentCommit.hash) {
				currentCommit.files = currentCommit.files || [];
				currentCommit.files.push(line.trim());
			}
		}

		if (currentCommit.hash) {
			commits.push(currentCommit as GitCommit);
		}

		return commits;
	} catch (error) {
		console.error('Error getting git commits:', error);
		return [];
	}
}

/**
 * Determine the importance of a commit based on message and files
 */
function getCommitImportance(commit: GitCommit): 'major' | 'minor' | 'internal' {
	const message = commit.message.toLowerCase();
	const files = commit.files.join(' ').toLowerCase();

	// Skip internal/technical commits
	if (
		message.includes('refactor') ||
		message.includes('chore') ||
		message.includes('docs') ||
		message.includes('test') ||
		message.includes('ci') ||
		message.includes('config') ||
		message.includes('format') ||
		message.includes('lint') ||
		files.includes('test') ||
		files.includes('.github') ||
		files.includes('scripts/') ||
		files.includes('drizzle/') ||
		files.includes('package.json') ||
		files.includes('tsconfig') ||
		files.includes('eslint')
	) {
		return 'internal';
	}

	// Major features
	if (
		message.includes('feat') ||
		message.includes('feature') ||
		message.includes('add') ||
		message.includes('new') ||
		message.includes('implement') ||
		files.includes('routes/') ||
		files.includes('components/')
	) {
		return 'major';
	}

	// Minor improvements/fixes
	return 'minor';
}

/**
 * Generate a user-friendly title and description from commit message
 */
function makeUserFriendly(commit: GitCommit): { title: string; description: string } {
	let message = commit.message;

	// Remove common prefixes
	message = message
		.replace(/^(feat|feature|add|fix|update|improve|enhance|refactor|chore|docs):\s*/i, '')
		.trim();

	// Capitalize first letter
	message = message.charAt(0).toUpperCase() + message.slice(1);

	// Split into title and description
	const colonIndex = message.indexOf(':');
	let title: string;
	let description: string;

	if (colonIndex > 0 && colonIndex < 60) {
		title = message.substring(0, colonIndex).trim();
		description = message.substring(colonIndex + 1).trim();
	} else {
		title = message.length > 60 ? message.substring(0, 57) + '...' : message;
		description = '';
	}

	// Make descriptions more casual
	description = description
		.replace(/implemented/i, 'built')
		.replace(/fixed/i, 'fixed')
		.replace(/added/i, 'added')
		.replace(/updated/i, 'updated')
		.replace(/improved/i, 'improved')
		.replace(/enhanced/i, 'enhanced')
		.replace(/created/i, 'created')
		.replace(/removed/i, 'removed');

	return { title, description };
}

/**
 * Detect relevant links based on files changed
 */
function detectLink(commits: GitCommit[]): { url: string; label: string } | undefined {
	const allFiles = commits.flatMap((c) => c.files);
	const message = commits
		.map((c) => c.message)
		.join(' ')
		.toLowerCase();

	// Check for scenario-related changes
	if (message.includes('scenario') || allFiles.some((f) => f.includes('scenario'))) {
		// Try to extract scenario ID from commits
		const scenarioMatch =
			message.match(/scenario[:\s]+(\w+)/i) ||
			allFiles.find((f) => f.match(/scenario[/-]?(\w+)\./i));

		if (scenarioMatch) {
			const scenarioId = scenarioMatch[1];
			return {
				url: `https://trykaiwa.com/?scenario=${scenarioId}`,
				label: 'Try it out'
			};
		}
		return {
			url: 'https://trykaiwa.com',
			label: 'Try it out'
		};
	}

	// Check for conversation-related changes
	if (message.includes('conversation') || allFiles.some((f) => f.includes('conversation'))) {
		return {
			url: 'https://trykaiwa.com/conversation',
			label: 'Start a conversation'
		};
	}

	// Check for analysis-related changes
	if (message.includes('analysis') || allFiles.some((f) => f.includes('analysis'))) {
		return {
			url: 'https://trykaiwa.com/analysis',
			label: 'View your analysis'
		};
	}

	// Check for email/cron related (probably not user-facing)
	if (message.includes('email') || message.includes('cron') || message.includes('digest')) {
		return undefined; // Don't link internal features
	}

	// Default to homepage for other features
	if (allFiles.some((f) => f.includes('routes/') || f.includes('components/'))) {
		return {
			url: 'https://trykaiwa.com',
			label: 'Try it out'
		};
	}

	return undefined;
}

/**
 * Group related commits into features
 */
function groupCommitsIntoFeatures(commits: GitCommit[]): FeatureGroup[] {
	const groups: FeatureGroup[] = [];
	const processed = new Set<string>();

	// Only process major and minor commits (skip internal)
	const relevantCommits = commits.filter((c) => getCommitImportance(c) !== 'internal');

	for (const commit of relevantCommits) {
		if (processed.has(commit.hash)) continue;

		const importance = getCommitImportance(commit);
		const { title, description } = makeUserFriendly(commit);
		const relatedCommits = [commit];

		// Find related commits (similar messages or files)
		for (const other of relevantCommits) {
			if (other.hash === commit.hash || processed.has(other.hash)) continue;

			const similarity = calculateSimilarity(commit, other);
			if (similarity > 0.3) {
				relatedCommits.push(other);
				processed.add(other.hash);
			}
		}

		processed.add(commit.hash);

		const link = detectLink(relatedCommits);

		groups.push({
			title,
			commits: relatedCommits,
			description: description || 'New feature or improvement',
			link,
			importance
		});
	}

	return groups.sort((a, b) => {
		// Sort by importance (major first) then by number of commits
		if (a.importance !== b.importance) {
			if (a.importance === 'major') return -1;
			if (b.importance === 'major') return 1;
		}
		return b.commits.length - a.commits.length;
	});
}

/**
 * Calculate similarity between two commits
 */
function calculateSimilarity(commit1: GitCommit, commit2: GitCommit): number {
	const msg1 = commit1.message.toLowerCase();
	const msg2 = commit2.message.toLowerCase();
	const files1 = new Set(commit1.files.map((f) => f.split('/')[0]));
	const files2 = new Set(commit2.files.map((f) => f.split('/')[0]));

	let similarity = 0;

	// Check message similarity (simple word overlap)
	const words1 = new Set(msg1.split(/\s+/));
	const words2 = new Set(msg2.split(/\s+/));
	const commonWords = [...words1].filter((w) => words2.has(w) && w.length > 3);
	similarity += (commonWords.length / Math.max(words1.size, words2.size)) * 0.5;

	// Check file similarity
	const commonFiles = [...files1].filter((f) => files2.has(f));
	similarity += (commonFiles.length / Math.max(files1.size, files2.size)) * 0.5;

	return similarity;
}

/**
 * Generate markdown from feature groups
 */
function generateMarkdown(groups: FeatureGroup[], date: string, totalCommits: number): string {
	const dateStr = new Date(date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	let markdown = `# Week of ${dateStr}\n\n`;

	// Major features go in "What Shipped"
	const majorFeatures = groups.filter((g) => g.importance === 'major').slice(0, 4);
	const minorFeatures = groups.filter((g) => g.importance === 'minor').slice(0, 2);

	if (majorFeatures.length > 0) {
		markdown += `## What Shipped\n\n`;
		for (const feature of majorFeatures) {
			markdown += `- **${feature.title}**`;
			if (feature.description) {
				markdown += `: ${feature.description}`;
			}
			if (feature.link) {
				markdown += ` [${feature.link.label}](${feature.link.url})`;
			}
			markdown += `\n`;
		}
		markdown += `\n`;
	}

	if (minorFeatures.length > 0) {
		markdown += `## Highlights\n\n`;
		for (const feature of minorFeatures) {
			markdown += `- **${feature.title}**`;
			if (feature.description) {
				markdown += `: ${feature.description}`;
			}
			markdown += `\n`;
		}
		markdown += `\n`;
	}

	// Add coming up next placeholder
	markdown += `## Coming Up Next\n\n`;
	markdown += `- **More improvements**: Continuing to build features that help you practice with confidence\n\n`;

	// Notes section
	markdown += `## Notes\n\n`;
	markdown += `Generated from ${totalCommits} commits this week. `;
	if (majorFeatures.length > 0) {
		markdown += `Focusing on ${majorFeatures.length} major update${majorFeatures.length > 1 ? 's' : ''}.\n`;
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

		console.log(`📊 Found ${commits.length} commits`);

		const groups = groupCommitsIntoFeatures(commits);
		const majorFeatures = groups.filter((g) => g.importance === 'major');
		const minorFeatures = groups.filter((g) => g.importance === 'minor');
		const internalCommits = commits.filter((c) => getCommitImportance(c) === 'internal');

		console.log(`\n📦 Grouped into ${groups.length} features:`);
		console.log(`   ✨ Major: ${majorFeatures.length}`);
		console.log(`   🔧 Minor: ${minorFeatures.length}`);
		console.log(`   🔒 Internal/Skipped: ${internalCommits.length}\n`);

		const markdown = generateMarkdown(groups, end.toISOString().split('T')[0], commits.length);

		if (options.dryRun) {
			console.log('📝 Generated markdown (dry run):\n');
			console.log(markdown);
			return;
		}

		// Generate filename for Sunday (end of week)
		const month = String(end.getMonth() + 1).padStart(2, '0');
		const day = String(end.getDate()).padStart(2, '0');
		const year = end.getFullYear();
		const filename = `Updates-${month}-${day}-${year}.md`;
		const filePath = join(process.cwd(), 'weekly-updates', filename);

		// Check if file already exists
		if (existsSync(filePath)) {
			console.log(`⚠️  File already exists: ${filename}`);
			console.log('   Use a different date or delete the existing file first.');
			console.log(`   Location: ${filePath}\n`);
			return;
		}

		// Write the file
		writeFileSync(filePath, markdown);

		const dateStr = end.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

		console.log(`✅ Generated weekly update file: ${filename}`);
		console.log(`📁 Location: ${filePath}`);
		console.log(`📅 Date: ${dateStr}`);
		console.log('\n📝 Next steps:');
		console.log('1. Review and edit the generated file to add personal touches');
		console.log('2. Add any manual items you want to highlight');
		console.log('3. Preview at /dev/weekly-email or send directly via GitHub Actions');
		console.log('\n💡 Tip: Edit the file to make it more personal and add any context!');
	} catch (error) {
		console.error('❌ Error generating weekly update from git:', error);
		process.exit(1);
	}
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	generateWeeklyUpdateFromGit();
}
