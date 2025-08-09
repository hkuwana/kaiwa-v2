import { pgTable, integer, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

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

// Conversations - core feature
export const conversations = pgTable('conversations', {
	id: text('id').primaryKey(),
	userId: uuid('user_id').references(() => users.id),
	targetLanguageId: text('target_language_id').references(() => languages.id),
	title: text('title'),
	startedAt: timestamp('started_at').defaultNow(),
	endedAt: timestamp('ended_at'),
	durationSeconds: integer('duration_seconds')
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
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
