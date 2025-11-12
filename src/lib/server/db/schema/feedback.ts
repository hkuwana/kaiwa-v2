import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Feedback table - Stores user feedback submitted through the app
 *
 * This table captures user feedback including bug reports, feature requests,
 * and general comments. It stores the feedback type, message, context information
 * (URL, user agent), and timestamps. User ID is optional to allow anonymous feedback.
 *
 * @example
 * ```typescript
 * // Store user feedback
 * await db.insert(feedback).values({
 *   userId: 'user-123', // optional
 *   type: 'bug',
 *   message: 'The conversation ended unexpectedly',
 *   url: '/conversation/abc-123',
 *   userAgent: 'Mozilla/5.0...',
 *   timestamp: new Date().toISOString()
 * });
 * ```
 */
export const feedback = pgTable(
	'feedback',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		// Optional user reference (allows anonymous feedback)
		userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

		// Feedback type (bug, feature, general, etc.)
		type: text('type').notNull(),

		// Feedback message content
		message: text('message').notNull(),

		// Context information
		url: text('url'), // URL where feedback was submitted
		userAgent: text('user_agent'), // Browser/device info

		// Client timestamp when feedback was submitted
		timestamp: text('timestamp'),

		// Server timestamp when feedback was received
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		// Performance indexes for common queries
		index('feedback_user_id_idx').on(table.userId),
		index('feedback_type_idx').on(table.type),
		index('feedback_created_at_idx').on(table.createdAt),
		// Composite index for user feedback queries
		index('feedback_user_type_idx').on(table.userId, table.type)
	]
);
