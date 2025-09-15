import { PostHog } from 'posthog-node';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { getUserCurrentTier } from '$lib/server/services/payment.service';

// PostHog configuration for server-side
const POSTHOG_KEY = publicEnv.PUBLIC_POSTHOG_KEY || 'phc_your_key_here';
const POSTHOG_HOST = 'https://us.i.posthog.com';

export const load = async ({ url, request, locals }) => {
	// Initialize PostHog for server-side tracking
	const posthog = new PostHog(POSTHOG_KEY, {
		host: POSTHOG_HOST,
		flushAt: 1,
		flushInterval: 0
	});
	const userId = locals.user?.id;
	const referrer = request.headers.get('referer');
	const userAgent = request.headers.get('user-agent');

	// Get user data from locals (set by hooks.server.ts)
	const user = locals.user || null;

	// If user exists, get their current tier using simplified service
	// During build, skip Stripe API calls to avoid 404 errors
	let currentTier = 'free';
	if (user && env.NODE_ENV !== 'build') {
		try {
			currentTier = await getUserCurrentTier(user.id);
		} catch (error) {
			console.error('Error fetching user tier in layout:', error);
			// Fallback to free tier if Stripe API fails
			currentTier = 'free';
		}
	}

	return {
		posthogInitialized: await posthogHasInitialized(
			posthog,
			url,
			userAgent,
			referrer,
			userId,
			request.method
		),
		user,
		currentTier
	};
};

async function posthogHasInitialized(
	posthog: PostHog,
	url: URL,
	userAgent: string | null,
	referrer: string | null,
	userId: string | undefined,
	method: string
): Promise<boolean> {
	if (!userId) {
		userId = 'anonymous';
	}
	if (!referrer) {
		referrer = null;
	}
	try {
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
				method: method,
				url: url.href,
				server_side: true,
				timestamp: new Date().toISOString()
			},
			groups: {
				server: 'kaiwa-flyio',
				environment: env.NODE_ENV || 'production'
			}
		});
		return true;
	} catch (error) {
		console.error('Error capturing page view', error);
		return false;
	} finally {
		await posthog.shutdown();
		console.log('PostHog shutdown');
	}
}
