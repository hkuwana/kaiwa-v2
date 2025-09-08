import { pgTable, uuid, text, integer, timestamp, index, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users'; // Assuming you have a users table
import { languages } from './languages'; // Assuming you have a languages table
import { DEFAULT_VOICE } from '../../../types/openai.realtime.types';

export const learningMotivationEnum = pgEnum('learning_motivation_enum', [
	'Connection',
	'Career',
	'Travel',
	'Academic',
	'Culture',
	'Growth'
]);

export const challengePreferenceEnum = pgEnum('challenge_preference_enum', [
	'comfortable',
	'moderate',
	'challenging'
]);

export const correctionStyleEnum = pgEnum('correction_style_enum', [
	'immediate',
	'gentle',
	'end_of_session'
]);

export const userPreferences = pgTable(
	'user_preferences',
	{
		id: uuid('id').primaryKey().defaultRandom().notNull(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(), // Added onDelete cascade

		// Essential learning preferences
		targetLanguageId: text('target_language_id')
			.references(() => languages.id)
			.notNull(),
		learningGoal: learningMotivationEnum('learning_goal').default('Connection').notNull(), // Using ENUM
		preferredVoice: text('preferred_voice').default(DEFAULT_VOICE).notNull(), // Could also be an enum
		dailyGoalSeconds: integer('daily_goal_seconds').default(180).notNull(), // 3 minutes (Full length of free version)

		// Skill breakdown by competency (the source of truth for user skill)
		speakingLevel: integer('speaking_level').default(5).notNull(), // 1-100
		listeningLevel: integer('listening_level').default(5).notNull(), // 1-100
		readingLevel: integer('reading_level').default(5).notNull(), // 1-100
		writingLevel: integer('writing_level').default(5).notNull(), // 1-100
		// `overallSkillLevel` can be calculated in the app to prevent sync issues

		// Confidence tracking
		speakingConfidence: integer('speaking_confidence').default(25).notNull(),
		successfulExchanges: integer('successful_exchanges').default(0).notNull(),
		comfortZone: jsonb('comfort_zone').$type<string[]>().default([]),

		conversationContext: jsonb('conversation_context').$type<{
			userName?: string;
			occupation?: string;
			learningReason?: string;
			recentTopics?: string[];
		}>(),

		// Specific learning goals (using jsonb for better querying and performance)
		specificGoals: jsonb('specific_goals').$type<string[]>(), // e.g., ["ordering food", "job interview"]

		// Adaptive learning preferences (using ENUMs)
		challengePreference: challengePreferenceEnum('challenge_preference')
			.default('moderate')
			.notNull(),
		correctionStyle: correctionStyleEnum('correction_style').default('gentle').notNull(),

		// User memories - array of personal facts and preferences learned from conversations
		memories: jsonb('memories').$type<string[]>().default([]), // Array of memory strings like "Wants to learn because of speaking with grandma"

		// Analytics and progress tracking
		recentSessionScores: jsonb('recent_session_scores').$type<number[]>().default([]), // Last 10 session performance scores
		skillLevelHistory: jsonb('skill_level_history')
			.$type<
				Array<{
					date: string;
					speaking?: number;
					listening?: number;
					reading?: number;
					writing?: number;
				}>
			>()
			.default([]), // Last 30 skill level entries

		// Metadata
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date()) // Automatically update on change
			.notNull(),
		// Realtime audio interaction settings (client UX preferences)
		audioSettings: jsonb('audio_settings').$type<{
			mode?: 'toggle' | 'push_to_talk';
			pressBehavior?: 'tap_toggle' | 'press_hold';
			autoGreet?: boolean;
			greetingMode?: 'scenario' | 'generic';
		}>()
	},
	(table) => [
		index('user_preferences_user_id_idx').on(table.userId),
		index('user_preferences_target_language_idx').on(table.targetLanguageId)
	]
);
