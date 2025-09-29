import {
	pgTable,
	uuid,
	text,
	integer,
	jsonb,
	timestamp,
	decimal,
	index,
	primaryKey
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { linguisticFeatures } from './linguistic-features';
import { languages } from './languages';

/**
 * 📊 User Feature Profiles table - Tracks individual user progress on specific language features
 *
 * This table maintains a learning profile for each user showing their mastery level
 * of specific linguistic features (grammar rules, vocabulary patterns, etc.).
 * It tracks how often they encounter each feature, their success rate, mastery score,
 * review priority, and learning streaks. Used to personalize learning recommendations
 * and focus practice on areas where the user needs improvement.
 *
 * **Key Features:**
 * - 🎯 Individual feature mastery tracking
 * - 📈 Success rate and occurrence counting
 * - 🔄 Adaptive review priority calculation
 * - 🔥 Learning streak maintenance
 * - 📊 Comprehensive progress analytics
 * - 🎨 Personalized learning recommendations
 *
 * @example
 * ```typescript
 * // Track user progress on a grammar feature
 * await db.insert(userFeatureProfiles).values({
 *   userId: 'user-123',
 *   featureId: 'past-tense-irregular-verbs',
 *   languageId: 'ja',
 *   occurrenceCount: 15,
 *   cleanRunCount: 12,
 *   masteryScore: '0.80',
 *   reviewPriority: '0.3',
 *   streakLength: 5
 * });
 * ```
 */
export const userFeatureProfiles = pgTable(
	'user_feature_profiles',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		featureId: text('feature_id')
			.notNull()
			.references(() => linguisticFeatures.id, { onDelete: 'cascade' }),

		languageId: text('language_id').references(() => languages.id, { onDelete: 'set null' }),

		occurrenceCount: integer('occurrence_count').default(0).notNull(),

		cleanRunCount: integer('clean_run_count').default(0).notNull(),

		lastSeenAt: timestamp('last_seen_at'),

		lastMasteredAt: timestamp('last_mastered_at'),

		masteryScore: decimal('mastery_score', { precision: 5, scale: 2 }).default('0').notNull(),

		reviewPriority: decimal('review_priority', { precision: 5, scale: 2 }).default('1').notNull(),

		streakLength: integer('streak_length').default(0).notNull(),

		metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull(),

		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		// Composite primary key: user + feature
		primaryKey({ columns: [table.userId, table.featureId] }),

		// Performance indexes for feature profile queries
		index('user_feature_profiles_feature_idx').on(table.featureId),
		index('user_feature_profiles_language_idx').on(table.languageId),
		index('user_feature_profiles_priority_idx').on(table.reviewPriority),
		index('user_feature_profiles_mastery_idx').on(table.masteryScore),
		index('user_feature_profiles_streak_idx').on(table.streakLength),
		// Composite index for user progress analysis
		index('user_feature_profiles_user_language_idx').on(table.userId, table.languageId),
		// Index for review queue queries
		index('user_feature_profiles_review_queue_idx').on(table.reviewPriority, table.lastSeenAt)
	]
);
