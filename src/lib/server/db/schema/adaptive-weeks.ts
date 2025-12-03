import {
	pgTable,
	text,
	uuid,
	integer,
	timestamp,
	jsonb,
	index,
	pgEnum,
	boolean
} from 'drizzle-orm/pg-core';
import { learningPaths } from './learning-paths';

/**
 * Week status enumeration
 */
export const weekStatusEnum = pgEnum('adaptive_week_status', [
	'locked', // Not yet accessible (future week)
	'active', // Current week, user can practice
	'completed', // Week finished, analysis done
	'skipped' // User chose to skip this week
]);

/**
 * Conversation seed - a prompt/idea for generating a specific conversation
 */
export type ConversationSeed = {
	id: string; // Unique seed ID within the week
	title: string; // Short title ("Morning coffee chat")
	description: string; // What this conversation is about
	suggestedSessionTypes: string[]; // Which session types work well
	vocabularyHints: string[]; // Key words/phrases to practice
	grammarHints: string[]; // Grammar patterns to reinforce
	scenarioId?: string; // Generated scenario ID (once created)
};

/**
 * Focus area - something the user should work on
 */
export type FocusArea = {
	type: 'vocabulary' | 'grammar' | 'pronunciation' | 'fluency' | 'confidence';
	description: string; // e.g., "Past tense verbs"
	priority: 'high' | 'medium' | 'low';
	source: 'baseline' | 'analysis' | 'user_request';
};

/**
 * Leverage area - something the user is already good at
 */
export type LeverageArea = {
	type: 'vocabulary' | 'grammar' | 'topic' | 'skill';
	description: string; // e.g., "Food vocabulary", "Present tense"
	confidence: number; // 0-100
};

/**
 * 📅 Adaptive Weeks - Flexible weekly themes that adapt based on progress
 *
 * Instead of 28 fixed days, we have 4 adaptive weeks. Each week:
 * - Has a theme that breathes (not 7 rigid lessons)
 * - Contains conversation "seeds" that can spawn multiple sessions
 * - Adapts based on the previous week's analysis
 * - Lets users choose session types based on time/mood
 *
 * **Key Philosophy:**
 * - Week 1 is the "Anchor Week" - establishes baseline
 * - Weeks 2-4 are "Flow Weeks" - adapt based on previous analysis
 * - No "Day 3 of 28" guilt - just "conversations this week"
 * - User picks session type + conversation seed = personalized micro-session
 *
 * **Adaptation Flow:**
 * ```
 * Week 1 ends → AI analyzes all conversations →
 * Week 2 generated with focus areas from struggles +
 * leverage areas from strengths
 * ```
 *
 * @example
 * ```typescript
 * // Create Week 1 (Anchor Week)
 * await db.insert(adaptiveWeeks).values({
 *   pathId: 'dutch-family-intro',
 *   weekNumber: 1,
 *   theme: 'Mijn Dag',
 *   themeDescription: 'Talk about your daily life...',
 *   status: 'active',
 *   conversationSeeds: [...],
 *   isAnchorWeek: true
 * });
 * ```
 */
