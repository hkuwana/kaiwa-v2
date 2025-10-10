import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyticsEventsRepository } from '$lib/server/repositories/analytics-events.repository';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { sessionId, reason, comment } = await request.json();

		if (!sessionId || !reason) {
			return error(400, 'Missing required fields');
		}

		// Save to analytics_events table
		await analyticsEventsRepository.createAnalyticsEvent({
			userId: locals.user?.id || null,
			sessionId,
			eventName: 'exit_survey_submitted',
			properties: {
				reason,
				comment: comment || null
			},
			createdAt: new Date()
		});

		return json({ success: true });
	} catch (err) {
		console.error('Error saving exit survey:', err);
		return error(500, 'Failed to save survey');
	}
};
