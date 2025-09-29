import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Session table - Manages user authentication sessions
 *
 * This table stores active user authentication sessions for the app.
 * Each session has a unique ID, links to a user account, and includes
 * an expiration timestamp for automatic cleanup. Used by the authentication
 * system to maintain user login state securely.
 */

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [
		// Performance indexes for session management
		index('session_user_id_idx').on(table.userId),
		index('session_expires_at_idx').on(table.expiresAt)
	]
);
