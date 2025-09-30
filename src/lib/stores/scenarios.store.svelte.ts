// src/lib/shared/stores/scenarios.store.svelte.ts
// Shared scenario management that can be used across features

import type { Scenario } from '$lib/server/db/types';
import { browser } from '$app/environment';
import { SvelteSet } from 'svelte/reactivity';

// Use existing scenario store for static data
import { scenarioStore as existingStore } from '$lib/stores/scenario.store.svelte';

export class ScenariosStore {
	// Reactive state
	selectedScenario = $state<Scenario | null>(null);
	availableScenarios = $state<Scenario[]>([]);
	customScenarios = $state<Scenario[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);

	// Computed values
	allScenarios = $derived([...this.availableScenarios, ...this.customScenarios]);
	hasCustomScenarios = $derived(this.customScenarios.length > 0);

	// Feature event system
	private subscribers = new SvelteSet<(scenario: Scenario | null) => void>();
	private recommendationSubscribers = new SvelteSet<(scenarios: Scenario[]) => void>();

	constructor() {
		// Only run in browser
		if (browser) {
			// Initialize with existing scenarios
			this.availableScenarios = existingStore.getAvailableScenarios();
			this.selectedScenario = existingStore.getSelectedScenario();
			this.loadUserScenarios();
		}
	}

	/**
	 * Set the currently selected scenario
	 */
	setSelectedScenario(scenario: Scenario | null) {
		this.selectedScenario = scenario;

		// Notify all subscribing features
		this.subscribers.forEach((callback) => {
			try {
				callback(scenario);
			} catch (error) {
				console.error('Error in scenario change subscriber:', error);
			}
		});

		// Persist selection
		if (browser && scenario) {
			localStorage.setItem('kaiwa-selected-scenario', JSON.stringify(scenario));
		}
	}

	/**
	 * Get selected scenario (for external access)
	 */
	getSelectedScenario(): Scenario | null {
		return this.selectedScenario;
	}

	/**
	 * Set scenario by ID
	 */
	setScenarioById(scenarioId: string): boolean {
		const scenario = this.allScenarios.find((s) => s.id === scenarioId);
		if (scenario) {
			this.setSelectedScenario(scenario);
			return true;
		}
		return false;
	}

	/**
	 * Get scenarios by type/category
	 */
	getScenariosByType(type: string): Scenario[] {
		return this.allScenarios.filter((scenario) => scenario.category === type);
	}

	/**
	 * Get scenarios by difficulty
	 */
	getScenariosByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Scenario[] {
		return this.allScenarios.filter((scenario) => scenario.difficulty === difficulty);
	}

	/**
	 * Add custom scenario (from analysis results)
	 */
	addCustomScenario(scenario: Scenario) {
		// Check if already exists
		const exists = this.customScenarios.some((s) => s.id === scenario.id);
		if (!exists) {
			this.customScenarios = [...this.customScenarios, scenario];
			this.saveUserScenarios();
		}
	}

	/**
	 * Update scenario recommendations based on user progress
	 */
	updateRecommendations(recommendedScenarios: Scenario[]) {
		// Notify features about new recommendations
		this.recommendationSubscribers.forEach((callback) => {
			try {
				callback(recommendedScenarios);
			} catch (error) {
				console.error('Error in recommendation subscriber:', error);
			}
		});
	}

	/**
	 * Subscribe to scenario changes (for features that need to react)
	 */
	subscribeToScenarioChanges(callback: (scenario: Scenario | null) => void): () => void {
		this.subscribers.add(callback);

		// Return unsubscribe function
		return () => {
			this.subscribers.delete(callback);
		};
	}

	/**
	 * Subscribe to recommendation updates
	 */
	subscribeToRecommendations(callback: (scenarios: Scenario[]) => void): () => void {
		this.recommendationSubscribers.add(callback);

		return () => {
			this.recommendationSubscribers.delete(callback);
		};
	}

	/**
	 * Load user's custom scenarios and selection from storage
	 */
	private async loadUserScenarios() {
		try {
			// Load custom scenarios
			const savedCustom = localStorage.getItem('kaiwa-custom-scenarios');
			if (savedCustom) {
				this.customScenarios = JSON.parse(savedCustom);
			}

			// Load selected scenario
			const savedSelected = localStorage.getItem('kaiwa-selected-scenario');
			if (savedSelected) {
				const scenario = JSON.parse(savedSelected);
				// Verify scenario still exists
				const exists = this.allScenarios.some((s) => s.id === scenario.id);
				if (exists) {
					this.selectedScenario = scenario;
				}
			}
		} catch (error) {
			console.error('Failed to load user scenarios:', error);
		}
	}

	/**
	 * Save user scenarios to storage
	 */
	private saveUserScenarios() {
		try {
			localStorage.setItem('kaiwa-custom-scenarios', JSON.stringify(this.customScenarios));
		} catch (error) {
			console.error('Failed to save user scenarios:', error);
		}
	}

	/**
	 * Reset scenarios to default state
	 */
	reset() {
		this.selectedScenario = null;
		this.customScenarios = [];
		this.isLoading = false;
		this.error = null;

		if (browser) {
			localStorage.removeItem('kaiwa-selected-scenario');
			localStorage.removeItem('kaiwa-custom-scenarios');
		}
	}

	/**
	 * Search scenarios by query
	 */
	searchScenarios(query: string): Scenario[] {
		const lowerQuery = query.toLowerCase();
		return this.allScenarios.filter(
			(scenario) =>
				scenario.title.toLowerCase().includes(lowerQuery) ||
				scenario.description.toLowerCase().includes(lowerQuery)
		);
	}

	/**
	 * Get random scenario (for exploration)
	 */
	getRandomScenario(excludeCurrent = true): Scenario | null {
		let available = this.availableScenarios;

		if (excludeCurrent && this.selectedScenario) {
			available = available.filter((s) => s.id !== this.selectedScenario!.id);
		}

		if (available.length === 0) return null;

		const randomIndex = Math.floor(Math.random() * available.length);
		return available[randomIndex];
	}
}

// Export singleton instance
export const scenariosStore = new ScenariosStore();
