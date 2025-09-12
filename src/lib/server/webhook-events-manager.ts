// 🔗 Webhook Events Manager
// In-memory storage for webhook events (dev only)

import { dev } from '$app/environment';

// In-memory storage for webhook events (dev only)
// In production, this would come from a database or logging service
let webhookEvents: any[] = [];

export function addWebhookEvent(event: any) {
	if (!dev) return; // Only store in development
	
	webhookEvents.push({
		id: event.id,
		type: event.type,
		created: event.created,
		data: event.data,
		object: event.object
	});

	// Keep only the last 100 events
	if (webhookEvents.length > 100) {
		webhookEvents = webhookEvents.slice(-100);
	}
}

export function getWebhookEvents(): any[] {
	// Return the most recent 50 events, sorted by timestamp
	return webhookEvents
		.sort((a, b) => b.created - a.created)
		.slice(0, 50);
}

export function addManualWebhookEvent(eventData: any) {
	if (!dev) return; // Only store in development
	
	// Add event to in-memory storage
	const event = {
		id: `evt_${Date.now()}`,
		type: eventData.type || 'manual.test',
		created: Math.floor(Date.now() / 1000),
		data: eventData.data || {},
		object: 'event'
	};

	addWebhookEvent(event);
	return event;
}