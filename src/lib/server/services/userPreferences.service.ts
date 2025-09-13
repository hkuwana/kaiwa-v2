import { userPreferencesRepository } from '$lib/server/repositories/userPreferences.repository';
import type { NewUserPreferences, UserPreferences } from '$lib/server/db/types';
import { DEFAULT_VOICE } from '$lib/types';

/**
 * Update skill levels for a user
 */
export async function updateSkillLevels(
	userId: string,
	skillUpdates: {
		speakingLevel?: number;
		listeningLevel?: number;
		readingLevel?: number;
		writingLevel?: number;
		speakingConfidence?: number;
	}
): Promise<UserPreferences | null> {
	return await userPreferencesRepository.updatePreferences(userId, skillUpdates);
}

/**
 * Update learning goals for a user
 */
export async function updateLearningGoals(
	userId: string,
	goalUpdates: {
		learningGoal?: 'Connection' | 'Career' | 'Travel' | 'Academic' | 'Culture' | 'Growth';
		dailyGoalSeconds?: number;
		specificGoals?: string[];
		challengePreference?: 'comfortable' | 'moderate' | 'challenging';
		correctionStyle?: 'immediate' | 'gentle' | 'end_of_session';
	}
): Promise<UserPreferences | null> {
	return await userPreferencesRepository.updatePreferences(userId, goalUpdates);
}

/**
 * Update progress tracking for a user
 */
export async function updateProgress(
	userId: string,
	progressUpdates: Partial<UserPreferences>
): Promise<UserPreferences | null> {
	return await userPreferencesRepository.updatePreferences(userId, progressUpdates);
}

/**
 * Add session score to recent scores (keeps last 10)
 */
export async function addSessionScore(
	userId: string,
	score: number
): Promise<UserPreferences | null> {
	const current = await userPreferencesRepository.getPreferencesByUserId(userId);
	if (!current) return null;

	const recentScores = current.recentSessionScores || [];
	const updatedScores = [...recentScores, score].slice(-10); // Keep last 10 scores

	return await userPreferencesRepository.updatePreferences(userId, {
		recentSessionScores: updatedScores
	});
}

/**
 * Update skill level history (keeps last 30 entries)
 */
export async function updateSkillLevelHistory(
	userId: string,
	skillType: 'speaking' | 'listening' | 'reading' | 'writing',
	level: number
): Promise<UserPreferences | null> {
	const current = await userPreferencesRepository.getPreferencesByUserId(userId);
	if (!current) return null;

	const history = current.skillLevelHistory || [];
	const newEntry = { date: new Date().toISOString().split('T')[0], level };
	const updatedHistory = [...history, newEntry].slice(-30); // Keep last 30 entries

	return await userPreferencesRepository.updatePreferences(userId, {
		skillLevelHistory: updatedHistory
	});
}

/**
 * Get comprehensive learning statistics for a user
 */
export async function getLearningStats(userId: string): Promise<{
	averageSessionScore: number;
	totalStudyTime: number;
	currentStreak: number;
	skillLevels: {
		speaking: number;
		listening: number;
		reading: number;
		writing: number;
	};
	overallSkillLevel: number;
}> {
	const prefs = await userPreferencesRepository.getPreferencesByUserId(userId);
	if (!prefs) {
		return {
			averageSessionScore: 0,
			totalStudyTime: 0,
			currentStreak: 0,
			skillLevels: { speaking: 0, listening: 0, reading: 0, writing: 0 },
			overallSkillLevel: 0
		};
	}

	const recentScores = prefs.recentSessionScores || [];
	const averageScore =
		recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;

	const skillLevels = {
		speaking: prefs.speakingLevel || 0,
		listening: prefs.listeningLevel || 0,
		reading: prefs.readingLevel || 0,
		writing: prefs.writingLevel || 0
	};

	const overallSkillLevel = Math.round(
		(skillLevels.speaking + skillLevels.listening + skillLevels.reading + skillLevels.writing) / 4
	);

	return {
		averageSessionScore: Math.round(averageScore * 100) / 100,
		totalStudyTime: 0,
		currentStreak: 0,
		skillLevels,
		overallSkillLevel
	};
}

/**
 * Get overall skill level (calculated average)
 */
export async function getOverallSkillLevel(userId: string): Promise<number> {
	const prefs = await userPreferencesRepository.getPreferencesByUserId(userId);
	if (!prefs) return 0;

	const levels = [
		prefs.speakingLevel || 0,
		prefs.listeningLevel || 0,
		prefs.readingLevel || 0,
		prefs.writingLevel || 0
	];

	return Math.round(levels.reduce((a, b) => a + b, 0) / levels.length);
}

/**
 * Get skill level for a specific skill type
 */
