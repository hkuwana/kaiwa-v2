import { logger } from '$lib/server/logger';
import { json } from '@sveltejs/kit';

// Simple test endpoint to verify analysis limits are working
export const POST = async ({ request }) => {
	try {
		const { userId, analysisType = 'basic' } = await request.json();

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Test the check-usage endpoint
		const checkResponse = await fetch(`${request.url.replace('/test-limits', '/check-usage')}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, analysisType })
		});

		const checkResult = await checkResponse.json();

		// If allowed, test recording usage
		let recordResult = null;
		if (checkResult.allowed) {
			const recordResponse = await fetch(
				`${request.url.replace('/test-limits', '/record-usage')}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId, analysisType })
				}
			);
			recordResult = await recordResponse.json();
		}

		return json({
			userId,
			analysisType,
			checkResult,
			recordResult,
			testStatus: 'completed'
		});
	} catch (error) {
		logger.error('Test error:', error);
		return json(
			{ error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
