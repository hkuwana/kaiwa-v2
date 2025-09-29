import { pgTable, text, timestamp, index, jsonb, boolean } from 'drizzle-orm/pg-core';
import { conversations } from './conversations';

/**
 * Messages table - Stores individual messages within conversations
 *
 * This table contains all the messages exchanged between users and the AI tutor during conversations.
 * It includes comprehensive language support (translations, romanization, multiple scripts),
 * audio features (speech timings, pronunciation analysis), and learning analytics
 * (grammar analysis, vocabulary tracking, difficulty levels). Each message can be translated
 * and provides rich context for language learning feedback.
 */
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
		sequenceId: text('sequence_id'), // For maintaining chronological order - nullable for backwards compatibility

		// Comprehensive translation support
		translatedContent: text('translated_content'),
		sourceLanguage: text('source_language'), // Language of the original content
		targetLanguage: text('target_language'), // Language the content was translated to
		userNativeLanguage: text('user_native_language'), // User's native language for context

		// Multi-language script support (consolidated approach)
		romanization: text('romanization'), // Latin script representation (includes pinyin, romaji, etc.)
		hiragana: text('hiragana'), // Japanese hiragana
		otherScripts: jsonb('other_scripts'), // For katakana, hangul, kanji, and other writing systems

		// Word-level audio alignment
		speechTimings: jsonb('speech_timings').$type<
			Array<{
				word: string;
				startMs: number;
				endMs: number;
				charStart: number;
				charEnd: number;
			}>
		>(),

		// Translation metadata
		translationConfidence: text('translation_confidence').$type<'low' | 'medium' | 'high'>(),
		translationProvider: text('translation_provider'), // e.g., 'openai', 'google', 'manual'
		translationNotes: text('translation_notes'), // Any special notes about the translation
		isTranslated: boolean('is_translated').default(false), // Flag to indicate if translation exists

		// Analysis and feedback
		grammarAnalysis: jsonb('grammar_analysis'),
		vocabularyAnalysis: jsonb('vocabulary_analysis'),
		pronunciationScore: text('pronunciation_score'),

		// Audio features
		audioUrl: text('audio_url'),
		audioDuration: text('audio_duration'),

		// Metadata for language learning
		difficultyLevel: text('difficulty_level'),
		learningTags: jsonb('learning_tags'),

		// Context for better translation understanding
		conversationContext: text('conversation_context'), // Brief context of the conversation
		messageIntent: text('message_intent').$type<
			'question' | 'statement' | 'greeting' | 'farewell' | 'other'
		>()
	},
	(table) => [
		// Performance indexes for message queries
		index('messages_conversation_id_idx').on(table.conversationId),
		index('messages_role_idx').on(table.role),
		index('messages_timestamp_idx').on(table.timestamp),
		index('messages_sequence_idx').on(table.sequenceId),
		// Composite index for conversation + timestamp queries
		index('messages_conversation_timestamp_idx').on(table.conversationId, table.timestamp),
		// Index for role-based queries within conversations
		index('messages_conversation_role_idx').on(table.conversationId, table.role),

		// Enhanced indexes for translation and language features
		index('messages_language_idx').on(table.sourceLanguage, table.targetLanguage),
		index('messages_user_native_language_idx').on(table.userNativeLanguage),
		index('messages_translation_idx').on(table.isTranslated, table.translationConfidence),
		index('messages_difficulty_idx').on(table.difficultyLevel),
		index('messages_intent_idx').on(table.messageIntent),

		// Indexes for multi-language script support
		index('messages_romanization_idx').on(table.romanization),
		index('messages_hiragana_idx').on(table.hiragana),

		// Composite index for language learning queries
		index('messages_language_learning_idx').on(
			table.sourceLanguage,
			table.targetLanguage,
			table.userNativeLanguage
		),

		// Composite index for script-based queries
		index('messages_script_support_idx').on(
			table.sourceLanguage,
			table.romanization,
			table.hiragana
		)
	]
);
