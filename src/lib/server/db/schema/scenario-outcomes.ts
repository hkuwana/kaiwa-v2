import {
	pgTable,
	uuid,
	text,
	boolean,
	decimal,
	json,
	integer,
	timestamp,
	index
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { conversations } from './conversations';
import { scenarios } from './scenarios';

/**
 * 🏆 Scenario Outcomes table - Records learning progress and success metrics for completed scenarios
 *
 * This table stores detailed assessment results after users complete learning scenarios.
 * It tracks goal achievement, language proficiency scores (grammar, vocabulary, pronunciation),
 * specific words used and missed, grammar errors made, AI-generated feedback and suggestions,
 * and session metrics. Used for progress tracking, personalized learning recommendations,
 * and measuring educational effectiveness.
 *
 * **Key Features:**
 * - 🎯 Goal achievement tracking with completion scores
 * - 📊 Multi-dimensional proficiency scoring (grammar, vocabulary, pronunciation)
 * - 📝 Detailed vocabulary usage analysis (used vs. missed words)
 * - 🤖 AI-generated personalized feedback and suggestions
 * - 📈 Progress tracking for learning analytics
 * - 🔍 Error analysis for targeted improvement
 *
 * @example
 * ```typescript
 * // Record a successful scenario completion
 * await db.insert(scenarioOutcomes).values({
 *   userId: 'user-123',
 *   conversationId: 'conv-456',
 *   scenarioId: 'restaurant-ordering',
 *   wasGoalAchieved: true,
 *   goalCompletionScore: '0.85',
 *   grammarUsageScore: '0.90',
 *   vocabularyUsageScore: '0.75',
 *   pronunciationScore: '0.80',
 *   usedTargetVocabulary: ['こんにちは', 'メニュー', 'お願いします'],
 *   missedTargetVocabulary: ['いただきます', 'ごちそうさまでした'],
 *   aiFeedback: 'Great job! You handled the ordering well...',
 *   durationSeconds: 300,
 *   exchangeCount: 8
 * });
 * ```
 */
export const scenarioOutcomes = pgTable(
	'scenario_outcomes',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		conversationId: text('conversation_id')
			.notNull()
			.references(() => conversations.id, { onDelete: 'cascade' }),

		scenarioId: text('scenario_id')
			.notNull()
			.references(() => scenarios.id, { onDelete: 'cascade' }),

		wasGoalAchieved: boolean('was_goal_achieved').notNull(),

		goalCompletionScore: decimal('goal_completion_score', { precision: 3, scale: 2 }),

		grammarUsageScore: decimal('grammar_usage_score', { precision: 3, scale: 2 }),

		vocabularyUsageScore: decimal('vocabulary_usage_score', { precision: 3, scale: 2 }),

		pronunciationScore: decimal('pronunciation_score', { precision: 3, scale: 2 }),

		usedTargetVocabulary: json('used_target_vocabulary').$type<string[]>(),

		missedTargetVocabulary: json('missed_target_vocabulary').$type<string[]>(),

		grammarErrors: json('grammar_errors').$type<string[]>(),

		aiFeedback: text('ai_feedback'),

		suggestions: json('suggestions').$type<string[]>(),

		durationSeconds: integer('duration_seconds').notNull(),

		exchangeCount: integer('exchange_count').notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		// Performance indexes for scenario outcome queries
		index('scenario_outcomes_user_id_idx').on(table.userId),
		index('scenario_outcomes_conversation_id_idx').on(table.conversationId),
		index('scenario_outcomes_scenario_id_idx').on(table.scenarioId),
		index('scenario_outcomes_goal_achieved_idx').on(table.wasGoalAchieved),
		index('scenario_outcomes_created_at_idx').on(table.createdAt),
		// Composite index for user progress analysis
		index('scenario_outcomes_user_scenario_idx').on(table.userId, table.scenarioId),
		// Index for proficiency score queries
		index('scenario_outcomes_grammar_score_idx').on(table.grammarUsageScore),
		index('scenario_outcomes_vocabulary_score_idx').on(table.vocabularyUsageScore),
		index('scenario_outcomes_pronunciation_score_idx').on(table.pronunciationScore)
	]
);
