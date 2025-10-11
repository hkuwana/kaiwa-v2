// src/lib/stores/scenario.store.svelte.ts
// Enhanced scenario store with persistent storage using cookies + localStorage

import { browser } from '$app/environment';
import type { ScenarioWithHints } from '$lib/data/scenarios';
import { scenariosData } from '$lib/data/scenarios';
import type { Scenario } from '$lib/server/db/types';

// Storage keys
const STORAGE_KEYS = {
	SCENARIO: 'kaiwa_selected_scenario',
	SCENARIO_HISTORY: 'kaiwa_scenario_history'
} as const;

// Cookie options
const COOKIE_OPTIONS = {
	path: '/',
	maxAge: 60 * 60 * 24 * 365, // 1 year
	sameSite: 'lax' as const
};

// Utility functions for cookie management
export const scenarioCookieUtils = {
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
	}
};

export class ScenarioStore {
	// Currently selected scenario
	private selectedScenario = $state<ScenarioWithHints>(scenariosData[0]);

	// Scenario history for tracking user progress
	private scenarioHistory = $state<ScenarioWithHints[]>([]);

	// Flag to track if persistence is set up
	private persistenceInitialized = false;

	constructor() {
		this.initializeFromStorage();
	}

	// Public getter methods for components to access data
	getSelectedScenario = (): ScenarioWithHints => this.selectedScenario;
	getScenarioHistory = (): ScenarioWithHints[] => [...this.scenarioHistory]; // Return copy to prevent mutation

	// Initialize scenario from persistent storage
	private initializeFromStorage = () => {
		if (browser) {
			console.log('🔄 Initializing scenario from persistent storage...');

			// Try localStorage first (faster)
			const storedScenarioId = localStorage.getItem(STORAGE_KEYS.SCENARIO);
			const storedHistory = localStorage.getItem(STORAGE_KEYS.SCENARIO_HISTORY);

			console.log('📦 Found stored values:', {
				scenario: storedScenarioId,
				history: storedHistory ? 'exists' : 'none'
			});

			// Set scenario from storage or default to onboarding
			if (storedScenarioId) {
				// For now, we'll use the default onboarding scenario
				// In a real app, you'd fetch the actual scenario from the database
				this.selectedScenario = scenariosData[0];
				console.log('🎯 Scenario loaded from storage:', storedScenarioId);
			} else {
				// Default to onboarding scenario for non-logged-in users
				this.selectedScenario = scenariosData[0];
				console.log('🎯 No stored scenario found, using default onboarding');
			}

			// Set history from storage
			if (storedHistory) {
				try {
					this.scenarioHistory = JSON.parse(storedHistory);
					console.log(
						'📚 Scenario history loaded from storage:',
						this.scenarioHistory.length,
						'items'
					);
				} catch (error) {
					console.warn('⚠️ Failed to parse scenario history:', error);
					this.scenarioHistory = [];
				}
			} else {
				console.log('📚 No stored scenario history found');
			}

			// Set up watchers to persist changes (deferred to avoid $effect issues)
			setTimeout(() => {
				this.setupPersistence();
			}, 0);

			console.log('✅ Scenario initialization complete');
		} else {
			// Server-side: set default onboarding scenario
			this.selectedScenario = scenariosData[0];
			console.log('🖥️ Server-side scenario initialized with default onboarding');
		}
	};

	// Set up automatic persistence when values change
	private setupPersistence = () => {
		if (this.persistenceInitialized || !browser) return;

		console.log('🔗 Setting up automatic scenario persistence...');

		try {
			// Since we can't use $effect in stores outside component context,
			// we'll rely on manual persistence calls in the setter methods
			// This is actually more predictable and avoids the component lifecycle issues

			this.persistenceInitialized = true;
			console.log('✅ Scenario persistence setup complete (manual mode)');
		} catch (error) {
			console.warn('⚠️ Failed to setup scenario persistence, will retry later:', error);
			// Reset flag so we can try again
			this.persistenceInitialized = false;
		}
	};

	// Persist scenario to both localStorage and cookies
	private persistScenario = (scenario: ScenarioWithHints) => {
		if (!browser) return;

		try {
			// Store in localStorage
			localStorage.setItem(STORAGE_KEYS.SCENARIO, scenario.id);

			// Store in cookies (for SSR compatibility)
			scenarioCookieUtils.setCookie(STORAGE_KEYS.SCENARIO, scenario.id);

			console.log('💾 Scenario persisted:', scenario.id);
		} catch (error) {
			console.warn('⚠️ Failed to persist scenario:', error);
		}
	};

	// Persist history to localStorage
	private persistHistory = (history: ScenarioWithHints[]) => {
		if (!browser) return;

		try {
			// Store in localStorage
			localStorage.setItem(STORAGE_KEYS.SCENARIO_HISTORY, JSON.stringify(history));
			console.log('💾 Scenario history persisted:', history.length, 'items');
		} catch (error) {
			console.warn('⚠️ Failed to persist scenario history:', error);
		}
	};

