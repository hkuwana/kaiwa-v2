import { pgTable, text, integer, timestamp, index, boolean, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Conversation Sessions - Enhanced session tracking for detailed analytics
 *
 * Tracks individual conversation sessions with comprehensive analytics including
 * duration, usage consumption, device type, and engagement metrics.
 */
export const conversationSessions = pgTable(
	'conversation_sessions',
	{
		id: text('id').primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),

		// Session details
		language: text('language').notNull(),
		startTime: timestamp('start_time').notNull(),
		endTime: timestamp('end_time'),
		durationSeconds: integer('duration_seconds').notNull(),

		// Usage tracking
		secondsConsumed: integer('seconds_consumed').notNull(),
		inputTokens: integer('input_tokens').default(0),
		wasExtended: boolean('was_extended').default(false),
		extensionsUsed: integer('extensions_used').default(0),

		// Metadata
		transcriptionMode: boolean('transcription_mode').default(false),
		deviceType: text('device_type'),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => [
		index('conversation_sessions_user_idx').on(table.userId),
		index('conversation_sessions_start_time_idx').on(table.startTime),
		index('conversation_sessions_language_idx').on(table.language),
		index('conversation_sessions_device_type_idx').on(table.deviceType),
		// Composite index for user language analytics
		index('conversation_sessions_user_language_idx').on(table.userId, table.language),
		// Index for duration-based analytics
		index('conversation_sessions_duration_idx').on(table.durationSeconds),
		// Index for extension tracking
		index('conversation_sessions_extensions_idx').on(table.wasExtended, table.extensionsUsed)
	]
);
