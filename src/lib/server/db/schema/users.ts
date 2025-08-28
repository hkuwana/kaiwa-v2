import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

// Core user management - simplified and focused
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
		hashedPassword: text('hashed_password')
	},
	(table) => [
		// Performance indexes for common queries
		index('users_email_idx').on(table.email),
		index('users_created_at_idx').on(table.createdAt),
		index('users_last_usage_idx').on(table.lastUsage)
	]
);
