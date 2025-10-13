import { pgTable, text, timestamp, index, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { conversations } from './conversations';

/**
 * Messages table - Stores individual messages within conversations
 *
 * This table contains all the messages exchanged between users and the AI tutor during conversations.
 * It includes comprehensive language support (translations, romanization, multiple scripts),
 * basic audio metadata (links to separate audio_analysis table), and learning analytics
 * (grammar analysis, vocabulary tracking, difficulty levels). Each message can be translated
 * and provides rich context for language learning feedback.
 *
 * **Audio Data Separation**: Heavy audio analysis data is stored in `message_audio_analysis` table
 * to keep this table lean and performant for text-based queries.
 *
 * **Audio Retention Policy**: Audio files are stored in Tigris/S3 with a configurable retention period
 * (default: 90 days). After this period, audio is deleted to manage storage costs.
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

		// Translation metadata
		translationConfidence: text('translation_confidence').$type<'low' | 'medium' | 'high'>(),
		translationProvider: text('translation_provider'), // e.g., 'openai', 'google', 'manual'
		translationNotes: text('translation_notes'), // Any special notes about the translation
		isTranslated: boolean('is_translated').default(false), // Flag to indicate if translation exists

		// Analysis and feedback (grammar/vocabulary only - see message_audio_analysis for speech)
		grammarAnalysis: jsonb('grammar_analysis'),
		vocabularyAnalysis: jsonb('vocabulary_analysis'),

		// Audio storage metadata (links to Tigris/S3)
		audioUrl: text('audio_url'), // Signed URL (expires after TTL - see audio_url_expires_at)
		audioUrlExpiresAt: timestamp('audio_url_expires_at'), // When the signed URL expires (typically 7 days)
		audioStorageKey: text('audio_storage_key'), // Permanent S3 key for regenerating signed URLs
		audioDurationMs: integer('audio_duration_ms'), // Duration in milliseconds
		audioSizeBytes: integer('audio_size_bytes'), // File size for cost/storage tracking
		audioFormat: text('audio_format').$type<'pcm16' | 'g711_ulaw' | 'g711_alaw' | 'mp3' | 'wav'>(), // Audio codec
		audioSampleRate: integer('audio_sample_rate').default(24000), // Sample rate in Hz (OpenAI default: 24000)
		audioChannels: integer('audio_channels').default(1), // Number of channels (1=mono, 2=stereo)

		// Audio processing state (tracks async pipeline)
		audioProcessingState: text('audio_processing_state')
			.$type<'pending' | 'uploading' | 'uploaded' | 'analyzing' | 'analyzed' | 'failed'>()
			.default('pending'),
		audioProcessingError: text('audio_processing_error'), // Error message if processing failed

		// Audio retention policy tracking
		audioRetentionExpiresAt: timestamp('audio_retention_expires_at'), // When audio should be deleted from storage (e.g., +90 days)
		audioDeletedAt: timestamp('audio_deleted_at'), // When audio was actually deleted (for audit trail)

		// Quick pronunciation scores (detailed analysis in message_audio_analysis)
		pronunciationScore: integer('pronunciation_score'), // 0-100 overall pronunciation quality
		fluencyScore: integer('fluency_score'), // 0-100 overall fluency rating
		speechRateWpm: integer('speech_rate_wpm'), // Words per minute (including pauses)

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
		),

		// Audio-related indexes
		index('messages_audio_storage_idx').on(table.audioStorageKey), // For looking up by storage key
		index('messages_audio_processing_idx').on(table.audioProcessingState), // For background job processing
		index('messages_audio_retention_idx').on(table.audioRetentionExpiresAt), // For cleanup jobs
		index('messages_pronunciation_idx').on(table.pronunciationScore, table.fluencyScore), // For analytics
		// Composite index for finding expired audio to clean up
		index('messages_audio_cleanup_idx').on(table.audioRetentionExpiresAt, table.audioDeletedAt)
	]
);
