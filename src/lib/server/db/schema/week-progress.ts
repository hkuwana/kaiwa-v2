import {
	pgTable,
	uuid,
	text,
	integer,
	timestamp,
	jsonb,
	index,
	decimal,
	unique
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { adaptiveWeeks } from './adaptive-weeks';
import { conversations } from './conversations';
import { sessionTypes } from './session-types';
import { learningPathAssignments } from './learning-path-assignments';

/**
 * Session record - details about a single completed session
 */
export type SessionRecord = {
	conversationId: string;
	sessionTypeId: string;
	conversationSeedId?: string; // Which seed they chose (optional)
	startedAt: string; // ISO timestamp
	completedAt: string; // ISO timestamp
	durationSeconds: number;
	exchangeCount: number; // Number of user turns
	comfortRating?: number; // 1-5 self-reported
	mood?: 'great' | 'good' | 'okay' | 'struggling'; // How they felt
};

/**
 * Vocabulary encountered during the week
 */
export type VocabularyEncounter = {
	word: string;
	timesUsed: number;
	timesCorrect: number;
	contexts: string[]; // Example sentences where used
};

/**
 * Grammar pattern usage
 */
export type GrammarEncounter = {
	pattern: string; // e.g., "past tense", "question formation"
	timesAttempted: number;
	timesCorrect: number;
	commonErrors?: string[];
};

/**
 * 📊 Week Progress - Soft progress tracking for conversations this week
 *
 * This replaces the rigid "Day 5 of 28" with a gentler "conversations this week" approach.
 * Progress is measured by:
 * - Number of sessions completed (vs suggested)
 * - Total time spent (vs target)
 * - Session variety (different types tried)
 * - Comfort/engagement trends
 *
 * **No guilt, no pressure:**
 * - 3 sessions? Great!
 * - 7 sessions? Amazing!
 * - 1 session? Still learning!
 *
 * **Key metrics tracked:**
 * - Session count and types used
 * - Total minutes practiced
 * - Vocabulary and grammar encounters
 * - Comfort ratings over time
 * - Topics that sparked joy vs. frustration
 *
 * @example
 * ```typescript
 * // Record a completed session
 * await db.update(weekProgress)
 *   .set({
 *     sessionsCompleted: sql`sessions_completed + 1`,
 *     totalMinutes: sql`total_minutes + ${sessionMinutes}`,
 *     sessions: sql`sessions || ${JSON.stringify(newSession)}::jsonb`
 *   })
 *   .where(eq(weekProgress.weekId, currentWeekId));
 * ```
 */
export const weekProgress = pgTable(
	'week_progress',
	{
		// Unique identifier
		id: uuid('id').primaryKey().defaultRandom().notNull(),

		// User this progress belongs to
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		// The assignment (user's enrollment in the path)
		assignmentId: uuid('assignment_id')
			.notNull()
			.references(() => learningPathAssignments.id, { onDelete: 'cascade' }),

		// The adaptive week being tracked
		weekId: uuid('week_id')
			.notNull()
			.references(() => adaptiveWeeks.id, { onDelete: 'cascade' }),

		// ─────────────────────────────────────────────────────
		// SOFT PROGRESS METRICS (no rigid targets)
		// ─────────────────────────────────────────────────────

		// Number of sessions completed this week
		sessionsCompleted: integer('sessions_completed').default(0).notNull(),

		// Total minutes practiced this week
		totalMinutes: decimal('total_minutes', { precision: 8, scale: 2 }).default('0').notNull(),

		// Number of different session types tried
		sessionTypesUsed: integer('session_types_used').default(0).notNull(),

		// Number of different conversation seeds explored
		seedsExplored: integer('seeds_explored').default(0).notNull(),

		// Average comfort rating (1-5) across sessions
		averageComfortRating: decimal('average_comfort_rating', { precision: 3, scale: 2 }),

		// ─────────────────────────────────────────────────────
		// DETAILED SESSION RECORDS
		// ─────────────────────────────────────────────────────

		// Array of all session records for this week
		sessions: jsonb('sessions').$type<SessionRecord[]>().notNull().default([]),

		// Set of session type IDs used (for quick lookup)
		sessionTypeIdsUsed: jsonb('session_type_ids_used').$type<string[]>().notNull().default([]),

		// Set of conversation seed IDs explored
		seedIdsExplored: jsonb('seed_ids_explored').$type<string[]>().notNull().default([]),

		// ─────────────────────────────────────────────────────
		// LEARNING ANALYTICS (for weekly analysis)
		// ─────────────────────────────────────────────────────

		// Vocabulary encountered this week
		vocabularyEncounters: jsonb('vocabulary_encounters')
			.$type<VocabularyEncounter[]>()
			.notNull()
			.default([]),

		// Grammar patterns practiced
		grammarEncounters: jsonb('grammar_encounters')
			.$type<GrammarEncounter[]>()
			.notNull()
			.default([]),

		// Topics that went well (user felt confident)
		topicsThatSparkedJoy: jsonb('topics_that_sparked_joy').$type<string[]>().notNull().default([]),

		// Topics that were challenging
		topicsThatWereChallenging: jsonb('topics_that_were_challenging')
			.$type<string[]>()
			.notNull()
			.default([]),

		// ─────────────────────────────────────────────────────
		// STREAKS & ENGAGEMENT (encouraging, not punishing)
		// ─────────────────────────────────────────────────────

		// Days with at least one session this week (0-7)
		activeDaysThisWeek: integer('active_days_this_week').default(0).notNull(),

		// Current streak of consecutive active days
		currentStreakDays: integer('current_streak_days').default(0).notNull(),

		// Longest streak during this week
		longestStreakThisWeek: integer('longest_streak_this_week').default(0).notNull(),

		// Last session timestamp
		lastSessionAt: timestamp('last_session_at'),

		// ─────────────────────────────────────────────────────
		// TIMESTAMPS
		// ─────────────────────────────────────────────────────

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		// Performance indexes
		index('week_progress_user_id_idx').on(table.userId),
		index('week_progress_assignment_id_idx').on(table.assignmentId),
		index('week_progress_week_id_idx').on(table.weekId),
		index('week_progress_last_session_idx').on(table.lastSessionAt),
		// Unique: one progress record per user per week
		unique('week_progress_user_week_unique').on(table.userId, table.weekId),
		// Composite: find user's active week progress
		index('week_progress_user_assignment_idx').on(table.userId, table.assignmentId)
	]
);

/**
 * 🔗 Week Sessions - Links individual conversations to week progress
 *
 * While weekProgress.sessions stores summary data, this table provides
 * the actual foreign key relationships for queries and joins.
 */
export const weekSessions = pgTable(
	'week_sessions',
	{
		id: uuid('id').primaryKey().defaultRandom().notNull(),

		// The week progress record
		weekProgressId: uuid('week_progress_id')
			.notNull()
			.references(() => weekProgress.id, { onDelete: 'cascade' }),

		// The actual conversation
		conversationId: text('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),

		// Session type used
		sessionTypeId: text('session_type_id')
			.notNull()
			.references(() => sessionTypes.id),

		// Which conversation seed they chose (optional - might be free choice)
		conversationSeedId: text('conversation_seed_id'),

		// Session timing
		startedAt: timestamp('started_at').notNull(),
		completedAt: timestamp('completed_at'),
		durationSeconds: integer('duration_seconds'),

		// Engagement metrics
		exchangeCount: integer('exchange_count').default(0).notNull(),
		comfortRating: integer('comfort_rating'), // 1-5
		mood: text('mood').$type<'great' | 'good' | 'okay' | 'struggling'>(),

		// User's reflection (optional)
		userReflection: text('user_reflection'),

		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('week_sessions_week_progress_idx').on(table.weekProgressId),
		index('week_sessions_conversation_idx').on(table.conversationId),
		index('week_sessions_session_type_idx').on(table.sessionTypeId),
		index('week_sessions_started_at_idx').on(table.startedAt),
		// Composite: sessions for a week ordered by time
		index('week_sessions_week_time_idx').on(table.weekProgressId, table.startedAt)
	]
);
