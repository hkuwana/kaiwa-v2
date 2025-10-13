/**
 * Pronunciation Analysis Module
 *
 * Uses Echogarden to analyze speech pronunciation, timing, and fluency.
 * This module processes audio files and compares them against expected transcripts.
 */

import type {
	AnalysisModuleDefinition,
	AnalysisModuleContext,
	AnalysisModuleResult
} from '../types/analysis-module.types';
import type {
	PronunciationAnalysisResult,
	PronunciationIssue,
	PausePattern,
	SpeechRateMetrics,
	FluencyMetrics,
	WordPronunciation,
	WordTiming
} from '../types/speech-analysis.types';
import { audioStorageService } from '$lib/server/services/audio-storage.service';

// Echogarden types (will be imported when echogarden is installed)
interface EchogardenTimeline {
	startTime: number;
	endTime: number;
	text: string;
	confidence?: number;
}

interface EchogardenAlignmentResult {
	timeline: EchogardenTimeline[];
	wordTimeline?: EchogardenTimeline[];
	phoneTimeline?: EchogardenTimeline[];
}

/**
 * Detect pauses in speech from word timings
 */
function detectPauses(wordTimings: WordTiming[], minimumPauseDurationMs = 200): PausePattern[] {
	const pauses: PausePattern[] = [];

	for (let i = 0; i < wordTimings.length - 1; i++) {
		const currentWord = wordTimings[i];
		const nextWord = wordTimings[i + 1];

		const pauseDuration = nextWord.startMs - currentWord.endMs;

		if (pauseDuration >= minimumPauseDurationMs) {
			// Classify pause type based on duration
			let type: PausePattern['type'] = 'natural';
			if (pauseDuration > 1000) {
				type = 'thinking';
			} else if (pauseDuration > 500) {
				type = 'hesitation';
			} else if (pauseDuration > 300) {
				type = 'breath';
			}

			pauses.push({
				startMs: currentWord.endMs,
				endMs: nextWord.startMs,
				durationMs: pauseDuration,
				type,
				context: `${currentWord.word} ... ${nextWord.word}`
			});
		}
	}

	return pauses;
}

/**
 * Calculate speech rate metrics
 */
function calculateSpeechRate(
	wordTimings: WordTiming[],
	totalDurationMs: number
): SpeechRateMetrics {
	const wordCount = wordTimings.length;
	const totalDurationMin = totalDurationMs / 60000;

	// Calculate total pause duration
	let pauseDurationMs = 0;
	for (let i = 0; i < wordTimings.length - 1; i++) {
		const gap = wordTimings[i + 1].startMs - wordTimings[i].endMs;
		if (gap > 0) pauseDurationMs += gap;
	}

	const speechDurationMs = totalDurationMs - pauseDurationMs;
	const speechDurationMin = speechDurationMs / 60000;

	// Estimate syllables (rough approximation: ~1.3 syllables per word)
	const estimatedSyllables = wordCount * 1.3;

	return {
		wordsPerMinute: totalDurationMin > 0 ? wordCount / totalDurationMin : 0,
		syllablesPerSecond: totalDurationMs > 0 ? estimatedSyllables / (totalDurationMs / 1000) : 0,
		articulationRate: speechDurationMin > 0 ? wordCount / speechDurationMin : 0,
		totalDurationMs,
		speechDurationMs,
		pauseDurationMs
	};
}

/**
 * Detect hesitations and filler words
 */
function analyzeFluency(
	transcript: string,
	wordTimings: WordTiming[],
	pauses: PausePattern[]
): FluencyMetrics {
	const fillerWords = ['uh', 'um', 'like', 'you know', 'i mean', 'sort of', 'kind of'];
	const words = transcript.toLowerCase().split(/\s+/);

	const fillerWordCount = words.filter((word) =>
		fillerWords.some((filler) => word.includes(filler))
	).length;

	const hesitationPauses = pauses.filter((p) => p.type === 'hesitation' || p.type === 'thinking');
	const naturalPauses = pauses.filter((p) => p.type === 'natural' || p.type === 'breath');

	// Calculate pause metrics
	const totalPauseDuration = pauses.reduce((sum, p) => sum + p.durationMs, 0);
	const averagePauseDuration = pauses.length > 0 ? totalPauseDuration / pauses.length : 0;
	const longestPause = pauses.length > 0 ? Math.max(...pauses.map((p) => p.durationMs)) : 0;

	// Calculate fluency score (0-100)
	let fluencyScore = 100;

	// Penalties
	fluencyScore -= hesitationPauses.length * 5; // -5 points per hesitation
	fluencyScore -= fillerWordCount * 3; // -3 points per filler word
	fluencyScore -= Math.min(20, (longestPause - 1000) / 100); // Penalty for long pauses

	// Bonuses for natural flow
	if (naturalPauses.length > hesitationPauses.length) fluencyScore += 5;

	fluencyScore = Math.max(0, Math.min(100, fluencyScore));

	return {
		overallScore: fluencyScore,
		hesitationCount: hesitationPauses.length,
		fillerWordCount,
		falseStartCount: 0, // TODO: Implement false start detection
		pauseFrequency: pauses.length / (wordTimings.length / 100), // Pauses per 100 words
		averagePauseDuration,
		longestPauseDuration: longestPause
	};
}

