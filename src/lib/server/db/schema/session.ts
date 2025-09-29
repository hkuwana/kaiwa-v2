import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * 🔐 Session table - Manages user authentication sessions
 *
 * This table stores active user authentication sessions for the app.
 * Each session has a unique ID, links to a user account, and includes
 * an expiration timestamp for automatic cleanup. Used by the authentication
 * system to maintain user login state securely.
 *
 * **Security Features:**
 * - ⏰ Automatic expiration for security
 * - 🔗 Secure session ID generation
 * - 🧹 Automatic cleanup of expired sessions
 * - 👤 User association for session validation
 *
 * @example
 * ```typescript
 * // Create a new user session
 * await db.insert(session).values({
 *   id: 'sess_1234567890abcdef',
 *   userId: 'user-123',
 *   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
 * });
 * ```
 */
export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),

		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
	},
	(table) => [
		// Performance indexes for session management
		index('session_user_id_idx').on(table.userId),
		index('session_expires_at_idx').on(table.expiresAt),
		// Composite index for active session queries
		index('session_user_active_idx').on(table.userId, table.expiresAt)
	]
);
