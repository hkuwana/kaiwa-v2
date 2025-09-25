import type { Message, Language } from '$lib/server/db/types';

interface FluencyMetrics {
	wordsPerMinute: number;
	averageResponseTime: number;
	vocabularyDiversity: number;
	sentenceComplexity: number;
	conversationFlow: number;
	hesitationPatterns: string[];
	fillerWords: string[];
}

export function runFluencyAnalysisProcessor({
	messages,
	language
}: {
	messages: Message[];
	language: Language;
}): {
	findings: Array<{
		summary: string;
		details: FluencyMetrics & {
			fluencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'native-like';
			strengthAreas: string[];
			improvementAreas: string[];
		};
		modality: 'text';
		confidence: number;
	}>;
	raw: { fluencyMetrics: FluencyMetrics };
	summary: string;
} {
	const userMessages = messages.filter(msg => msg.role === 'user' && msg.content.trim());

	if (userMessages.length === 0) {
		return {
			findings: [],
			raw: { fluencyMetrics: getEmptyMetrics() },
			summary: 'No user messages for fluency analysis'
		};
	}

	const metrics = calculateFluencyMetrics(userMessages);
	const fluencyLevel = determineFluencyLevel(metrics);
	const { strengthAreas, improvementAreas } = analyzeFluencyAreas(metrics);

	return {
		findings: [{
			summary: `Fluency analysis: ${fluencyLevel} level detected`,
			details: {
				...metrics,
				fluencyLevel,
				strengthAreas,
				improvementAreas
			},
			modality: 'text',
			confidence: 0.85
		}],
		raw: { fluencyMetrics: metrics },
		summary: `Fluency level: ${fluencyLevel} (${metrics.wordsPerMinute} WPM)`
	};
}

function calculateFluencyMetrics(messages: Message[]): FluencyMetrics {
	// Calculate words per minute based on conversation duration
	const firstMessage = messages[0];
	const lastMessage = messages[messages.length - 1];
	const durationMinutes = Math.max(1,
		(lastMessage.timestamp?.getTime() - firstMessage.timestamp?.getTime()) / (1000 * 60) || 1
	);

	const totalWords = messages.reduce((sum, msg) =>
		sum + (msg.content?.split(/\s+/)?.length || 0), 0
	);

	const wordsPerMinute = totalWords / durationMinutes;

	// Calculate average response time (simplified - would need more data in real implementation)
	const averageResponseTime = estimateAverageResponseTime(messages);

	// Vocabulary diversity (unique words / total words)
	const allWords = messages.flatMap(msg =>
		(msg.content || '').toLowerCase().split(/\s+/).filter(word => word.length > 2)
	);
	const uniqueWords = new Set(allWords);
	const vocabularyDiversity = allWords.length > 0 ? uniqueWords.size / allWords.length : 0;

	// Sentence complexity (average words per sentence)
	const sentences = messages.flatMap(msg =>
		(msg.content || '').split(/[.!?]+/).filter(s => s.trim().length > 0)
	);
	const sentenceComplexity = sentences.length > 0
		? allWords.length / sentences.length
		: 0;

	// Conversation flow (consistency of message lengths)
	const messageLengths = messages.map(msg => (msg.content || '').split(/\s+/).length);
	const avgLength = messageLengths.reduce((sum, len) => sum + len, 0) / messageLengths.length;
	const variance = messageLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / messageLengths.length;
	const conversationFlow = Math.max(0, 1 - (Math.sqrt(variance) / avgLength));

	// Pattern recognition
	const hesitationPatterns = detectHesitationPatterns(messages);
	const fillerWords = detectFillerWords(messages);

	return {
		wordsPerMinute: Math.round(wordsPerMinute * 10) / 10,
		averageResponseTime,
		vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
		sentenceComplexity: Math.round(sentenceComplexity * 10) / 10,
		conversationFlow: Math.round(conversationFlow * 100) / 100,
		hesitationPatterns,
		fillerWords
	};
}

function estimateAverageResponseTime(messages: Message[]): number {
	// This is a simplified calculation - in a real implementation,
	// you'd track actual typing/response times
	const avgMessageLength = messages.reduce((sum, msg) =>
		sum + (msg.content || '').length, 0) / messages.length;

	// Estimate based on message length (rough heuristic)
	return Math.max(2, avgMessageLength * 0.1);
}

