import { pgTable, text, timestamp, index, jsonb, integer, uuid } from 'drizzle-orm/pg-core';
import { messages } from './messages';

/**
 * Message Audio Analysis table - Stores detailed speech analysis results
 *
 * This table is separated from the main `messages` table to keep the messages table
 * lean and performant for text-based queries. Audio analysis data can be quite large
 * (speech timings, phoneme analysis, etc.) and is only needed when reviewing pronunciation
 * feedback or generating detailed learning insights.
 *
 * **Design Rationale:**
 * - One-to-one relationship with messages (one analysis per message)
 * - Loaded on-demand when displaying pronunciation feedback
 * - Allows for re-analysis without modifying core message data
 * - Can be pruned independently from messages for cost savings
 *
 * **Data Flow:**
 * 1. Message created with audioUrl → audioProcessingState = 'uploaded'
 * 2. Background job picks up message → audioProcessingState = 'analyzing'
 * 3. Echogarden/analysis runs → creates record in this table
 * 4. audioProcessingState = 'analyzed', message.pronunciationScore updated
 */
export const messageAudioAnalysis = pgTable(
	'message_audio_analysis',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		messageId: text('message_id')
			.notNull()
			.unique()
			.references(() => messages.id, { onDelete: 'cascade' }), // Delete analysis when message is deleted
		analyzedAt: timestamp('analyzed_at').notNull().defaultNow(),
		analysisVersion: text('analysis_version').notNull().default('1.0'), // Track analysis algorithm version for re-processing

		// Overall scores (duplicated in messages for quick access)
		overallAccuracyScore: integer('overall_accuracy_score'), // 0-100
		overallFluencyScore: integer('overall_fluency_score'), // 0-100

		// Speech rate metrics
		speechRateWpm: integer('speech_rate_wpm'), // Words per minute (including pauses)
		articulationRateWpm: integer('articulation_rate_wpm'), // Words per minute (excluding pauses)
		totalSpeechDurationMs: integer('total_speech_duration_ms'), // Total speech time
		totalPauseDurationMs: integer('total_pause_duration_ms'), // Total pause time

		// Pause and hesitation analysis
		pauseCount: integer('pause_count'), // Number of pauses detected
		hesitationCount: integer('hesitation_count'), // Number of hesitations (um, uh, etc.)
		averagePauseDurationMs: integer('average_pause_duration_ms'),
		longestPauseDurationMs: integer('longest_pause_duration_ms'),

		// Word-level timing with enhanced metadata
		speechTimings: jsonb('speech_timings').$type<
			Array<{
				word: string;
				startMs: number;
				endMs: number;
				charStart: number;
				charEnd: number;
				confidence?: number; // ASR confidence 0-1
				isPause?: boolean; // True if this is a pause segment
				isHesitation?: boolean; // True if um, uh, etc.
				duration?: number; // Milliseconds (for quick filtering)
			}>
		>(),

		// Phoneme-level analysis (optional, from advanced models)
		phonemeAnalysis: jsonb('phoneme_analysis').$type<
			Array<{
				phoneme: string; // IPA phoneme
				word: string; // Word this phoneme belongs to
				accuracyScore: number; // 0-100 pronunciation accuracy for this phoneme
				startMs: number;
				endMs: number;
				expectedPhoneme?: string; // What it should have been
				issues?: string[]; // Specific pronunciation issues
			}>
		>(),

		// Problematic words and patterns
		problematicWords: jsonb('problematic_words').$type<
			Array<{
				word: string;
				issue: string; // Description of the issue
				severity: 'low' | 'medium' | 'high';
				startMs: number;
				endMs: number;
				suggestion?: string; // How to improve
			}>
		>(),

		// Recommendations for learner
		recommendations: jsonb('recommendations').$type<string[]>(), // List of actionable recommendations

		// Words to practice (extracted from issues)
		practiceWords: jsonb('practice_words').$type<string[]>(),

		// Raw analysis output (for debugging and future re-processing)
		rawAlignment: jsonb('raw_alignment'), // Raw Echogarden alignment output
		rawFeatures: jsonb('raw_features'), // Any additional features from analysis engine

		// Analysis metadata
		analysisEngine: text('analysis_engine').default('echogarden'), // Which engine was used
		analysisModelVersion: text('analysis_model_version'), // Model version (e.g., 'base', 'large')
		analysisLanguage: text('analysis_language'), // Language code used for analysis
		analysisDurationMs: integer('analysis_duration_ms'), // How long analysis took (for performance monitoring)

		// Error tracking
		analysisError: text('analysis_error'), // Error message if analysis failed
		analysisWarnings: jsonb('analysis_warnings').$type<string[]>() // Non-fatal warnings during analysis
	},
	(table) => [
		// Primary indexes
		index('message_audio_analysis_message_id_idx').on(table.messageId), // Quick lookup by message
		index('message_audio_analysis_analyzed_at_idx').on(table.analyzedAt), // For time-based queries

		// Analysis quality indexes
		index('message_audio_analysis_accuracy_idx').on(table.overallAccuracyScore),
		index('message_audio_analysis_fluency_idx').on(table.overallFluencyScore),

		// Performance monitoring
		index('message_audio_analysis_engine_idx').on(table.analysisEngine, table.analysisVersion),

		// Language-specific queries
		index('message_audio_analysis_language_idx').on(table.analysisLanguage)
	]
);
