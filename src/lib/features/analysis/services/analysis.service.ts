/**
 * Analysis Service - Service Layer
 *
 * Pure business logic for language analysis following Kaiwa's 3-layer architecture.
 * No dependencies on other services, no UI knowledge, fully testable.
 */

import type { AnalysisMessage, AnalysisResult, LanguageLevel } from '../types/analysis.types';

// Re-export types for backward compatibility
export type { AnalysisMessage, AnalysisResult, LanguageLevel } from '../types/analysis.types';

export interface AnalysisRunResult {
	runId: string;
	conversationId: string;
	results: AnalysisResult[];
	startedAt: Date;
	completedAt: Date;
	languageCode: string;
}

export interface LevelAssessmentResult {
	currentLevel: LanguageLevel;
	suggestedNextLevel: LanguageLevel;
	strengthAreas: string[];
	growthAreas: string[];
	confidenceLevel: 'low' | 'medium' | 'high';
	recommendedScenarios: string[];
}

/**
 * Analysis Service
 *
 * Handles all analysis-related API communication.
 * Processing happens on the backend, this service just coordinates API calls.
 */
export class AnalysisService {
	private readonly baseUrl = '/api/analysis';

	/**
	 * Run analysis on conversation messages
	 * Backend handles all processing
	 */
	async runAnalysis(
		conversationId: string,
		languageCode: string,
		messages: AnalysisMessage[],
		moduleIds?: string[]
	): Promise<AnalysisRunResult> {
		const response = await fetch(`${this.baseUrl}/run`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				conversationId,
				languageCode,
				moduleIds,
				messages: messages.map((msg) => ({
					id: msg.id,
					role: msg.role,
					content: msg.content,
					timestamp: msg.timestamp?.toISOString()
				}))
			})
		});

		if (!response.ok) {
			throw new Error(`Analysis failed: ${response.statusText}`);
		}

		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Analysis failed');
		}

		return {
			runId: data.run.runId,
			conversationId: data.run.conversationId,
			results: data.run.moduleResults.map((result: any) => ({
				moduleId: result.moduleId,
				summary: result.summary,
				confidence: result.score,
				recommendations: result.recommendations,
				data: result.details
			})),
			startedAt: new Date(data.run.startedAt),
			completedAt: new Date(data.run.completedAt),
			languageCode: data.run.languageCode
		};
	}

	/**
	 * Assess language level
	 * Backend handles CEFR assessment and practical mapping
	 */
	async assessLevel(
		messages: AnalysisMessage[],
		languageCode: string
	): Promise<LevelAssessmentResult> {
		const response = await fetch(`${this.baseUrl}/assess-level`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				languageCode,
				messages: messages.map((msg) => ({
					id: msg.id,
					role: msg.role,
					content: msg.content,
					timestamp: msg.timestamp?.toISOString()
				})),
				includeRecommendations: true
			})
		});

		if (!response.ok) {
			throw new Error(`Level assessment failed: ${response.statusText}`);
		}

		const data = await response.json();
		if (!data.success) {
			throw new Error(data.error || 'Level assessment failed');
		}

		return {
			currentLevel: data.assessment.currentLevel,
			suggestedNextLevel: data.assessment.suggestedNextLevel,
			strengthAreas: data.assessment.strengthAreas || [],
			growthAreas: data.assessment.growthAreas || [],
			confidenceLevel: data.assessment.confidenceLevel || 'medium',
			recommendedScenarios: data.assessment.recommendedScenarios || []
		};
	}

	/**
	 * Get available analysis modules
	 */
	async getAvailableModules(): Promise<
		Array<{
			id: string;
			label: string;
			description: string;
			modality: 'text' | 'audio';
			tier?: 'free' | 'pro' | 'premium';
		}>
	> {
		const response = await fetch(`${this.baseUrl}/modules`);

		if (!response.ok) {
			throw new Error(`Failed to fetch modules: ${response.statusText}`);
		}

		const data = await response.json();
		return data.modules;
	}

	/**
	 * Get analysis configuration
	 */
	async getConfig(section?: string): Promise<any> {
		const url = section ? `${this.baseUrl}/config?section=${section}` : `${this.baseUrl}/config`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Failed to fetch config: ${response.statusText}`);
		}

		return await response.json();
	}
}

// Export singleton instance
export const analysisService = new AnalysisService();
