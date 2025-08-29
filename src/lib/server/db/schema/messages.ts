import { pgTable, text, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
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

		// Language learning features
		translatedContent: text('translated_content'),
		sourceLanguage: text('source_language'),
		targetLanguage: text('target_language'),

		// Analysis and feedback
		grammarAnalysis: jsonb('grammar_analysis'),
		vocabularyAnalysis: jsonb('vocabulary_analysis'),
		pronunciationScore: text('pronunciation_score'),

		// Audio features
		audioUrl: text('audio_url'),
		audioDuration: text('audio_duration'),

		// Metadata for language learning
		difficultyLevel: text('difficulty_level'),
		learningTags: jsonb('learning_tags')
	},
	(table) => [
		// Performance indexes for message queries
		index('messages_conversation_id_idx').on(table.conversationId),
		index('messages_role_idx').on(table.role),
		index('messages_timestamp_idx').on(table.timestamp),
		// Composite index for conversation + timestamp queries
		index('messages_conversation_timestamp_idx').on(table.conversationId, table.timestamp),
		// Index for role-based queries within conversations
		index('messages_conversation_role_idx').on(table.conversationId, table.role),

		// New indexes for language learning features
		index('messages_language_idx').on(table.sourceLanguage, table.targetLanguage),
		index('messages_difficulty_idx').on(table.difficultyLevel)
	]
);
