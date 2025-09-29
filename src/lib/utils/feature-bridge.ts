// src/lib/shared/utils/feature-bridge.ts
// Cross-feature communication utilities for maintaining loose coupling

import type { Message, Language, Scenario } from '$lib/server/db/types';

export interface ConversationEndData {
	messages: Message[];
	sessionId: string;
	language: Language;
	scenario: Scenario | null;
	userId: string;
	duration: number;
	endReason: 'user' | 'limit' | 'error';
}

export interface AnalysisResults {
	conversationId: string;
	analysisData: any; // Using any for now to avoid type issues
	insights: string[];
	recommendations: string[];
	shareableMoments?: ShareableMoment[];
}

export interface ShareableMoment {
	id: string;
	type: 'breakthrough' | 'funny-fail' | 'cultural-insight' | 'success-story';
	content: {
		anonymized: true;
		text: string;
		context: string;
		viralPotential: number; // 1-10 score
	};
	userConsent: 'pending' | 'approved' | 'declined';
}

export interface FeatureNotification {
	featureName: string;
	event: string;
	data: any;
	timestamp: number;
}

/**
 * Central hub for cross-feature communication
 * Uses dynamic imports to avoid circular dependencies
 */
export class FeatureBridge {
	private static eventListeners: Map<string, Set<(data: any) => void>> = new Map();

	/**
	 * Pass conversation data to analysis feature
	 */
	static async passToAnalysis(
		conversationData: ConversationEndData
	): Promise<AnalysisResults | null> {
		try {
			// Dynamic import to avoid circular dependencies
			// @ts-ignore - Vite dynamic import limitation
			const analysisFeature = await import(/* @vite-ignore */ '$lib/features/analysis/index.js');

			if (analysisFeature.startAnalysis) {
				const results = await analysisFeature.startAnalysis(conversationData);

				// Emit event for other features to listen
				this.emit('analysis-completed', results);

				return results;
			}
		} catch (error) {
			// Feature not available yet - this is expected during development
			const message = error instanceof Error ? error.message : String(error);
			console.warn('Analysis feature not available yet:', message);
			return null;
		}

		return null;
	}

	/**
	 * Evaluate conversation/analysis for viral sharing potential
	 */
	static async evaluateForSharing(analysisResults: AnalysisResults): Promise<ShareableMoment[]> {
		try {
			// @ts-ignore - Vite dynamic import limitation
			const culturalDnaFeature = await import(
				/* @vite-ignore */ '$lib/features/cultural-dna/index.js'
			);

			if (culturalDnaFeature.evaluateShareableMoments) {
				const moments = await culturalDnaFeature.evaluateShareableMoments(analysisResults);

				// Emit event for UI updates
				this.emit('sharable-moments-detected', {
					moments,
					analysisId: analysisResults.conversationId
				});

				return moments;
			}
		} catch (error) {
			// Feature not available yet - this is expected during development
			const message = error instanceof Error ? error.message : String(error);
			console.warn('Cultural DNA feature not available yet:', message);
		}

		return [];
	}

	/**
	 * Trigger onboarding flow for new users or feature introductions
	 */
	static async triggerOnboarding(type: 'user' | 'feature', context: any): Promise<void> {
		try {
			// @ts-ignore - Vite dynamic import limitation
			const onboardingFeature = await import(
				/* @vite-ignore */ '$lib/features/onboarding/index.js'
			);

			if (onboardingFeature.startOnboarding) {
				await onboardingFeature.startOnboarding(type, context);
				this.emit('onboarding-started', { type, context });
			}
		} catch (error) {
			// Feature not available yet - this is expected during development
			const message = error instanceof Error ? error.message : String(error);
			console.warn('Onboarding feature not available yet:', message);
		}
	}

	/**
	 * Update scenario recommendations based on user performance
	 */
	static async updateScenarioRecommendations(
		userId: string,
		conversationData: ConversationEndData
	): Promise<void> {
		try {
			// @ts-ignore - Vite dynamic import limitation
			const scenarioFeature = await import(/* @vite-ignore */ '$lib/features/scenarios/index.js');

			if (scenarioFeature.updateRecommendations) {
				await scenarioFeature.updateRecommendations(userId, conversationData);
				this.emit('scenarios-updated', { userId });
			}
		} catch (error) {
			// Feature not available yet - this is expected during development
			const message = error instanceof Error ? error.message : String(error);
			console.warn('Scenarios feature not available yet:', message);
		}
	}

	/**
	 * Event system for loose coupling between features
	 */
	static emit(event: string, data: any): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			const notification: FeatureNotification = {
				featureName: 'bridge',
				event,
				data,
				timestamp: Date.now()
			};

			listeners.forEach((callback) => {
				try {
					callback(notification);
				} catch (error) {
					console.error(`Error in event listener for ${event}:`, error);
				}
			});
		}
	}

	static subscribe(
		event: string,
		callback: (notification: FeatureNotification) => void
	): () => void {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}

		const listeners = this.eventListeners.get(event)!;
		listeners.add(callback);

		// Return unsubscribe function
		return () => {
			listeners.delete(callback);
			if (listeners.size === 0) {
				this.eventListeners.delete(event);
			}
		};
	}

	/**
	 * Helper to check if a feature is available/loaded
	 */
	static async isFeatureAvailable(featureName: string): Promise<boolean> {
		try {
			// @ts-ignore - Vite dynamic import limitation
			const feature = await import(/* @vite-ignore */ `$lib/features/${featureName}/index.js`);
			return !!feature;
		} catch {
			return false;
		}
	}

	/**
	 * Batch operations for multiple features
	 */
	static async notifyMultipleFeatures(
		featureEvents: Array<{ feature: string; method: string; data: any }>
	): Promise<void> {
		const promises = featureEvents.map(async ({ feature, method, data }) => {
			try {
				// @ts-ignore - Vite dynamic import limitation
				const featureModule = await import(/* @vite-ignore */ `$lib/features/${feature}/index.js`);
				if (featureModule[method]) {
					return await featureModule[method](data);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				console.warn(`Feature ${feature} not available yet:`, message);
			}
		});

		await Promise.allSettled(promises);
	}
}

// Event types for type safety
export type FeatureEvent =
	| 'conversation-started'
	| 'conversation-ended'
	| 'analysis-completed'
	| 'sharable-moments-detected'
	| 'onboarding-started'
	| 'scenarios-updated'
	| 'user-upgraded'
	| 'feature-unlocked';

// Helper hook for Svelte components to listen to feature events
export function createFeatureEventSubscription(event: FeatureEvent, callback: (data: any) => void) {
	let unsubscribe: (() => void) | null = null;

	// Subscribe on mount
	const subscribe = () => {
		unsubscribe = FeatureBridge.subscribe(event, callback);
	};

	// Cleanup function
	const destroy = () => {
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
	};

	return {
		subscribe,
		destroy
	};
}
