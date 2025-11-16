import { logger } from '$lib/logger';
// src/lib/stores/settings.store.svelte.ts
// Enhanced settings store with persistent storage using cookies + localStorage

import type { Language } from '$lib/server/db/types';
import { languages as allLanguages } from '$lib/data/languages';
import { browser } from '$app/environment';
import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';

// Storage keys
const STORAGE_KEYS = {
	LANGUAGE: 'kaiwa_selected_language',
	SPEAKER: 'kaiwa_selected_speaker',
	SCENARIO: 'kaiwa_selected_scenario',
	LANGUAGE_CODE: 'kaiwa_language_code' // Fallback for SSR
} as const;

// Cookie options
const COOKIE_OPTIONS = {
	path: '/',
	maxAge: 60 * 60 * 24 * 365, // 1 year
	sameSite: 'lax' as const
};

// Utility functions for cookie management
export const cookieUtils = {
	// Set a cookie with proper encoding
	setCookie: (name: string, value: string, options: Partial<typeof COOKIE_OPTIONS> = {}) => {
		if (!browser) return;

		const opts = { ...COOKIE_OPTIONS, ...options };
		const encodedValue = encodeURIComponent(value);
		const cookieString = `${name}=${encodedValue}; path=${opts.path}; max-age=${opts.maxAge}; samesite=${opts.sameSite}`;

		document.cookie = cookieString;
	},

	// Get a cookie value
	getCookie: (name: string): string | null => {
		if (!browser) return null;

		const value = document.cookie
			.split('; ')
			.find((row) => row.startsWith(name + '='))
			?.split('=')[1];

		return value ? decodeURIComponent(value) : null;
	},

	// Delete a cookie
	deleteCookie: (name: string) => {
		if (!browser) return;

		document.cookie = `${name}=; path=${COOKIE_OPTIONS.path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
	},

	// List all cookies (for debugging)
	listCookies: (): Record<string, string> => {
		if (!browser) return {};

		const cookies: Record<string, string> = {};
		document.cookie.split('; ').forEach((cookie) => {
			const [name, value] = cookie.split('=');
			if (name && value) {
				cookies[name] = decodeURIComponent(value);
			}
		});

		return cookies;
	}
};

export class SettingsStore {
	// User's selected language for conversation practice (full language object)
	selectedLanguage = $state<Language | null>(null);

	// User's selected AI speaker/voice
	selectedSpeaker = $state('ballad');

	// User's selected learning scenario
	selectedScenario = $state<string | null>(null);

	// Flag to track if persistence is set up
	private persistenceInitialized = false;

	constructor() {
		this.initializeFromStorage();
	}

	// Initialize settings from persistent storage
	private initializeFromStorage = () => {
		if (browser) {
			logger.info('🔄 Initializing settings from persistent storage...');

			// Try localStorage first (faster)
			const storedLanguageCode = localStorage.getItem(STORAGE_KEYS.LANGUAGE_CODE);
			const storedSpeaker = localStorage.getItem(STORAGE_KEYS.SPEAKER);

			logger.info('📦 Found stored values:', {
				language: storedLanguageCode,
				speaker: storedSpeaker
			});

			// Set speaker from storage if it exists
			if (storedSpeaker) {
				this.selectedSpeaker = storedSpeaker;
				logger.info('🎭 Speaker loaded from storage:', storedSpeaker);
			}

			// Set scenario from storage
			const storedScenario = localStorage.getItem(STORAGE_KEYS.SCENARIO);
			if (storedScenario) {
				this.selectedScenario = storedScenario;
				logger.debug('🎯 Scenario loaded from storage:', storedScenario);
			} else {
				logger.debug('🎯 No stored scenario found');
			}

			// Set language from storage or default
			if (storedLanguageCode) {
				const language = allLanguages.find((lang) => lang.code === storedLanguageCode);
				if (language) {
					this.selectedLanguage = language;
					logger.info('🌍 Language loaded from storage:', language.name, `(${language.code})`);
				} else {
					logger.warn(
						'⚠️ Stored language code not found in available languages:',
						storedLanguageCode
					);
				}
			} else {
				logger.info('🌍 No stored language found');
			}

			// If no stored language, set default (Japanese-first for launch)
			if (!this.selectedLanguage) {
				const defaultLanguage = allLanguages.find((lang) => lang.code === 'ja');
				if (defaultLanguage) {
					this.selectedLanguage = defaultLanguage;
					logger.info('🌍 Setting default language:', defaultLanguage.name);
					this.persistLanguage(defaultLanguage);
				}
			}

			// Set up watchers to persist changes (deferred to avoid $effect issues)
			setTimeout(() => {
				this.setupPersistence();
			}, 0);

			logger.info('✅ Settings initialization complete');
		} else {
			// Server-side: set default language
			const defaultLanguage = allLanguages.find((lang) => lang.code === 'ja');
			if (defaultLanguage) {
				this.selectedLanguage = defaultLanguage;
			}
			logger.info('🖥️ Server-side settings initialized with default language');
		}
	};

	// Set up automatic persistence when values change
	private setupPersistence = () => {
		if (this.persistenceInitialized || !browser) return;

		logger.info('🔗 Setting up automatic persistence...');

		try {
			// Since we can't use $effect in stores outside component context,
			// we'll rely on manual persistence calls in the setter methods
			// This is actually more predictable and avoids the component lifecycle issues

			this.persistenceInitialized = true;
			logger.info('✅ Persistence setup complete (manual mode)');
		} catch (error) {
			logger.warn('⚠️ Failed to setup persistence, will retry later:', error);
			// Reset flag so we can try again
			this.persistenceInitialized = false;
		}
	};

	// Persist language to both localStorage and cookies
	private persistLanguage = (language: Language) => {
		if (!browser) return;

		try {
			// Store in localStorage
			localStorage.setItem(STORAGE_KEYS.LANGUAGE_CODE, language.code);

			// Store in cookies (for SSR compatibility)
			cookieUtils.setCookie(STORAGE_KEYS.LANGUAGE_CODE, language.code);

			logger.info('💾 Language persisted:', language.code);
		} catch (error) {
			logger.warn('⚠️ Failed to persist language:', error);
		}
	};

	// Persist speaker to both localStorage and cookies
	private persistSpeaker = (speakerId: string) => {
		if (!browser) return;

		try {
			// Store in localStorage
			localStorage.setItem(STORAGE_KEYS.SPEAKER, speakerId);

			// Store in cookies (for SSR compatibility)
			cookieUtils.setCookie(STORAGE_KEYS.SPEAKER, speakerId);

			logger.info('💾 Speaker persisted:', speakerId);
		} catch (error) {
			logger.warn('⚠️ Failed to persist speaker:', error);
		}
	};

	// Persist scenario to both localStorage and cookies
	private persistScenario = (scenarioId: string) => {
		if (!browser) return;

		try {
			// Store in localStorage
			localStorage.setItem(STORAGE_KEYS.SCENARIO, scenarioId);

			// Store in cookies (for SSR compatibility)
			cookieUtils.setCookie(STORAGE_KEYS.SCENARIO, scenarioId);

			logger.info('💾 Scenario persisted:', scenarioId);
		} catch (error) {
			logger.warn('⚠️ Failed to persist scenario:', error);
		}
	};

	// Update selected language by code
	setLanguage = (languageCode: string) => {
		const language = allLanguages.find((lang) => lang.code === languageCode);
		if (language) {
			this.selectedLanguage = language;

			// Persist language but don't auto-select speaker
			if (browser) {
				this.persistLanguage(language);
			}
		}
	};

	// Update selected language with full language object
	setLanguageObject = (language: Language) => {
		this.selectedLanguage = language;

		// Persist language but don't auto-select speaker - let user choose manually
		if (browser) {
			this.persistLanguage(language);
		}
	};

	// Get current language code
	getLanguageCode = (): string => {
		return this.selectedLanguage?.code || 'en';
	};

	// Update selected speaker
	setSpeaker = (speakerId: string) => {
		this.selectedSpeaker = speakerId;
		// Since we no longer use $effect, manually trigger persistence
		if (browser) {
			this.persistSpeaker(speakerId);
		}
	};

	// Update selected scenario
	setScenario = (scenarioId: string) => {
		this.selectedScenario = scenarioId;
		// Since we no longer use $effect, manually trigger persistence
		if (browser) {
			this.persistScenario(scenarioId);
		}
	};

	// Reset to defaults and clear storage
	reset = () => {
		const defaultLanguage = allLanguages.find((lang) => lang.code === 'en');
		this.selectedLanguage = defaultLanguage || null;
		this.selectedSpeaker = DEFAULT_VOICE;
		this.selectedScenario = null;

		// Clear persistent storage
		if (browser) {
			try {
				localStorage.removeItem(STORAGE_KEYS.LANGUAGE_CODE);
				localStorage.removeItem(STORAGE_KEYS.SPEAKER);
				localStorage.removeItem(STORAGE_KEYS.SCENARIO);

				// Clear cookies
				cookieUtils.deleteCookie(STORAGE_KEYS.LANGUAGE_CODE);
				cookieUtils.deleteCookie(STORAGE_KEYS.SPEAKER);
				cookieUtils.deleteCookie(STORAGE_KEYS.SCENARIO);

				logger.info('🗑️ Settings storage cleared');
			} catch (error) {
				logger.warn('⚠️ Failed to clear storage:', error);
			}
		}
	};

	// Get current settings for debugging
	getCurrentSettings = () => {
		return {
			language: this.selectedLanguage,
			speaker: this.selectedSpeaker,
			scenario: this.selectedScenario,
			storage: browser
				? {
						localStorage: {
							language: localStorage.getItem(STORAGE_KEYS.LANGUAGE_CODE),
							speaker: localStorage.getItem(STORAGE_KEYS.SPEAKER),
							scenario: localStorage.getItem(STORAGE_KEYS.SCENARIO)
						},
						cookies: {
							language: cookieUtils.getCookie(STORAGE_KEYS.LANGUAGE_CODE),
							speaker: cookieUtils.getCookie(STORAGE_KEYS.SPEAKER),
							scenario: cookieUtils.getCookie(STORAGE_KEYS.SCENARIO)
						},
						allCookies: cookieUtils.listCookies()
					}
				: 'Server-side'
		};
	};

	// Force reload from storage (useful for debugging)
	reloadFromStorage = () => {
		if (browser) {
			this.initializeFromStorage();
			logger.info('🔄 Settings reloaded from storage');
		}
	};

	// Manually trigger persistence setup (for components that need it)
	ensurePersistence = () => {
		if (!this.persistenceInitialized) {
			this.setupPersistence();
		}
	};
}

// Export a default instance
export const settingsStore = new SettingsStore();

// Hook for components to easily access persistent settings
export const usePersistentSettings = () => {
	return {
		// Get current settings
		getSettings: () => settingsStore.getCurrentSettings(),

		// Force reload from storage
		reload: () => settingsStore.reloadFromStorage(),

		// Clear all settings
		clear: () => settingsStore.reset(),

		// Debug storage state
		debug: () => {
			const settings = settingsStore.getCurrentSettings();
			logger.debug('🔍 Current Settings:', settings);
			return settings;
		},

		// Test persistence by setting and retrieving values
		testPersistence: () => {
			if (!browser) return 'Server-side - cannot test';

			try {
				// Test localStorage
				const testKey = 'kaiwa_test_persistence';
				const testValue = 'test_value_' + Date.now();

				localStorage.setItem(testKey, testValue);
				const retrievedValue = localStorage.getItem(testKey);
				localStorage.removeItem(testKey);

				// Test cookies
				cookieUtils.setCookie(testKey, testValue);
				const retrievedCookie = cookieUtils.getCookie(testKey);
				cookieUtils.deleteCookie(testKey);

				const results = {
					localStorage: retrievedValue === testValue ? '✅ Working' : '❌ Failed',
					cookies: retrievedCookie === testValue ? '✅ Working' : '❌ Failed',
					testValue,
					retrievedValue,
					retrievedCookie
				};

				logger.info('🧪 Persistence Test Results:', results);
				return results;
			} catch (error) {
				logger.error('❌ Persistence test failed:', error);
				return { error: error instanceof Error ? error.message : 'Unknown error' };
			}
		}
	};
};