/**
 * Identify pronunciation issues
 */
function identifyIssues(
	wordPronunciations: WordPronunciation[],
	pauses: PausePattern[],
	speechRate: SpeechRateMetrics
): PronunciationIssue[] {
	const issues: PronunciationIssue[] = [];

	// Check for timing issues in word pronunciations
	wordPronunciations.forEach((wp, index) => {
		if (wp.actualTiming && wp.expectedTiming) {
			const expectedDuration = wp.expectedTiming.endMs - wp.expectedTiming.startMs;
			const actualDuration = wp.actualTiming.endMs - wp.actualTiming.startMs;
			const deviation = Math.abs(actualDuration - expectedDuration);
			const deviationPercent = (deviation / expectedDuration) * 100;

			if (deviationPercent > 50) {
				issues.push({
					type: 'timing',
					severity: deviationPercent > 100 ? 'high' : 'medium',
					description: `Word "${wp.word}" was pronounced ${actualDuration > expectedDuration ? 'slower' : 'faster'} than expected`,
					wordIndex: index,
					suggestion: `Practice pronunciation of "${wp.word}" at a natural pace`
				});
			}
		}
	});

	// Check for excessive pauses
	const longPauses = pauses.filter((p) => p.type === 'thinking' || p.durationMs > 2000);
	if (longPauses.length > 0) {
		issues.push({
			type: 'pause',
			severity: 'medium',
			description: `${longPauses.length} long pause(s) detected, which may indicate hesitation`,
			suggestion: 'Practice speaking more continuously and build confidence'
		});
	}

	// Check speech rate
	if (speechRate.wordsPerMinute < 100) {
		issues.push({
			type: 'timing',
			severity: 'low',
			description: 'Speech rate is slower than typical conversational pace',
			suggestion: 'Try to speak at a slightly faster, more natural pace'
		});
	} else if (speechRate.wordsPerMinute > 180) {
		issues.push({
			type: 'timing',
			severity: 'medium',
			description: 'Speech rate is faster than typical conversational pace',
			suggestion: 'Slow down slightly to improve clarity and pronunciation'
		});
	}

	return issues;
}

/**
 * Generate practice recommendations
 */
function generateRecommendations(
	issues: PronunciationIssue[],
	fluency: FluencyMetrics,
	speechRate: SpeechRateMetrics
): string[] {
	const recommendations: string[] = [];

	// Fluency recommendations
	if (fluency.overallScore < 70) {
		recommendations.push('Focus on speaking more fluently by practicing full sentences without stopping');
	}

	if (fluency.hesitationCount > 3) {
		recommendations.push('Reduce hesitations by preparing key phrases and practicing transitions');
	}

	if (fluency.fillerWordCount > 2) {
		recommendations.push('Try to eliminate filler words like "um" and "uh" - pause silently instead');
	}

	// Speech rate recommendations
	if (speechRate.wordsPerMinute < 100) {
		recommendations.push('Practice speaking at a slightly faster pace to sound more natural');
	} else if (speechRate.wordsPerMinute > 180) {
		recommendations.push('Slow down your speech to improve clarity and pronunciation');
	}

	// Pause pattern recommendations
	if (fluency.averagePauseDuration > 1000) {
		recommendations.push('Work on reducing pause duration between words and phrases');
	}

	// General recommendation if everything is good
	if (issues.length === 0 && fluency.overallScore > 80) {
		recommendations.push('Great job! Your pronunciation and fluency are excellent. Keep practicing!');
	}

	return recommendations;
}

