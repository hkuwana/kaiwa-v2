import { pgTable, text, integer, timestamp, index, boolean } from 'drizzle-orm/pg-core';
import { users } from '../users';

// Track individual conversation sessions for detailed analytics
// V2: Simplified without tierId - tier can be derived from user's active subscription
export const conversationSessions = pgTable(
	'conversation_sessions_v2',
	{
		// Use camelCase for TypeScript properties, snake_case for DB columns
		id: text('id').primaryKey(),
		userId: text('user_id')
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
		index('conversation_sessions_v2_user_idx').on(table.userId),
		index('conversation_sessions_v2_start_time_idx').on(table.startTime),
		index('conversation_sessions_v2_language_idx').on(table.language)
	]
);
