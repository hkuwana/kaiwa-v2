// src/lib/services/analytics.service.ts
// 📊 Encapsulated PostHog Analytics Service

import { browser } from '$app/environment';
import { page } from '$app/state';
import { env } from '$env/dynamic/public';
import type { PostHog } from 'posthog-js';

// PostHog configuration
const POSTHOG_HOST = 'https://us.i.posthog.com';

class AnalyticsService {
	private posthog: PostHog | null = null;
	private isInitialized = false;

	/**
	 * Initializes the PostHog instance. Should be called once in the root layout.
	 */
	async init() {
		if (this.isInitialized || !browser) {
			return;
		}

		// Dynamically import to avoid SSR issues
		const posthogModule = await import('posthog-js');
		this.posthog = posthogModule.default;

		this.posthog.init(env.PUBLIC_POSTHOG_KEY, {
			api_host: POSTHOG_HOST,
			person_profiles: 'identified_only',
			capture_pageview: false, // We handle this manually with trackPageView
			capture_pageleave: true,
			respect_dnt: true,
			disable_session_recording: false,
			session_recording: {
				maskAllInputs: true,
				maskInputOptions: {
					password: true
				}
			}
		});

		this.isInitialized = true;
		console.log('📊 PostHog Service Initialized');
	}

	/**
	 * Identifies a user when they log in.
	 */
	identifyUser(userId: string, properties?: Record<string, unknown>) {
		if (!this.posthog) return;
		this.posthog.identify(userId, properties);
	}

	/**
	 * Resets the user context on logout.
	 */
	resetUser() {
		if (!this.posthog) return;
		this.posthog.reset();
	}

	/**
	 * Core tracking function to capture an event.
	 */
	track(eventName: string, properties?: Record<string, unknown>) {
		if (!this.posthog) return;

		this.posthog.capture(eventName, {
			...properties,
			$current_url: page.url.href,
			$pathname: page.url.pathname
		});
	}

	/**
	 * Manually tracks a page view. Useful for SvelteKit's client-side navigation.
	 */
	trackPageView() {
		if (!this.posthog) return;
		this.posthog.capture('$pageview');
	}

	// --- Conversion Tracking Methods ---

	trackSignUp(method: 'google' | 'email', tier: string = 'free') {
		this.track('user_signed_up', {
			method,
			tier,
			$set: { signup_method: method, initial_tier: tier }
		});
	}

	trackFirstConversation(language: string, mode: 'traditional' | 'realtime') {
		this.track('first_conversation_started', {
			language,
			mode,
			$set: { first_conversation_language: language, first_conversation_mode: mode }
		});
	}

	trackTierLimitReached(limitType: 'conversations' | 'minutes' | 'realtime', currentTier: string) {
		this.track('tier_limit_reached', {
			limit_type: limitType,
			current_tier: currentTier,
			$set: { has_hit_limit: true }
		});
	}

	trackPricingViewed(source: 'limit_modal' | 'navbar' | 'settings' | 'onboarding') {
		this.track('pricing_viewed', { source });
	}

	trackCheckoutStarted(tier: 'plus' | 'premium', billing: 'monthly' | 'yearly') {
		this.track('checkout_started', {
			target_tier: tier,
			billing_cycle: billing,
			$set: { checkout_intent: `${tier}_${billing}` }
		});
	}

	trackSubscriptionCreated(
		tier: 'plus' | 'premium',
		billing: 'monthly' | 'yearly',
		amount: number
	) {
		this.track('subscription_created', {
			tier,
			billing_cycle: billing,
			amount,
			$set: {
				is_paying_user: true,
				subscription_tier: tier,
				subscription_billing: billing
			}
		});
	}

	// --- Feature Tracking Methods ---

	trackRealtimeUsed(language: string, duration_seconds: number) {
		this.track('realtime_conversation_used', {
			language,
			duration_seconds,
			$set: { has_used_realtime: true }
		});
	}

	// --- Engagement Tracking Methods ---

	trackSessionStart() {
		this.track('session_started', {
			$set: { last_active: new Date().toISOString() }
		});
	}

	trackConversationCompleted(duration_minutes: number, message_count: number, mode: string) {
		this.track('conversation_completed', {
			duration_minutes,
			message_count,
			mode
		});
	}
}

// Export a singleton instance of the service for use throughout the app.
export const analyticsService = new AnalyticsService();
