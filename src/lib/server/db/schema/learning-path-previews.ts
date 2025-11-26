import { pgTable, text, timestamp, jsonb, index, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import type { DayScheduleEntry } from './learning-paths';

/**
 * Preview session status enumeration
 */
export const previewStatusEnum = pgEnum('preview_status', [
	'generating',
	'ready',
	'committed'
]);

/**
 * Scenario preview type - embedded in preview session
 */
export type ScenarioPreview = {
	title: string;
	description: string;
	difficulty: string;
	objectives?: string[];
	sampleDialogue?: {
		ai: string;
		user?: string;
	};
	context?: string;
	role?: string;
	instructions?: string;
};

/**
 * 🎯 Learning Path Previews - Temporary preview sessions for path creation
 *
 * This table stores temporary preview sessions when users create learning paths
 * through the dashboard. Previews are generated instantly with first 3 scenarios
 * and allow users to refine before committing to a real learning path.
 *
 * **Key Features:**
 * - ⚡ Instant generation (8-12 seconds)
 * - 🎨 Preview first 3 scenarios before committing
 * - ✨ Natural language refinement
 * - 🔄 Individual scenario regeneration
 * - 🗑️ Auto-cleanup after 24 hours
 * - 💾 Temporary storage (not saved to learning_paths until commit)
 *
 * **Lifecycle:**
 * 1. User types intent → generates preview (status: 'generating')
 * 2. Preview ready with 3 scenarios (status: 'ready')
 * 3. User can refine/regenerate scenarios
 * 4. User commits → creates real learning_path (status: 'committed')
 * 5. Cleanup cron deletes expired/committed previews
 *
 * @example
 * Create preview session:
 * await db.insert(learningPathPreviews).values({
 *   userId: 'user-123',
 *   sessionId: 'abc123',
 *   intent: 'Learn Japanese for business',
 *   title: 'Business Japanese - 30 Day Journey',
 *   description: 'Master professional Japanese communication',
 *   targetLanguage: 'ja',
 *   sourceLanguage: 'en',
 *   schedule: [dayEntries],
 *   previewScenarios: {
 *     1: scenarioData1,
 *     2: scenarioData2,
 *     3: scenarioData3
 *   },
 *   status: 'ready',
 *   expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
 * });
 */
export const learningPathPreviews = pgTable(
	'learning_path_previews',
	{
		// Primary identifier
		id: uuid('id').defaultRandom().primaryKey(),

		// User who created this preview
		userId: uuid('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),

		// Short session ID for URL (e.g., 'abc123')
		sessionId: text('session_id').notNull().unique(),

		// Original user intent
		intent: text('intent').notNull(),

		// Generated path metadata
		title: text('title').notNull(),
		description: text('description').notNull(),
		targetLanguage: text('target_language').notNull(),
		sourceLanguage: text('source_language').notNull().default('en'),

		// Complete 30-day schedule (same format as learning_paths)
		schedule: jsonb('schedule').$type<DayScheduleEntry[]>().notNull(),

		// Preview scenarios (embedded, days 1-3)
		// Format: { "1": {...}, "2": {...}, "3": {...} }
		previewScenarios: jsonb('preview_scenarios')
			.$type<Record<string, ScenarioPreview>>()
			.notNull()
			.default({}),

		// Preview status
		status: previewStatusEnum('status').default('generating').notNull(),

		// If committed, link to created learning path
		committedPathId: text('committed_path_id'),

		// Timestamps
		createdAt: timestamp('created_at').defaultNow().notNull(),
		expiresAt: timestamp('expires_at').notNull(), // Auto-delete after 24h

		// Metadata for generation context
		metadata: jsonb('metadata').$type<{
			parsedIntent?: {
				targetLanguage: string;
				sourceLanguage: string;
				learningGoal?: string;
				proficiencyLevel?: string;
				preferences?: string[];
			};
			refinementHistory?: Array<{
				prompt: string;
				timestamp: string;
			}>;
			regeneratedDays?: number[]; // Which days were regenerated
		}>()
	},
	(table) => [
		// Performance indexes
		index('learning_path_previews_user_id_idx').on(table.userId),
		index('learning_path_previews_session_id_idx').on(table.sessionId),
		index('learning_path_previews_status_idx').on(table.status),
		index('learning_path_previews_expires_at_idx').on(table.expiresAt), // For cleanup cron
		index('learning_path_previews_committed_path_idx').on(table.committedPathId),
		// Composite index for active user previews
		index('learning_path_previews_user_status_idx').on(table.userId, table.status)
	]
);

/**
 * Type exports for use in services
 */
export type LearningPathPreview = typeof learningPathPreviews.$inferSelect;
export type NewLearningPathPreview = typeof learningPathPreviews.$inferInsert;
