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
 * Scenario category enumeration for browsing and filtering
 */
export const scenarioCategoryEnum = pgEnum('scenario_category', [
	'relationships', // Dating, family, friends
	'professional', // Work, business, networking
	'travel', // Tourism, navigation, accommodation
	'education', // School, university, tutoring
	'health', // Medical, wellness, emergency
	'daily_life', // Shopping, errands, household
	'entertainment', // Hobbies, culture, media
	'food_drink', // Restaurants, cooking, bars
	'services', // Banking, government, utilities
	'emergency' // Crisis, urgent situations
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
 * - 🎨 Multiple categories (relationships, professional, travel, etc.)
 * - 📝 Clear learning objectives and success criteria
 * - 😊 Comfort indicators for user confidence tracking
 * - 🔄 Active/inactive status for content management
 * - 🏷️ Tags and searchable keywords for discovery
 * - 🖼️ Visual thumbnails for browsing
 * - ⏱️ Duration tracking in seconds for session planning
 * - 👤 Author attribution for UGC
 * - 🔗 Shareable links for viral growth
 *
 * @example
 * ```typescript
 * // Create a restaurant ordering scenario
 * await db.insert(scenarios).values({
 *   id: 'restaurant-ordering',
 *   title: 'Ordering Food at a Restaurant',
 *   description: 'Practice ordering food and drinks at a Japanese restaurant',
 *   categories: ['food_drink', 'daily_life'],
 *   tags: ['restaurant', 'ordering', 'food'],
 *   difficulty: 'beginner',
 *   estimatedDurationSeconds: 600, // 10 minutes
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

		// ===== PHASE 1: Discovery & Sharing Fields =====

		// Categories for browsing (e.g., ['relationships', 'family'])
		categories: json('categories').$type<string[]>(),

		// User-defined tags (e.g., ['parents', 'first impression', 'dinner'])
		tags: json('tags').$type<string[]>(),

		// Primary skill focus: conversation, listening, vocabulary, grammar
		primarySkill: text('primary_skill'),

		// Search keywords for discovery (e.g., ['meet parents', 'earn trust'])
		searchKeywords: json('search_keywords').$type<string[]>(),

		// Target languages this scenario is designed for (null = all languages)
		// e.g., ['nl'] for Dutch-only, ['nl', 'de'] for Dutch + German
		// Language-specific scenarios (like grammar drills) should set this field
		// Generic scenarios (like "Heart-to-Heart Talk") should leave it null
		targetLanguages: json('target_languages').$type<string[]>(),

		// Visual thumbnail URL (watercolor/artistic style preferred)
		thumbnailUrl: text('thumbnail_url'),

		// ⚠️ OPTIONAL UX METADATA: Estimated duration in SECONDS (e.g., 600 = 10 minutes)
		// This is NOT used for tier usage tracking. Actual conversation time is tracked via:
		//   - user_usage.secondsUsed (actual time spent)
		//   - tiers.monthlySeconds (tier limit)
		// This field is purely for helping users plan their practice sessions.
		// You do NOT need to fill this out for new scenarios. We track actual usage instead.
		estimatedDurationSeconds: integer('estimated_duration_seconds'), // Nullable - optional UX hint

		// Author attribution for user-generated content
		authorDisplayName: text('author_display_name').default('Kaiwa Team'),

		// Shareable URL slug (e.g., 'meeting-parents-jb2k')
		shareSlug: text('share_slug'),

		// Full shareable URL (generated)
		shareUrl: text('share_url'),

		// ===== End Phase 1 Fields =====

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
		index('scenarios_title_idx').on(table.title),
		// Phase 1: Discovery & browsing indexes
		index('scenarios_primary_skill_idx').on(table.primarySkill),
		index('scenarios_duration_idx').on(table.estimatedDurationSeconds),
		index('scenarios_share_slug_idx').on(table.shareSlug)
	]
);
