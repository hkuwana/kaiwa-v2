import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdirSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export const POST: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		// Run the generate script
		const { stdout, stderr } = await execAsync('pnpm run generate-weekly-update-from-git', {
			cwd: process.cwd()
		});

		if (stderr && !stdout.includes('Generated weekly update file')) {
			console.error('Script stderr:', stderr);
		}

		// Extract filename from stdout
		const filenameMatch = stdout.match(
			/Generated weekly update file: (Updates-\d{2}-\d{2}-\d{4}\.md)/
		);
		if (!filenameMatch) {
			// Check if it says file already exists
			const existsMatch = stdout.match(/File already exists: (Updates-\d{2}-\d{2}-\d{4}\.md)/);
			if (existsMatch) {
				return json({
					success: false,
					error:
						'Weekly update file already exists for this week. Please edit the existing file instead.',
					filename: existsMatch[1]
				});
			}

			return json({
				success: false,
				error: 'Could not determine generated filename. Check the script output.',
				stdout
			});
		}

		const filename = filenameMatch[1];

		// Extract stats from stdout
		const commitsMatch = stdout.match(/Found (\d+) commits/);
		const majorMatch = stdout.match(/Major: (\d+)/);
		const minorMatch = stdout.match(/Minor: (\d+)/);

		// Extract date from filename (Updates-MM-DD-YYYY.md)
		const dateMatch = filename.match(/Updates-(\d{2})-(\d{2})-(\d{4})\.md/);
		let date = '';
		if (dateMatch) {
			const [, month, day, year] = dateMatch;
			date = `${year}-${month}-${day}`;
		}

		return json({
			success: true,
			filename,
			date,
			commits: commitsMatch ? parseInt(commitsMatch[1]) : 0,
			majorFeatures: majorMatch ? parseInt(majorMatch[1]) : 0,
			minorFeatures: minorMatch ? parseInt(minorMatch[1]) : 0,
			message: 'Weekly update generated successfully'
		});
	} catch (error) {
		console.error('Error generating from git:', error);

		// Check if it's because no commits found
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		if (errorMessage.includes('No commits found')) {
			return json({
				success: false,
				error: 'No commits found in the past 7 days. Make some changes first!'
			});
		}

		return json(
			{
				success: false,
				error: 'Failed to generate weekly update',
				details: errorMessage
			},
			{ status: 500 }
		);
	}
};
