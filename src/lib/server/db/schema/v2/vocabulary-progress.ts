import { pgTable, uuid, text, integer, timestamp, index, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../users';
import { languages } from '../languages';

/**
 * Vocabulary mastery level enumeration
 */
export const masteryLevelEnum = pgEnum('mastery_level', [
	'new',
	'learning',
	'practicing',
	'mastered'
]);

/**
 * 📚 Vocabulary Progress table - Advanced vocabulary tracking with spaced repetition
 *
 * This table implements sophisticated vocabulary tracking with spaced repetition algorithms
 * to optimize learning retention. It tracks individual word mastery levels, encounter counts,
 * successful usage, and review scheduling to provide personalized vocabulary learning experiences.
 * This is part of the V2 advanced features that go beyond basic MVP functionality.
 *
 * **Key Features:**
 * - 🎯 Individual word mastery tracking
 * - 📊 Encounter and success rate analytics
 * - 🔄 Spaced repetition scheduling
 * - 📈 Adaptive review intervals
 * - 🎨 Personalized learning recommendations
 * - 📚 Comprehensive vocabulary analytics
 * - 🎯 Language-specific word tracking
 *
 * @example
 * ```typescript
 * // Track vocabulary progress for a word
 * await db.insert(vocabularyProgress).values({
 *   userId: 'user-123',
 *   languageId: 'ja',
 *   word: 'こんにちは',
 *   encounterCount: 5,
 *   successfulUsageCount: 4,
 *   masteryLevel: 'practicing',
 *   nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
 *   reviewInterval: 3
 * });
 * ```
 */
export const vocabularyProgress = pgTable(
	'vocabulary_progress',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		languageId: text('language_id')
			.notNull()
			.references(() => languages.id, { onDelete: 'cascade' }),

		word: text('word').notNull(),

		encounterCount: integer('encounter_count').default(0).notNull(),

		successfulUsageCount: integer('successful_usage_count').default(0).notNull(),

		masteryLevel: masteryLevelEnum('mastery_level').default('new').notNull(),

		lastReviewed: timestamp('last_reviewed'),

		nextReview: timestamp('next_review'),

		reviewInterval: integer('review_interval'),

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
		index('vocabulary_progress_word_idx').on(table.word),
		// Composite index for user + language queries
		index('vocabulary_progress_user_language_idx').on(table.userId, table.languageId),
		// Composite index for user + mastery level queries
		index('vocabulary_progress_user_mastery_idx').on(table.userId, table.masteryLevel),
		// Index for spaced repetition queries
		index('vocabulary_progress_review_schedule_idx').on(table.nextReview, table.masteryLevel),
		// Index for word-specific queries
		index('vocabulary_progress_word_language_idx').on(table.word, table.languageId),
		// Index for success rate analysis
		index('vocabulary_progress_success_rate_idx').on(
			table.encounterCount,
			table.successfulUsageCount
		)
	]
);