export const adaptiveWeeks = pgTable(
	'adaptive_weeks',
	{
		// Unique identifier
		id: uuid('id').primaryKey().defaultRandom().notNull(),

		// Parent learning path
		pathId: text('path_id')
			.notNull()
			.references(() => learningPaths.id, { onDelete: 'cascade' }),

		// Week number (1-4 typically, but flexible)
		weekNumber: integer('week_number').notNull(),

		// Week theme - the overarching topic
		theme: text('theme').notNull(),

		// Longer description of the week's focus
		themeDescription: text('theme_description').notNull(),

		// Target difficulty range for this week (CEFR-style)
		difficultyMin: text('difficulty_min').notNull(), // e.g., 'A1'
		difficultyMax: text('difficulty_max').notNull(), // e.g., 'A2'

		// Week status
		status: weekStatusEnum('status').default('locked').notNull(),

		// Is this the baseline/anchor week? (Week 1 typically)
		isAnchorWeek: boolean('is_anchor_week').default(false).notNull(),

		// Pool of conversation ideas for this week
		// Users can do any of these, multiple times if they want
		conversationSeeds: jsonb('conversation_seeds')
			.$type<ConversationSeed[]>()
			.notNull()
			.default([]),

		// Focus areas - things to work on (populated from analysis or baseline)
		focusAreas: jsonb('focus_areas').$type<FocusArea[]>().notNull().default([]),

		// Leverage areas - things to build on (populated from analysis)
		leverageAreas: jsonb('leverage_areas').$type<LeverageArea[]>().notNull().default([]),

		// Suggested number of sessions for this week (soft target, not rigid)
		suggestedSessionCount: integer('suggested_session_count').default(5).notNull(),

		// Minimum sessions to "complete" the week (flexible)
		minimumSessionCount: integer('minimum_session_count').default(3).notNull(),

		// When this week becomes available
		unlocksAt: timestamp('unlocks_at'),

		// When user started this week
		startedAt: timestamp('started_at'),

		// When user completed this week
		completedAt: timestamp('completed_at'),

		// Reference to the analysis that generated this week (null for Week 1)
		generatedFromAnalysisId: uuid('generated_from_analysis_id'),

		// Metadata for additional context
		metadata: jsonb('metadata').$type<{
			generationPrompt?: string; // What prompt was used to generate this week
			userFeedback?: string; // Any feedback user gave about this week
			skipReason?: string; // Why user skipped (if skipped)
		}>(),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		// Performance indexes
		index('adaptive_weeks_path_id_idx').on(table.pathId),
		index('adaptive_weeks_week_number_idx').on(table.weekNumber),
		index('adaptive_weeks_status_idx').on(table.status),
		index('adaptive_weeks_unlocks_at_idx').on(table.unlocksAt),
		// Composite: find active week for a path
		index('adaptive_weeks_path_status_idx').on(table.pathId, table.status),
		// Composite: ordering within path
		index('adaptive_weeks_path_week_idx').on(table.pathId, table.weekNumber)
	]
);

/**
 * Default week themes for common learning paths
 * These serve as templates that get customized based on user goals
 */
export const DEFAULT_WEEK_THEMES = {
	'daily-life': [
		{
			weekNumber: 1,
			theme: 'My Day',
			themeDescription:
				'Start with the familiar. Talk about your daily routines, what you did today, simple plans for tomorrow. Build confidence with present and near-past.',
			isAnchorWeek: true,
			difficultyMin: 'A1',
			difficultyMax: 'A2'
		},
		{
			weekNumber: 2,
			theme: 'Last Week',
			themeDescription:
				'Expand into the recent past. Share stories about what happened, describe experiences, practice narrative flow.',
			isAnchorWeek: false,
			difficultyMin: 'A2',
			difficultyMax: 'A2'
		},
		{
			weekNumber: 3,
			theme: 'My Life',
			themeDescription:
				'Go deeper. Talk about your life, interests, relationships, and experiences. Express opinions and preferences.',
			isAnchorWeek: false,
			difficultyMin: 'A2',
			difficultyMax: 'B1'
		},
		{
			weekNumber: 4,
			theme: 'The Moment',
			themeDescription:
				'Practice for your goal. Rehearse the real conversations you want to have, integrate everything learned.',
			isAnchorWeek: false,
			difficultyMin: 'B1',
			difficultyMax: 'B1'
		}
	],
	'meet-family': [
		{
			weekNumber: 1,
			theme: 'Introducing Myself',
			themeDescription:
				'The basics of talking about yourself. Name, work, hobbies, how you met your partner. Comfortable, low-pressure practice.',
			isAnchorWeek: true,
			difficultyMin: 'A1',
			difficultyMax: 'A2'
		},
		{
			weekNumber: 2,
			theme: 'Daily Life Stories',
			themeDescription:
				'Share stories about your days, weekends, and routines. Practice past tense naturally through storytelling.',
			isAnchorWeek: false,
			difficultyMin: 'A2',
			difficultyMax: 'A2'
		},
		{
			weekNumber: 3,
			theme: 'Opinions & Preferences',
			themeDescription:
				'Express what you like, what you think, gentle opinions. Food, places, activities. Build personality in the language.',
			isAnchorWeek: false,
			difficultyMin: 'A2',
			difficultyMax: 'B1'
		},
		{
			weekNumber: 4,
			theme: 'Family Dinner',
			themeDescription:
				'The big rehearsal. Practice common family dinner scenarios: questions from parents, small talk, telling stories.',
			isAnchorWeek: false,
			difficultyMin: 'B1',
			difficultyMax: 'B1'
		}
	]
} as const;
