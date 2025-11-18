import {
	pgTable,
	uuid,
	text,
	integer,
	timestamp,
	index,
	pgEnum,
	jsonb,
	unique
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { languages } from './languages';
import { DEFAULT_VOICE } from '../../../types/openai.realtime.types';

/**
 * Learning motivation enumeration for user goals
 */
export const learningMotivationEnum = pgEnum('learning_motivation_enum', [
	'Connection',
	'Career',
	'Travel',
	'Academic',
	'Culture',
	'Growth'
]);

/**
 * Challenge preference enumeration for adaptive learning
 */
export const challengePreferenceEnum = pgEnum('challenge_preference_enum', [
	'comfortable',
	'moderate',
	'challenging'
]);

/**
 * Correction style enumeration for feedback delivery
 */
export const correctionStyleEnum = pgEnum('correction_style_enum', [
	'immediate',
	'gentle',
	'end_of_session'
]);

/**
 * Audio input mode enumeration for microphone control
 */
export const audioInputModeEnum = pgEnum('audio_input_mode_enum', [
	'vad', // Voice Activity Detection (automatic)
	'ptt' // Push-to-Talk (manual)
]);

/**
 * Speech speed enumeration for AI pacing control
 */
export const speechSpeedEnum = pgEnum('speech_speed_enum', [
	'auto',
	'very_slow',
	'slow',
	'normal',
	'fast',
	'native'
]);

/**
 * 🎯 User Preferences table - Stores individual user learning preferences and progress
 *
 * This table contains detailed learning preferences for each user-language combination.
 * It tracks skill levels (speaking, listening, reading, writing), learning goals and motivations,
 * conversation context and memories, progress history, and adaptive learning settings
 * like challenge preference and correction style. Each user can have different preferences
 * for different target languages they're learning.
 *
 * **Key Features:**
 * - 🌍 Multi-language support per user
 * - 📊 Comprehensive skill level tracking (speaking, listening, reading, writing)
 * - 🎯 Personalized learning goals and motivations
 * - 🧠 Conversation context and memory system
 * - 📈 Progress tracking and analytics
 * - 🎨 Adaptive learning preferences
 * - ⭐ Favorite scenarios and personalization
 *
 * @example
 * ```typescript
 * // Create user preferences for Japanese learning
 * await db.insert(userPreferences).values({
 *   userId: 'user-123',
 *   targetLanguageId: 'ja',
 *   learningGoal: 'Travel',
 *   preferredVoice: 'ja-jp-male',
 *   dailyGoalSeconds: 300,
 *   speakingLevel: 25,
 *   listeningLevel: 30,
 *   readingLevel: 15,
 *   writingLevel: 10,
 *   currentLanguageLevel: 'A1.2',
 *   practicalLevel: 'basic-greetings',
 *   challengePreference: 'moderate',
 *   correctionStyle: 'gentle'
 * });
 * ```
 */
export const userPreferences = pgTable(
	'user_preferences',
	{
		id: uuid('id').primaryKey().defaultRandom().notNull(),

		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		targetLanguageId: text('target_language_id')
			.references(() => languages.id, { onDelete: 'cascade' })
			.notNull(),

		learningGoal: learningMotivationEnum('learning_goal').default('Connection').notNull(),

		preferredVoice: text('preferred_voice').default(DEFAULT_VOICE).notNull(),

		dailyGoalSeconds: integer('daily_goal_seconds').default(180).notNull(), // 3 minutes (Full length of free version)

		speakingLevel: integer('speaking_level').default(5).notNull(),

		listeningLevel: integer('listening_level').default(5).notNull(),

		readingLevel: integer('reading_level').default(5).notNull(),

		writingLevel: integer('writing_level').default(5).notNull(),
		// `overallSkillLevel` can be calculated in the app to prevent sync issues

		currentLanguageLevel: text('current_language_level').default('A1.1').notNull(),

		practicalLevel: text('practical_level').default('basic-greetings').notNull(),

		confidenceScore: integer('confidence_score').default(50).notNull(),

		lastLevelAssessment: timestamp('last_level_assessment'),

		levelProgression: jsonb('level_progression')
			.$type<
				Array<{
					level: string;
					practicalLevel: string;
					achievedAt: string; // ISO date string
					confidenceAtTime: number;
				}>
			>()
			.default([]),

		speakingConfidence: integer('speaking_confidence').default(25).notNull(),

		successfulExchanges: integer('successful_exchanges').default(0).notNull(),

		comfortZone: jsonb('comfort_zone').$type<string[]>().default([]),

		conversationContext: jsonb('conversation_context').$type<{
			userName?: string;
			occupation?: string;
			learningReason?: string;
			recentTopics?: string[];
		}>(),

		specificGoals: jsonb('specific_goals').$type<string[]>(),

		challengePreference: challengePreferenceEnum('challenge_preference')
			.default('moderate')
			.notNull(),

		correctionStyle: correctionStyleEnum('correction_style').default('gentle').notNull(),

		audioInputMode: audioInputModeEnum('audio_input_mode').default('ptt').notNull(),

		speechSpeed: speechSpeedEnum('speech_speed').default('slow').notNull(),

		memories: jsonb('memories').$type<string[]>().default([]),

		favoriteScenarioIds: jsonb('favorite_scenario_ids').$type<string[]>().default([]),

		recentSessionScores: jsonb('recent_session_scores').$type<number[]>().default([]),

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
			.default([]),

		createdAt: timestamp('created_at').defaultNow().notNull(),

		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
		// Note: Audio settings and email preferences moved to userSettings table
	},
	(table) => [
		// Performance indexes for user preference queries
		index('user_preferences_user_id_idx').on(table.userId),
		index('user_preferences_target_language_idx').on(table.targetLanguageId),
		index('user_preferences_learning_goal_idx').on(table.learningGoal),
		index('user_preferences_confidence_idx').on(table.confidenceScore),
		// Unique constraint: one preference record per user-language combination
		unique('user_preferences_user_language_unique').on(table.userId, table.targetLanguageId),
		// Composite index for user progress analysis
		index('user_preferences_user_confidence_idx').on(table.userId, table.confidenceScore)
	]
);
