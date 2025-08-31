// 📊 PostHog Analytics Integration
// Client-side analytics for user behavior and conversion tracking

import { browser } from '$app/environment';
import { page } from '$app/state';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import posthog from 'posthog-js';

// PostHog configuration
const POSTHOG_HOST = 'https://us.i.posthog.com'; // or your self-hosted instance

/**
 * Initialize PostHog (call this in app.html or root layout)
 */
export function initializePostHog(): void {
	if (!browser) return;

	// Dynamic import to avoid SSR issues
	import('posthog-js').then(({ default: posthog }) => {
		posthog.init(PUBLIC_POSTHOG_KEY, {
			api_host: POSTHOG_HOST,
			person_profiles: 'identified_only', // Only create profiles for logged-in users
			capture_pageview: false, // We'll handle this manually
			capture_pageleave: true,

			// Privacy settings
			respect_dnt: true,
			opt_out_capturing_by_default: false,

			// Performance
			disable_session_recording: false, // Enable session recordings for conversion analysis
			session_recording: {
				maskAllInputs: true, // Mask sensitive inputs
				maskInputOptions: {
					password: true,
					email: false // We want to see email interactions for conversion
				}
			}
		});

		console.log('📊 PostHog initialized');
	});
}

/**
 * Identify user when they log in
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
	if (!posthog) return;

	posthog.identify(userId, {
		...properties,
		$set_once: {
			first_seen: new Date().toISOString(),
			...(properties?.$set_once as Record<string, unknown>)
		}
	});
}

/**
 * Track conversion events
 */
export const trackConversion = {
	// User signs up
	signUp: (method: 'google' | 'email', tier: string = 'free') => {
		track('user_signed_up', {
			method,
			tier,
			$set: { signup_method: method, initial_tier: tier }
		});
	},

	// User starts their first conversation
	firstConversation: (language: string, mode: 'traditional' | 'realtime') => {
		track('first_conversation_started', {
			language,
			mode,
			$set: { first_conversation_language: language, first_conversation_mode: mode }
		});
	},

	// User hits tier limits (key conversion moment)
	tierLimitReached: (limitType: 'conversations' | 'minutes' | 'realtime', currentTier: string) => {
		track('tier_limit_reached', {
			limit_type: limitType,
			current_tier: currentTier,
			$set: { has_hit_limit: true }
		});
	},

	// User views pricing
	viewPricing: (source: 'limit_modal' | 'navbar' | 'settings' | 'onboarding') => {
		track('pricing_viewed', { source });
	},

	// User starts checkout
	checkoutStarted: (tier: 'plus' | 'premium', billing: 'monthly' | 'yearly') => {
		track('checkout_started', {
			target_tier: tier,
			billing_cycle: billing,
			$set: { checkout_intent: `${tier}_${billing}` }
		});
	},

	// User completes payment
	subscriptionCreated: (
		tier: 'plus' | 'premium',
		billing: 'monthly' | 'yearly',
		amount: number
	) => {
		track('subscription_created', {
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

	// User cancels subscription
	subscriptionCancelled: (tier: string, reason?: string) => {
		track('subscription_cancelled', {
			tier,
			reason,
			$set: { is_paying_user: false }
		});
	}
};

/**
 * Track feature usage
 */
export const trackFeature = {
	// Realtime conversation usage
	realtimeUsed: (language: string, duration_seconds: number) => {
		track('realtime_conversation_used', {
			language,
			duration_seconds,
			$set: { has_used_realtime: true }
		});
	},

	// Traditional conversation
	traditionalUsed: (language: string, message_count: number) => {
		track('traditional_conversation_used', {
			language,
			message_count,
			$set: { has_used_traditional: true }
		});
	},

	// Voice selection
	voiceChanged: (voice: string, language: string) => {
		track('voice_changed', { voice, language });
	},

	// Language switching
	languageChanged: (from_language: string, to_language: string) => {
		track('language_changed', { from_language, to_language });
	}
};

/**
 * Track user engagement
 */
export const trackEngagement = {
	// Daily active user
	sessionStart: () => {
		track('session_started', {
			$set: { last_active: new Date().toISOString() }
		});
	},

	// Conversation completed
	conversationCompleted: (duration_minutes: number, message_count: number, mode: string) => {
		track('conversation_completed', {
			duration_minutes,
			message_count,
			mode,
			$set: {
				total_conversations: '$total_conversations + 1',
				total_minutes: `$total_minutes + ${duration_minutes}`
			}
		});
	},

	// User returns after period of inactivity
	userReturned: (days_since_last_visit: number) => {
		track('user_returned', {
			days_since_last_visit,
			$set: { last_return: new Date().toISOString() }
		});
	}
};

/**
 * Core tracking function
 */
export function track(eventName: string, properties?: Record<string, unknown>): void {
	if (!posthog) return;

	// Add context from current page

	posthog.capture(eventName, {
		...properties,
		$current_url: page.url.href,
		$pathname: page.url.pathname,
		timestamp: new Date().toISOString()
	});
}

/**
 * Track page views manually
 */
export function trackPageView(path?: string): void {
	if (!posthog) return;

	posthog.capture('$pageview', {
		$current_url: path || page.url.href,
		$pathname: path || page.url.pathname
	});
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>): void {
	if (!posthog) return;

	posthog.setPersonProperties(properties);
}

/**
 * Reset user (on logout)
 */
export function resetUser(): void {
	if (!posthog) return;

	posthog.reset();
}

/**
 * Create feature flags (for A/B testing)
 */
export function getFeatureFlag(flag: string): boolean | string | undefined {
	if (!posthog) return undefined;

	return posthog.getFeatureFlag(flag);
}

/**
 * Check if user is in experiment
 */
export function isFeatureEnabled(flag: string): boolean {
	if (!posthog) return false;

	return posthog.isFeatureEnabled(flag) || false;
}

// Export the PostHog instance for advanced usage
export { posthog };
