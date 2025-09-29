import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

/**
 * Users table - Stores basic user account information
 *
 * This table holds the essential user data for the Kaiwa language learning app.
 * It includes authentication info (Google OAuth, email/password), user preferences
 * (native language, UI language), payment integration (Stripe customer ID),
 * and basic tracking data like registration and last activity times.
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

		// Essential settings
		nativeLanguageId: text('native_language_id').notNull().default('en'),
		preferredUILanguageId: text('preferred_ui_language_id').notNull().default('ja'),

		// Tracking
		createdAt: timestamp('created_at').defaultNow(),
		lastUsage: timestamp('last_usage'),

		// Optional password for email signup (if we add it later)
		hashedPassword: text('hashed_password'),

		// Email verification
		emailVerified: timestamp('email_verified'),
		emailVerificationRequired: timestamp('email_verification_required').defaultNow()
	},
	(table) => [
		// Performance indexes for common queries
		index('users_email_idx').on(table.email),
		index('users_created_at_idx').on(table.createdAt),
		index('users_last_usage_idx').on(table.lastUsage)
	]
);
