/**
 * Speech Analysis Types
 *
 * Type definitions for pronunciation and speech analysis features
 */

export interface WordTiming {
	word: string;
	startMs: number;
	endMs: number;
	charStart: number;
	charEnd: number;
}

export interface PhonemeTiming {
	phoneme: string;
	startMs: number;
	endMs: number;
	confidence?: number;
}

export interface WordPronunciation {
	word: string;
	expectedTiming: WordTiming;
	actualTiming?: WordTiming;
	phonemes: PhonemeTiming[];
	accuracyScore?: number;
	issues?: PronunciationIssue[];
}

export interface PronunciationIssue {
	type: 'timing' | 'phoneme' | 'stress' | 'intonation' | 'pause';
	severity: 'low' | 'medium' | 'high';
	description: string;
	wordIndex?: number;
	phonemeIndex?: number;
	suggestion?: string;
}

export interface PausePattern {
	startMs: number;
	endMs: number;
	durationMs: number;
	type: 'natural' | 'hesitation' | 'breath' | 'thinking';
	context?: string; // Word before/after pause
}

export interface SpeechRateMetrics {
	wordsPerMinute: number;
	syllablesPerSecond: number;
	articulationRate: number; // WPM excluding pauses
	totalDurationMs: number;
	speechDurationMs: number; // Excluding pauses
	pauseDurationMs: number;
}

export interface FluencyMetrics {
	overallScore: number; // 0-100
	hesitationCount: number;
	fillerWordCount: number;
	falseStartCount: number;
	pauseFrequency: number; // Pauses per minute
	averagePauseDuration: number;
	longestPauseDuration: number;
}

export interface PronunciationAnalysisResult {
	messageId: string;
	userId?: string;
	conversationId: string;
	languageCode: string;

	// Transcript reference
	transcript: string;
	audioUrl: string;
	audioStorageKey?: string;

	// Analysis results
	wordPronunciations: WordPronunciation[];
	pauses: PausePattern[];
	speechRate: SpeechRateMetrics;
	fluency: FluencyMetrics;
	issues: PronunciationIssue[];

	// Overall assessment
	overallAccuracyScore: number; // 0-100
	overallFluencyScore: number; // 0-100
	recommendedPracticeWords: string[];
	recommendations: string[];

	// Metadata
	analyzedAt: Date;
	analysisEngine: 'echogarden' | 'azure-speech' | 'whisper';
	processingTimeMs: number;
}

export interface SpeechAnalysisComparison {
	messageId: string;
	expectedTimings: WordTiming[];
	actualTimings: WordTiming[];
	timingDeviations: Array<{
		word: string;
		expectedDurationMs: number;
		actualDurationMs: number;
		deviationMs: number;
		deviationPercent: number;
	}>;
	alignmentScore: number; // 0-100, how well actual matches expected
}

export interface IntonationPattern {
	startMs: number;
	endMs: number;
	pitchHz: number[];
	pitchMean: number;
	pitchRange: number;
	contour: 'rising' | 'falling' | 'flat' | 'rising-falling' | 'falling-rising';
}

export interface ProsodicFeatures {
	intonationPatterns: IntonationPattern[];
	stressPatterns: Array<{
		word: string;
		syllableIndex: number;
		isStressed: boolean;
		expectedStress?: boolean;
	}>;
	rhythm: {
		type: 'stress-timed' | 'syllable-timed' | 'mora-timed';
		regularity: number; // 0-100
	};
}

export interface DetailedSpeechAnalysis extends PronunciationAnalysisResult {
	prosody?: ProsodicFeatures;
	phonemeDetails?: Array<{
		phoneme: string;
		occurrences: number;
		averageAccuracy: number;
		commonErrors: string[];
	}>;
	comparison?: SpeechAnalysisComparison;
}

// Analysis request types
export interface SpeechAnalysisRequest {
	messageId: string;
	audioUrl?: string;
	audioBuffer?: Buffer;
	transcript: string;
	languageCode: string;
	userId?: string;
	conversationId: string;
	options?: SpeechAnalysisOptions;
}

export interface SpeechAnalysisOptions {
	includePhonemes?: boolean;
	includeProsody?: boolean;
	includeComparison?: boolean;
	detailLevel?: 'basic' | 'detailed' | 'comprehensive';
	referenceTimings?: WordTiming[]; // For comparison with expected timings
}

// Helper types for UI display
export interface SpeechAnalysisDisplayData {
	summary: {
		overallScore: number;
		fluencyScore: number;
		speechRate: number;
		issueCount: number;
	};
	timeline: Array<{
		type: 'word' | 'pause' | 'issue';
		startMs: number;
		endMs: number;
		content: string;
		metadata?: Record<string, unknown>;
	}>;
	recommendations: Array<{
		priority: 'high' | 'medium' | 'low';
		category: string;
		message: string;
		actionable: boolean;
	}>;
	practiceWords: Array<{
		word: string;
		issueCount: number;
		primaryIssue: string;
	}>;
}
