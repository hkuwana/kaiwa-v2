// 📈 Server-Side Analytics Service
// Tracks events to database and PostHog for comprehensive analytics

import { db } from './db/index.js';
import { analyticsEvents, users } from './db/schema.js';
import { eq } from 'drizzle-orm';
import type { AnalyticsEvent } from './db/schema.js';

// PostHog server-side tracking
const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.i.posthog.com';

interface EventProperties {
	[key: string]: any;
}

interface EventContext {
	userAgent?: string;
	ipAddress?: string;
	referrer?: string;
	sessionId?: string;
}

export class AnalyticsService {
	/**
	 * Track event to both database and PostHog
	 */
	async track(
		eventName: string,
		userId?: string,
		properties?: EventProperties,
		context?: EventContext
	): Promise<void> {
		// Store in database
		await this.trackToDatabase(eventName, userId, properties, context);

		// Send to PostHog if configured
		if (POSTHOG_API_KEY) {
			await this.trackToPostHog(eventName, userId, properties, context);
		}
	}

	/**
	 * Track conversion events with enhanced properties
	 */
	async trackConversion(
		eventName: string,
		userId: string,
		conversionValue?: number,
		properties?: EventProperties,
		context?: EventContext
	): Promise<void> {
		const enhancedProperties = {
			...properties,
			is_conversion: true,
			conversion_value: conversionValue,
			timestamp: new Date().toISOString()
		};

		await this.track(eventName, userId, enhancedProperties, context);
	}

	/**
	 * Track user tier changes for revenue analysis
	 */
	async trackTierChange(
		userId: string,
		fromTier: string,
		toTier: string,
		context?: EventContext
	): Promise<void> {
		await this.track(
			'tier_changed',
			userId,
			{
				from_tier: fromTier,
				to_tier: toTier,
				is_upgrade: this.isUpgrade(fromTier, toTier),
				is_downgrade: this.isDowngrade(fromTier, toTier)
			},
			context
		);
	}

	/**
	 * Track usage events for product analytics
	 */
	async trackUsage(
		eventName: string,
		userId: string,
		usageData: {
			feature: string;
			duration?: number;
			count?: number;
			metadata?: Record<string, any>;
		},
		context?: EventContext
	): Promise<void> {
		await this.track(
			eventName,
			userId,
			{
				feature: usageData.feature,
				duration_seconds: usageData.duration,
				count: usageData.count,
				...usageData.metadata
			},
			context
		);
	}

	/**
	 * Store event in database
	 */
	private async trackToDatabase(
		eventName: string,
		userId?: string,
		properties?: EventProperties,
		context?: EventContext
	): Promise<void> {
		try {
			await db.insert(analyticsEvents).values({
				eventName,
				userId: userId || null,
				sessionId: context?.sessionId || null,
				properties: properties ? JSON.stringify(properties) : null,
				userAgent: context?.userAgent || null,
				ipAddress: context?.ipAddress || null,
				referrer: context?.referrer || null
			});
		} catch (error) {
			console.error('Failed to track event to database:', error);
		}
	}

	/**
	 * Send event to PostHog
	 */
	private async trackToPostHog(
		eventName: string,
		userId?: string,
		properties?: EventProperties,
		context?: EventContext
	): Promise<void> {
		try {
			const payload = {
				api_key: POSTHOG_API_KEY,
				event: eventName,
				properties: {
					...properties,
					$ip: context?.ipAddress,
					$useragent: context?.userAgent,
					$referrer: context?.referrer,
					$session_id: context?.sessionId,
					timestamp: new Date().toISOString()
				},
				distinct_id: userId || context?.sessionId || 'anonymous'
			};

			const response = await fetch(`${POSTHOG_HOST}/capture/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				console.error('PostHog tracking failed:', response.statusText);
			}
		} catch (error) {
			console.error('Failed to track event to PostHog:', error);
		}
	}

	/**
	 * Get analytics summary for a user
	 */
	async getUserAnalytics(userId: string): Promise<{
		totalEvents: number;
		conversionEvents: number;
		lastActivity: Date | null;
		topEvents: Array<{ event: string; count: number }>;
	}> {
		// This would require more complex queries - simplified for MVP
		const events = await db
			.select()
			.from(analyticsEvents)
			.where(eq(analyticsEvents.userId, userId))
			.limit(100);

		const totalEvents = events.length;
		const conversionEvents = events.filter(
			(e) =>
				e.properties && typeof e.properties === 'string' && JSON.parse(e.properties).is_conversion
		).length;

		const lastActivity =
			events.length > 0
				? events.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))[0]
						.createdAt
				: null;

		// Count event types
		const eventCounts: Record<string, number> = {};
		events.forEach((event) => {
			eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
		});

		const topEvents = Object.entries(eventCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5)
			.map(([event, count]) => ({ event, count }));

		return {
			totalEvents,
			conversionEvents,
			lastActivity,
			topEvents
		};
	}

	/**
	 * Helper: Check if tier change is an upgrade
	 */
	private isUpgrade(fromTier: string, toTier: string): boolean {
		const tierOrder = { free: 0, pro: 1, premium: 2 };
		return (
			(tierOrder[toTier as keyof typeof tierOrder] || 0) >
			(tierOrder[fromTier as keyof typeof tierOrder] || 0)
		);
	}

	/**
	 * Helper: Check if tier change is a downgrade
	 */
	private isDowngrade(fromTier: string, toTier: string): boolean {
		const tierOrder = { free: 0, pro: 1, premium: 2 };
		return (
			(tierOrder[toTier as keyof typeof tierOrder] || 0) <
			(tierOrder[fromTier as keyof typeof tierOrder] || 0)
		);
	}
}

// Convenience functions for common events
export const analytics = new AnalyticsService();

// Quick tracking functions
export const trackConversion = analytics.trackConversion.bind(analytics);
export const trackUsage = analytics.trackUsage.bind(analytics);
export const trackTierChange = analytics.trackTierChange.bind(analytics);
