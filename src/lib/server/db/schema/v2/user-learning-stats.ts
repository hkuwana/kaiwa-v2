import { pgTable, uuid, text, integer, decimal, timestamp, json, index } from 'drizzle-orm/pg-core';
import { users } from '../users';
import { languages } from '../languages';

// User learning statistics and progress tracking
export const userLearningStats = pgTable(
	'user_learning_stats',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		languageId: text('language_id')
			.notNull()
			.references(() => languages.id),

		// Overall progress
		totalStudyTimeMinutes: integer('total_study_time_minutes').default(0),
		totalConversations: integer('total_conversations').default(0),
		totalScenariosCompleted: integer('total_scenarios_completed').default(0),
		currentStreakDays: integer('current_streak_days').default(0),
		longestStreakDays: integer('longest_streak_days').default(0),

		// Proficiency tracking
		overallProficiency: decimal('overall_proficiency', { precision: 3, scale: 2 }).default('0.00'), // 0.00 to 1.00
		grammarProficiency: decimal('grammar_proficiency', { precision: 3, scale: 2 }).default('0.00'),
		vocabularyProficiency: decimal('vocabulary_proficiency', { precision: 3, scale: 2 }).default(
			'0.00'
		),
		pronunciationProficiency: decimal('pronunciation_proficiency', {
			precision: 3,
			scale: 2
		}).default('0.00'),

		// Achievement tracking
		achievements: json('achievements').$type<
			{
				id: string;
				earnedAt: string;
				description: string;
			}[]
		>(),

		// Learning milestones
		milestones: json('milestones').$type<{
			id: string;
			achievedAt: string;
			description: string;
			level: string;
		}>(),

		// Study patterns
		studyPatterns: json('study_patterns').$type<{
			preferredTimeOfDay: string;
			averageSessionLength: number;
			mostActiveDays: string[];
		}>(),

		// Metadata
		firstStudied: timestamp('first_studied').defaultNow(),
		lastStudied: timestamp('last_studied').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		// Performance indexes
		index('user_learning_stats_user_id_idx').on(table.userId),
		index('user_learning_stats_language_id_idx').on(table.languageId),
		index('user_learning_stats_last_studied_idx').on(table.lastStudied),
		index('user_learning_stats_overall_proficiency_idx').on(table.overallProficiency),
		// Composite index for user + language queries
		index('user_learning_stats_user_language_idx').on(table.userId, table.languageId),
		// Index for leaderboard queries
		index('user_learning_stats_proficiency_language_idx').on(
			table.overallProficiency,
			table.languageId
		)
	]
);
