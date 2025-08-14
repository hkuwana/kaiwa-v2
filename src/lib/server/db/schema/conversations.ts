import { pgTable, text, uuid, timestamp, integer, decimal } from 'drizzle-orm/pg-core';
import { users } from './users';
import { languages } from './languages';

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
