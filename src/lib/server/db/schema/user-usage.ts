import {
	pgTable,
	text,
	integer,
	timestamp,
	index,
	primaryKey,
	uuid,
	jsonb
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * 📊 User Usage table - Tracks monthly usage limits and consumption by user
 *
 * This table monitors how much each user has consumed of their monthly allowances
 * (conversations, seconds, realtime sessions, analyses, etc.). It tracks usage for
 * all users regardless of tier to enable conversion analytics and limit enforcement.
 * Includes feature-specific usage tracking, banking (rollover) for paid users,
 * daily granular tracking, engagement metrics, and business analytics data.
 *
 * **Key Features:**
 * - 📅 Monthly usage period tracking (YYYY-MM format)
 * - 🎯 Comprehensive feature usage monitoring
 * - 🏦 Session banking/rollover for paid users
 * - 📊 Daily granular usage tracking
 * - 📈 Engagement and quality metrics
 * - 💰 Business analytics and overage tracking
 * - 🔄 Real-time limit enforcement
 *
 * @example
 * ```typescript
 * // Track monthly usage for a user
 * await db.insert(userUsage).values({
 *   userId: 'user-123',
 *   period: '2025-01',
 *   conversationsUsed: 15,
 *   secondsUsed: 1800,
 *   realtimeSessionsUsed: 5,
 *   analysesUsed: 3,
 *   tierWhenUsed: 'plus'
 * });
 * ```
 */
export const userUsage = pgTable(
	'user_usage',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		period: text('period').notNull(),

		conversationsUsed: integer('conversations_used').default(0),

		secondsUsed: integer('seconds_used').default(0),

		realtimeSessionsUsed: integer('realtime_sessions_used').default(0),

		bankedSeconds: integer('banked_seconds').default(0),

		bankedSecondsUsed: integer('banked_seconds_used').default(0),

		ankiExportsUsed: integer('anki_exports_used').default(0),

		sessionExtensionsUsed: integer('session_extensions_used').default(0),

		advancedVoiceSeconds: integer('advanced_voice_seconds').default(0),

		analysesUsed: integer('analyses_used').default(0),

		basicAnalysesUsed: integer('basic_analyses_used').default(0),

		quickStatsUsed: integer('quick_stats_used').default(0),

		grammarSuggestionsUsed: integer('grammar_suggestions_used').default(0),

		advancedGrammarUsed: integer('advanced_grammar_used').default(0),

		fluencyAnalysisUsed: integer('fluency_analysis_used').default(0),

		phraseSuggestionsUsed: integer('phrase_suggestions_used').default(0),

		onboardingProfileUsed: integer('onboarding_profile_used').default(0),

		pronunciationAnalysisUsed: integer('pronunciation_analysis_used').default(0),

		speechRhythmUsed: integer('speech_rhythm_used').default(0),

		audioSuggestionUsed: integer('audio_suggestion_used').default(0),

		dailyUsage: jsonb('daily_usage').$type<Record<string, Record<string, number>>>().default({}),

		completedSessions: integer('completed_sessions').default(0),

		longestSessionSeconds: integer('longest_session_seconds').default(0),

		averageSessionSeconds: integer('average_session_seconds').default(0),

		overageSeconds: integer('overage_seconds').default(0),

		tierWhenUsed: text('tier_when_used').default('free'),

		lastConversationAt: timestamp('last_conversation_at'),

		lastRealtimeAt: timestamp('last_realtime_at'),

		lastAnalysisAt: timestamp('last_analysis_at'),

		firstActivityAt: timestamp('first_activity_at'),

		createdAt: timestamp('created_at').defaultNow(),

		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		// Composite primary key: user + period
		primaryKey({ columns: [table.userId, table.period] }),

		// Performance indexes for usage queries
		index('user_usage_user_idx').on(table.userId),
		index('user_usage_period_idx').on(table.period),
		index('user_usage_user_period_idx').on(table.userId, table.period),
		index('user_usage_tier_idx').on(table.tierWhenUsed),
		// Index for overage tracking
		index('user_usage_overage_idx').on(table.overageSeconds),
		// Index for engagement analysis
		index('user_usage_last_activity_idx').on(table.lastConversationAt, table.lastRealtimeAt)
	]
);
