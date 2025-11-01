import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { WeeklyUpdatesParserService } from '$lib/server/services/weekly-updates-parser.service';

/**
 * GET endpoint to fetch raw markdown content of a weekly update file
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const date = url.searchParams.get('date');
		if (!date) {
			return json({ error: 'date parameter is required' }, { status: 400 });
		}

		// Parse date and construct filename
		const dateParts = date.split('-');
		if (dateParts.length !== 3) {
			return json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
		}

		const [year, month, day] = dateParts;
		const filename = `Updates-${month}-${day}-${year}.md`;
		const filePath = join(process.cwd(), 'weekly-updates', filename);

		if (!existsSync(filePath)) {
			return json({ error: 'Weekly update file not found' }, { status: 404 });
		}

		const markdown = readFileSync(filePath, 'utf-8');

		return json({
			success: true,
			date,
			filename,
			markdown
		});
	} catch (error) {
		console.error('Error getting markdown:', error);
		return json(
			{
				error: 'Failed to get markdown',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

