import { pgTable, text, timestamp, json, index } from 'drizzle-orm/pg-core';

// Scenarios - MVP focused on onboarding and comfort-building
export const scenarios = pgTable(
	'scenarios',
	{
		id: text('id').primaryKey(),
		title: text('title').notNull(),
		description: text('description'),
		category: text('category')
			.$type<'onboarding' | 'comfort' | 'basic' | 'intermediate'>()
			.default('comfort'),

		// Language and difficulty
		difficulty: text('difficulty')
			.$type<'beginner' | 'intermediate' | 'advanced'>()
			.default('beginner'),

		// Scenario content (simplified)
		instructions: text('instructions'), // What the user should do
		context: text('context'), // Background story/situation
		expectedOutcome: text('expected_outcome'), // What success looks like

		// Learning framework data
		learningObjectives: json('learning_objectives').$type<string[]>(), // What they'll learn
		comfortIndicators: json('comfort_indicators').$type<{
			confidence: number; // 1-5 scale
			engagement: number; // 1-5 scale
			understanding: number; // 1-5 scale
		}>(),

		// Metadata
		isActive: text('is_active').default('true'),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		// Performance indexes
		index('scenarios_category_idx').on(table.category),
		index('scenarios_difficulty_idx').on(table.difficulty),
		index('scenarios_is_active_idx').on(table.isActive)
	]
);