function detectHesitationPatterns(messages: Message[]): string[] {
	const patterns = [
		'um', 'uh', 'er', 'like', 'you know', 'i mean', 'actually',
		'basically', 'literally', 'kind of', 'sort of'
	];

	const foundPatterns = new Set<string>();
	const allText = messages.map(msg => msg.content || '').join(' ').toLowerCase();

	patterns.forEach(pattern => {
		if (allText.includes(pattern)) {
			foundPatterns.add(pattern);
		}
	});

	return Array.from(foundPatterns);
}

function detectFillerWords(messages: Message[]): string[] {
	const fillers = ['well', 'so', 'anyway', 'basically', 'actually', 'really', 'just'];
	const foundFillers = new Set<string>();
	const allText = messages.map(msg => msg.content || '').join(' ').toLowerCase();

	fillers.forEach(filler => {
		const regex = new RegExp(`\\b${filler}\\b`, 'g');
		const matches = allText.match(regex);
		if (matches && matches.length > 2) { // Only flag if overused
			foundFillers.add(`${filler} (${matches.length}x)`);
		}
	});

	return Array.from(foundFillers);
}

function determineFluencyLevel(metrics: FluencyMetrics): 'beginner' | 'intermediate' | 'advanced' | 'native-like' {
	const scores = {
		wpm: metrics.wordsPerMinute > 120 ? 3 : metrics.wordsPerMinute > 80 ? 2 : metrics.wordsPerMinute > 40 ? 1 : 0,
		vocabulary: metrics.vocabularyDiversity > 0.7 ? 3 : metrics.vocabularyDiversity > 0.5 ? 2 : metrics.vocabularyDiversity > 0.3 ? 1 : 0,
		complexity: metrics.sentenceComplexity > 15 ? 3 : metrics.sentenceComplexity > 10 ? 2 : metrics.sentenceComplexity > 6 ? 1 : 0,
		flow: metrics.conversationFlow > 0.8 ? 3 : metrics.conversationFlow > 0.6 ? 2 : metrics.conversationFlow > 0.4 ? 1 : 0
	};

	const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

	if (totalScore >= 11) return 'native-like';
	if (totalScore >= 8) return 'advanced';
	if (totalScore >= 5) return 'intermediate';
	return 'beginner';
}

function analyzeFluencyAreas(metrics: FluencyMetrics): {
	strengthAreas: string[];
	improvementAreas: string[];
} {
	const strengthAreas: string[] = [];
	const improvementAreas: string[] = [];

	// Words per minute
	if (metrics.wordsPerMinute > 80) {
		strengthAreas.push('Good speaking pace');
	} else if (metrics.wordsPerMinute < 40) {
		improvementAreas.push('Speaking pace could be faster');
	}

	// Vocabulary diversity
	if (metrics.vocabularyDiversity > 0.6) {
		strengthAreas.push('Rich vocabulary usage');
	} else if (metrics.vocabularyDiversity < 0.4) {
		improvementAreas.push('Try using more varied vocabulary');
	}

	// Sentence complexity
	if (metrics.sentenceComplexity > 12) {
		strengthAreas.push('Complex sentence structures');
	} else if (metrics.sentenceComplexity < 6) {
		improvementAreas.push('Try using longer, more complex sentences');
	}

	// Conversation flow
	if (metrics.conversationFlow > 0.7) {
		strengthAreas.push('Consistent conversation flow');
	} else if (metrics.conversationFlow < 0.5) {
		improvementAreas.push('Work on maintaining consistent message lengths');
	}

	// Hesitation patterns
	if (metrics.hesitationPatterns.length === 0) {
		strengthAreas.push('Confident expression');
	} else if (metrics.hesitationPatterns.length > 3) {
		improvementAreas.push('Reduce hesitation patterns');
	}

	// Filler words
	if (metrics.fillerWords.length === 0) {
		strengthAreas.push('Clean speech patterns');
	} else if (metrics.fillerWords.length > 2) {
		improvementAreas.push('Reduce filler word usage');
	}

	return { strengthAreas, improvementAreas };
}

function getEmptyMetrics(): FluencyMetrics {
	return {
		wordsPerMinute: 0,
		averageResponseTime: 0,
		vocabularyDiversity: 0,
		sentenceComplexity: 0,
		conversationFlow: 0,
		hesitationPatterns: [],
		fillerWords: []
	};
}