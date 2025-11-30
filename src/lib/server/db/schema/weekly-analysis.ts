import {
	pgTable,
	uuid,
	text,
	integer,
	timestamp,
	jsonb,
	index,
	decimal,
	pgEnum
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { adaptiveWeeks } from './adaptive-weeks';
import { weekProgress } from './week-progress';
import { learningPathAssignments } from './learning-path-assignments';

/**
 * Analysis status enumeration
 */
export const analysisStatusEnum = pgEnum('weekly_analysis_status', [
	'pending', // Waiting to be processed
	'processing', // AI is analyzing
	'completed', // Analysis done, next week generated
	'failed' // Something went wrong
]);

/**
 * Strength identified during the week
 */
export type IdentifiedStrength = {
	area: 'vocabulary' | 'grammar' | 'pronunciation' | 'fluency' | 'confidence' | 'topic';
	description: string; // e.g., "Strong use of present tense"
	evidence: string[]; // Example utterances showing strength
	confidenceScore: number; // 0-100 how confident we are about this
};

/**
 * Challenge identified during the week
 */
export type IdentifiedChallenge = {
	area: 'vocabulary' | 'grammar' | 'pronunciation' | 'fluency' | 'confidence' | 'topic';
	description: string; // e.g., "Hesitation with past tense verbs"
	evidence: string[]; // Example utterances showing challenge
	suggestedApproach: string; // How to address this next week
	severity: 'minor' | 'moderate' | 'significant';
};

/**
 * Topic affinity - what topics the user enjoys
 */
export type TopicAffinity = {
	topic: string; // e.g., "food", "family", "work"
	engagementLevel: 'high' | 'medium' | 'low';
	sessionsInTopic: number;
	averageComfortInTopic: number; // 1-5
};

/**
 * Recommendation for next week
 */
export type NextWeekRecommendation = {
	type: 'focus' | 'leverage' | 'introduce' | 'avoid';
	area: string;
	description: string;
	reasoning: string; // Why this recommendation
	priority: 'high' | 'medium' | 'low';
};

/**
 * Generated conversation seed for next week
 */
export type GeneratedSeed = {
	id: string;
	title: string;
	description: string;
	suggestedSessionTypes: string[];
	vocabularyHints: string[];
	grammarHints: string[];
	reasoning: string; // Why this seed was generated
};

/**
 * 📈 Weekly Analysis - AI analysis of the week's progress that shapes next week
 *
 * At the end of each week, the AI reviews all conversations and progress to:
 * 1. Identify what went well (strengths to leverage)
 * 2. Identify challenges (areas to focus on gently)
 * 3. Notice topic preferences (what sparks joy)
 * 4. Generate recommendations for next week
 * 5. Create conversation seeds for the next week
 *
 * **The Magic of Adaptation:**
 * ```
 * Week 1 Progress → Analysis → Week 2 Generated
 *                             (tailored to user)
 * ```
 *
 * **Analysis considers:**
 * - Vocabulary usage and accuracy
 * - Grammar patterns attempted and success rate
 * - Topics that engaged vs. topics that felt hard
 * - Session types preferred
 * - Comfort ratings and mood trends
 * - Time spent and consistency
 *
 * @example
 * ```typescript
 * // Create analysis for completed week
 * const analysis = await db.insert(weeklyAnalysis).values({
 *   userId: user.id,
 *   weekId: completedWeek.id,
 *   weekProgressId: weekProgress.id,
 *   status: 'pending'
 * }).returning();
 *
 * // Process analysis asynchronously
 * await weeklyAnalysisQueue.add(analysis.id);
 * ```
 */
export const weeklyAnalysis = pgTable(
	'weekly_analysis',
	{
		// Unique identifier
		id: uuid('id').primaryKey().defaultRandom().notNull(),

		// User this analysis is for
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		// The assignment (enrollment)
		assignmentId: uuid('assignment_id')
			.notNull()
			.references(() => learningPathAssignments.id, { onDelete: 'cascade' }),

		// The week being analyzed
		weekId: uuid('week_id')
			.notNull()
			.references(() => adaptiveWeeks.id, { onDelete: 'cascade' }),

		// The progress record for this week
		weekProgressId: uuid('week_progress_id')
			.notNull()
			.references(() => weekProgress.id, { onDelete: 'cascade' }),

		// Analysis status
		status: analysisStatusEnum('status').default('pending').notNull(),

		// ─────────────────────────────────────────────────────
		// SUMMARY METRICS (from progress)
		// ─────────────────────────────────────────────────────

		// Sessions completed this week
		totalSessions: integer('total_sessions').default(0).notNull(),

		// Total minutes practiced
		totalMinutes: decimal('total_minutes', { precision: 8, scale: 2 }).default('0').notNull(),

		// Average comfort rating across sessions
		averageComfort: decimal('average_comfort', { precision: 3, scale: 2 }),

		// Days active this week
		activeDays: integer('active_days').default(0).notNull(),

		// ─────────────────────────────────────────────────────
		// AI-GENERATED INSIGHTS
		// ─────────────────────────────────────────────────────

		// What the user did well
		strengths: jsonb('strengths').$type<IdentifiedStrength[]>().notNull().default([]),

		// Areas that need gentle attention
		challenges: jsonb('challenges').$type<IdentifiedChallenge[]>().notNull().default([]),

		// Topic preferences
		topicAffinities: jsonb('topic_affinities').$type<TopicAffinity[]>().notNull().default([]),

		// Session type preferences
		preferredSessionTypes: jsonb('preferred_session_types').$type<string[]>().notNull().default([]),

		// ─────────────────────────────────────────────────────
		// RECOMMENDATIONS FOR NEXT WEEK
		// ─────────────────────────────────────────────────────

		// AI recommendations
		recommendations: jsonb('recommendations')
			.$type<NextWeekRecommendation[]>()
			.notNull()
			.default([]),

		// Generated conversation seeds for next week
		generatedSeeds: jsonb('generated_seeds').$type<GeneratedSeed[]>().notNull().default([]),

		// Suggested theme for next week
		suggestedNextTheme: text('suggested_next_theme'),

		// Suggested difficulty adjustment
		suggestedDifficultyAdjustment: text('suggested_difficulty_adjustment').$type<
			'maintain' | 'increase' | 'decrease'
		>(),

		// ─────────────────────────────────────────────────────
		// NARRATIVE SUMMARY (human-readable)
		// ─────────────────────────────────────────────────────

		// Friendly summary of the week (shown to user)
		weekSummary: text('week_summary'),

		// Encouragement message
		encouragementMessage: text('encouragement_message'),

		// Preview of what's coming next week
		nextWeekPreview: text('next_week_preview'),

		// ─────────────────────────────────────────────────────
		// PROCESSING METADATA
		// ─────────────────────────────────────────────────────

		// When analysis started processing
		processingStartedAt: timestamp('processing_started_at'),

		// When analysis completed
		completedAt: timestamp('completed_at'),

		// If failed, what went wrong
		errorMessage: text('error_message'),

		// Retry count
		retryCount: integer('retry_count').default(0).notNull(),

		// The next week ID that was generated from this analysis
		generatedWeekId: uuid('generated_week_id'),

		// Raw AI response (for debugging)
		rawAiResponse: jsonb('raw_ai_response'),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		// Performance indexes
		index('weekly_analysis_user_id_idx').on(table.userId),
		index('weekly_analysis_assignment_id_idx').on(table.assignmentId),
		index('weekly_analysis_week_id_idx').on(table.weekId),
		index('weekly_analysis_status_idx').on(table.status),
		index('weekly_analysis_completed_at_idx').on(table.completedAt),
		// Composite: find pending analyses
		index('weekly_analysis_pending_idx').on(table.status, table.createdAt)
	]
);

/**
 * Analysis prompt template for AI
 * This structures what the AI should look for when analyzing a week
 */
export const WEEKLY_ANALYSIS_PROMPT_TEMPLATE = `
You are analyzing a language learner's week of practice. Your goal is to:

1. **Identify Strengths** - What did they do well? Look for:
   - Vocabulary used correctly
   - Grammar patterns they're comfortable with
   - Topics where they showed confidence
   - Improvements from early to late in the week

2. **Identify Challenges** (gently) - What needs more practice? Look for:
   - Vocabulary gaps
   - Grammar patterns that caused hesitation
   - Topics that seemed uncomfortable
   - Patterns of self-correction or confusion

3. **Notice Topic Affinities** - What topics engaged them?
   - Which conversation seeds did they return to?
   - Where did they speak more freely?
   - What topics had higher comfort ratings?

4. **Generate Recommendations** - How should next week adapt?
   - What to build on (leverage strengths)
   - What to gently introduce more of (address challenges)
   - What topics to include (spark joy)
   - What to avoid or delay (if something was frustrating)

5. **Create Next Week's Seeds** - Generate 4-6 conversation prompts that:
   - Build on this week's theme
   - Incorporate topics they enjoyed
   - Gently weave in areas for growth
   - Feel fresh but familiar

Be encouraging. This is about growth, not judgment.
The learner should feel good about what they accomplished.
`;
