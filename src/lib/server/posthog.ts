// 📊 PostHog Server-Side Analytics
// Server-side analytics for SSR page views and API usage tracking

import { PostHog } from 'posthog-node';
import { env } from '$env/dynamic/private';

// PostHog configuration for server-side
const POSTHOG_KEY = env.POSTHOG_API_KEY || 'phc_your_key_here';
const POSTHOG_HOST = env.POSTHOG_HOST || 'https://us.i.posthog.com';

// Check if we should skip tracking (development/localhost)
const shouldSkipTracking = env.NODE_ENV !== 'production';

// Create server-side PostHog instance
export const posthog = new PostHog(POSTHOG_KEY, {
	host: POSTHOG_HOST,
	flushAt: 1, // Send events immediately for real-time tracking
	flushInterval: 0 // Disable automatic flushing
});

/**
 * Track server-side page views during SSR
 */
export function trackSSRPageView(
	path: string,
	userId?: string,
	properties?: Record<string, unknown>
): void {
	if (shouldSkipTracking) return; // Skip tracking in development

	posthog.capture({
		distinctId: userId || 'anonymous',
		event: '$pageview',
		properties: {
			$current_url: path,
			$pathname: path,
			$set: {
				$initial_referrer: properties?.referrer,
				$initial_referring_domain: properties?.referring_domain
			},
			server_side: true,
			timestamp: new Date().toISOString(),
			...properties
		},
		groups: {
			server: 'kaiwa-flyio',
			environment: env.NODE_ENV || 'production'
		}
	});
}

/**
 * Track API usage and server-side events
 */
export function trackServerEvent(
	eventName: string,
	userId?: string,
	properties?: Record<string, unknown>
): void {
	if (shouldSkipTracking) return; // Skip tracking in development

	posthog.capture({
		distinctId: userId || 'anonymous',
		event: eventName,
		properties: {
			...properties,
			server_side: true,
			timestamp: new Date().toISOString()
		},
		groups: {
			server: 'kaiwa-flyio',
			environment: env.NODE_ENV || 'production'
		}
	});
}

/**
 * Track user identification on server-side
 */
export function identifyServerUser(userId: string, properties?: Record<string, unknown>): void {
	if (shouldSkipTracking) return; // Skip tracking in development

	posthog.identify({
		distinctId: userId,
		properties: {
			...properties,
			server_side: true,
			last_seen: new Date().toISOString()
		}
	});
}

/**
 * Track feature flag usage on server-side
 */
export async function getServerFeatureFlag(
	flag: string,
	userId?: string
): Promise<boolean | string | undefined> {
	if (!userId) return undefined;

	try {
		return await posthog.getFeatureFlag(flag, userId);
	} catch (error) {
		console.error('Error getting feature flag:', error);
		return undefined;
	}
}

/**
 * Track conversion events on server-side
 */
export const trackServerConversion = {
	// User signs up (server-side)
	signUp: (userId: string, method: 'google' | 'email', tier: string = 'free') => {
		trackServerEvent('user_signed_up', userId, {
			method,
			tier,
			$set: { signup_method: method, initial_tier: tier }
		});
	},

	// User hits tier limits (server-side)
	tierLimitReached: (
		userId: string,
		limitType: 'conversations' | 'minutes' | 'realtime',
		currentTier: string
	) => {
		trackServerEvent('tier_limit_reached', userId, {
			limit_type: limitType,
			current_tier: currentTier,
			$set: { has_hit_limit: true }
		});
	},

	// Subscription events (server-side)
	subscriptionCreated: (
		userId: string,
		tier: 'plus' | 'premium',
		billing: 'monthly' | 'yearly',
		amount: number
	) => {
		trackServerEvent('subscription_created', userId, {
			tier,
			billing_cycle: billing,
			amount,
			$set: {
				is_paying_user: true,
				subscription_tier: tier,
				subscription_billing: billing
			}
		});
	},

	// API usage tracking
	apiCall: (
		userId: string,
		endpoint: string,
		method: string,
		duration: number,
		success: boolean
	) => {
		trackServerEvent('api_call', userId, {
			endpoint,
			method,
			duration_ms: duration,
			success,
			$set: { last_api_call: new Date().toISOString() }
		});
	}
};

/**
 * Cleanup function to flush remaining events
 */
export async function flushPostHog(): Promise<void> {
	try {
		await posthog.shutdown();
	} catch (error) {
		console.error('Error flushing PostHog:', error);
	}
}

// Ensure cleanup on process exit
process.on('exit', flushPostHog);
process.on('SIGINT', flushPostHog);
process.on('SIGTERM', flushPostHog);
