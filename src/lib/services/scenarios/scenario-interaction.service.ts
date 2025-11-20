// 🎯 Scenario Interaction Service
// Handles all scenario selection, navigation, and interaction logic
// Keep components dumb - put all business logic here

import { goto } from '$app/navigation';
import { track } from '$lib/analytics/posthog';
import type { Scenario } from '$lib/data/scenarios';

export interface ScenarioSelectionOptions {
	source?: string; // Where the selection came from (e.g., 'browse', 'dropdown', 'share_link')
	trackEvent?: boolean; // Whether to track analytics
	navigateTo?: string; // Where to navigate after selection
}

export interface ScenarioSelectionStoreAdapter {
	setScenarioById: (scenarioId: string) => void;
}

/**
 * Select a scenario and optionally navigate to conversation page
 * This is the main entry point for scenario selection across the app
 */
export function selectScenario(
	scenario: Scenario,
	store: ScenarioSelectionStoreAdapter,
	options: ScenarioSelectionOptions = {}
): void {
	const { source = 'unknown', trackEvent = true, navigateTo = '/conversation' } = options;

	// Update the store
	store.setScenarioById(scenario.id);

	// Track analytics if enabled
	if (trackEvent) {
		track('scenario_selected', {
			scenario_id: scenario.id,
			scenario_title: scenario.title,
			scenario_role: scenario.role,
			scenario_difficulty: scenario.difficulty,
			source
		});
	}

	// Navigate if requested
	if (navigateTo) {
		goto(navigateTo);
	}
}

/**
 * Get thumbnail URL for a scenario
 * Uses scenario ID as filename: /thumbnails/scenarios/{id}.jpg
 * Falls back to a default placeholder if not found
 */
export function getScenarioThumbnailUrl(scenario: Scenario): string {
	// If scenario has explicit thumbnailUrl, use it
	if (scenario.thumbnailUrl) {
		return scenario.thumbnailUrl;
	}

	// Otherwise, construct from scenario ID
	// Format: /thumbnails/scenarios/{scenario-id}.jpg
	return `/thumbnails/scenarios/${scenario.id}.jpg`;
}

/**
 * Get thumbnail URL with fallback to placeholder
 * Useful for rendering where you want a guaranteed image
 */
export function getScenarioThumbnailUrlWithFallback(scenario: Scenario): string {
	return scenario.thumbnailUrl || `/thumbnails/scenarios/placeholder.jpg`;
}

/**
 * Check if scenario has a custom thumbnail
 */
export function hasCustomThumbnail(scenario: Scenario): boolean {
	return !!scenario.thumbnailUrl;
}

/**
 * Format scenario duration for display
 * Returns formatted string like "15 min" or null if no duration
 */
export function formatScenarioDuration(durationSeconds: number | null | undefined): string | null {
	if (!durationSeconds) return null;
	const minutes = Math.round(durationSeconds / 60);
	return `${minutes} min`;
}

/**
 * Get scenario categories as formatted display strings
 * Replaces underscores with spaces and capitalizes
 */
export function formatScenarioCategories(categories: string[] | null | undefined): string[] {
	if (!categories || categories.length === 0) return [];
	return categories.map((cat) => cat.replace(/_/g, ' '));
}

/**
 * Quick action: Try a scenario immediately from browse page
 * Tracks analytics and navigates to conversation
 */
export function tryScenarioNow(
	scenario: Scenario,
	store: ScenarioSelectionStoreAdapter
): void {
	selectScenario(
		scenario,
		store,
		{
			source: 'browse_try_now',
			trackEvent: true,
			navigateTo: '/conversation'
		}
	);
}

/**
 * Share a scenario (future feature)
 * Returns the shareable URL
 */
export function getScenarioShareUrl(scenario: Scenario): string {
	if (scenario.shareUrl) return scenario.shareUrl;
	if (scenario.shareSlug) return `${window.location.origin}/s/${scenario.shareSlug}`;
	return `${window.location.origin}/scenarios`; // Fallback
}