/**
 * Main pronunciation analysis function using Echogarden
 */
async function analyzePronunciationWithEchogarden(
	audioBuffer: Buffer,
	transcript: string,
	languageCode: string
): Promise<Partial<PronunciationAnalysisResult>> {
	const startTime = Date.now();

	try {
		// Lazy load echogarden (only load when needed)
		// This prevents loading issues if echogarden isn't installed yet
		const echogarden = await import('echogarden').catch(() => null);

		if (!echogarden) {
			console.warn('⚠️ Echogarden not installed. Install with: npm install echogarden');
			return {
				analysisEngine: 'echogarden',
				processingTimeMs: Date.now() - startTime,
				issues: [
					{
						type: 'timing',
						severity: 'high',
						description: 'Echogarden is not installed. Speech analysis unavailable.',
						suggestion: 'Install Echogarden: npm install echogarden'
					}
				],
				recommendations: ['Install Echogarden to enable pronunciation analysis']
			};
		}

		// Run Echogarden alignment
		// Map common language codes to Echogarden language identifiers
		const languageMap: Record<string, string> = {
			en: 'en',
			ja: 'ja',
			es: 'es',
			fr: 'fr',
			de: 'de',
			zh: 'zh',
			ko: 'ko',
			it: 'it',
			pt: 'pt',
			ru: 'ru'
		};

		const echoLanguage = languageMap[languageCode] || 'en';

		const alignmentResult = (await echogarden.align(audioBuffer, transcript, {
			language: echoLanguage,
			engine: 'whisper', // Use Whisper for better accuracy
			plainText: {
				paragraphBreaks: 'double',
				whitespace: 'collapse'
			}
		})) as EchogardenAlignmentResult;

		// Convert Echogarden timeline to our WordTiming format
		const wordTimings: WordTiming[] =
			alignmentResult.wordTimeline?.map((item, index) => ({
				word: item.text,
				startMs: item.startTime * 1000,
				endMs: item.endTime * 1000,
				charStart: transcript.indexOf(item.text, index > 0 ? wordTimings[index - 1].charEnd : 0),
				charEnd:
					transcript.indexOf(item.text, index > 0 ? wordTimings[index - 1].charEnd : 0) +
					item.text.length
			})) || [];

		// Detect pauses
		const pauses = detectPauses(wordTimings);

		// Calculate speech rate
		const totalDurationMs = wordTimings.length > 0 ? wordTimings[wordTimings.length - 1].endMs : 0;
		const speechRate = calculateSpeechRate(wordTimings, totalDurationMs);

		// Analyze fluency
		const fluency = analyzeFluency(transcript, wordTimings, pauses);

		// Create word pronunciations (basic - no expected timings yet)
		const wordPronunciations: WordPronunciation[] = wordTimings.map((timing) => ({
			word: timing.word,
			expectedTiming: timing, // Use actual as expected for now
			actualTiming: timing,
			phonemes: [] // TODO: Extract from alignmentResult.phoneTimeline
		}));

		// Identify issues
		const issues = identifyIssues(wordPronunciations, pauses, speechRate);

		// Generate recommendations
		const recommendations = generateRecommendations(issues, fluency, speechRate);

		// Find words that need practice (words with issues)
		const recommendedPracticeWords = wordPronunciations
			.filter((wp) => wp.issues && wp.issues.length > 0)
			.map((wp) => wp.word)
			.slice(0, 5); // Top 5 words

		return {
			wordPronunciations,
			pauses,
			speechRate,
			fluency,
			issues,
			overallAccuracyScore: 100 - issues.length * 10, // Simple scoring
			overallFluencyScore: fluency.overallScore,
			recommendedPracticeWords,
			recommendations,
			analyzedAt: new Date(),
			analysisEngine: 'echogarden',
			processingTimeMs: Date.now() - startTime
		};
	} catch (error) {
		console.error('Echogarden analysis failed:', error);
		return {
			analysisEngine: 'echogarden',
			processingTimeMs: Date.now() - startTime,
			issues: [
				{
					type: 'timing',
					severity: 'high',
					description: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
					suggestion: 'Please try again or contact support'
				}
			],
			recommendations: ['Analysis failed. Please try again.']
		};
	}
}

/**
 * Pronunciation Analysis Module Definition
 */
