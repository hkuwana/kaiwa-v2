import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

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

		// In production, you might want to:
		// 1. Save to database
		// 2. Send email notification
		// 3. Post to Slack/Discord webhook
		// 4. Log to external service

		// For now, log to console in development
		console.log('📝 Feedback Received:', {
			type,
			message,
			timestamp,
			url,
			userAgent,
			receivedAt: new Date().toISOString()
		});

		// TODO: Implement actual feedback storage
		// Example: await saveFeedbackToDatabase({ type, message, timestamp, url, userAgent })

		return json({
			success: true,
			message: 'Feedback received. Thank you!',
			id: `feedback-${Date.now()}`
		});
	} catch (error) {
		console.error('Feedback API error:', error);
		return json(
			{ error: 'Failed to process feedback' },
			{ status: 500 }
		);
	}
};
