import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { analyticsEvents } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { sessionId, reason, comment } = await request.json();

		if (!sessionId || !reason) {
			return error(400, 'Missing required fields');
		}

		// Save to analytics_events table
		await db.insert(analyticsEvents).values({
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
