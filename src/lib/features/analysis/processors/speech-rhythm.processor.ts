import type { Message } from '$lib/server/db/types';

interface RhythmMetrics {
	speakingRate: number; // words per minute
	pausePatterns: PausePattern[];
	stressPatterns: StressPattern[];
	intonationCurve: number[];
	naturalness: number; // 0-1 scale
	rhythmScore: number; // 0-100 scale
}

interface PausePattern {
	duration: number; // milliseconds
	position: 'natural' | 'unnatural' | 'hesitation';
	timestamp: number;
	confidence: number;
}

interface StressPattern {
	word: string;
	expectedStress: number[]; // syllable positions
	detectedStress: number[];
	accuracy: number; // 0-1 scale
	timestamp: number;
}

export function runSpeechRhythmProcessor({
	messages,
	audioData,
	language
}: {
	messages: Message[];
	audioData?: ArrayBuffer;
	language: { code: string; name: string };
}): {
	findings: Array<{
		summary: string;
		details: RhythmMetrics & {
			rhythmLevel: 'mechanical' | 'improving' | 'natural' | 'native-like';
			strengthAreas: string[];
			improvementAreas: string[];
		};
		modality: 'audio';
		confidence: number;
	}>;
	raw: { rhythmMetrics: RhythmMetrics };
	summary: string;
} {
	if (!audioData) {
		return {
			findings: [{
				summary: 'Speech rhythm analysis requires audio data',
				details: {
					...getEmptyRhythmMetrics(),
					rhythmLevel: 'mechanical' as const,
					strengthAreas: [],
					improvementAreas: ['Enable audio recording for rhythm analysis']
				},
				modality: 'audio',
				confidence: 0.0
			}],
			raw: { rhythmMetrics: getEmptyRhythmMetrics() },
			summary: 'Audio data not available for rhythm analysis'
		};
	}

	// Simulate rhythm analysis (replace with actual audio processing)
	const metrics = simulateRhythmAnalysis(messages, language.code);
	const rhythmLevel = determineRhythmLevel(metrics);
	const { strengthAreas, improvementAreas } = analyzeRhythmAreas(metrics);

	return {
		findings: [{
			summary: `Speech rhythm: ${rhythmLevel} (${metrics.rhythmScore}/100)`,
			details: {
				...metrics,
				rhythmLevel,
				strengthAreas,
				improvementAreas
			},
			modality: 'audio',
			confidence: 0.8
		}],
		raw: { rhythmMetrics: metrics },
		summary: `Rhythm analysis: ${rhythmLevel} level detected`
	};
}

function simulateRhythmAnalysis(messages: Message[], languageCode: string): RhythmMetrics {
	const userMessages = messages.filter(msg => msg.role === 'user');

	// Simulate speaking rate calculation
	const totalWords = userMessages.reduce((sum, msg) =>
		sum + (msg.content?.split(/\s+/)?.length || 0), 0);
	const estimatedDuration = totalWords * 0.4; // ~150 WPM average
	const speakingRate = (totalWords / estimatedDuration) * 60;

	// Simulate pause patterns
	const pausePatterns: PausePattern[] = generatePausePatterns(userMessages);

	// Simulate stress patterns
	const stressPatterns: StressPattern[] = generateStressPatterns(userMessages, languageCode);

	// Simulate intonation curve (simplified)
	const intonationCurve = generateIntonationCurve(userMessages.length);

	// Calculate naturalness and rhythm score
	const naturalness = calculateNaturalness(pausePatterns, stressPatterns);
	const rhythmScore = calculateRhythmScore(speakingRate, pausePatterns, naturalness);

	return {
		speakingRate: Math.round(speakingRate),
		pausePatterns,
		stressPatterns,
		intonationCurve,
		naturalness,
		rhythmScore
	};
}

function generatePausePatterns(messages: Message[]): PausePattern[] {
	const patterns: PausePattern[] = [];

	// Simulate pause analysis
	messages.forEach((msg, index) => {
		const wordCount = (msg.content || '').split(/\s+/).length;

		// Add natural pauses (commas, periods)
		const commas = (msg.content || '').split(',').length - 1;
		const sentences = (msg.content || '').split(/[.!?]/).length - 1;

		// Natural pauses
		for (let i = 0; i < commas; i++) {
			patterns.push({
				duration: 300 + Math.random() * 200, // 300-500ms
				position: 'natural',
				timestamp: index * 1000 + i * 200,
				confidence: 0.9
			});
		}

		// Sentence boundaries
		for (let i = 0; i < sentences; i++) {
			patterns.push({
				duration: 500 + Math.random() * 300, // 500-800ms
				position: 'natural',
				timestamp: index * 1000 + commas * 200 + i * 300,
				confidence: 0.95
			});
		}

		// Simulate some hesitation pauses
		if (wordCount > 10 && Math.random() < 0.3) {
			patterns.push({
				duration: 800 + Math.random() * 500, // 800-1300ms
				position: 'hesitation',
				timestamp: index * 1000 + 400,
				confidence: 0.7
			});
		}
	});

	return patterns;
}

