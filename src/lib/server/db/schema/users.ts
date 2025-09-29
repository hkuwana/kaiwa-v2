import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

/**
 * Users - Core user account information
 *
 * Central user table containing authentication, preferences, and billing data.
 * Supports Google OAuth and email/password authentication.
 */
export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		googleId: text('google_id').unique(),
		username: text('username').unique(),
		displayName: text('display_name'),
		email: text('email').notNull().unique(),
		avatarUrl: text('avatar_url'),
		stripeCustomerId: text('stripe_customer_id'),

		// Language preferences
		nativeLanguageId: text('native_language_id').notNull().default('en'),
		preferredUILanguageId: text('preferred_ui_language_id').notNull().default('ja'),

		// Authentication
		hashedPassword: text('hashed_password'),
		emailVerified: timestamp('email_verified'),
		emailVerificationRequired: timestamp('email_verification_required').defaultNow(),

		// Tracking
		createdAt: timestamp('created_at').defaultNow(),
		lastUsage: timestamp('last_usage')
	},
	(table) => [
		// Performance indexes for common queries
		index('users_email_idx').on(table.email),
		index('users_created_at_idx').on(table.createdAt),
		index('users_last_usage_idx').on(table.lastUsage)
	]
);
