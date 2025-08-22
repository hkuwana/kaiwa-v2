import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { conversations } from './conversations';

// Messages - conversation content
export const messages = pgTable(
	'messages',
	{
		id: text('id').primaryKey(),
		conversationId: text('conversation_id')
			.notNull()
			.references(() => conversations.id),
		role: text('role').$type<'assistant' | 'user' | 'system'>().notNull(),
		content: text('content').notNull(),
		timestamp: timestamp('timestamp').notNull().defaultNow(),

		// Optional audio reference for future features
		audioUrl: text('audio_url')
	},
	(table) => [
		// Performance indexes for message queries
		index('messages_conversation_id_idx').on(table.conversationId),
		index('messages_role_idx').on(table.role),
		index('messages_timestamp_idx').on(table.timestamp),
		// Composite index for conversation + timestamp queries
		index('messages_conversation_timestamp_idx').on(table.conversationId, table.timestamp),
		// Index for role-based queries within conversations
		index('messages_conversation_role_idx').on(table.conversationId, table.role)
	]
);
