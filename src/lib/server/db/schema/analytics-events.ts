import { pgTable, uuid, text, json, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Analytics Events table - Tracks user behavior and conversion events
 *
 * This table captures user interaction events for analytics and conversion tracking.
 * It stores event names (like 'conversation_started', 'subscription_purchased'),
 * flexible properties in JSON format, user context (user agent, IP, referrer),
 * and session information. Used for product analytics, A/B testing, and
 * understanding user behavior patterns.
 *
 * @example
 * ```typescript
 * // Track a conversation start event
 * await db.insert(analyticsEvents).values({
 *   userId: 'user-123',
 *   eventName: 'conversation_started',
 *   properties: { language: 'ja', mode: 'realtime' },
 *   userAgent: 'Mozilla/5.0...',
 *   ipAddress: '192.168.1.1'
 * });
 * ```
 */
export const analyticsEvents = pgTable(
	'analytics_events',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

		sessionId: text('session_id'),

		eventName: text('event_name').notNull(),

		properties: json('properties').$type<Record<string, unknown>>(),

		userAgent: text('user_agent'),

		ipAddress: text('ip_address'),

		referrer: text('referrer'),

		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		// Performance indexes for common analytics queries
		index('analytics_events_user_id_idx').on(table.userId),
		index('analytics_events_event_name_idx').on(table.eventName),
		index('analytics_events_created_at_idx').on(table.createdAt),
		index('analytics_events_session_id_idx').on(table.sessionId),
		// Composite index for user event queries
		index('analytics_events_user_event_idx').on(table.userId, table.eventName),
		// Composite index for time-based event analysis
		index('analytics_events_event_time_idx').on(table.eventName, table.createdAt)
	]
);
