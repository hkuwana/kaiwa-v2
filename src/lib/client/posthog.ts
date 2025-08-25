import { posthog, track } from '$lib/analytics/posthog';

export const posthogManager = {
	trackEvent(eventName: string, properties?: Record<string, unknown>) {
		track(eventName, properties);
	}
};

