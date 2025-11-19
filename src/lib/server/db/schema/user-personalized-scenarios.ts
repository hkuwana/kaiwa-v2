import { pgTable, text, timestamp, json, index, boolean, uuid, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { scenarios } from './scenarios';

/**
 * 🎯 User Personalized Scenarios table
 *
 * Stores AI-generated, user-specific scenarios created during onboarding based on
 * the user's high-stakes conversation goal. These scenarios are tailored to the
 * user's actual needs (e.g., "Meeting Yuto's parents in Tokyo" for Sofia ICP).
 *
 * **Why This Exists:**
 * - Generic scenarios don't match the user's actual high-stakes moment
 * - ICP research shows users need specific, personalized practice
 * - Example: Sofia (Bilingual Spouse) needs "Meeting partner's parents" with HER partner's name
 * - Creates "magic moment" when user sees their EXACT goal as a scenario
 *
 * **Key Features:**
 * - ✅ Generated during onboarding from user's goal/timeline/participants
 * - 🎨 Fully customized context, phrases, and learning objectives
 * - 📅 Timeline tracking (e.g., "18 days until you meet Yuto's parents")
 * - 🔗 Can be linked to base scenarios template or standalone
 * - 💎 Premium feature (free tier: 1 personalized scenario, paid: unlimited)
 * - 📊 Tracks usage and completion to measure personalization effectiveness
 *
 * **Generation Flow:**
 * 1. Onboarding: User answers "Who do you want to talk to in Japanese?"
 * 2. AI generates scenario using GPT-4 with ICP-aware templates
 * 3. Stored in this table with personalized phrases and context
 * 4. Surfaced prominently on scenarios page and dashboard
 *
 * @example
 * ```typescript
 * // Sofia's personalized scenario
 * await db.insert(userPersonalizedScenarios).values({
 *   userId: 'sofia-123',
 *   title: "Meeting Yuto's Parents - First Dinner",
 *   context: "You're at Yuto's family home in Setagaya. His mother serves tea...",
 *   conversationGoal: "meeting boyfriend's parents",
 *   conversationTimeline: "3 weeks",
 *   conversationParticipants: "Yuto's parents in Tokyo",
 *   personalizedPhrases: [
 *     { ja: "Yutoと2年間付き合っています", en: "I've been dating Yuto for 2 years" },
 *     { ja: "ご家族にお会いできて嬉しいです", en: "I'm happy to meet your family" }
 *   ],
 *   learningObjectives: [
 *     "Introduce yourself politely",
 *     "Express gratitude for the invitation",
 *     "Talk about your relationship with Yuto"
 *   ]
 * });
 * ```
 */
export const userPersonalizedScenarios = pgTable(
	'user_personalized_scenarios',
	{
		id: uuid('id').primaryKey().defaultRandom(),

		// User relationship
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		// Optional link to base scenario template (if generated from existing scenario)
		baseScenarioId: text('base_scenario_id').references(() => scenarios.id, {
			onDelete: 'set null'
		}),

		// Scenario content (customized)
		title: text('title').notNull(),
		description: text('description'),
		context: text('context').notNull(), // Fully personalized scenario setting
		expectedOutcome: text('expected_outcome'),
		learningObjectives: json('learning_objectives').$type<string[]>(),

		// Personalization metadata (from onboarding)
		conversationGoal: text('conversation_goal').notNull(), // "meeting boyfriend's parents"
		conversationTimeline: text('conversation_timeline'), // "3 weeks", "next month"
		conversationParticipants: text('conversation_participants'), // "Yuto's parents in Tokyo"
		targetLanguage: text('target_language').notNull(), // "ja", "es", "fr"

		// Personalized phrases (specific to user's context)
		personalizedPhrases: json('personalized_phrases').$type<
			Array<{
				targetLanguage: string;
				english: string;
				usage?: string;
			}>
		>(),

		// User context used for generation
		userContext: json('user_context').$type<{
			relationshipDuration?: string;
			occupation?: string;
			interests?: string[];
			learningReason?: string;
		}>(),

		// Status & visibility
		isActive: boolean('is_active').default(true).notNull(),
		isPrimary: boolean('is_primary').default(false).notNull(), // Featured as "Your Personalized Scenario"

		// Engagement tracking
		timesUsed: integer('times_used').default(0).notNull(),
		lastUsedAt: timestamp('last_used_at'),

		// Generation metadata
		generatedBy: text('generated_by').default('openai-gpt-4').notNull(),
		generationPrompt: text('generation_prompt'), // Store for debugging/iteration

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		// Query optimizations
		index('user_personalized_scenarios_user_idx').on(table.userId),
		index('user_personalized_scenarios_active_idx').on(table.isActive),
		index('user_personalized_scenarios_primary_idx').on(table.isPrimary),
		index('user_personalized_scenarios_language_idx').on(table.targetLanguage)
	]
);

export type UserPersonalizedScenario = typeof userPersonalizedScenarios.$inferSelect;
export type NewUserPersonalizedScenario = typeof userPersonalizedScenarios.$inferInsert;
