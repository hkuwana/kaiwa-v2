import {
	pgTable,
	uuid,
	text,
	integer,
	timestamp,
	index,
	pgEnum,
	boolean,
	jsonb,
	unique
} from 'drizzle-orm/pg-core';
import { learningPaths } from './learning-paths';
import { users } from './users';

/**
 * Assignment role enumeration
 */
export const assignmentRoleEnum = pgEnum('assignment_role', ['tester', 'learner']);

/**
 * Assignment status enumeration
 */
export const assignmentStatusEnum = pgEnum('assignment_status', [
	'invited',
	'active',
	'completed',
	'archived'
]);

/**
 * 🎓 Learning Path Assignments table - Tracks user enrollment in learning paths
 *
 * This table manages which users are following which learning paths. It supports:
 * - Testers: Early users testing creator-authored courses
 * - Learners: Regular users enrolled in public or private paths
 *
 * Assignments track progress, start dates, and completion status. They enable:
 * - Email automation (daily reminders based on currentDayIndex)
 * - Progress tracking per user
 * - Cohort management (multiple users on same path)
 * - Tester feedback loops
 *
 * **Key Features:**
 * - 👥 User enrollment tracking
 * - 📅 Start date and progress tracking
 * - 🎯 Role-based assignments (tester vs learner)
 * - 📊 Current day index for email automation
 * - 🔔 Email opt-in/opt-out
 * - ✅ Completion tracking
 *
 * @example
 * ```typescript
 * // Assign a tester to a creator-authored path
 * await db.insert(learningPathAssignments).values({
 *   pathId: 'jp-business-path-abc123',
 *   userId: 'tester-456',
 *   role: 'tester',
 *   status: 'active',
 *   startsAt: new Date('2025-12-01'),
 *   currentDayIndex: 0
 * });
 *
 * // Public user enrolls in template
 * await db.insert(learningPathAssignments).values({
 *   pathId: 'jp-meet-parents-template',
 *   userId: 'user-789',
 *   role: 'learner',
 *   status: 'active',
 *   startsAt: new Date(), // Start immediately
 *   currentDayIndex: 0
 * });
 * ```
 */
export const learningPathAssignments = pgTable(
	'learning_path_assignments',
	{
		// Unique assignment identifier
		id: uuid('id').primaryKey().defaultRandom().notNull(),

		// Reference to learning path (template or user-specific)
		pathId: text('path_id')
			.notNull()
			.references(() => learningPaths.id, { onDelete: 'cascade' }),

		// User enrolled in this path
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		// Role: tester (early feedback) or learner (regular user)
		role: assignmentRoleEnum('role').default('learner').notNull(),

		// Assignment status: invited, active, completed, archived
		status: assignmentStatusEnum('status').default('invited').notNull(),

		// When this course should start for this user
		startsAt: timestamp('starts_at').notNull(),

		// Current progress (0 = not started, 1-28 = current day)
		currentDayIndex: integer('current_day_index').default(0).notNull(),

		// When user completed the path (null if in progress)
		completedAt: timestamp('completed_at'),

		// Email automation opt-in (for daily reminders)
		emailRemindersEnabled: boolean('email_reminders_enabled').default(true).notNull(),

		// Last email sent date (for tracking)
		lastEmailSentAt: timestamp('last_email_sent_at'),

		// Metadata for assignment context
		metadata: jsonb('metadata').$type<{
			invitedBy?: string; // User ID who invited this person
			inviteNote?: string; // Custom message from inviter
			feedbackRequested?: boolean; // Whether creator wants feedback
			customStartTime?: string; // Preferred time for daily emails (HH:MM format)
		}>(),

		createdAt: timestamp('created_at').defaultNow().notNull(),

		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [
		// Performance indexes for assignment queries
		index('assignments_user_id_idx').on(table.userId),
		index('assignments_path_id_idx').on(table.pathId),
		index('assignments_status_idx').on(table.status),
		index('assignments_role_idx').on(table.role),
		index('assignments_starts_at_idx').on(table.startsAt),
		// Composite index for user's active assignments
		index('assignments_user_active_idx').on(table.userId, table.status),
		// Composite index for path's testers
		index('assignments_path_testers_idx').on(table.pathId, table.role, table.status),
		// Index for email automation (active assignments needing emails)
		index('assignments_email_ready_idx').on(table.status, table.emailRemindersEnabled),
		// Unique constraint: one assignment per user-path combination
		unique('assignments_user_path_unique').on(table.userId, table.pathId)
	]
);
