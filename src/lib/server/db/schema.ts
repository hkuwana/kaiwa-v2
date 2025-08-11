import {
	pgTable,
	integer,
	text,
	timestamp,
	boolean,
	uuid,
	decimal,
	json
} from 'drizzle-orm/pg-core';

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

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

// Languages - essential for conversation
export const languages = pgTable('languages', {
	id: text('id').primaryKey(), // e.g., 'japanese'
	code: text('code').notNull().unique(), // ISO 639-1 e.g., 'ja'
	name: text('name').notNull(), // e.g., 'Japanese'
	nativeName: text('native_name').notNull(), // e.g., '日本語'
	isSupported: boolean('is_supported').default(true).notNull()
});

// Tier definitions and limits
export const tiers = pgTable('tiers', {
	id: text('id').primaryKey(), // 'free', 'pro', 'premium'
	name: text('name').notNull(),
	description: text('description'),

	// Monthly limits
	monthlyConversations: integer('monthly_conversations'),
	monthlyMinutes: integer('monthly_minutes'),
	monthlyRealtimeSessions: integer('monthly_realtime_sessions'),

	// Feature access
	hasRealtimeAccess: boolean('has_realtime_access').default(false),
	hasAdvancedVoices: boolean('has_advanced_voices').default(false),
	hasAnalytics: boolean('has_analytics').default(false),

	// Pricing
	monthlyPriceUsd: decimal('monthly_price_usd', { precision: 10, scale: 2 }),

	isActive: boolean('is_active').default(true)
});

// Usage tracking for tier limits
export const userUsage = pgTable('user_usage', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),

	// Usage period (monthly reset)
	periodStart: timestamp('period_start').notNull(),
	periodEnd: timestamp('period_end').notNull(),

	// Usage counters
	conversationsUsed: integer('conversations_used').default(0),
	minutesUsed: integer('minutes_used').default(0),
	realtimeSessionsUsed: integer('realtime_sessions_used').default(0),

	// Metadata
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// 💰 MONETIZATION TABLES - Phase 1 Essential

// Stripe subscriptions
export const subscriptions = pgTable('subscriptions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),

	// Stripe data
	stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
	stripeCustomerId: text('stripe_customer_id').notNull(),
	stripePriceId: text('stripe_price_id').notNull(),

	// Subscription details
	status: text('status').notNull(), // active, canceled, past_due, etc.
	currentPeriodStart: timestamp('current_period_start').notNull(),
	currentPeriodEnd: timestamp('current_period_end').notNull(),
	cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),

	// Tier mapping
	tierId: text('tier_id')
		.notNull()
		.references(() => tiers.id),

	// Metadata
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// Payment history for analytics
export const payments = pgTable('payments', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	subscriptionId: uuid('subscription_id').references(() => subscriptions.id),

	// Stripe payment data
	stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
	stripeInvoiceId: text('stripe_invoice_id').unique(),

	// Payment details
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	currency: text('currency').notNull().default('usd'),
	status: text('status').notNull(), // succeeded, failed, pending

	// Metadata
	createdAt: timestamp('created_at').defaultNow()
});

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
	createdAt: timestamp('created_at').defaultNow()
});

// Conversations - core feature
export const conversations = pgTable('conversations', {
	id: text('id').primaryKey(),
	userId: uuid('user_id').references(() => users.id),
	targetLanguageId: text('target_language_id').references(() => languages.id),
	title: text('title'),
	mode: text('mode').$type<'traditional' | 'realtime'>().default('traditional'),
	voice: text('voice'),
	startedAt: timestamp('started_at').defaultNow(),
	endedAt: timestamp('ended_at'),
	durationSeconds: integer('duration_seconds'),

	// Usage tracking
	messageCount: integer('message_count').default(0),
	audioMinutes: decimal('audio_minutes', { precision: 8, scale: 2 }).default('0')
});

// Messages - conversation content
export const messages = pgTable('messages', {
	id: text('id').primaryKey(),
	conversationId: text('conversation_id')
		.notNull()
		.references(() => conversations.id),
	role: text('role').$type<'assistant' | 'user' | 'system'>().notNull(),
	content: text('content').notNull(),
	timestamp: timestamp('timestamp').notNull().defaultNow(),

	// Optional audio reference for future features
	audioId: text('audio_id')
});

export type Session = typeof session.$inferSelect;
export type User = typeof users.$inferSelect;
export type Language = typeof languages.$inferSelect;
export type Tier = typeof tiers.$inferSelect;
export type UserUsage = typeof userUsage.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
