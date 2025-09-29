import { pgTable, text, timestamp, json, index, boolean, pgEnum } from 'drizzle-orm/pg-core';

/**
 * Scenario category enumeration for type safety
 */
export const scenarioCategoryEnum = pgEnum('scenario_category', [
	'onboarding',
	'comfort',
	'basic',
	'intermediate',
	'relationships',
	'roleplay'
]);

/**
 * Scenario difficulty enumeration for type safety
 */
export const scenarioDifficultyEnum = pgEnum('scenario_difficulty', [
	'beginner',
	'intermediate',
	'advanced'
]);

/**
 * 🎭 Scenarios table - Defines structured learning situations and contexts
 *
 * This table stores predefined conversation scenarios that guide users through
 * specific learning situations (like ordering food, job interviews, casual chat).
 * Each scenario includes instructions, context, difficulty level, learning objectives,
 * and comfort indicators to help users practice language skills in realistic contexts.
 * Used primarily for onboarding and building user confidence.
 *
 * **Key Features:**
 * - 🎯 Structured learning situations for realistic practice
 * - 📊 Difficulty progression (beginner → intermediate → advanced)
 * - 🎨 Multiple categories (onboarding, comfort, roleplay, etc.)
 * - 📝 Clear learning objectives and success criteria
 * - 😊 Comfort indicators for user confidence tracking
 * - 🔄 Active/inactive status for content management
 *
 * @example
 * ```typescript
 * // Create a restaurant ordering scenario
 * await db.insert(scenarios).values({
 *   id: 'restaurant-ordering',
 *   title: 'Ordering Food at a Restaurant',
 *   description: 'Practice ordering food and drinks at a Japanese restaurant',
 *   category: 'basic',
 *   difficulty: 'beginner',
 *   instructions: 'Order a meal and ask about ingredients',
 *   context: 'You are at a Japanese restaurant for lunch...',
 *   expectedOutcome: 'Successfully order a meal and ask questions',
 *   learningObjectives: ['food vocabulary', 'polite expressions', 'asking questions'],
 *   comfortIndicators: { confidence: 3, engagement: 4, understanding: 3 }
 * });
 * ```
 */
export const scenarios = pgTable(
	'scenarios',
	{
		id: text('id').primaryKey(),

		title: text('title').notNull(),

		description: text('description').notNull(),

		category: scenarioCategoryEnum('category').default('comfort').notNull(),

		difficulty: scenarioDifficultyEnum('difficulty').default('beginner').notNull(),

		instructions: text('instructions').notNull(),

		context: text('context').notNull(),

		expectedOutcome: text('expected_outcome'),

		learningObjectives: json('learning_objectives').$type<string[]>(),

		comfortIndicators: json('comfort_indicators').$type<{
			confidence: number; // 1-5 scale
			engagement: number; // 1-5 scale
			understanding: number; // 1-5 scale
		}>(),

		isActive: boolean('is_active').default(true).notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull(),

		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		// Performance indexes for scenario queries
		index('scenarios_category_idx').on(table.category),
		index('scenarios_difficulty_idx').on(table.difficulty),
		index('scenarios_is_active_idx').on(table.isActive),
		// Composite index for active scenarios by category
		index('scenarios_active_category_idx').on(table.isActive, table.category),
		// Composite index for difficulty progression
		index('scenarios_active_difficulty_idx').on(table.isActive, table.difficulty),
		// Index for title searches
		index('scenarios_title_idx').on(table.title)
	]
);
