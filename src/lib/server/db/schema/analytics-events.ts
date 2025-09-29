import { pgTable, uuid, text, json, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Analytics Events table - Tracks user behavior and conversion events
 *
 * This table captures user interaction events for analytics and conversion tracking.
 * It stores event names (like 'conversation_started', 'subscription_purchased'),
 * flexible properties in JSON format, user context (user agent, IP, referrer),
 * and session information. Used for product analytics, A/B testing, and
 * understanding user behavior patterns.
 */
export const analyticsEvents = pgTable('analytics_events', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id), // nullable for anonymous events
	sessionId: text('session_id'), // PostHog session ID

	// Event data
	eventName: text('event_name').notNull(),
	properties: json('properties'), // flexible event properties

	// Context
	userAgent: text('user_agent'),
	ipAddress: text('ip_address'),
	referrer: text('referrer'),

	// Timestamp
	createdAt: timestamp('created_at').defaultNow().notNull()
});
