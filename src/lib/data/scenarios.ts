// 🎯 Scenarios Data
// Focused scenario set for the MVP

import type { Scenario } from '$lib/server/db/types';
import type { CEFRLevel } from '$lib/utils/cefr';
import type { InstructionParameters } from '$lib/services/instructions/parameters';

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
	// Freeform guidance for UI copy (e.g., recommended CEFR levels)
	cefrRecommendation?: string;
	// Optional instruction parameter overrides to seed the session
	parameterHints?: Partial<InstructionParameters>;
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
		persona: null,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'beginner-confidence-bridge',
		title: 'Starting from Zero',
		description:
			'Start from zero in the target language, blending native-language support into your first phrases.',
		role: 'tutor',
		difficulty: 'beginner',
		difficultyRating: 1,
		cefrLevel: 'A1',
		cefrRecommendation: 'Ideal if you are A0–A1 and need native-language scaffolding.',
		instructions: `You and your coach build a shared phrase bank. First, explain (in your native language) who you need to talk to and why. Then practice 3–5 anchor phrases where the coach says it in the target language, gives the native translation, and has you repeat. Finish by assembling those phrases into a short introduction.`,
		context:
			'A quiet table with notebooks open. Your coach is patient, mixing your native language with slow target-language modeling.',
		expectedOutcome:
			'Leave with a personal intro script that you can say once in the target language without translation.',
		learningObjectives: [
			'confidence priming',
			'core phrase acquisition',
			'pronunciation modeling',
			'native-to-target scaffolding',
			'personal mission articulation'
		],
		comfortIndicators: {
			confidence: 1,
			engagement: 4,
			understanding: 2
		},
		persona: null,
		parameterHints: {
			speakingSpeed: 'very_slow',
			sentenceLength: 'very_short',
			scaffoldingLevel: 'heavy',
			languageMixingPolicy: 'code_switching',
			encouragementFrequency: 'frequent',
			topicChangeFrequency: 'focused',
			conversationPace: 'relaxed',
			pauseFrequency: 'frequent',
			vocabularyComplexity: 'basic',
			grammarComplexity: 'simple',
			correctionStyle: 'explicit'
		},
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'clinic-night-triage',
		title: 'Midnight Clinic Triage',
		description: 'Explain a medical issue at an urgent care clinic.',
		role: 'character',
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
		persona: {
			title: 'Night-Shift Triage Nurse',
			nameTemplate: 'Nurse {SPEAKER_NAME}',
			setting: 'Urgent care exam room just after midnight.',
			introPrompt:
				'Introduce yourself as the triage nurse on duty, verify the patient name, and begin calmly collecting symptoms and vital details.',
			stakes:
				'If you miss critical information, the patient may not receive the right treatment in time.'
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
		description: "Earn trust over a meal with your partner's parents.",
		role: 'character',
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
		persona: {
			title: 'Protective Parent Hosting Dinner',
			nameTemplate: '{SPEAKER_NAME}-san',
			setting: 'Tatami dining room with seasonal dishes and attentive family members.',
			introPrompt:
				'Greet your child’s partner warmly but with cautious curiosity, ask respectful questions about their background, and notice small etiquette cues.',
			stakes:
				'You want to decide whether to welcome them into the family and trust them with your child’s future.'
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
		persona: null,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'relationship-apology',
		title: 'Relationship Apology',
		description: 'Repair trust after a misunderstanding with your partner.',
		role: 'character',
		difficulty: 'intermediate',
		difficultyRating: 5,
		cefrLevel: 'B2',
		instructions: `Acknowledge what hurt them, explain what you meant without deflecting, and rebuild trust by asking what they need from you. Practice the vulnerability that turns "sorry" into real repair.`,
		context:
			'A quiet moment after the argument has cooled. Your partner is willing to listen, but trust needs rebuilding.',
		expectedOutcome:
			'Restore emotional connection and leave with a shared plan to prevent the same friction',
		learningObjectives: [
			'apology language',
			'taking responsibility',
			'expressing regret',
			'active listening',
			'emotional repair',
			'cultural nuance in apologies',
			'rebuilding trust'
		],
		comfortIndicators: {
			confidence: 2,
			engagement: 5,
			understanding: 4
		},
		persona: {
			title: 'Partner After Conflict',
			nameTemplate: '{SPEAKER_NAME}',
			setting: 'A quiet space where your partner is ready to talk but still hurt.',
			introPrompt:
				'Express that you are willing to listen but need to hear genuine acknowledgment. Share how the situation made you feel and wait to see if your partner truly understands.',
			stakes:
				'If the apology feels shallow or defensive, the relationship loses another layer of trust.'
		},
		isActive: true,
		localeHints: ['ja-JP'],
		preferredLanguages: ['ja'],
		speakerGenderPreference: 'neutral',
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'vulnerable-heart-to-heart',
		title: 'Sharing What You Really Feel',
		description: 'Express your fears, hopes, or needs to someone you love.',
		role: 'character',
		difficulty: 'intermediate',
		difficultyRating: 4,
		cefrLevel: 'B1',
		instructions: `Name the feeling, explain why it matters, and ask for what you need. Practice moving past "I'm fine" to say what's actually true.`,
		context:
			'Late evening, safe space with someone who cares. The moment when surface talk could go deeper.',
		expectedOutcome: 'Feel heard and understood; strengthen emotional intimacy through honesty',
		learningObjectives: [
			'emotion vocabulary',
			'vulnerability expression',
			'asking for support',
			'sharing inner thoughts',
			'cultural emotional norms',
			'opening up gradually'
		],
		comfortIndicators: {
			confidence: 2,
			engagement: 5,
			understanding: 4
		},
		persona: {
			title: 'Trusted Loved One',
			nameTemplate: '{SPEAKER_NAME}',
			setting: 'A safe, quiet moment where someone is ready to really listen.',
			introPrompt:
				'Notice that something feels important. Ask gentle questions, create space for honesty, and respond with empathy when they share.',
			stakes: 'If you rush or minimize their feelings, they may close off and stop sharing.'
		},
		isActive: true,
		localeHints: ['ja-JP'],
		preferredLanguages: ['ja'],
		speakerGenderPreference: 'neutral',
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'family-milestone-toast',
		title: 'Family Celebration Speech',
		description: 'Deliver a heartfelt toast at a wedding, birthday, or reunion.',
		role: 'character',
		difficulty: 'intermediate',
		difficultyRating: 5,
		cefrLevel: 'B2',
		instructions: `Share a personal story, honor the people being celebrated, and close with a wish for the future. Practice the cadence, warmth, and cultural touches that make a toast memorable.`,
		context:
			'A room full of relatives and friends. Glasses raised, cameras ready, and everyone waiting to hear your words.',
		expectedOutcome:
			'Deliver a toast that feels authentic, honors tradition, and earns genuine applause',
		learningObjectives: [
			'celebratory language',
			'storytelling in public',
			'cultural toast customs',
			'honoring family',
			'expressing gratitude',
			'public speaking confidence'
		],
		comfortIndicators: {
			confidence: 3,
			engagement: 5,
			understanding: 4
		},
		persona: {
			title: 'Family Gathering Audience',
			nameTemplate: 'Family & Friends',
			setting: 'A celebration with relatives of all ages listening and recording the moment.',
			introPrompt:
				'Listen warmly as someone you care about gives a toast. React to personal stories, laugh at gentle humor, and raise your glass when they finish.',
			stakes:
				'If the toast feels flat or culturally off, the moment loses its emotional weight and becomes awkward.'
		},
		isActive: true,
		localeHints: ['ja-JP'],
		preferredLanguages: ['ja'],
		speakerGenderPreference: 'neutral',
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 'breaking-important-news',
		title: 'Sharing Life Changes',
		description: 'Tell your family about a major decision: moving, career change, or relationship.',
		role: 'character',
		difficulty: 'intermediate',
		difficultyRating: 5,
		cefrLevel: 'B2',
		instructions: `Lead with the decision, explain your reasoning, acknowledge their concerns, and reassure them that the relationship stays strong. Practice handling reactions from surprise to resistance.`,
		context:
			'A serious family conversation. You have news that will change things, and they deserve to hear it from you directly.',
		expectedOutcome:
			'Share your decision clearly, handle emotional reactions with care, and maintain family trust',
		learningObjectives: [
			'delivering important news',
			'explaining decisions',
			'handling emotional reactions',
			'reassuring loved ones',
			'navigating family dynamics',
			'respectful assertiveness'
		],
		comfortIndicators: {
			confidence: 3,
			engagement: 5,
			understanding: 4
		},
		persona: {
			title: 'Family Member Receiving News',
			nameTemplate: '{SPEAKER_NAME}',
			setting: 'A family setting where important news is about to be shared.',
			introPrompt:
				'Listen as your family member shares an important life decision. React with genuine emotion—surprise, concern, or questions—and try to understand their reasoning.',
			stakes:
				'If they cannot explain clearly or handle your concerns, you may feel excluded from their life or worried about their future.'
		},
		isActive: true,
		localeHints: ['ja-JP'],
		preferredLanguages: ['ja'],
		speakerGenderPreference: 'neutral',
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
