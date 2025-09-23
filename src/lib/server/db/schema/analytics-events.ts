import { pgTable, uuid, text, json, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

// Analytics events for conversion tracking
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
