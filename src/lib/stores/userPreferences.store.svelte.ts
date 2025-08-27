import { browser } from '$app/environment';
import type { UserPreferences } from '$lib/server/db/types';
import {
	createGuestUserPreferences,
	getLanguageSpecificPreferences
} from '$lib/data/userPreferences';

// 🌟 User Preferences Store
// Manages user preferences state with local storage persistence

const STORAGE_KEY = 'kaiwa_user_preferences';
const GUEST_ID = 'guest';

// 🌟 Store state
export const userPreferencesStore = {
	// Reactive state
	preferences: $state<UserPreferences | null>(null),
	isInitialized: $state<boolean>(false),

	// 🌟 Initialize the store
	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		if (browser) {
			await this.loadFromStorage();
		}

		this.isInitialized = true;
	},

	// 🌟 Get current preferences (combines dummy + actual + overrides)
	getPreferences(): UserPreferences {
		if (!this.preferences) {
			// Fallback to dummy preferences if none loaded
			this.preferences = createGuestUserPreferences();
		}
		return this.preferences;
	},

	// 🌟 Update preferences (merges with existing)
	async updatePreferences(updates: Partial<UserPreferences>): Promise<void> {
		const current = this.getPreferences();

		this.preferences = {
			...current,
			...updates,
			updatedAt: new Date()
		};

		if (browser) {
			await this.saveToStorage();
		}
	},

	// 🌟 Set language-specific preferences
	async setLanguagePreferences(languageCode: string): Promise<void> {
		const languageDefaults = getLanguageSpecificPreferences(languageCode);

		await this.updatePreferences({
			targetLanguageId: languageDefaults.targetLanguageId,
			learningGoal: languageDefaults.learningGoal,
			specificGoals: languageDefaults.specificGoals,
			challengePreference: languageDefaults.challengePreference
		});
	},

	// 🌟 Reset to default preferences
	async resetToDefaults(): Promise<void> {
		this.preferences = createGuestUserPreferences();

		if (browser) {
			await this.saveToStorage();
		}
	},

	// 🌟 Get specific preference value
	getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K] {
		return this.getPreferences()[key];
	},

	// 🌟 Check if user is guest
	isGuest(): boolean {
		return this.getPreferences().userId === GUEST_ID;
	},

	// 🌟 Get skill level (calculated from individual skills)
	getOverallSkillLevel(): number {
		const prefs = this.getPreferences();
		const skills = [
			prefs.speakingLevel,
			prefs.listeningLevel,
			prefs.readingLevel,
			prefs.writingLevel
		];

		return Math.round(skills.reduce((sum, skill) => sum + skill, 0) / skills.length);
	},

	// 🌟 Get challenge level based on preferences
	getChallengeLevel(): 'beginner' | 'intermediate' | 'advanced' {
		const overallLevel = this.getOverallSkillLevel();
		const challengePref = this.getPreference('challengePreference');

		// Adjust based on user's challenge preference
		switch (challengePref) {
			case 'comfortable':
				return overallLevel < 30 ? 'beginner' : overallLevel < 70 ? 'intermediate' : 'advanced';
			case 'challenging':
				return overallLevel < 20 ? 'beginner' : overallLevel < 60 ? 'intermediate' : 'advanced';
			default: // moderate
				return overallLevel < 25 ? 'beginner' : overallLevel < 65 ? 'intermediate' : 'advanced';
		}
	},

	// 🌟 Get context type based on learning goal
	getContextType(): 'casual' | 'formal' | 'business' | 'academic' {
		const goal = this.getPreference('learningGoal');

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
	},

	// 🌟 Get transcription mode preference
	getTranscriptionMode(): boolean {
		// Default to true for beginners, false for advanced users
		const level = this.getOverallSkillLevel();
		return level < 40; // Enable transcription for beginners
	},

	// 🌟 Merge with actual user preferences from server
	async mergeWithServerPreferences(serverPrefs: Partial<UserPreferences> | null): Promise<void> {
		if (!serverPrefs) return;

		// If we have server preferences, merge them
		if (this.preferences?.userId === GUEST_ID) {
			// Replace guest preferences with actual user preferences
			this.preferences = {
				...createGuestUserPreferences(),
				...serverPrefs,
				updatedAt: new Date()
			};
		} else {
			// Merge with existing preferences
			await this.updatePreferences(serverPrefs);
		}

		if (browser) {
			await this.saveToStorage();
		}
	},

	// 🌟 Clear all stored preferences
	async clearStorage(): Promise<void> {
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
		this.preferences = null;
		this.isInitialized = false;
	},

	// 🌟 Private: Load from local storage
	async loadFromStorage(): Promise<void> {
		if (!browser) return;

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				// Validate the stored data has required fields
				if (this.isValidPreferences(parsed)) {
					this.preferences = parsed;
					return;
				}
			}
		} catch (error) {
			console.warn('Failed to load preferences from storage:', error);
		}

		// Fallback to dummy preferences
		this.preferences = createGuestUserPreferences();
	},

	// 🌟 Private: Save to local storage
	async saveToStorage(): Promise<void> {
		if (!browser || !this.preferences) return;

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
		} catch (error) {
			console.warn('Failed to save preferences to storage:', error);
		}
	},

	// 🌟 Private: Validate preferences object
	isValidPreferences(obj: UserPreferences): obj is UserPreferences {
		return (
			obj &&
			typeof obj === 'object' &&
			typeof obj.id === 'string' &&
			typeof obj.userId === 'string' &&
			typeof obj.targetLanguageId === 'string' &&
			typeof obj.learningGoal === 'string' &&
			typeof obj.preferredVoice === 'string'
		);
	}
};

// 🌟 Export convenience functions that delegate to the store
export const {
	initialize,
	getPreferences,
	updatePreferences,
	setLanguagePreferences,
	resetToDefaults,
	getPreference,
	isGuest,
	getOverallSkillLevel,
	getChallengeLevel,
	getContextType,
	getTranscriptionMode,
	mergeWithServerPreferences,
	clearStorage
} = userPreferencesStore;
