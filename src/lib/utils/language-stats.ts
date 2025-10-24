/**
 * Language-specific statistics utilities
 */

/**
 * Determine if a language should display character count instead of word count
 */
export function isCJKLanguage(languageCode: string | null): boolean {
	if (!languageCode) return false;

	const cjkLanguages = ['zh-CN', 'zh-TW', 'zh', 'ja', 'ko'];
	return cjkLanguages.includes(languageCode);
}

/**
 * Get the appropriate metric for a language (words or characters)
 */
export function getLanguageMetric(
	languageCode: string | null,
	wordCount: number,
	characterCount: number
): {
	value: number;
	unit: string;
	label: string;
} {
	const isCJK = isCJKLanguage(languageCode);

	if (isCJK) {
		return {
			value: characterCount,
			unit: 'characters',
			label: 'Characters'
		};
	} else {
		return {
			value: wordCount,
			unit: 'words',
			label: 'Words'
		};
	}
}

/**
 * Format language name with flag emoji
 */
export function formatLanguageName(languageCode: string | null): string {
	if (!languageCode) return 'N/A';

	const languageMap: Record<string, string> = {
		ja: '🇯🇵 Japanese',
		'zh-CN': '🇨🇳 Chinese',
		ko: '🇰🇷 Korean',
		es: '🇪🇸 Spanish',
		fr: '🇫🇷 French',
		de: '🇩🇪 German',
		it: '🇮🇹 Italian',
		pt: '🇵🇹 Portuguese',
		ru: '🇷🇺 Russian',
		ar: '🇸🇦 Arabic'
	};

	return languageMap[languageCode] || languageCode;
}

/**
 * Generate tangible comparisons for practice stats
 */
export function getTangibleComparisons(stats: {
	totalMinutes: number;
	totalWords?: number;
	totalCharacters?: number;
	language: string | null;
}): {
	icon: string;
	comparison: string;
}[] {
	const comparisons: { icon: string; comparison: string }[] = [];

	// Time-based comparisons
	if (stats.totalMinutes >= 60) {
		const hours = Math.round(stats.totalMinutes / 60);
		comparisons.push({
			icon: '🎬',
			comparison: `${hours} feature-length movie${hours > 1 ? 's' : ''}`
		});
	} else if (stats.totalMinutes >= 30) {
		comparisons.push({
			icon: '📺',
			comparison: 'a TV episode'
		});
	} else if (stats.totalMinutes >= 10) {
		comparisons.push({
			icon: '☕',
			comparison: 'a coffee break conversation'
		});
	}

	// Word/Character-based comparisons
	const isCJK = isCJKLanguage(stats.language);

	if (isCJK && stats.totalCharacters) {
		// CJK character comparisons
		if (stats.totalCharacters >= 10000) {
			const shortStories = Math.round(stats.totalCharacters / 5000);
			comparisons.push({
				icon: '📖',
				comparison: `${shortStories} short stor${shortStories > 1 ? 'ies' : 'y'}`
			});
		} else if (stats.totalCharacters >= 1000) {
			const articles = Math.round(stats.totalCharacters / 1000);
			comparisons.push({
				icon: '📄',
				comparison: `${articles} article${articles > 1 ? 's' : ''}`
			});
		} else if (stats.totalCharacters >= 500) {
			comparisons.push({
				icon: '💬',
				comparison: 'a long email'
			});
		}
	} else if (stats.totalWords) {
		// Word-based comparisons
		if (stats.totalWords >= 5000) {
			const chapters = Math.round(stats.totalWords / 2500);
			comparisons.push({
				icon: '📚',
				comparison: `${chapters} book chapter${chapters > 1 ? 's' : ''}`
			});
		} else if (stats.totalWords >= 1000) {
			const articles = Math.round(stats.totalWords / 500);
			comparisons.push({
				icon: '📰',
				comparison: `${articles} blog post${articles > 1 ? 's' : ''}`
			});
		} else if (stats.totalWords >= 500) {
			comparisons.push({
				icon: '📝',
				comparison: 'a one-page essay'
			});
		} else if (stats.totalWords >= 100) {
			comparisons.push({
				icon: '💭',
				comparison: 'a few paragraphs'
			});
		}
	}

	// Conversation-based comparison (speaking rate estimate)
	if (stats.totalMinutes > 0) {
		const estimatedSpeakingMinutes = isCJK
			? Math.round((stats.totalCharacters || 0) / 150) // ~150 chars/min for CJK
			: Math.round((stats.totalWords || 0) / 130); // ~130 words/min average speaking rate

		if (estimatedSpeakingMinutes >= 60) {
			const hours = Math.round(estimatedSpeakingMinutes / 60);
			comparisons.push({
				icon: '🗣️',
				comparison: `${hours} hour${hours > 1 ? 's' : ''} of active speaking`
			});
		} else if (estimatedSpeakingMinutes >= 5) {
			comparisons.push({
				icon: '💬',
				comparison: `${estimatedSpeakingMinutes} minutes of active speaking`
			});
		}
	}

	// Milestone-based encouragement
	if (stats.totalMinutes >= 180) {
		// 3 hours
		comparisons.push({
			icon: '⭐',
			comparison: 'serious immersion time!'
		});
	} else if (stats.totalMinutes >= 60) {
		comparisons.push({
			icon: '🔥',
			comparison: 'building strong habits!'
		});
	}

	return comparisons;
}

/**
 * Get a friendly summary string for email/display
 */
export function getTangibleSummary(stats: {
	totalMinutes: number;
	totalWords?: number;
	totalCharacters?: number;
	language: string | null;
}): string {
	const comparisons = getTangibleComparisons(stats);

	if (comparisons.length === 0) {
		return 'Great start on your language journey!';
	}

	// Pick the most impressive comparison
	const primary = comparisons[0];

	if (comparisons.length === 1) {
		return `That's like ${primary.comparison}!`;
	}

	const secondary = comparisons[1];
	return `That's like ${primary.comparison}, or ${secondary.comparison}!`;
}
