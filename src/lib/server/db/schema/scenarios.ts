import { pgTable, text, timestamp, json, index, boolean } from 'drizzle-orm/pg-core';

/**
 * Scenarios table - Defines structured learning situations and contexts
 *
 * This table stores predefined conversation scenarios that guide users through
 * specific learning situations (like ordering food, job interviews, casual chat).
 * Each scenario includes instructions, context, difficulty level, learning objectives,
 * and comfort indicators to help users practice language skills in realistic contexts.
 * Used primarily for onboarding and building user confidence.
 */
export const scenarios = pgTable(
	'scenarios',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		description: text('description').notNull(),
		category: text('category')
			.$type<'onboarding' | 'comfort' | 'basic' | 'intermediate' | 'relationships' | 'roleplay'>()
			.default('comfort')
			.notNull(),

		// Language and difficulty
		difficulty: text('difficulty')
			.$type<'beginner' | 'intermediate' | 'advanced'>()
			.default('beginner')
			.notNull(),

		// Scenario content (simplified)
		instructions: text('instructions').notNull(), // What the user should do
		context: text('context').notNull(), // Background story/situation
		expectedOutcome: text('expected_outcome'), // What success looks like

		// Learning framework data
		learningObjectives: json('learning_objectives').$type<string[]>(), // What they'll learn
		comfortIndicators: json('comfort_indicators').$type<{
			confidence: number; // 1-5 scale
			engagement: number; // 1-5 scale
			understanding: number; // 1-5 scale
		}>(),

		// Metadata
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		// Performance indexes
		index('scenarios_category_idx').on(table.category),
		index('scenarios_difficulty_idx').on(table.difficulty),
		index('scenarios_is_active_idx').on(table.isActive)
	]
);