export const pronunciationAnalysisModule: AnalysisModuleDefinition = {
	id: 'pronunciation-analysis',
	name: 'Pronunciation Analysis',
	description: 'Analyzes speech pronunciation, timing, fluency, and provides personalized recommendations',
	version: '1.0.0',
	modality: 'speech',

	async run(context: AnalysisModuleContext): Promise<AnalysisModuleResult> {
		const startTime = Date.now();

		// Filter for user messages with audio
		const userMessagesWithAudio = context.messages.filter(
			(msg) => msg.role === 'user' && msg.audioUrl
		);

		if (userMessagesWithAudio.length === 0) {
			return {
				moduleId: 'pronunciation-analysis',
				summary: 'No audio messages found for analysis',
				details: {
					message: 'No user messages with audio recordings were found in this conversation.',
					recommendation: 'Record your voice during conversations to enable pronunciation analysis.'
				}
			};
		}

		// Check if audio storage is configured
		if (!audioStorageService.isConfigured()) {
			return {
				moduleId: 'pronunciation-analysis',
				summary: 'Audio storage not configured',
				details: {
					message: 'Audio storage service is not configured. Cannot retrieve audio files.',
					recommendation: 'Configure Tigris or S3 storage to enable pronunciation analysis.'
				}
			};
		}

		// Analyze each audio message
		const analysisResults: PronunciationAnalysisResult[] = [];

		for (const message of userMessagesWithAudio) {
			try {
				// Download audio from storage
				const audioStorageKey = message.audioStorageKey || message.audioUrl;
				if (!audioStorageKey) continue;

				const audioBuffer = await audioStorageService.downloadAudio(audioStorageKey);

				// Run pronunciation analysis
				const analysisResult = await analyzePronunciationWithEchogarden(
					audioBuffer,
					message.content,
					context.languageCode
				);

				analysisResults.push({
					messageId: message.id,
					userId: context.userId,
					conversationId: context.conversationId,
					languageCode: context.languageCode,
					transcript: message.content,
					audioUrl: message.audioUrl || '',
					audioStorageKey: audioStorageKey,
					wordPronunciations: analysisResult.wordPronunciations || [],
					pauses: analysisResult.pauses || [],
					speechRate: analysisResult.speechRate || {
						wordsPerMinute: 0,
						syllablesPerSecond: 0,
						articulationRate: 0,
						totalDurationMs: 0,
						speechDurationMs: 0,
						pauseDurationMs: 0
					},
					fluency: analysisResult.fluency || {
						overallScore: 0,
						hesitationCount: 0,
						fillerWordCount: 0,
						falseStartCount: 0,
						pauseFrequency: 0,
						averagePauseDuration: 0,
						longestPauseDuration: 0
					},
					issues: analysisResult.issues || [],
					overallAccuracyScore: analysisResult.overallAccuracyScore || 0,
					overallFluencyScore: analysisResult.overallFluencyScore || 0,
					recommendedPracticeWords: analysisResult.recommendedPracticeWords || [],
					recommendations: analysisResult.recommendations || [],
					analyzedAt: new Date(),
					analysisEngine: analysisResult.analysisEngine || 'echogarden',
					processingTimeMs: analysisResult.processingTimeMs || 0
				});
			} catch (error) {
				console.error(`Failed to analyze message ${message.id}:`, error);
			}
		}

		// Aggregate results
		const avgAccuracyScore =
			analysisResults.reduce((sum, r) => sum + r.overallAccuracyScore, 0) / analysisResults.length;
		const avgFluencyScore =
			analysisResults.reduce((sum, r) => sum + r.overallFluencyScore, 0) / analysisResults.length;
		const totalIssues = analysisResults.reduce((sum, r) => sum + r.issues.length, 0);

		// Collect all unique recommended practice words
		const allPracticeWords = new Set<string>();
		analysisResults.forEach((r) => r.recommendedPracticeWords.forEach((w) => allPracticeWords.add(w)));

		return {
			moduleId: 'pronunciation-analysis',
			summary: `Analyzed ${analysisResults.length} audio message(s) with ${totalIssues} issue(s) found`,
			details: {
				messagesAnalyzed: analysisResults.length,
				averageAccuracy: Math.round(avgAccuracyScore),
				averageFluency: Math.round(avgFluencyScore),
				totalIssues,
				practiceWords: Array.from(allPracticeWords).slice(0, 10),
				results: analysisResults,
				processingTimeMs: Date.now() - startTime
			}
		};
	}
};
