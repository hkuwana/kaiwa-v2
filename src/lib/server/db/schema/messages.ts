import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { conversations } from './conversations';

// Messages - conversation content
export const messages = pgTable('messages', {
	id: text('id').primaryKey(),
	conversationId: text('conversation_id')
		.notNull()
		.references(() => conversations.id),
	role: text('role').$type<'assistant' | 'user' | 'system'>().notNull(),
	content: text('content').notNull(),
	timestamp: timestamp('timestamp').notNull().defaultNow(),

	// Optional audio reference for future features
	audioUrl: text('audio_url')
});