function generateStressPatterns(messages: Message[], languageCode: string): StressPattern[] {
	const patterns: StressPattern[] = [];

	// Common multi-syllable words for different languages
	const stressWords = {
		'en': [
			{ word: 'important', expected: [0], detected: [0] },
			{ word: 'beautiful', expected: [0], detected: [1] },
			{ word: 'understand', expected: [2], detected: [0] }
		],
		'es': [
			{ word: 'importante', expected: [2], detected: [2] },
			{ word: 'hermoso', expected: [1], detected: [1] }
		],
		'fr': [
			{ word: 'important', expected: [2], detected: [2] },
			{ word: 'magnifique', expected: [2], detected: [1] }
		]
	};

	const words = stressWords[languageCode as keyof typeof stressWords] || stressWords['en'];

	words.forEach((wordInfo, index) => {
		patterns.push({
			word: wordInfo.word,
			expectedStress: wordInfo.expected,
			detectedStress: wordInfo.detected,
			accuracy: wordInfo.expected[0] === wordInfo.detected[0] ? 1.0 : 0.6,
			timestamp: index * 1000
		});
	});

	return patterns;
}

function generateIntonationCurve(messageCount: number): number[] {
	// Simulate intonation curve with some variation
	const curve: number[] = [];

	for (let i = 0; i < messageCount * 10; i++) {
		const baseFrequency = 150 + Math.sin(i * 0.1) * 30;
		const variation = Math.random() * 20 - 10;
		curve.push(baseFrequency + variation);
	}

	return curve;
}

function calculateNaturalness(pausePatterns: PausePattern[], stressPatterns: StressPattern[]): number {
	// Calculate based on pause positioning and stress accuracy
	const naturalPauses = pausePatterns.filter(p => p.position === 'natural').length;
	const hesitationPauses = pausePatterns.filter(p => p.position === 'hesitation').length;
	const totalPauses = pausePatterns.length;

	const pauseNaturalness = totalPauses > 0 ? naturalPauses / totalPauses : 0.5;

	const stressAccuracy = stressPatterns.length > 0
		? stressPatterns.reduce((sum, pattern) => sum + pattern.accuracy, 0) / stressPatterns.length
		: 0.7;

	return (pauseNaturalness * 0.4 + stressAccuracy * 0.6);
}

function calculateRhythmScore(speakingRate: number, pausePatterns: PausePattern[], naturalness: number): number {
	// Ideal speaking rate is around 150-160 WPM
	const rateScore = Math.max(0, 1 - Math.abs(speakingRate - 155) / 100);

	// Pause quality score
	const naturalPauses = pausePatterns.filter(p => p.position === 'natural').length;
	const hesitationPauses = pausePatterns.filter(p => p.position === 'hesitation').length;
	const pauseScore = hesitationPauses === 0 ? 1.0 : Math.max(0, 1 - (hesitationPauses / (naturalPauses + hesitationPauses)));

	// Combined score
	const combinedScore = (rateScore * 0.3 + pauseScore * 0.3 + naturalness * 0.4) * 100;

	return Math.round(Math.max(0, Math.min(100, combinedScore)));
}

function determineRhythmLevel(metrics: RhythmMetrics): 'mechanical' | 'improving' | 'natural' | 'native-like' {
	if (metrics.rhythmScore >= 90) return 'native-like';
	if (metrics.rhythmScore >= 75) return 'natural';
	if (metrics.rhythmScore >= 60) return 'improving';
	return 'mechanical';
}

function analyzeRhythmAreas(metrics: RhythmMetrics): {
	strengthAreas: string[];
	improvementAreas: string[];
} {
	const strengthAreas: string[] = [];
	const improvementAreas: string[] = [];

	// Speaking rate analysis
	if (metrics.speakingRate >= 140 && metrics.speakingRate <= 170) {
		strengthAreas.push('Natural speaking pace');
	} else if (metrics.speakingRate < 120 || metrics.speakingRate > 180) {
		improvementAreas.push('Adjust speaking pace');
	}

	// Pause pattern analysis
	const hesitationPauses = metrics.pausePatterns.filter(p => p.position === 'hesitation').length;
	const naturalPauses = metrics.pausePatterns.filter(p => p.position === 'natural').length;

	if (naturalPauses > hesitationPauses * 2) {
		strengthAreas.push('Good pause placement');
	} else if (hesitationPauses > naturalPauses) {
		improvementAreas.push('Reduce hesitation pauses');
	}

	// Stress pattern analysis
	const stressAccuracy = metrics.stressPatterns.length > 0
		? metrics.stressPatterns.reduce((sum, p) => sum + p.accuracy, 0) / metrics.stressPatterns.length
		: 0;

	if (stressAccuracy > 0.8) {
		strengthAreas.push('Correct word stress');
	} else if (stressAccuracy < 0.6) {
		improvementAreas.push('Work on word stress patterns');
	}

	// Overall naturalness
	if (metrics.naturalness > 0.8) {
		strengthAreas.push('Natural speech rhythm');
	} else if (metrics.naturalness < 0.5) {
		improvementAreas.push('Develop more natural speech rhythm');
	}

	return { strengthAreas, improvementAreas };
}

function getEmptyRhythmMetrics(): RhythmMetrics {
	return {
		speakingRate: 0,
		pausePatterns: [],
		stressPatterns: [],
		intonationCurve: [],
		naturalness: 0,
		rhythmScore: 0
	};
}

export type { RhythmMetrics, PausePattern, StressPattern };