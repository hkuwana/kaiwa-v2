import type { UserPreferences } from '$lib/server/db/types';
import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';

// 🌟 Dummy User Preferences for Guests
// This provides sensible defaults for users who haven't logged in yet

export const defaultUserPreference: Omit<
	UserPreferences,
	'id' | 'userId' | 'createdAt' | 'updatedAt'
> = {
	// Essential learning preferences
	targetLanguageId: 'en', // Default to English
	learningGoal: 'Connection',
	preferredVoice: DEFAULT_VOICE,
	dailyGoalSeconds: 180,

	// Skill breakdown by competency (beginner level)
	speakingLevel: 5,
	listeningLevel: 5,
	readingLevel: 5,
	writingLevel: 5,

	// Confidence tracking
	speakingConfidence: 50,

	// Specific learning goals
	specificGoals: ['basic conversation', 'greetings', 'introductions'],

	// Adaptive learning preferences
	challengePreference: 'moderate',
	correctionStyle: 'gentle',
	conversationContext: null,
	successfulExchanges: 0,
	comfortZone: null,
	memories: null,
	// Progress tracking defaults
	recentSessionScores: [],
	skillLevelHistory: [],
	// Realtime audio interaction settings (client UX defaults)
	audioSettings: {
		mode: 'toggle', // default: click to toggle
		pressBehavior: 'tap_toggle', // default: tap toggles on/off
		autoGreet: true,
		greetingMode: 'scenario'
	}
};

// 🌟 Guest User Preferences Factory
// Creates a complete preferences object for guests with generated ID and timestamps

export function createGuestUserPreferences(
	overrides: Partial<typeof defaultUserPreference> = {}
): UserPreferences {
	const now = new Date();

	return {
		id: crypto.randomUUID(),
		userId: 'guest', // Special identifier for guests
		...defaultUserPreference,
		...overrides,
		createdAt: now,
		updatedAt: now
	};
}

// 🌟 Default Preferences by Language
// Language-specific default preferences

export const languageSpecificDefaults: Record<string, Partial<typeof defaultUserPreference>> = {
	ja: {
		targetLanguageId: 'ja',
		learningGoal: 'Culture',
		specificGoals: ['basic greetings', 'self-introduction', 'daily conversation'],
		challengePreference: 'moderate'
	},
	es: {
		targetLanguageId: 'es',
		learningGoal: 'Travel',
		specificGoals: ['ordering food', 'asking directions', 'basic conversation'],
		challengePreference: 'comfortable'
	},
	fr: {
		targetLanguageId: 'fr',
		learningGoal: 'Culture',
		specificGoals: ['greetings', 'basic phrases', 'cultural expressions'],
		challengePreference: 'moderate'
	},
	de: {
		targetLanguageId: 'de',
		learningGoal: 'Career',
		specificGoals: ['business greetings', 'formal conversation', 'professional vocabulary'],
		challengePreference: 'challenging'
	}
};

// 🌟 Get Language-Specific Preferences
// Combines dummy preferences with language-specific overrides

export function getLanguageSpecificPreferences(languageCode: string): typeof defaultUserPreference {
	const languageDefaults = languageSpecificDefaults[languageCode] || {};

	return {
		...defaultUserPreference,
		...languageDefaults
	};
}
