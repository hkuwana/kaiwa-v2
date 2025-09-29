import {
	pgTable,
	uuid,
	text,
	boolean,
	decimal,
	json,
	integer,
	timestamp
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { conversations } from './conversations';
import { scenarios } from './scenarios';

/**
 * Scenario Outcomes table - Records learning progress and success metrics for completed scenarios
 *
 * This table stores detailed assessment results after users complete learning scenarios.
 * It tracks goal achievement, language proficiency scores (grammar, vocabulary, pronunciation),
 * specific words used and missed, grammar errors made, AI-generated feedback and suggestions,
 * and session metrics. Used for progress tracking, personalized learning recommendations,
 * and measuring educational effectiveness.
 */
export const scenarioOutcomes = pgTable('scenario_outcomes', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id), // Required for user tracking
	conversationId: text('conversation_id')
		.notNull()
		.references(() => conversations.id),
	scenarioId: text('scenario_id')
		.notNull()
		.references(() => scenarios.id),

	// Success metrics
	wasGoalAchieved: boolean('was_goal_achieved').notNull(),
	goalCompletionScore: decimal('goal_completion_score', { precision: 3, scale: 2 }), // 0.00 to 1.00

	// Language proficiency metrics
	grammarUsageScore: decimal('grammar_usage_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
	vocabularyUsageScore: decimal('vocabulary_usage_score', { precision: 3, scale: 2 }), // 0.00 to 1.00
	pronunciationScore: decimal('pronunciation_score', { precision: 3, scale: 2 }), // 0.00 to 1.00

	// Detailed assessment
	usedTargetVocabulary: json('used_target_vocabulary').$type<string[]>(), // Words they actually used
	missedTargetVocabulary: json('missed_target_vocabulary').$type<string[]>(), // Words they should have used
	grammarErrors: json('grammar_errors').$type<string[]>(), // Specific errors made

	// AI feedback
	aiFeedback: text('ai_feedback'), // Personalized feedback from AI
	suggestions: json('suggestions').$type<string[]>(), // Improvement suggestions

	// Session data
	durationSeconds: integer('duration_seconds').notNull(),
	exchangeCount: integer('exchange_count').notNull(),

	// Metadata
	createdAt: timestamp('created_at').defaultNow().notNull()
});
