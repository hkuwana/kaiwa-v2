// src/lib/utils/cefr.ts
// Helper utilities for working with CEFR-aligned difficulty ratings

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// 1-8 scale where higher numbers indicate more advanced CEFR proficiency.
// We allow small ranges so future scenarios can represent sub-bands (e.g., B2+).
const RATING_TO_CEFR: Array<{ level: CEFRLevel; min: number; max: number }> = [
	{ level: 'A1', min: 1, max: 2 },
	{ level: 'A2', min: 3, max: 3 },
	{ level: 'B1', min: 4, max: 5 },
	{ level: 'B2', min: 6, max: 6 },
	{ level: 'C1', min: 7, max: 7 },
	{ level: 'C2', min: 8, max: 8 }
];

const CEFR_TO_RATING: Record<CEFRLevel, number> = {
	A1: 1,
	A2: 3,
	B1: 4,
	B2: 6,
	C1: 7,
	C2: 8
};

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function difficultyRatingToCefr(rating?: number | null): CEFRLevel {
	if (!rating) return 'A1';
	const match = RATING_TO_CEFR.find((band) => rating >= band.min && rating <= band.max);
	return match?.level ?? (rating > 8 ? 'C2' : 'A1');
}

export function cefrToDifficultyRating(level?: CEFRLevel | null): number {
	if (!level) return CEFR_TO_RATING.A1;
	return CEFR_TO_RATING[level];
}

export function compareCefrLevel(a: CEFRLevel, b: CEFRLevel): number {
	return CEFR_ORDER.indexOf(a) - CEFR_ORDER.indexOf(b);
}

export function inferCefrFromSpeakingScore(score?: number | null): CEFRLevel {
	if (score == null) return 'A1';
	if (score >= 85) return 'C2';
	if (score >= 70) return 'C1';
	if (score >= 55) return 'B2';
	if (score >= 40) return 'B1';
	if (score >= 25) return 'A2';
	return 'A1';
}

export function shouldStayInTargetLanguage(level: CEFRLevel): boolean {
	// Encourage full target-language immersion for learners at B2 or above
	return compareCefrLevel(level, 'B2') >= 0;
}

export function difficultyRatingToStars(rating?: number | null): number {
	if (!rating) return 1;
	// Map 1-8 to 1-5 stars (rounded up) to balance readability
	return Math.min(5, Math.max(1, Math.ceil(rating / 2)));
}

export function getDifficultyLevel(rating?: number | null): {
	label: string;
	color: 'success' | 'warning' | 'error';
	description: string;
} {
	if (!rating) rating = 1;

	if (rating <= 2) {
		return {
			label: 'Easy',
			color: 'success',
			description: 'Perfect for beginners. Simple vocabulary and grammar.'
		};
	} else if (rating <= 4) {
		return {
			label: 'Intermediate',
			color: 'warning',
			description: 'Moderate challenge. Introduces more complex topics and vocabulary.'
		};
	} else {
		return {
			label: 'Hard',
			color: 'error',
			description: 'Advanced content. Requires good language proficiency.'
		};
	}
}

export function formatCefrBadge(
	level: CEFRLevel,
	options: { withDescriptor?: boolean } = {}
): string {
	if (!options.withDescriptor) return level;

	const descriptorMap: Record<CEFRLevel, string> = {
		A1: 'Beginner',
		A2: 'Elementary',
		B1: 'Intermediate',
		B2: 'Upper-Intermediate',
		C1: 'Advanced',
		C2: 'Expert'
	};

	return `${level} - ${descriptorMap[level]}`;
}

// Helper for instruction system
export function getLearnerCefrLevel(preferences: { speakingLevel?: number | null }): CEFRLevel {
	return inferCefrFromSpeakingScore(preferences.speakingLevel);
}

// Helper for scenario difficulty
export function getScenarioCefrLevel(scenario?: {
	cefrLevel?: CEFRLevel;
	difficultyRating?: number;
}): CEFRLevel {
	if (!scenario) return 'A1';
	return scenario.cefrLevel || difficultyRatingToCefr(scenario.difficultyRating);
}
