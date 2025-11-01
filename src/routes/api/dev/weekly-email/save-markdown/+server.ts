import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * POST endpoint to save markdown content to a weekly update file
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { date, markdown } = await request.json();

		if (!date || !markdown) {
			return json({ error: 'date and markdown are required' }, { status: 400 });
		}

		// Parse date and construct filename
		const dateParts = date.split('-');
		if (dateParts.length !== 3) {
			return json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
		}

		const [year, month, day] = dateParts;
		const filename = `Updates-${month}-${day}-${year}.md`;
		const filePath = join(process.cwd(), 'weekly-updates', filename);

		// Check if directory exists (should always exist, but safety check)
		const dir = join(process.cwd(), 'weekly-updates');
		if (!existsSync(dir)) {
			return json({ error: 'Weekly updates directory not found' }, { status: 500 });
		}

		// Write the file
		writeFileSync(filePath, markdown, 'utf-8');

		console.log(`✅ Saved weekly update file: ${filename}`);

		return json({
			success: true,
			date,
			filename,
			message: 'Markdown saved successfully'
		});
	} catch (error) {
		console.error('Error saving markdown:', error);
		return json(
			{
				error: 'Failed to save markdown',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

