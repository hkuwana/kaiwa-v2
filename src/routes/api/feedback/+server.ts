import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { feedback } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const { type, message, timestamp, url, userAgent } = body;

		// Validate input
		if (!type || !message || !timestamp) {
			return json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// Get user ID from session if available
		const userId = locals.user?.id ?? null;

		// Save feedback to database
		const [savedFeedback] = await db
			.insert(feedback)
			.values({
				userId,
				type,
				message,
				timestamp,
				url,
				userAgent
			})
			.returning();

		// Log to console for development visibility
		console.log('📝 Feedback Saved:', {
			id: savedFeedback.id,
			type,
			userId: userId || 'anonymous',
			url,
			receivedAt: new Date().toISOString()
		});

		return json({
			success: true,
			message: 'Feedback received. Thank you!',
			id: savedFeedback.id
		});
	} catch (error) {
		console.error('Feedback API error:', error);
		return json(
			{ error: 'Failed to process feedback' },
			{ status: 500 }
		);
	}
};
