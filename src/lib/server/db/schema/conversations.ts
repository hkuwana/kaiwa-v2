import { pgTable, text, uuid, timestamp, integer, decimal, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { languages } from './languages';
import { scenarios } from './scenarios';

// Conversations - core feature with basic scenario support
export const conversations = pgTable(
	'conversations',
	{
		id: text('id').primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		targetLanguageId: text('target_language_id')
			.notNull()
			.references(() => languages.id),
		title: text('title'),
		mode: text('mode').$type<'traditional' | 'realtime'>().default('traditional').notNull(),
		voice: text('voice'),

		// Basic scenario support for onboarding
		scenarioId: text('scenario_id').references(() => scenarios.id),
		isOnboarding: text('is_onboarding').default('true').notNull(), // First comfort session

		startedAt: timestamp('started_at').defaultNow().notNull(),
		endedAt: timestamp('ended_at'),
		durationSeconds: integer('duration_seconds'),

		// Usage tracking
		messageCount: integer('message_count').default(0),
		audioSeconds: decimal('audio_seconds', { precision: 8, scale: 2 }).default('0').notNull(), // Changed from audio_minutes

		// Basic comfort/engagement tracking
		comfortRating: integer('comfort_rating'), // 1-5 scale from user feedback
		engagementLevel: text('engagement_level').$type<'low' | 'medium' | 'high'>()
	},
	(table) => [
		// Performance indexes for conversation queries
		index('conversations_user_id_idx').on(table.userId),
		index('conversations_target_language_id_idx').on(table.targetLanguageId),
		index('conversations_mode_idx').on(table.mode),
		index('conversations_scenario_id_idx').on(table.scenarioId),
		index('conversations_is_onboarding_idx').on(table.isOnboarding),
		index('conversations_started_at_idx').on(table.startedAt),
		index('conversations_ended_at_idx').on(table.endedAt),
		// Composite index for user + language queries
		index('conversations_user_language_idx').on(table.userId, table.targetLanguageId),
		// Index for time-based queries
		index('conversations_started_ended_idx').on(table.startedAt, table.endedAt)
	]
);
