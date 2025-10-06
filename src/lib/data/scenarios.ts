// 🎯 Scenarios Data
// Focused scenario set for the MVP

import type { Scenario } from '$lib/server/db/types';

// Extended scenario type with optional speaker selection hints
export type ScenarioWithHints = Scenario & {
	// Preferred locales for the conversation partner's voice (BCP-47 codes)
	localeHints?: string[]; // e.g., ['en-GB', 'en-US']
	// Soft preference for speaker gender (used as tie-breaker only)
	speakerGenderPreference?: 'male' | 'female' | 'neutral';
	// Preferred target languages for this scenario (language IDs from languages table)
	preferredLanguages?: string[]; // e.g., ['japanese', 'spanish', 'chinese']
};

export const scenariosData: ScenarioWithHints[] = [
	{
		id: 'onboarding-welcome',
		title: 'Mission Kickoff Briefing',
		description: 'Map the real conversations you need next.',
		category: 'onboarding',
		difficulty: 'beginner',
		instructions: `Name the three situations you dread most, how they currently go, and what "ready" would feel like. Your guide is listening for stakes, vocabulary gaps, and the people who matter to you.`,
		context:
			'You and your coach sit in a quiet studio, whiteboard ready to capture the missions that actually matter.',
		expectedOutcome:
			'A ranked mission plan that defines success criteria for your next conversations',
		learningObjectives: [
			'needs discovery',
			'scenario prioritization',
			'motivation priming',
			'comfort calibration',
			'language background',
			'goal setting'
		],
		comfortIndicators: {
			confidence: 3,
			engagement: 5,
			understanding: 4
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'clinic-night-triage',
		title: 'Midnight Clinic Triage',
		description: 'Explain a sudden medical issue at an urgent care clinic.',
		category: 'roleplay',
		difficulty: 'intermediate',
		instructions: `Describe your symptoms, when they started, and what makes them better or worse. Ask the nurse to repeat the plan until you can say it back confidently.`,
		context:
			'Fluorescent lights, rain still on your jacket, a calm nurse ushering you into a small exam room.',
		expectedOutcome: 'Communicate symptoms clearly and leave with a treatment plan you understand',
		learningObjectives: [
			'symptom vocabulary',
			'timeline narration',
			'medication discussion',
			'clarifying instructions',
			'anxiety regulation',
			'urgent escalation language'
		],
		comfortIndicators: {
			confidence: 2,
			engagement: 4,
			understanding: 3
		},
		isActive: true,
		localeHints: ['ja-JP'],
		preferredLanguages: ['ja'],
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'family-dinner-introduction',
		title: "Partner's Parents Dinner",
		description: 'Earn trust over a home-cooked meal with your partner’s parents.',
		category: 'relationships',
		difficulty: 'intermediate',
		instructions: `Share who you are, ask questions that show respect, and respond to advice with warmth. Practice toasts, compliments, and the small cultural cues that matter.`,
		context:
			'A low table, seasonal dishes, and parents who are curious but cautious about welcoming you in.',
		expectedOutcome: 'Leave the conversation feeling accepted and with a promised next visit',
		learningObjectives: [
			'family honorifics',
			'personal storytelling',
			'cultural etiquette',
			'complimenting naturally',
			'listening for subtext',
			'expressing gratitude'
		],
		comfortIndicators: {
			confidence: 3,
			engagement: 5,
			understanding: 4
		},
		isActive: true,
		localeHints: ['ja-JP'],
		preferredLanguages: ['ja'],
		speakerGenderPreference: 'neutral',
		createdAt: new Date(),
		updatedAt: new Date()
	}
];

export const getOnboardingScenario = (): ScenarioWithHints | undefined => {
	return scenariosData.find((scenario) => scenario.category === 'onboarding');
};

export const getComfortScenarios = (): ScenarioWithHints[] => {
	return scenariosData.filter((scenario) => scenario.category !== 'onboarding');
};

export const getScenarioById = (id: string): ScenarioWithHints | undefined => {
	return scenariosData.find((scenario) => scenario.id === id);
};

/**
 * Get scenarios filtered by language preference
 * Prioritizes scenarios that prefer the given language, then returns all others
 */
export const getScenariosByLanguage = (languageId: string): ScenarioWithHints[] => {
	const preferred = scenariosData.filter((scenario) =>
		scenario.preferredLanguages?.includes(languageId)
	);
	const general = scenariosData.filter(
		(scenario) => !scenario.preferredLanguages || !scenario.preferredLanguages.includes(languageId)
	);

	return [...preferred, ...general];
};

/**
 * Get scenarios for a user based on their language preferences
 * If user has preferences for the language, exclude onboarding scenarios
 * If user has no preferences, only show onboarding scenario
 */
export const getScenariosForUser = (
	hasPreferences: boolean,
	languageId?: string
): ScenarioWithHints[] => {
	if (!hasPreferences) {
		// User has no preferences - show only onboarding scenario
		const onboarding = getOnboardingScenario();
		return onboarding ? [onboarding] : [];
	}

	// User has preferences - exclude onboarding, filter by language if specified
	let scenarios = scenariosData.filter((scenario) => scenario.category !== 'onboarding');

	if (languageId) {
		// Prioritize scenarios for the user's language
		const preferred = scenarios.filter((scenario) =>
			scenario.preferredLanguages?.includes(languageId)
		);
		const general = scenarios.filter(
			(scenario) =>
				!scenario.preferredLanguages || !scenario.preferredLanguages.includes(languageId)
		);
		scenarios = [...preferred, ...general];
	}

	return scenarios;
};

/**
 * Get scenarios by category, optionally filtered by language
 */
export const getScenariosByCategory = (
	category: string,
	languageId?: string
): ScenarioWithHints[] => {
	let scenarios = scenariosData.filter((scenario) => scenario.category === category);

	if (languageId) {
		// Prioritize scenarios for the specified language
		const preferred = scenarios.filter((scenario) =>
			scenario.preferredLanguages?.includes(languageId)
		);
		const general = scenarios.filter(
			(scenario) =>
				!scenario.preferredLanguages || !scenario.preferredLanguages.includes(languageId)
		);
		scenarios = [...preferred, ...general];
	}

	return scenarios;
};
