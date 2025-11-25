import {
	pgTable,
	text,
	timestamp,
	jsonb,
	index,
	boolean,
	uuid,
	pgEnum
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Learning path status enumeration
 */
export const learningPathStatusEnum = pgEnum('learning_path_status', [
	'draft',
	'active',
	'archived'
]);

/**
 * Day schedule entry type for learning path schedule
 */
export type DayScheduleEntry = {
	dayIndex: number; // 1-28 (or up to 30 for custom paths)
	scenarioId?: string; // Optional until generated
	theme: string;
	difficulty: string; // e.g., 'A1', 'A2', 'B1', or 'beginner', 'intermediate', 'advanced'
	description?: string; // Optional daily description
};

/**
 * 📚 Learning Paths table - Defines 4-week structured learning curricula
 *
 * This table stores learning path definitions that guide users through multi-week
 * learning programs. Each path contains a schedule of daily lessons with themes,
 * difficulty progression, and linked scenarios. Paths can be:
 * - User-specific (created from preferences)
 * - Creator-authored (custom courses)
 * - Anonymous templates (public, SEO-friendly versions)
 *
 * **Key Features:**
 * - 📅 4-week (or custom length) structured schedules
 * - 🎯 Daily themes and difficulty progression
 * - 🔗 Links to generated scenarios
 * - 👤 User-specific or anonymous templates
 * - 🌐 Public templates for SEO/discovery
 * - 📊 Template vs user-specific paths
 * - 🔒 PII protection for public templates
 *
 * @example
 * ```typescript
 * // Create a user-specific learning path
 * await db.insert(learningPaths).values({
 *   id: 'jp-business-path-abc123',
 *   userId: 'user-123',
 *   title: 'Business Japanese - 4 Week Intensive',
 *   description: 'Prepare for business meetings in Japanese',
 *   schedule: [
 *     { dayIndex: 1, theme: 'Introductions', difficulty: 'A2' },
 *     { dayIndex: 2, theme: 'Email etiquette', difficulty: 'A2' },
 *     // ... more days
 *   ],
 *   isTemplate: false,
 *   isPublic: false,
 *   status: 'active'
 * });
 *
 * // Create an anonymous template (for SEO)
 * await db.insert(learningPaths).values({
 *   id: 'jp-meet-parents-template',
 *   userId: null, // Anonymous
 *   title: '4-Week Japanese: Meeting Partner\'s Parents',
 *   description: 'Master family conversations and polite Japanese',
 *   shareSlug: 'jp-meet-parents-four-week',
 *   isTemplate: true,
 *   isPublic: true,
 *   status: 'active'
 * });
 * ```
 */
export const learningPaths = pgTable(
	'learning_paths',
	{
		// Primary identifier (slug-like, e.g., 'jp-meet-parents-four-week-path')
		id: text('id').primaryKey(),

		// Owner user (null for anonymous templates)
		userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),

		// Human-readable title (scrubbed for templates)
		title: text('title').notNull(),

		// Description/summary (scrubbed for templates)
		description: text('description').notNull(),

		// Target language for this path (e.g., 'ja', 'es', 'fr')
		targetLanguage: text('target_language').notNull(),

		// Ordered array of day entries with themes, difficulty, and scenario IDs
		schedule: jsonb('schedule').$type<DayScheduleEntry[]>().notNull().default([]),

		// Template vs user-specific path
		isTemplate: boolean('is_template').default(false).notNull(),

		// Public visibility (for SEO indexing)
		isPublic: boolean('is_public').default(false).notNull(),

		// SEO-friendly slug for public access (e.g., 'jp-meet-parents-four-week')
		shareSlug: text('share_slug'),

		// Path status: draft, active, archived
		status: learningPathStatusEnum('status').default('active').notNull(),

		// User who created this (for creator-authored paths)
		createdByUserId: uuid('created_by_user_id').references(() => users.id, {
			onDelete: 'set null'
		}),

		// Metadata for path context (optional)
		metadata: jsonb('metadata').$type<{
			cefrLevel?: string; // e.g., 'A2', 'B1'
			primarySkill?: string; // e.g., 'conversation', 'listening'
			estimatedMinutesPerDay?: number; // e.g., 20
			category?: string; // e.g., 'relationships', 'professional'
			tags?: string[]; // e.g., ['family', 'formal', 'dinner']
		}>(),

		createdAt: timestamp('created_at').defaultNow().notNull(),

		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		// Performance indexes for learning path queries
		index('learning_paths_user_id_idx').on(table.userId),
		index('learning_paths_is_template_idx').on(table.isTemplate),
		index('learning_paths_is_public_idx').on(table.isPublic),
		index('learning_paths_status_idx').on(table.status),
		index('learning_paths_share_slug_idx').on(table.shareSlug),
		index('learning_paths_target_language_idx').on(table.targetLanguage),
		// Composite index for public template discovery
		index('learning_paths_public_templates_idx').on(table.isTemplate, table.isPublic),
		// Composite index for user's active paths
		index('learning_paths_user_active_idx').on(table.userId, table.status),
		// Index for creator-authored paths
		index('learning_paths_creator_idx').on(table.createdByUserId)
	]
);
