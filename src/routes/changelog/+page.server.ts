import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ChangelogEntry {
	date: string;
	version?: string;
	title: string;
	description: string;
	commits: Array<{
		hash: string;
		message: string;
		date: string;
	}>;
	type: 'feature' | 'improvement' | 'fix' | 'update';
}

// Curated changelog entries for user-facing changes
const curatedChangelog: ChangelogEntry[] = [
	{
		date: '2024-11-27',
		title: 'Learning Paths Playground Enhancement',
		description:
			'Added rich user context textarea for detailed learner profiles, making it easier to create personalized learning paths.',
		commits: [],
		type: 'feature'
	},
	{
		date: '2024-11-16',
		title: 'About Page Refresh',
		description:
			'Updated about page copy, improved theme switcher, and refreshed icons for a cleaner look.',
		commits: [],
		type: 'improvement'
	},
	{
		date: '2024-11-15',
		title: 'Personalized Learning Paths',
		description:
			'Introduced personalized learning paths with custom scenarios tailored to your specific goals and situations.',
		commits: [],
		type: 'feature'
	}
];

export async function load() {
	let recentCommits: Array<{ hash: string; message: string; date: string; author: string }> = [];

	try {
		// Get recent commits (last 20) with user-facing changes
		const { stdout } = await execAsync(
			'git log --pretty=format:"%h|%s|%ad|%an" --date=short -20 2>/dev/null || echo ""',
			{ cwd: process.cwd() }
		);

		if (stdout.trim()) {
			recentCommits = stdout
				.trim()
				.split('\n')
				.filter((line) => line.includes('|'))
				.map((line) => {
					const [hash, message, date, author] = line.split('|');
					return { hash, message, date, author };
				})
				// Filter to only show user-facing commits (feat, fix, improve, update)
				.filter(
					(commit) =>
						commit.message.startsWith('feat') ||
						commit.message.startsWith('fix') ||
						commit.message.startsWith('improve') ||
						commit.message.startsWith('update') ||
						commit.message.startsWith('add')
				);
		}
	} catch {
		// Git not available or not a git repo, that's fine
		console.log('Could not fetch git commits for changelog');
	}

	return {
		changelog: curatedChangelog,
		recentCommits
	};
}
