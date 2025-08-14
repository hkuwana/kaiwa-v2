import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { languages } from './languages.js';

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
