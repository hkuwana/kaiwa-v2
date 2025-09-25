import type { Message } from '$lib/server/db/types';

interface GrammarIssue {
	type: 'subject-verb-agreement' | 'article-usage' | 'tense-consistency' | 'word-order' | 'common-mistake';
	severity: 'low' | 'medium' | 'high';
	suggestion: string;
	explanation: string;
	position?: { start: number; end: number };
}

export function runAdvancedGrammarProcessor({
	messages,
	language
}: {
	messages: Message[];
	language: { code: string; name: string };
}): {
	findings: Array<{
		summary: string;
		details: {
			issues: GrammarIssue[];
			overallScore: number;
			improvementAreas: string[];
		};
		modality: 'text';
		targetMessageId: string;
		suggestedAction: string;
		confidence: number;
	}>;
	summary: string;
} {
	const findings: Array<{
		summary: string;
		details: {
			issues: GrammarIssue[];
			overallScore: number;
			improvementAreas: string[];
		};
		modality: 'text';
		targetMessageId: string;
		suggestedAction: string;
		confidence: number;
	}> = [];

	const userMessages = messages.filter(msg => msg.role === 'user' && msg.content.trim());

	for (const message of userMessages) {
		const issues = analyzeGrammarIssues(message.content, language.code);

		if (issues.length === 0) continue;

		const overallScore = calculateGrammarScore(issues);
		const improvementAreas = identifyImprovementAreas(issues);

		findings.push({
			summary: `Found ${issues.length} grammar points for improvement (Score: ${overallScore}/100)`,
			details: {
				issues,
				overallScore,
				improvementAreas
			},
			modality: 'text',
			targetMessageId: message.id,
			suggestedAction: 'Show detailed grammar analysis',
			confidence: 0.8
		});
	}

	return {
		findings,
		summary: findings.length
			? `Advanced grammar analysis: ${findings.length} messages analyzed`
			: 'No grammar issues detected'
	};
}

function analyzeGrammarIssues(content: string, languageCode: string): GrammarIssue[] {
	const issues: GrammarIssue[] = [];
	const lowercaseContent = content.toLowerCase();

	// Subject-verb agreement patterns
	const svPatterns = [
		{ pattern: /\b(i|you|we|they)\s+(is|was)\b/g, type: 'subject-verb-agreement' as const },
		{ pattern: /\b(he|she|it)\s+(are|were)\b/g, type: 'subject-verb-agreement' as const }
	];

	// Article usage patterns
	const articlePatterns = [
		{ pattern: /\b(a)\s+[aeiou]/gi, suggestion: 'Use "an" before vowels', type: 'article-usage' as const },
		{ pattern: /\b(an)\s+[bcdfghjklmnpqrstvwxyz]/gi, suggestion: 'Use "a" before consonants', type: 'article-usage' as const }
	];

	// Common ESL mistakes
	const commonMistakes = [
		{ pattern: /\bmake\s+homework\b/gi, correct: 'do homework', type: 'common-mistake' as const },
		{ pattern: /\bsay\s+me\b/gi, correct: 'tell me', type: 'common-mistake' as const },
		{ pattern: /\bexplain\s+me\b/gi, correct: 'explain to me', type: 'common-mistake' as const }
	];

	// Process patterns
	[...svPatterns, ...articlePatterns, ...commonMistakes].forEach((patternObj) => {
		const { pattern, type } = patternObj;
		const suggestion = 'suggestion' in patternObj ? patternObj.suggestion : undefined;
		const correct = 'correct' in patternObj ? patternObj.correct : undefined;

		let match;
		while ((match = pattern.exec(content)) !== null) {
			issues.push({
				type,
				severity: type === 'subject-verb-agreement' ? 'high' : 'medium',
				suggestion: suggestion || (correct ? `Consider: "${correct}"` : 'Grammar issue detected'),
				explanation: getExplanation(type, match[0]),
				position: { start: match.index, end: match.index + match[0].length }
			});
		}
	});

	return issues;
}

function calculateGrammarScore(issues: GrammarIssue[]): number {
	if (issues.length === 0) return 100;

	const severityWeights = { low: 2, medium: 5, high: 10 };
	const totalDeduction = issues.reduce((sum, issue) => sum + severityWeights[issue.severity], 0);

	return Math.max(0, 100 - Math.min(totalDeduction, 90));
}

function identifyImprovementAreas(issues: GrammarIssue[]): string[] {
	const areas = new Set<string>();

	issues.forEach(issue => {
		switch (issue.type) {
			case 'subject-verb-agreement':
				areas.add('Subject-verb agreement');
				break;
			case 'article-usage':
				areas.add('Article usage (a/an/the)');
				break;
			case 'common-mistake':
				areas.add('Common expression patterns');
				break;
			case 'tense-consistency':
				areas.add('Tense consistency');
				break;
			case 'word-order':
				areas.add('Word order');
				break;
		}
	});

	return Array.from(areas);
}

function getExplanation(type: GrammarIssue['type'], match: string): string {
	const explanations = {
		'subject-verb-agreement': 'Subject and verb must agree in number (singular/plural)',
		'article-usage': 'Choose the correct article based on the following sound',
		'common-mistake': 'This is a common mistake for language learners',
		'tense-consistency': 'Keep tenses consistent throughout your message',
		'word-order': 'Word order affects meaning and clarity'
	};

	return explanations[type] || 'Grammar improvement opportunity';
}