import type { UserPreferences } from '$lib/server/db/types';
import {
	createGuestUserPreferences,
	getLanguageSpecificPreferences
} from '$lib/data/user-preferences';

// 🌟 User Preferences Service
// Pure, stateless functions for working with user preferences

// 🌟 Create guest user preferences
export function createGuestPreferences(): UserPreferences {
	return createGuestUserPreferences();
}

// 🌟 Get language-specific preferences
export function getLanguagePreferences(languageCode: string): Partial<UserPreferences> {
	return getLanguageSpecificPreferences(languageCode);
}

// 🌟 Check if user is guest
export function isGuestUser(userId: string): boolean {
	return userId === 'guest';
}

// 🌟 Calculate overall skill level from preferences
export function calculateOverallSkillLevel(prefs: UserPreferences): number {
	const skills = [
		prefs.speakingLevel,
		prefs.listeningLevel,
		prefs.readingLevel,
		prefs.writingLevel
	];

	return Math.round(skills.reduce((sum, skill) => sum + skill, 0) / skills.length);
}

// 🌟 Calculate challenge level based on preferences
export function calculateChallengeLevel(
	prefs: UserPreferences
): 'beginner' | 'intermediate' | 'advanced' {
	const overallLevel = calculateOverallSkillLevel(prefs);
	const challengePref = prefs.challengePreference;

	// Adjust based on user's challenge preference
	switch (challengePref) {
		case 'comfortable':
			return overallLevel < 30 ? 'beginner' : overallLevel < 70 ? 'intermediate' : 'advanced';
		case 'challenging':
			return overallLevel < 20 ? 'beginner' : overallLevel < 60 ? 'intermediate' : 'advanced';
		default: // moderate
			return overallLevel < 25 ? 'beginner' : overallLevel < 65 ? 'intermediate' : 'advanced';
	}
}

// 🌟 Calculate context type based on learning goal
export function calculateContextType(
	prefs: UserPreferences
): 'casual' | 'formal' | 'business' | 'academic' {
	const goal = prefs.learningGoal;

	switch (goal) {
		case 'Career':
			return 'business';
		case 'Academic':
			return 'academic';
		case 'Travel':
		case 'Connection':
		case 'Culture':
		case 'Growth':
		default:
			return 'casual';
	}
}

// 🌟 Calculate transcription mode preference
export function calculateTranscriptionMode(prefs: UserPreferences): boolean {
	// Default to true for beginners, false for advanced users
	const level = calculateOverallSkillLevel(prefs);
	return level < 40; // Enable transcription for beginners
}

// 🌟 Merge preferences with overrides
export function mergePreferences(
	current: UserPreferences,
	overrides: Partial<UserPreferences>
): UserPreferences {
	return {
		...current,
		...overrides,
		updatedAt: new Date()
	};
}

// 🌟 Validate preferences object
export function validatePreferences(obj: unknown): obj is UserPreferences {
	if (!obj || typeof obj !== 'object' || obj === null) {
		return false;
	}

	const prefObj = obj as Record<string, unknown>;

	return (
		'id' in prefObj &&
		'userId' in prefObj &&
		'targetLanguageId' in prefObj &&
		'learningGoal' in prefObj &&
		'preferredVoice' in prefObj &&
		typeof prefObj.id === 'string' &&
		typeof prefObj.userId === 'string' &&
		typeof prefObj.targetLanguageId === 'string' &&
		typeof prefObj.learningGoal === 'string' &&
		typeof prefObj.preferredVoice === 'string'
	);
}

// 🌟 Get default preferences for a new user
export function getDefaultPreferences(): UserPreferences {
	return createGuestUserPreferences();
}

// 🌟 Get preferences with language overrides
export function getPreferencesWithLanguage(
	basePrefs: UserPreferences,
	languageCode: string
): UserPreferences {
	const languageDefaults = getLanguageSpecificPreferences(languageCode);

	return mergePreferences(basePrefs, {
		targetLanguageId: languageDefaults.targetLanguageId,
		learningGoal: languageDefaults.learningGoal,
		specificGoals: languageDefaults.specificGoals,
		challengePreference: languageDefaults.challengePreference
	});
}
