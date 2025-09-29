import { pgTable, text, integer, timestamp, index, boolean, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Conversation Sessions table (DEPRECATED) - Legacy session tracking
 *
 * DEPRECATED: This schema has been moved to v2/conversationSessions.ts
 * The v2 version removes tierId for cleaner MVP implementation.
 * Use the v2 version for new development.
 *
 * This legacy table tracked individual conversation sessions for detailed analytics,
 * including session duration, language practice, extension usage, and device information.
 * Replaced by a simpler v2 implementation that focuses on essential MVP functionality.
 */
export const conversationSessions = pgTable(
	'conversation_sessions',
	{
		// Use camelCase for TypeScript properties, snake_case for DB columns
		id: text('id').primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		// Session details
		language: text('language').notNull(),
		startTime: timestamp('start_time').notNull(),
		endTime: timestamp('end_time'),
		durationMinutes: integer('duration_minutes').notNull(),

		// Usage tracking
		minutesConsumed: integer('minutes_consumed').notNull(),
		wasExtended: boolean('was_extended').default(false),
		extensionsUsed: integer('extensions_used').default(0),

		// Metadata
		transcriptionMode: boolean('transcription_mode').default(false),
		deviceType: text('device_type'), // 'desktop', 'mobile', 'tablet'

		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [
		index('conversation_sessions_user_idx').on(table.userId),
		index('conversation_sessions_start_time_idx').on(table.startTime),
		index('conversation_sessions_language_idx').on(table.language)
	]
);
