import { pgTable, text, integer, timestamp, jsonb, index, boolean, pgEnum } from 'drizzle-orm/pg-core';

/**
 * Session type category enumeration
 * Groups session types by their primary purpose
 */
export const sessionTypeCategoryEnum = pgEnum('session_type_category', [
	'warmup', // Quick, easy sessions to build confidence
	'practice', // Core learning sessions
	'challenge', // Stretch sessions for growth
	'review' // Consolidation and reflection
]);

/**
 * 🎯 Session Types - Defines the micro-session formats users can choose from
 *
 * Each session type represents a distinct conversational format with its own
 * duration, purpose, and feel. Users pick based on available time and mood.
 *
 * **Design Philosophy (Johnny Ive meets Language Teaching):**
 * - Sessions feel complete in themselves, not "Day 3 of 28"
 * - Duration is honest (5-10 min means 5-10 min)
 * - Each type serves a distinct emotional/learning need
 * - Names are inviting, not clinical
 *
 * **Core Session Types:**
 * - ☕ Quick Check-in (3-5 min) - "How are you? What's happening?"
 * - 📖 Story Moment (5-8 min) - "Tell me about yesterday..."
 * - ❓ Question Game (5-7 min) - Structured Q&A practice
 * - 🎭 Mini Roleplay (8-10 min) - A tiny scene with context
 * - 🔄 Review Chat (5-7 min) - Revisit what you've learned
 *
 * @example
 * ```typescript
 * // Fetch available session types for a theme
 * const sessionTypes = await db.query.sessionTypes.findMany({
 *   where: eq(sessionTypes.isActive, true)
 * });
 * ```
 */
export const sessionTypes = pgTable(
	'session_types',
	{
		// Unique identifier (slug-like: 'quick-checkin', 'story-moment')
		id: text('id').primaryKey(),

		// Human-friendly name ("Quick Check-in", "Story Moment")
		name: text('name').notNull(),

		// Emoji icon for visual recognition
		icon: text('icon').notNull(),

		// Short description for selection UI
		description: text('description').notNull(),

		// Category for grouping in UI
		category: sessionTypeCategoryEnum('category').notNull(),

		// Duration range in minutes [min, max]
		durationMinutesMin: integer('duration_minutes_min').notNull(),
		durationMinutesMax: integer('duration_minutes_max').notNull(),

		// Target number of exchanges (user turns)
		targetExchanges: integer('target_exchanges').notNull(),

		// Prompt template hints for AI scenario generation
		promptHints: jsonb('prompt_hints')
			.$type<{
				tone: string; // e.g., 'casual', 'structured', 'playful'
				structure: string; // e.g., 'open', 'q-and-a', 'narrative'
				userRole: string; // What the user does in this session
				aiRole: string; // What the AI does in this session
			}>()
			.notNull(),

		// Whether this session type is available for selection
		isActive: boolean('is_active').default(true).notNull(),

		// Display order in selection UI
		displayOrder: integer('display_order').default(0).notNull(),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		index('session_types_category_idx').on(table.category),
		index('session_types_is_active_idx').on(table.isActive),
		index('session_types_display_order_idx').on(table.displayOrder)
	]
);

/**
 * Default session types to seed the database
 */
export const DEFAULT_SESSION_TYPES = [
	{
		id: 'quick-checkin',
		name: 'Quick Check-in',
		icon: '☕',
		description: 'A brief, friendly exchange. Perfect when you have just a few minutes.',
		category: 'warmup' as const,
		durationMinutesMin: 3,
		durationMinutesMax: 5,
		targetExchanges: 4,
		promptHints: {
			tone: 'warm and casual',
			structure: 'open conversation',
			userRole: 'Share how you are and what you are doing',
			aiRole: 'Friendly conversation partner who asks follow-up questions'
		},
		isActive: true,
		displayOrder: 1
	},
	{
		id: 'story-moment',
		name: 'Story Moment',
		icon: '📖',
		description: 'Share a story about something that happened. Great for building narrative skills.',
		category: 'practice' as const,
		durationMinutesMin: 5,
		durationMinutesMax: 8,
		targetExchanges: 6,
		promptHints: {
			tone: 'encouraging and curious',
			structure: 'narrative with gentle prompts',
			userRole: 'Tell a story about a recent experience',
			aiRole: 'Interested listener who asks clarifying questions'
		},
		isActive: true,
		displayOrder: 2
	},
	{
		id: 'question-game',
		name: 'Question Game',
		icon: '❓',
		description: 'Practice asking and answering questions. You ask, I answer—then we switch!',
		category: 'practice' as const,
		durationMinutesMin: 5,
		durationMinutesMax: 7,
		targetExchanges: 8,
		promptHints: {
			tone: 'playful and structured',
			structure: 'alternating Q&A rounds',
			userRole: 'Ask questions and give answers',
			aiRole: 'Question partner who models good questions'
		},
		isActive: true,
		displayOrder: 3
	},
	{
		id: 'mini-roleplay',
		name: 'Mini Roleplay',
		icon: '🎭',
		description: 'A short scene with a specific situation. Practice real conversations.',
		category: 'challenge' as const,
		durationMinutesMin: 8,
		durationMinutesMax: 10,
		targetExchanges: 8,
		promptHints: {
			tone: 'immersive but supportive',
			structure: 'scenario-based dialogue',
			userRole: 'Play yourself in a realistic situation',
			aiRole: 'Character in the scene who stays in role'
		},
		isActive: true,
		displayOrder: 4
	},
	{
		id: 'review-chat',
		name: 'Review Chat',
		icon: '🔄',
		description: 'Revisit topics from earlier this week. Reinforce what you have learned.',
		category: 'review' as const,
		durationMinutesMin: 5,
		durationMinutesMax: 7,
		targetExchanges: 6,
		promptHints: {
			tone: 'reflective and reinforcing',
			structure: 'guided review conversation',
			userRole: 'Practice vocabulary and patterns from the week',
			aiRole: 'Supportive reviewer who reintroduces familiar topics'
		},
		isActive: true,
		displayOrder: 5
	},
	{
		id: 'deep-dive',
		name: 'Deep Dive',
		icon: '🌊',
		description: 'A longer conversation when you have more time. Explore a topic fully.',
		category: 'challenge' as const,
		durationMinutesMin: 12,
		durationMinutesMax: 15,
		targetExchanges: 12,
		promptHints: {
			tone: 'engaged and exploratory',
			structure: 'extended natural conversation',
			userRole: 'Engage in a fuller discussion on a topic',
			aiRole: 'Thoughtful conversation partner'
		},
		isActive: true,
		displayOrder: 6
	}
] as const;
