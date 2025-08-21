// src/lib/stores/settings.store.svelte.ts
// Simple settings store to hold user's conversation preferences

import type { Language } from '$lib/server/db/types';
import { languages as allLanguages } from '$lib/data/languages';

export class SettingsStore {
	// User's selected language for conversation practice (full language object)
	selectedLanguage = $state<Language | null>(null);

	// User's selected AI speaker/voice
	selectedSpeaker = $state('alloy');

	constructor() {
		// Initialize with default language (English)
		const defaultLanguage = allLanguages.find((lang) => lang.code === 'en');
		if (defaultLanguage) {
			this.selectedLanguage = defaultLanguage;
		}
	}

	// Update selected language by code
	setLanguage = (languageCode: string) => {
		const language = allLanguages.find((lang) => lang.code === languageCode);
		if (language) {
			this.selectedLanguage = language;
		}
	};

	// Update selected language with full language object
	setLanguageObject = (language: Language) => {
		this.selectedLanguage = language;
	};

	// Get current language code
	getLanguageCode = (): string => {
		return this.selectedLanguage?.code || 'en';
	};

	// Update selected speaker
	setSpeaker = (speakerId: string) => {
		this.selectedSpeaker = speakerId;
	};

	// Reset to defaults
	reset = () => {
		const defaultLanguage = allLanguages.find((lang) => lang.code === 'en');
		this.selectedLanguage = defaultLanguage || null;
		this.selectedSpeaker = 'alloy';
	};
}

// Export a default instance
export const settingsStore = new SettingsStore();
