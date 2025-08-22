import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { languages } from './languages';

// User preferences and settings - MVP focused and extensible
export const userPreferences = pgTable(
	'user_preferences',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),

		// Essential learning preferences
		targetLanguageId: text('target_language_id').references(() => languages.id),
		learningGoal: text('learning_goal')
			.$type<'casual' | 'conversational' | 'fluent'>()
			.default('conversational'),
		preferredVoice: text('preferred_voice').default('alloy'),
		dailyGoalMinutes: integer('daily_goal_minutes').default(30),

		// Basic progress tracking (simplified from userLearningStats)
		totalStudyTimeMinutes: integer('total_study_time_minutes').default(0),
		totalConversations: integer('total_conversations').default(0),
		currentStreakDays: integer('current_streak_days').default(0),
		lastStudied: timestamp('last_studied').defaultNow(),

		// UI preferences
		theme: text('theme').$type<'light' | 'dark' | 'auto'>().default('auto'),

		// Metadata
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		// Performance indexes
		index('user_preferences_user_id_idx').on(table.userId),
		index('user_preferences_target_language_idx').on(table.targetLanguageId),
		index('user_preferences_updated_at_idx').on(table.updatedAt)
	]
);
