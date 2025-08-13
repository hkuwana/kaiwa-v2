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

// Languages - enhanced to match kaiwa-old structure
export const languages = pgTable('languages', {
	id: text('id').primaryKey(), // e.g., 'ja'
	code: text('code').notNull().unique(), // ISO 639-1 e.g., 'ja'
	name: text('name').notNull(), // e.g., 'Japanese'
	nativeName: text('native_name').notNull(), // e.g., '日本語'
	isRTL: boolean('is_rtl').default(false).notNull(),
	hasRomanization: boolean('has_romanization').default(true).notNull(),
	writingSystem: text('writing_system').notNull(), // 'latin', 'chinese', etc.
	supportedScripts: json('supported_scripts').$type<string[]>(), // ['hiragana', 'katakana', 'kanji']
	isSupported: boolean('is_supported').default(true).notNull()
});

// Speakers - for voice selection and language practice
export const speakers = pgTable('speakers', {
	id: text('id').primaryKey(), // e.g., 'ja-jp-male'
	languageId: text('language_id')
		.notNull()
		.references(() => languages.id),
	region: text('region').notNull(), // e.g., 'Japan'
	dialectName: text('dialect_name').notNull(), // e.g., 'Japanese'
	bcp47Code: text('bcp47_code').notNull(), // e.g., 'ja-JP'
	speakerEmoji: text('speaker_emoji').notNull(), // e.g., '🇯🇵'
	gender: text('gender').$type<'male' | 'female'>().notNull(),
	voiceName: text('voice_name').notNull(), // e.g., 'Hiro'
	voiceProviderId: text('voice_provider_id').notNull(), // e.g., 'openai-hiro'
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow()
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

// 🎯 LEARNING SCENARIOS - Core feature for task-oriented learning
export const scenarios = pgTable('scenarios', {
	id: text('id').primaryKey(), // e.g., 'cafe-ordering', 'directions-asking'
	languageId: text('language_id')
		.notNull()
		.references(() => languages.id),

	// Scenario metadata
	title: text('title').notNull(), // e.g., 'Ordering at a Café'
	description: text('description').notNull(), // e.g., 'Practice ordering coffee and food'
	context: text('context').notNull(), // e.g., 'You are at a café in Tokyo'
	goal: text('goal').notNull(), // e.g., 'Order one coffee and one pastry'

	// Difficulty and categorization
	difficulty: text('difficulty')
		.$type<'beginner' | 'intermediate' | 'advanced'>()
		.notNull()
		.default('beginner'),
	category: text('category').notNull(), // e.g., 'food', 'travel', 'business'

	// Learning objectives
	targetGrammar: text('target_grammar'), // e.g., 'polite form (-masu)'
	targetVocabulary: json('target_vocabulary').$type<string[]>(), // ['コーヒー', 'ケーキ', 'お願いします']
	exampleResponses: json('example_responses').$type<string[]>(), // ['コーヒーを一つお願いします']

	// Scaffolding features
	translationHints: json('translation_hints').$type<Record<string, string>>(), // {'コーヒー': 'coffee'}
	vocabularyPreview: json('vocabulary_preview').$type<string[]>(), // Words to show before starting

	// AI behavior configuration
	aiRole: text('ai_role').notNull(), // e.g., 'café staff member'
	aiPersonality: text('ai_personality'), // e.g., 'friendly and helpful'

	// 🎯 Success criteria for assessment
	successCriteria: json('success_criteria').$type<{
		requiredVocabulary: string[];
		optionalVocabulary: string[];
		grammarPatterns: string[];
		goalSteps: string[];
	}>(),

	// Metadata
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});

// 📊 SCENARIO OUTCOMES - Track learning progress and success
export const scenarioOutcomes = pgTable('scenario_outcomes', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id), // nullable for anonymous users
	conversationId: text('conversation_id')
		.notNull()
		.references(() => conversations.id),
	scenarioId: text('scenario_id')
		.notNull()
		.references(() => scenarios.id),

	// Success metrics
	wasGoalAchieved: boolean('was_goal_achieved').notNull(),
	goalCompletionScore: decimal('goal_completion_score', { precision: 3, scale: 2 }), // 0.00 to 1.00

	// Language proficiency metrics
	grammarUsageScore: decimal('grammar_usage_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
	vocabularyUsageScore: decimal('vocabulary_usage_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
	pronunciationScore: decimal('pronunciation_score', { precision: 3, scale: 2 }), // 0.00 to 1.00

	// Detailed assessment
	usedTargetVocabulary: json('used_target_vocabulary').$type<string[]>(), // Words they actually used
	missedTargetVocabulary: json('missed_target_vocabulary').$type<string[]>(), // Words they should have used
	grammarErrors: json('grammar_errors').$type<string[]>(), // Specific errors made

	// AI feedback
	aiFeedback: text('ai_feedback'), // Personalized feedback from AI
	suggestions: json('suggestions').$type<string[]>(), // Improvement suggestions

	// Session data
	durationSeconds: integer('duration_seconds').notNull(),
	exchangeCount: integer('exchange_count').notNull(),

	// Metadata
	createdAt: timestamp('created_at').defaultNow()
});

// 📚 VOCABULARY TRACKING - Track word mastery over time
export const vocabularyProgress = pgTable('vocabulary_progress', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	languageId: text('language_id')
		.notNull()
		.references(() => languages.id),
	word: text('word').notNull(), // The vocabulary word

	// Mastery tracking
	encounterCount: integer('encounter_count').default(0).notNull(), // Times seen in scenarios
	successfulUsageCount: integer('successful_usage_count').default(0).notNull(), // Times used correctly
	masteryLevel: text('mastery_level')
		.$type<'new' | 'learning' | 'practicing' | 'mastered'>()
		.default('new')
		.notNull(),

	// Spaced repetition data
	lastReviewed: timestamp('last_reviewed'),
	nextReview: timestamp('next_review'),
	reviewInterval: integer('review_interval'), // Days until next review

	// Metadata
	firstEncountered: timestamp('first_encountered').defaultNow(),
	lastUpdated: timestamp('last_updated').defaultNow()
});

// 🔄 SCENARIO ATTEMPTS - Track multiple attempts at the same scenario
export const scenarioAttempts = pgTable('scenario_attempts', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => users.id),
	scenarioId: text('scenario_id')
		.notNull()
		.references(() => scenarios.id),

	// Attempt tracking
	attemptNumber: integer('attempt_number').notNull(), // 1st, 2nd, 3rd attempt
	startedAt: timestamp('started_at').defaultNow(),
	completedAt: timestamp('completed_at'),

	// Progress tracking
	completedSteps: json('completed_steps').$type<string[]>(), // Which parts they completed
	abandonedAt: text('abandoned_at'), // Where they gave up if applicable

	// Learning analytics
	timeSpentSeconds: integer('time_spent_seconds'),
	hintsUsed: integer('hints_used').default(0),
	translationsUsed: integer('translations_used').default(0),

	// Metadata
	createdAt: timestamp('created_at').defaultNow()
});

export type Session = typeof session.$inferSelect;
export type User = typeof users.$inferSelect;
export type Language = typeof languages.$inferSelect;
export type Speaker = typeof speakers.$inferSelect;
export type Tier = typeof tiers.$inferSelect;
export type UserUsage = typeof userUsage.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

// 🎯 New types for learning scenarios
export type Scenario = typeof scenarios.$inferSelect;
export type ScenarioOutcome = typeof scenarioOutcomes.$inferSelect;
export type VocabularyProgress = typeof vocabularyProgress.$inferSelect;
export type ScenarioAttempt = typeof scenarioAttempts.$inferSelect;
