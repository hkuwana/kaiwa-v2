// 🔗 Dev Webhook Events API
// Returns recent webhook events for development monitoring

import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getWebhookEvents, addManualWebhookEvent } from '$lib/server/webhook-events-manager';

export const GET = async () => {
	// Only allow in development
	if (!dev) {
		return json({ error: 'Not available in production' }, { status: 403 });
	}

	try {
		const recentEvents = getWebhookEvents();
		return json(recentEvents);
	} catch (error) {
		console.error('Error fetching webhook events:', error);
		return json(
			{
				error: 'Failed to fetch webhook events',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

export const POST = async ({ request }) => {
	// Only allow in development
	if (!dev) {
		return json({ error: 'Not available in production' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const event = addManualWebhookEvent(body);

		return json({ success: true, event });
	} catch (error) {
		console.error('Error storing webhook event:', error);
		return json(
			{
				error: 'Failed to store webhook event',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
