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
	// Clear statement of what the learner will be able to do after completing this scenario
	learningGoal?: string;
	// Optional instruction parameter overrides to seed the session
	parameterHints?: Partial<InstructionParameters>;
};

export const scenariosData: ScenarioWithHints[] = [
	{
		id: 'beginner-confidence-bridge',
		title: 'Zero to Hero',
		description:
			'Start in your native language, then build confidence with 2–3 key phrases inside a real micro‑interaction you can use today.',
		role: 'tutor',
		difficulty: 'beginner',
		difficultyRating: 1,
		cefrLevel: 'A1',
		cefrRecommendation:
			"Perfect if you've just started your learning journey (A0–A1) and need native-language support.",
		learningGoal:
			'From zero knowledge, confidently introduce yourself in your target language using real phrases you can use today',
		instructions: `This is your confidence bootcamp. Start in the user's native language to learn who they want to talk to and why—this is their mission. Then move fast with an interaction-first plan:

1. **Mission Statement** (native language): Get a concrete situation: "Who do you want to talk to? What do you want to say? Why does it matter?"

2. **Pick ONE Micro-Interaction** (be opinionated): Choose a realistic scene (e.g., introduce yourself to a coworker). Teach just 2–3 anchor lines inside the scene:
   - Model slowly in the target language
   - Give a quick native translation if needed
   - Have them repeat 2–3 times
   - Celebrate each small win

3. **Mini-Scene Drill** (target language): Use those lines immediately in a 20–30s mini-scene. Keep turns short and end with a question.

4. **Final Run-Through** (target language): Have them say their full introduction once without translation. If they freeze, give the first word.

Coach warmly. Avoid lists. Build confidence in ~5 minutes.`,
		context:
			"A comfortable, pressure-free space. You're sitting with someone who has never spoken this language before. You are warm, patient, and genuinely excited about their goal. The goal is trust, clarity, and one tiny win they can feel.",
		expectedOutcome:
			"Learner leaves with a personal 30-second introduction in the target language they can say without translation, plus clarity on why they're learning.",
		learningObjectives: [
			'confidence priming through quick wins',
			'core phrase acquisition (2-3 phrases)',
			'pronunciation modeling with repetition',
			'native-to-target code switching',
			'personal mission articulation and relevance',
			'psychological safety and emotional buy-in'
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
		id: 'onboarding-welcome',
		title: 'Phrase Sandbox Practice',
		description:
			'Practice any phrases you want in your target language in a safe, judgment-free space.',
		role: 'tutor',
		difficulty: 'beginner',
		difficultyRating: 1,
		cefrLevel: 'A1',
		learningGoal:
			'Build confidence by practicing specific phrases in your target language and getting instant feedback in a low-pressure sandbox',
		instructions: `You are a friendly native speaker in a safe practice sandbox. Speak entirely in the learner's target language throughout this session. Your role is to:

1. **Greet warmly** and set the tone, asking what they'd like to practice today in their target language.

2. **Listen for their phrase requests** and help them practice:
   - If they ask "How do I say X?", give them the target language phrase with natural pronunciation guidance
   - Have them repeat it 2-3 times naturally
   - Use it in a mini-conversation so they hear it in context
   - Give warm, specific feedback

3. **Keep it conversational, not formal**:
   - Use natural expressions and interjections from your region
   - Celebrate small wins genuinely
   - If they get stuck, offer the phrase, never make them feel bad

3.5 **Be Opinionated if Needed** (micro-scene):
   - If they aren't sure what to practice, propose ONE realistic micro-interaction (e.g., self-intro, order coffee)
   - Teach 2–3 anchor lines inside that scene and use them immediately in a 20–30s mini-chat

4. **Correct explicitly when needed**:
   - If they mispronounce or get grammar wrong, say the correct version
   - Have them repeat it 2-3 times
   - Move on with warmth and encouragement

5. **Only speak the target language**:
   - Respond entirely in the target language throughout the session
   - If learner switches to their native language, respond back in the target language
   - Only provide native-language translations when explicitly helping with a difficult word

This is a judgment-free zone. No pressure, just practice.`,
		context:
			'A cozy, relaxed virtual space. No stakes, no formal lesson—just a native speaker who is genuinely happy to help you practice whatever phrases you want to work on.',
		expectedOutcome:
			'Leave with 2–3 new phrases in your target language you feel confident saying, and a sense that you can ask for help anytime',
		learningObjectives: [
			'phrase acquisition on demand',
			'conversational target language exposure',
			'pronunciation confidence',
			'safe practice environment',
			'autonomy in learning requests',
			'reduction of language anxiety'
		],
		comfortIndicators: {
			confidence: 2,
			engagement: 4,
			understanding: 3
		},
		persona: null,
		parameterHints: {
			speakingSpeed: 'slow',
			sentenceLength: 'short',
			languageMixingPolicy: 'strict_immersion',
			encouragementFrequency: 'frequent',

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
		learningGoal:
			'Confidently explain medical symptoms and understand treatment instructions in a healthcare setting',
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
		learningGoal:
			"Build genuine trust and connection with your partner's family through respectful, culturally-aware conversation",
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
		learningGoal:
			'Create genuine connection by asking thoughtful questions and sharing your story naturally',
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
		learningGoal:
			'Repair trust in relationships by apologizing authentically and rebuilding emotional connection',
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
		learningGoal:
			"Express emotions vulnerably and deepen emotional intimacy by sharing what's truly important to you",
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
		learningGoal:
			'Deliver a heartfelt, memorable toast that celebrates loved ones with genuine warmth and cultural grace',
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
		learningGoal:
			'Announce major life decisions with clarity and confidence while maintaining family trust and understanding',
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
