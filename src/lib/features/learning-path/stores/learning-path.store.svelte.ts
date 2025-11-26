// src/lib/features/learning-path/stores/learning-path.store.svelte.ts

import { logger } from '$lib/logger';
import type { LearningPath, LearningPathAssignment } from '$lib/server/db/types';

/**
 * Extended type for learning path with assignment info
 */
export interface UserLearningPath {
	path: LearningPath;
	assignment: LearningPathAssignment;
	progressPercent: number;
	daysCompleted: number;
	totalDays: number;
	currentDay: {
		dayIndex: number;
		theme: string;
		difficulty: string;
		scenarioId?: string;
		isReady: boolean;
	} | null;
	nextDay: {
		dayIndex: number;
		theme: string;
		difficulty: string;
	} | null;
}

/**
 * Learning Path Store - Manages user's active learning paths
 * Uses Svelte 5 runes for reactive state management
 */
class LearningPathStore {
	// User info
	userId = $state<string | null>(null);

	// Learning paths data
	activePaths = $state<UserLearningPath[]>([]);
	completedPaths = $state<UserLearningPath[]>([]);
	availableTemplates = $state<LearningPath[]>([]);

	// UI state
	loading = $state(false);
	error = $state<string | null>(null);

	// Derived values
	hasActivePaths = $derived(() => this.activePaths.length > 0);
	totalActivePaths = $derived(() => this.activePaths.length);

	currentPath = $derived(() => {
		// Return the first active path (most recent assignment)
		return this.activePaths[0] || null;
	});

	overallProgress = $derived(() => {
		if (this.activePaths.length === 0) return 0;
		const total = this.activePaths.reduce((sum, p) => sum + p.progressPercent, 0);
		return Math.round(total / this.activePaths.length);
	});

	// --- Methods ---

	/**
	 * Initialize store with user ID
	 */
	setUser(userId: string) {
		this.userId = userId;
	}

	/**
	 * Load user's learning paths from API
	 */
	async loadPaths() {
		if (!this.userId) return;

		this.loading = true;
		this.error = null;

		try {
			const response = await fetch(`/api/users/${this.userId}/learning-paths`);
			if (!response.ok) {
				throw new Error('Failed to load learning paths');
			}

			const data = await response.json();

			if (data.success) {
				this.activePaths = data.data?.activePaths || [];
				this.completedPaths = data.data?.completedPaths || [];
			} else {
				throw new Error(data.error || 'Failed to load learning paths');
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to load learning paths';
			logger.error('[LearningPathStore] loadPaths error:', err);
		} finally {
			this.loading = false;
		}
	}

	/**
	 * Load available public templates
	 */
	async loadTemplates() {
		try {
			const response = await fetch('/api/learning-paths?isTemplate=true&isPublic=true&limit=10');
			if (!response.ok) {
				throw new Error('Failed to load templates');
			}

			const data = await response.json();
			this.availableTemplates = data.data?.paths || [];
		} catch (err) {
			logger.error('[LearningPathStore] loadTemplates error:', err);
		}
	}

	/**
	 * Share a path as a public template
	 */
	async shareAsTemplate(pathId: string): Promise<{ success: boolean; shareUrl?: string; error?: string }> {
		try {
			const response = await fetch(`/api/learning-paths/${pathId}/share`, {
				method: 'POST'
			});

			const data = await response.json();

			if (data.success) {
				return {
					success: true,
					shareUrl: `/program/${data.data.template.shareSlug}`
				};
			} else {
				return {
					success: false,
					error: data.error || 'Failed to share path'
				};
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to share path';
			logger.error('[LearningPathStore] shareAsTemplate error:', err);
			return {
				success: false,
				error: errorMsg
			};
		}
	}

	/**
	 * Enroll in a template/path
	 */
	async enrollInPath(pathId: string): Promise<{ success: boolean; error?: string }> {
		if (!this.userId) {
			return { success: false, error: 'Not authenticated' };
		}

		try {
			const response = await fetch(`/api/learning-paths/${pathId}/enroll`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: this.userId,
					startsAt: new Date().toISOString()
				})
			});

			const data = await response.json();

			if (data.success) {
				// Reload paths to get updated list
				await this.loadPaths();
				return { success: true };
			} else {
				return {
					success: false,
					error: data.error || 'Failed to enroll'
				};
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to enroll';
			logger.error('[LearningPathStore] enrollInPath error:', err);
			return {
				success: false,
				error: errorMsg
			};
		}
	}

	/**
	 * Update progress (mark day as completed)
	 */
	async markDayCompleted(assignmentId: string, dayIndex: number): Promise<{ success: boolean; error?: string }> {
		try {
			const response = await fetch(`/api/learning-paths/assignments/${assignmentId}/progress`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentDayIndex: dayIndex
				})
			});

			const data = await response.json();

			if (data.success) {
				// Update local state
				const pathIndex = this.activePaths.findIndex(p => p.assignment.id === assignmentId);
				if (pathIndex >= 0) {
					this.activePaths[pathIndex].assignment.currentDayIndex = dayIndex;
					this.activePaths[pathIndex].daysCompleted = dayIndex;
					this.activePaths[pathIndex].progressPercent = Math.round((dayIndex / this.activePaths[pathIndex].totalDays) * 100);
				}
				return { success: true };
			} else {
				return {
					success: false,
					error: data.error || 'Failed to update progress'
				};
			}
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Failed to update progress';
			logger.error('[LearningPathStore] markDayCompleted error:', err);
			return {
				success: false,
				error: errorMsg
			};
		}
	}

	/**
	 * Clear all state
	 */
	clear() {
		this.userId = null;
		this.activePaths = [];
		this.completedPaths = [];
		this.availableTemplates = [];
		this.loading = false;
		this.error = null;
	}
}

// Export singleton instance
export const learningPathStore = new LearningPathStore();
