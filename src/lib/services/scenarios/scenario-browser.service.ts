/**
 * 🔍 Scenario Browser Service
 *
 * Provides filtering, searching, and browsing functionality for scenarios.
 * Supports category filtering, tag searching, duration limits, and difficulty levels.
 */

import type { Scenario } from '$lib/server/db/types';

export interface ScenarioBrowseFilters {
	categories?: string[];
	tags?: string[];
	difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
	role?: ('tutor' | 'character' | 'friendly_chat' | 'expert')[];
	primarySkill?: ('conversation' | 'listening' | 'vocabulary' | 'grammar')[];
	minDuration?: number; // seconds
	maxDuration?: number; // seconds
	searchQuery?: string;
	cefrLevel?: string[];
}

export type ScenarioSortBy =
	| 'title'
	| 'difficulty'
	| 'duration'
	| 'popularity'
	| 'rating'
	| 'recent';

export interface ScenarioBrowseOptions {
	filters?: ScenarioBrowseFilters;
	sortBy?: ScenarioSortBy;
	limit?: number;
	offset?: number;
}

/**
 * Tier-based duration limits (in seconds)
 * Free tier: max 5 minutes per scenario
 * Plus tier: max 15 minutes per scenario
 * Premium tier: unlimited
 */
export const TIER_DURATION_LIMITS = {
	free: 300, // 5 minutes
	plus: 900, // 15 minutes
	premium: Infinity // unlimited
} as const;

/**
 * Get maximum scenario duration based on user tier
 */
export function getMaxDurationForTier(tier: 'free' | 'plus' | 'premium'): number {
	return TIER_DURATION_LIMITS[tier];
}

/**
 * Check if scenario is accessible for a given tier based on duration
 */
export function isScenarioAccessibleForTier(
	scenarioDuration: number,
	tier: 'free' | 'plus' | 'premium'
): boolean {
	const maxDuration = getMaxDurationForTier(tier);
	return scenarioDuration <= maxDuration;
}

/**
 * Format duration in seconds to human-readable string
 * Examples: "3.5 min", "10 min", "1 hr 5 min"
 */
export function formatDuration(seconds: number): string {
	if (seconds < 60) {
		return `${seconds}s`;
	}

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes < 60) {
		if (remainingSeconds === 0) {
			return `${minutes} min`;
		}
		const decimalMinutes = (seconds / 60).toFixed(1);
		return `${decimalMinutes} min`;
	}

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	if (remainingMinutes === 0) {
		return `${hours} hr`;
	}
	return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Filter scenarios based on criteria
 */
export function filterScenarios(
	scenarios: Scenario[],
	filters: ScenarioBrowseFilters = {}
): Scenario[] {
	let filtered = scenarios;

	// Filter by categories
	if (filters.categories && filters.categories.length > 0) {
		filtered = filtered.filter((scenario) => {
			const scenarioCategories = scenario.categories as string[] | null;
			if (!scenarioCategories) return false;
			return filters.categories!.some((cat) => scenarioCategories.includes(cat));
		});
	}

	// Filter by tags
	if (filters.tags && filters.tags.length > 0) {
		filtered = filtered.filter((scenario) => {
			const scenarioTags = scenario.tags as string[] | null;
			if (!scenarioTags) return false;
			return filters.tags!.some((tag) =>
				scenarioTags.some((st) => st.toLowerCase().includes(tag.toLowerCase()))
			);
		});
	}

	// Filter by difficulty
	if (filters.difficulty && filters.difficulty.length > 0) {
		filtered = filtered.filter((scenario) => filters.difficulty!.includes(scenario.difficulty));
	}

	// Filter by role
	if (filters.role && filters.role.length > 0) {
		filtered = filtered.filter((scenario) => filters.role!.includes(scenario.role));
	}

	// Filter by primary skill
	if (filters.primarySkill && filters.primarySkill.length > 0) {
		filtered = filtered.filter((scenario) => {
			const skill = scenario.primarySkill as string | null;
			return skill && filters.primarySkill!.includes(skill as any);
		});
	}

	// Filter by duration range
	if (filters.minDuration !== undefined) {
		filtered = filtered.filter((scenario) => {
			const duration = scenario.estimatedDurationSeconds || 600;
			return duration >= filters.minDuration!;
		});
	}

	if (filters.maxDuration !== undefined) {
		filtered = filtered.filter((scenario) => {
			const duration = scenario.estimatedDurationSeconds || 600;
			return duration <= filters.maxDuration!;
		});
	}

	// Filter by CEFR level
	if (filters.cefrLevel && filters.cefrLevel.length > 0) {
		filtered = filtered.filter(
			(scenario) => scenario.cefrLevel && filters.cefrLevel!.includes(scenario.cefrLevel)
		);
	}

	// Full-text search across title, description, tags, and keywords
	if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
		const query = filters.searchQuery.toLowerCase();
		filtered = filtered.filter((scenario) => {
			const searchableFields = [
				scenario.title,
				scenario.description,
				...(scenario.tags as string[] | null || []),
				...(scenario.searchKeywords as string[] | null || []),
				scenario.learningGoal || ''
			];

			return searchableFields.some((field) => field.toLowerCase().includes(query));
		});
	}

	return filtered;
}

