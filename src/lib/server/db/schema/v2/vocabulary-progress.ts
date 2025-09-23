import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from '../users';
import { languages } from '../languages';

// 📚 VOCABULARY TRACKING - Track word mastery over time
export const vocabularyProgress = pgTable(
	'vocabulary_progress',
	{
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
	},
	(table) => [
		// Performance indexes for vocabulary progress queries
		index('vocabulary_progress_user_id_idx').on(table.userId),
		index('vocabulary_progress_language_id_idx').on(table.languageId),
		index('vocabulary_progress_mastery_level_idx').on(table.masteryLevel),
		index('vocabulary_progress_next_review_idx').on(table.nextReview),
		index('vocabulary_progress_last_updated_idx').on(table.lastUpdated),
		// Composite index for user + language queries
		index('vocabulary_progress_user_language_idx').on(table.userId, table.languageId),
		// Composite index for user + mastery level queries
		index('vocabulary_progress_user_mastery_idx').on(table.userId, table.masteryLevel),
		// Index for spaced repetition queries
		index('vocabulary_progress_review_schedule_idx').on(table.nextReview, table.masteryLevel)
	]
);
