import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Core user management - simplified from kaiwa-old
export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	googleId: text('google_id').unique(),
	username: text('username').unique(),
	displayName: text('display_name'),
	email: text('email').notNull().unique(),
	avatarUrl: text('avatar_url'),

	// Essential settings
	nativeLanguageId: text('native_language_id').notNull().default('en'),
	preferredUILanguageId: text('preferred_ui_language_id').notNull().default('ja'),

	// User tier and limits
	tier: text('tier').$type<'free' | 'pro' | 'premium'>().notNull().default('free'),
	subscriptionStatus: text('subscription_status').$type<
		'active' | 'canceled' | 'past_due' | 'trialing'
	>(),
	subscriptionId: text('subscription_id'),
	subscriptionExpiresAt: timestamp('subscription_expires_at'),

	// Tracking
	createdAt: timestamp('created_at').defaultNow(),
	lastUsage: timestamp('last_usage'),

	// Optional password for email signup (if we add it later)
	hashedPassword: text('hashed_password')
});