export async function getSkillLevel(
	userId: string,
	skillType: 'speaking' | 'listening' | 'reading' | 'writing'
): Promise<number> {
	const prefs = await userPreferencesRepository.getPreferencesByUserId(userId);
	if (!prefs) return 0;

	switch (skillType) {
		case 'speaking':
			return prefs.speakingLevel || 0;
		case 'listening':
			return prefs.listeningLevel || 0;
		case 'reading':
			return prefs.readingLevel || 0;
		case 'writing':
			return prefs.writingLevel || 0;
		default:
			return 0;
	}
}

/**
 * Get user's learning progress summary
 */
export async function getProgressSummary(userId: string): Promise<{
	totalStudyTime: number;
	totalConversations: number;
	currentStreak: number;
	lastStudied: Date | null;
	recentScores: number[];
	averageScore: number;
}> {
	const prefs = await userPreferencesRepository.getPreferencesByUserId(userId);
	if (!prefs) {
		return {
			totalStudyTime: 0,
			totalConversations: 0,
			currentStreak: 0,
			lastStudied: null,
			recentScores: [],
			averageScore: 0
		};
	}

	const recentScores = prefs.recentSessionScores || [];
	const averageScore =
		recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : 0;

	return {
		totalStudyTime: 0,
		totalConversations: 0,
		currentStreak: 0,
		lastStudied: null,
		recentScores,
		averageScore: Math.round(averageScore * 100) / 100
	};
}

/**
 * Get user's learning preferences
 */
export async function getLearningPreferences(userId: string): Promise<{
	targetLanguageId: string | null;
	learningGoal: string | null;
	dailyGoalSeconds: number;
	challengePreference: string | null;
	correctionStyle: string | null;
	specificGoals: string[];
}> {
	const prefs = await userPreferencesRepository.getPreferencesByUserId(userId);
	if (!prefs) {
		return {
			targetLanguageId: null,
			learningGoal: null,
			dailyGoalSeconds: 180,
			challengePreference: null,
			correctionStyle: null,
			specificGoals: []
		};
	}

	return {
		targetLanguageId: prefs.targetLanguageId || null,
		learningGoal: prefs.learningGoal || null,
		dailyGoalSeconds: prefs.dailyGoalSeconds || 180,
		challengePreference: prefs.challengePreference || null,
		correctionStyle: prefs.correctionStyle || null,
		specificGoals: prefs.specificGoals || []
	};
}

/**
 * Check if user has met their daily goal
 */
export async function hasMetDailyGoal(userId: string): Promise<boolean> {
	const prefs = await userPreferencesRepository.getPreferencesByUserId(userId);
	if (!prefs) return false;

	const dailyGoal = prefs.dailyGoalSeconds || 180;
	// TODO: Replace with real daily study time when available
	const todayStudyTime = 0;

	// This is a simplified check - you might want to track daily study time separately
	return todayStudyTime >= dailyGoal;
}

/**
 * Get users who need motivation (haven't studied in X days)
 */
export async function getUsersNeedingMotivation(daysThreshold: number = 7): Promise<string[]> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

	// This would require a more complex query in the repository
	// For now, we'll get all users and filter in the service
	// You might want to add a repository method for this
	// const allUsers = await userPreferencesRepository.getAllUserPreferences(''); // This needs fixing

	// Placeholder - you'll need to implement this properly
	return [];
}

/**
 * Create default preferences for a new user
 */
export async function createDefaultPreferences(
	userId: string,
	targetLanguageId: string
): Promise<UserPreferences> {
	const defaultPreferences: NewUserPreferences = {
		userId,
		targetLanguageId,
		learningGoal: 'Connection',
		preferredVoice: DEFAULT_VOICE,
		dailyGoalSeconds: 180,
		speakingLevel: 5,
		listeningLevel: 5,
		readingLevel: 5,
		writingLevel: 5,
		speakingConfidence: 50,
		successfulExchanges: 0,
		comfortZone: null,
		memories: null,
		challengePreference: 'moderate',
		correctionStyle: 'gentle'
	};

	return await userPreferencesRepository.createPreferences(defaultPreferences);
}

/**
 * Get user preferences by user ID
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
	return await userPreferencesRepository.getPreferencesByUserId(userId);
}

/**
 * Update user preferences with any valid fields
 */
export async function updateUserPreferences(
	userId: string,
	updates: Partial<NewUserPreferences>
): Promise<UserPreferences | null> {
	return await userPreferencesRepository.updatePreferences(userId, updates);
}

// Default export with all functions
export default {
	updateSkillLevels,
	updateLearningGoals,
	updateProgress,
	addSessionScore,
	updateSkillLevelHistory,
	getLearningStats,
	getOverallSkillLevel,
	getSkillLevel,
	getProgressSummary,
	getLearningPreferences,
	hasMetDailyGoal,
	getUsersNeedingMotivation,
	createDefaultPreferences
};
