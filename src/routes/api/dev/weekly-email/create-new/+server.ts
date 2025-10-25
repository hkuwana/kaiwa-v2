import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const POST: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is logged in
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Run the update current weekly update script
		const { stdout, stderr } = await execAsync('pnpm run update-current-weekly-update', {
			cwd: process.cwd()
		});

		if (stderr) {
			console.error('Script stderr:', stderr);
		}

		// Extract filename from stdout
		const filenameMatch = stdout.match(
			/Updated weekly update file: (Updates-\d{2}-\d{2}-\d{4}\.md)/
		);
		const filename = filenameMatch
			? filenameMatch[1]
			: 'Updates-' +
				new Date().toISOString().slice(5, 10).replace('-', '-') +
				'-' +
				new Date().getFullYear() +
				'.md';

		return json({
			success: true,
			filename,
			filePath: `weekly-updates/${filename}`,
			message: 'Weekly update file updated successfully'
		});
	} catch (error) {
		console.error('Error creating weekly update:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
