import { PostHog } from 'posthog-node';
import { env } from '$env/dynamic/private';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';

// PostHog configuration for server-side
const POSTHOG_KEY = PUBLIC_POSTHOG_KEY || 'phc_your_key_here';
const POSTHOG_HOST = 'https://us.i.posthog.com';

export const load = async ({ url, request, locals }) => {
	// Initialize PostHog for server-side tracking
	const posthog = new PostHog(POSTHOG_KEY, {
		host: POSTHOG_HOST,
		flushAt: 1,
		flushInterval: 0
	});

	try {
		// Track SSR page view
		const userId = locals.user?.id;
		const referrer = request.headers.get('referer');
		const userAgent = request.headers.get('user-agent');

		posthog.capture({
			distinctId: userId || 'anonymous',
			event: '$pageview',
			properties: {
				$current_url: url.href,
				$pathname: url.pathname,
				$set: {
					$initial_referrer: referrer,
					$initial_referring_domain: referrer ? new URL(referrer).hostname : undefined
				},
				referrer,
				user_agent: userAgent,
				method: request.method,
				url: url.href,
				server_side: true,
				timestamp: new Date().toISOString()
			},
			groups: {
				server: 'kaiwa-flyio',
				environment: env.NODE_ENV || 'production'
			}
		});

		// Track user identification if logged in
		if (userId) {
			posthog.identify({
				distinctId: userId,
				properties: {
					server_side: true,
					last_seen: new Date().toISOString()
				}
			});
		}

		return {
			posthogInitialized: true,
			userId
		};
	} finally {
		// Always shutdown PostHog to flush events
		await posthog.shutdown();
	}
};
