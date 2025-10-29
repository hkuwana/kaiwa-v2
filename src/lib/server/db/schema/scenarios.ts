import {
	pgTable,
	text,
	timestamp,
	json,
	index,
	boolean,
	pgEnum,
	integer,
	uuid
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Scenario role enumeration - defines the AI's role in the conversation
 *
 * MECE (Mutually Exclusive, Collectively Exhaustive) roles:
 * - tutor: Language instructor who explains rules, corrects errors, drills patterns, and guides learning
 * - character: Role-player who embodies a specific persona (nurse, executive, parent, waiter, etc.)
 * - friend: Casual conversation partner who debates, shares stories, and chats naturally
 * - expert: Specialist who pushes into advanced, domain-heavy discussions
 */
export const scenarioRoleEnum = pgEnum('scenario_role', [
	'tutor',
	'character',
	'friendly_chat',
	'expert'
]);

/**
 * Scenario difficulty enumeration for type safety
 */
export const scenarioDifficultyEnum = pgEnum('scenario_difficulty', [
	'beginner',
	'intermediate',
	'advanced'
]);

export const scenarioVisibilityEnum = pgEnum('scenario_visibility', ['public', 'private']);

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

		role: scenarioRoleEnum('role').default('tutor').notNull(),

		difficulty: scenarioDifficultyEnum('difficulty').default('beginner').notNull(),

		difficultyRating: integer('difficulty_rating'),

		cefrLevel: text('cefr_level'),

		instructions: text('instructions').notNull(),

		context: text('context').notNull(),

		learningGoal: text('learning_goal'),

		cefrRecommendation: text('cefr_recommendation'),

		persona: json('persona').$type<{
			title?: string;
			nameTemplate?: string;
			setting?: string;
			introPrompt?: string;
			stakes?: string;
		}>(),

		expectedOutcome: text('expected_outcome'),

		learningObjectives: json('learning_objectives').$type<string[]>(),

		comfortIndicators: json('comfort_indicators').$type<{
			confidence: number; // 1-5 scale
			engagement: number; // 1-5 scale
			understanding: number; // 1-5 scale
		}>(),

		createdByUserId: uuid('created_by_user_id').references(() => users.id, {
			onDelete: 'cascade'
		}),

		visibility: scenarioVisibilityEnum('visibility').default('public').notNull(),

		usageCount: integer('usage_count').default(0).notNull(),

		isActive: boolean('is_active').default(true).notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull(),

		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		// Performance indexes for scenario queries
		index('scenarios_role_idx').on(table.role),
		index('scenarios_difficulty_idx').on(table.difficulty),
		index('scenarios_is_active_idx').on(table.isActive),
		// Composite index for active scenarios by role
		index('scenarios_active_role_idx').on(table.isActive, table.role),
		// Composite index for difficulty progression
		index('scenarios_active_difficulty_idx').on(table.isActive, table.difficulty),
		// Index for user-owned scenarios
		index('scenarios_user_visibility_idx').on(table.createdByUserId, table.visibility),
		index('scenarios_user_active_idx').on(table.createdByUserId, table.isActive),
		// Index for title searches
		index('scenarios_title_idx').on(table.title)
	]
);
