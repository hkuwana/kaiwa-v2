import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Email Verification table - Manages email verification codes and attempts
 *
 * This table stores 6-digit verification codes sent to users for email verification.
 * It tracks the email being verified, expiration times, verification status,
 * and failed attempt counts for security purposes. Used during user registration
 * and email change processes to ensure users own the email addresses they provide.
 */

export const emailVerification = pgTable(
	'email_verification',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		code: text('code').notNull(), // 6-digit verification code
		expiresAt: timestamp('expires_at').notNull(),
		verifiedAt: timestamp('verified_at'),
		attempts: integer('attempts').default(0).notNull(), // Track failed attempts
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('email_verification_user_id_idx').on(table.userId),
		index('email_verification_email_idx').on(table.email),
		index('email_verification_code_idx').on(table.code),
		index('email_verification_expires_at_idx').on(table.expiresAt)
	]
);
