// 🎯 Scenarios Data
// Focused scenario set for the MVP

import type { Scenario } from '$lib/server/db/types';
import type { CEFRLevel } from '$lib/utils/cefr';

// Extended scenario type with optional speaker selection hints
export type ScenarioWithHints = Scenario & {
	// Preferred locales for the conversation partner's voice (BCP-47 codes)
	localeHints?: string[]; // e.g., ['en-GB', 'en-US']
	// Soft preference for speaker gender (used as tie-breaker only)
	speakerGenderPreference?: 'male' | 'female' | 'neutral';
	// Preferred target languages for this scenario (language IDs from languages table)
	preferredLanguages?: string[]; // e.g., ['japanese', 'spanish', 'chinese']
	// Numeric difficulty rating mapped to CEFR (1-8 scale)
	difficultyRating?: number;
	// Cached CEFR level label
	cefrLevel?: CEFRLevel;
};

export const scenariosData: ScenarioWithHints[] = [
	{
		id: 'onboarding-welcome',
		title: 'Mission Kickoff Briefing',
		description: 'Map the real conversations you need next.',
		role: 'tutor',
		difficulty: 'beginner',
		difficultyRating: 1,
		cefrLevel: 'A1',
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
		description: 'Explain a medical issue at an urgent care clinic.',
		role: 'roleplay',
		difficulty: 'intermediate',
		difficultyRating: 4,
		cefrLevel: 'B1',
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
		id: 'politics-cafe-debate',
		title: 'Café Politics Discussion',
		description: 'Debate current events with a politically engaged friend over coffee.',
		role: 'friendly_chat',
		difficulty: 'intermediate',
		difficultyRating: 5,
		cefrLevel: 'B2',
		instructions: `Share your opinions on recent news, ask what they think, and practice agreeing, disagreeing, and finding common ground. Focus on natural back-and-forth like friends debating ideas.`,
		context:
			'A busy café, afternoon light streaming through windows, your friend leaning in with strong opinions about the latest headlines.',
		expectedOutcome:
			'Express nuanced political views and engage in respectful debate like a native speaker',
		learningObjectives: [
			'opinion vocabulary',
			'debate expressions',
			'polite disagreement',
			'supporting arguments',
			'conversational flow',
			'cultural sensitivity'
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
	},
	{
		id: 'grammar-tutor-session',
		title: 'Grammar Fundamentals Session',
		description: 'Practice verb conjugations and sentence structure with clear explanations.',
		role: 'tutor',
		difficulty: 'beginner',
		difficultyRating: 2,
		cefrLevel: 'A2',
		instructions: `Focus on mastering specific grammar patterns. Your tutor will explain rules, provide examples, correct your mistakes, and drill until you get it right.`,
		context:
			'A quiet study room with whiteboard space, your patient tutor ready to break down complex grammar into simple steps.',
		expectedOutcome: 'Understand and correctly use target grammar patterns with confidence',
		learningObjectives: [
			'verb conjugation',
			'sentence structure',
			'grammar pattern recognition',
			'error correction',
			'systematic practice',
			'rule comprehension'
		],
		comfortIndicators: {
			confidence: 3,
			engagement: 3,
			understanding: 5
		},
		isActive: true,
		localeHints: ['ja-JP'],
		preferredLanguages: ['ja'],
		speakerGenderPreference: 'neutral',
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'family-dinner-introduction',
		title: "Partner's Parents Dinner",
		description: "Earn trust over a meal with your partner's parents.",
		role: 'roleplay',
		difficulty: 'intermediate',
		difficultyRating: 6,
		cefrLevel: 'B2',
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
	},
	{
		id: 'executive-board-negotiation',
		title: 'Executive Board Negotiation',
		description:
			'Defend a strategic decision in front of skeptical executives and earn their approval.',
		role: 'roleplay',
		difficulty: 'advanced',
		difficultyRating: 7,
		cefrLevel: 'C1',
		instructions: `Lay out your recommendation in two concise points, anticipate objections, and clarify trade-offs with precise language. Push for a decision by summarizing consensus in the target language.`,
		context:
			'A glass-walled boardroom late at night. Revenue dashboards glow on the wall while senior leaders wait for your proposal.',
		expectedOutcome:
			'Secure stakeholder alignment on a high-stakes initiative with confident, nuanced language',
		learningObjectives: [
			'strategic framing',
			'objection handling',
			'persuasive summaries',
			'executive tone control',
			'high-register vocabulary'
		],
		comfortIndicators: {
			confidence: 4,
			engagement: 4,
			understanding: 4
		},
		isActive: true,
		localeHints: ['ja-JP'],
		preferredLanguages: ['ja'],
		speakerGenderPreference: 'neutral',
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'crisis-press-briefing',
		title: 'Crisis Press Briefing',
		description:
			'Face international reporters during a live briefing and manage follow-up questions with precision.',
		role: 'roleplay',
		difficulty: 'advanced',
		difficultyRating: 8,
		cefrLevel: 'C2',
		instructions: `Deliver a crisp opening statement, field fast-paced questions without losing composure, and close with a controlled call to action. Keep your language exact, diplomatic, and adaptive.`,
		context:
			'Bright lights, cameras blinking red, microphones thrust forward from every angle. Broadcasters are live in multiple languages.',
		expectedOutcome:
			'Demonstrate native-level fluency while handling probing questions under public pressure',
		learningObjectives: [
			'diplomatic phrasing',
			'rapid response control',
			'register shifting',
			'press conference etiquette',
			'precision under pressure'
		],
		comfortIndicators: {
			confidence: 2,
			engagement: 5,
			understanding: 5
		},
		isActive: true,
		localeHints: ['ja-JP'],
		preferredLanguages: ['ja'],
		speakerGenderPreference: 'neutral',
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'first-date-drinks',
		title: 'First Date Drinks',
		description: 'Break the ice and get to know someone on a first date.',
		role: 'friendly_chat',
		difficulty: 'intermediate',
		difficultyRating: 4,
		cefrLevel: 'B1',
		instructions: `You're on a first date. Ask questions, share stories, and see if there's a connection.`,
		context: 'A cozy bar with dim lighting and a good selection of drinks.',
		expectedOutcome: 'A fun and engaging conversation that leads to a second date.',
		learningObjectives: [
			'asking personal questions',
			'sharing personal stories',
			'flirting',
			'active listening'
		],
		comfortIndicators: {
			confidence: 3,
			engagement: 5,
			understanding: 4
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	}
];

const DEFAULT_RATING = 99;

const sortByDifficultyRating = (a: ScenarioWithHints, b: ScenarioWithHints) => {
	const ratingA = a.difficultyRating ?? DEFAULT_RATING;
	const ratingB = b.difficultyRating ?? DEFAULT_RATING;
	if (ratingA === ratingB) return a.title.localeCompare(b.title);
	return ratingA - ratingB;
};

export const sortScenariosByDifficulty = (input: ScenarioWithHints[]): ScenarioWithHints[] => {
	return [...input].sort(sortByDifficultyRating);
};

export const getOnboardingScenario = (): ScenarioWithHints | undefined => {
	return scenariosData.find(
		(scenario) => scenario.role === 'tutor' && scenario.id === 'onboarding-welcome'
	);
};

export const getComfortScenarios = (): ScenarioWithHints[] => {
	return scenariosData
		.filter((scenario) => scenario.id !== 'onboarding-welcome')
		.sort(sortByDifficultyRating);
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

	return [...preferred.sort(sortByDifficultyRating), ...general.sort(sortByDifficultyRating)];
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
	let scenarios = scenariosData.filter((scenario) => scenario.id !== 'onboarding-welcome');

	if (languageId) {
		// Prioritize scenarios for the user's language
		const preferred = scenarios.filter((scenario) =>
			scenario.preferredLanguages?.includes(languageId)
		);
		const general = scenarios.filter(
			(scenario) =>
				!scenario.preferredLanguages || !scenario.preferredLanguages.includes(languageId)
		);
		scenarios = [
			...preferred.sort(sortByDifficultyRating),
			...general.sort(sortByDifficultyRating)
		];
	}

	return scenarios.sort(sortByDifficultyRating);
};

/**
 * Get scenarios by role, optionally filtered by language
 */
export const getScenariosByRole = (role: string, languageId?: string): ScenarioWithHints[] => {
	let scenarios = scenariosData.filter((scenario) => scenario.role === role);

	if (languageId) {
		// Prioritize scenarios for the specified language
		const preferred = scenarios.filter((scenario) =>
			scenario.preferredLanguages?.includes(languageId)
		);
		const general = scenarios.filter(
			(scenario) =>
				!scenario.preferredLanguages || !scenario.preferredLanguages.includes(languageId)
		);
		scenarios = [
			...preferred.sort(sortByDifficultyRating),
			...general.sort(sortByDifficultyRating)
		];
	}

	return scenarios.sort(sortByDifficultyRating);
};