/**
 * Sort scenarios based on criteria
 */
export function sortScenarios(scenarios: Scenario[], sortBy: ScenarioSortBy = 'title'): Scenario[] {
	const sorted = [...scenarios];

	switch (sortBy) {
		case 'title':
			return sorted.sort((a, b) => a.title.localeCompare(b.title));

		case 'difficulty':
			const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
			return sorted.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);

		case 'duration':
			return sorted.sort((a, b) => {
				const aDuration = a.estimatedDurationSeconds || 600;
				const bDuration = b.estimatedDurationSeconds || 600;
				return aDuration - bDuration;
			});

		case 'popularity':
			return sorted.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

		case 'recent':
			return sorted.sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);

		case 'rating':
			// TODO: Implement when rating system is added to schema
			return sorted;

		default:
			return sorted;
	}
}

/**
 * Browse scenarios with filtering and sorting
 */
export function browseScenarios(
	scenarios: Scenario[],
	options: ScenarioBrowseOptions = {}
): {
	scenarios: Scenario[];
	total: number;
	hasMore: boolean;
} {
	const { filters, sortBy = 'title', limit, offset = 0 } = options;

	// Filter scenarios
	let filtered = filterScenarios(scenarios, filters);

	// Sort scenarios
	filtered = sortScenarios(filtered, sortBy);

	// Paginate if limit is specified
	const total = filtered.length;
	if (limit !== undefined) {
		filtered = filtered.slice(offset, offset + limit);
	}

	return {
		scenarios: filtered,
		total,
		hasMore: limit !== undefined && offset + limit < total
	};
}

/**
 * Get scenarios grouped by category
 */
export function groupScenariosByCategory(scenarios: Scenario[]): Map<string, Scenario[]> {
	const grouped = new Map<string, Scenario[]>();

	scenarios.forEach((scenario) => {
		const categories = (scenario.categories as string[] | null) || ['daily_life'];
		categories.forEach((category) => {
			if (!grouped.has(category)) {
				grouped.set(category, []);
			}
			grouped.get(category)!.push(scenario);
		});
	});

	return grouped;
}

/**
 * Get unique tags from scenarios
 */
export function getAllTags(scenarios: Scenario[]): string[] {
	const tagSet = new Set<string>();

	scenarios.forEach((scenario) => {
		const tags = (scenario.tags as string[] | null) || [];
		tags.forEach((tag) => tagSet.add(tag));
	});

	return Array.from(tagSet).sort();
}

/**
 * Get category-friendly display name
 */
export function getCategoryDisplayName(category: string): string {
	const displayNames: Record<string, string> = {
		relationships: 'Relationships',
		professional: 'Professional',
		travel: 'Travel',
		education: 'Education',
		health: 'Health',
		daily_life: 'Daily Life',
		entertainment: 'Entertainment',
		food_drink: 'Food & Drink',
		services: 'Services',
		emergency: 'Emergency'
	};

	return displayNames[category] || category;
}

/**
 * Generate shareable URL for a scenario
 */
export function generateScenarioShareUrl(shareSlug: string, baseUrl: string = 'https://kaiwa.app'): string {
	return `${baseUrl}/s/${shareSlug}`;
}

/**
 * Generate unique share slug for a scenario
 */
export function generateShareSlug(scenarioId: string): string {
	const randomSuffix = Math.random().toString(36).substring(2, 10);
	return `${scenarioId}-${randomSuffix}`;
}