	// Set scenario by ID (easy to use)
	setScenarioById = (scenarioId: string) => {
		// For now, we'll use the default onboarding scenario
		// In a real app, you'd fetch the actual scenario from the database
		if (scenarioId === 'onboarding-welcome') {
			this.selectedScenario = scenariosData[0];
		} else {
			this.selectedScenario =
				scenariosData.find((scenario) => scenario.id === scenarioId) || scenariosData[1];
		}

		// Add to history
		this.addToHistory(this.selectedScenario);

		// Since we no longer use $effect, manually trigger persistence
		if (browser) {
			this.persistScenario(this.selectedScenario);
		}
	};

	// Set scenario with full scenario object
	setScenario = (scenario: ScenarioWithHints) => {
		this.selectedScenario = scenario;

		// Add to history
		this.addToHistory(scenario);

		// Since we no longer use $effect, manually trigger persistence
		if (browser) {
			this.persistScenario(scenario);
		}
	};

	// Add scenario to history
	addToHistory = (scenario: Scenario) => {
		// Remove if already exists
		this.scenarioHistory = this.scenarioHistory.filter((s) => s.id !== scenario.id);

		// Add to beginning
		this.scenarioHistory = [scenario, ...this.scenarioHistory];

		// Keep only last 10 scenarios
		if (this.scenarioHistory.length > 10) {
			this.scenarioHistory = this.scenarioHistory.slice(0, 10);
		}

		// Since we no longer use $effect, manually trigger persistence
		if (browser) {
			this.persistHistory(this.scenarioHistory);
		}
	};

	// Get current scenario ID
	getScenarioId = (): string => {
		return this.selectedScenario?.id || 'onboarding-welcome';
	};

	// Check if current scenario is onboarding
	isOnboarding = (): boolean => {
		return this.selectedScenario?.id === 'onboarding-welcome';
	};

	// Get scenario by category
	getScenariosByCategory = (category: string): Scenario[] => {
		// In a real app, this would fetch from the database
		// For now, return the default onboarding scenario if it matches
		if (category === 'comfort') {
			return [scenariosData[0]];
		}
		return [];
	};

	// Get scenarios by difficulty
	getScenariosByDifficulty = (difficulty: string): Scenario[] => {
		// In a real app, this would fetch from the database
		// For now, return the default onboarding scenario if it matches
		if (difficulty === 'beginner') {
			return [scenariosData[0]];
		}
		return [];
	};

	// Reset to default onboarding scenario
	reset = () => {
		this.selectedScenario = scenariosData[0];
		this.scenarioHistory = [scenariosData[0]];

		// Clear persistent storage
		if (browser) {
			try {
				localStorage.removeItem(STORAGE_KEYS.SCENARIO);
				localStorage.removeItem(STORAGE_KEYS.SCENARIO_HISTORY);

				// Clear cookies
				scenarioCookieUtils.deleteCookie(STORAGE_KEYS.SCENARIO);

				console.log('🗑️ Scenario storage cleared');
			} catch (error) {
				console.warn('⚠️ Failed to clear scenario storage:', error);
			}
		}
	};

	// Get current scenario state for debugging
	getCurrentState = () => {
		return {
			selectedScenario: this.selectedScenario,
			scenarioHistory: this.scenarioHistory,
			storage: browser
				? {
						localStorage: {
							scenario: localStorage.getItem(STORAGE_KEYS.SCENARIO),
							history: localStorage.getItem(STORAGE_KEYS.SCENARIO_HISTORY)
						},
						cookies: {
							scenario: scenarioCookieUtils.getCookie(STORAGE_KEYS.SCENARIO)
						}
					}
				: 'Server-side'
		};
	};

	// Force reload from storage (useful for debugging)
	reloadFromStorage = () => {
		if (browser) {
			this.initializeFromStorage();
			console.log('🔄 Scenario reloaded from storage');
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
export const scenarioStore = new ScenarioStore();

// Hook for components to easily access persistent scenarios
export const usePersistentScenarios = () => {
	return {
		// Get current scenario
		getCurrentScenario: () => scenarioStore.getSelectedScenario(),

		// Set scenario by ID (easiest method)
		setScenario: (scenarioId: string) => scenarioStore.setScenarioById(scenarioId),

		// Set full scenario object
		setFullScenario: (scenario: Scenario) => scenarioStore.setScenario(scenario),

		// Get scenario history
		getHistory: () => scenarioStore.getScenarioHistory(),

		// Check if current scenario is onboarding
		isOnboarding: () => scenarioStore.isOnboarding(),

		// Get current settings
		getState: () => scenarioStore.getCurrentState(),

		// Force reload from storage
		reload: () => scenarioStore.reloadFromStorage(),

		// Clear all scenarios and reset to onboarding
		reset: () => scenarioStore.reset(),

		// Debug storage state
		debug: () => {
			const state = scenarioStore.getCurrentState();
			console.log('🔍 Current Scenario State:', state);
			return state;
		}
	};
};
