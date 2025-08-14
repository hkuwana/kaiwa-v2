import { pgTable, text, boolean, timestamp, json } from 'drizzle-orm/pg-core';
import { languages } from './languages';

// 🎯 LEARNING SCENARIOS - Core feature for task-oriented learning
export const scenarios = pgTable('scenarios', {
	id: text('id').primaryKey(), // e.g., 'cafe-ordering', 'directions-asking'
	languageId: text('language_id')
		.notNull()
		.references(() => languages.id),

	// Scenario metadata
	title: text('title').notNull(), // e.g., 'Ordering at a Café'
	description: text('description').notNull(), // e.g., 'Practice ordering coffee and food'
	context: text('context').notNull(), // e.g., 'You are at a café in Tokyo'
	goal: text('goal').notNull(), // e.g., 'Order one coffee and one pastry'

	// Difficulty and categorization
	difficulty: text('difficulty')
		.$type<'beginner' | 'intermediate' | 'advanced'>()
		.notNull()
		.default('beginner'),
	category: text('category').notNull(), // e.g., 'food', 'travel', 'business'

	// Learning objectives
	targetGrammar: text('target_grammar'), // e.g., 'polite form (-masu)'
	targetVocabulary: json('target_vocabulary').$type<string[]>(), // ['コーヒー', 'ケーキ', 'お願いします']
	exampleResponses: json('example_responses').$type<string[]>(), // ['コーヒーを一つお願いします']

	// Scaffolding features
	translationHints: json('translation_hints').$type<Record<string, string>>(), // {'コーヒー': 'coffee'}
	vocabularyPreview: json('vocabulary_preview').$type<string[]>(), // Words to show before starting

	// AI behavior configuration
	aiRole: text('ai_role').notNull(), // e.g., 'café staff member'
	aiPersonality: text('ai_personality'), // e.g., 'friendly and helpful'

	// 🎯 Success criteria for assessment
	successCriteria: json('success_criteria').$type<{
		requiredVocabulary: string[];
		optionalVocabulary: string[];
		grammarPatterns: string[];
		goalSteps: string[];
	}>(),

	// Metadata
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});
