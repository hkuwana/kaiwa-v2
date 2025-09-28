import { analysisService } from '../services/analysis.service';
import type {
	AnalysisMessage,
	AnalysisRunResult,
	LevelAssessmentResult,
	LanguageLevel
} from '../services/analysis.service';

interface AnalysisState {
	currentRun: AnalysisRunResult | null;
	isRunning: boolean;
	error: string | null;
	lastAssessment: LevelAssessmentResult | null;
	availableModules: Array<{
		id: string;
		label: string;
		description: string;
		modality: 'text' | 'audio';
		tier?: 'free' | 'pro' | 'premium';
	}>;
}

/**
 * Analysis Store
 *
 * Orchestrates analysis services following Kaiwa's 3-layer architecture.
 * Manages state and coordinates between analysis pipeline and level detection services.
 */
export class AnalysisStore {
	// State using Svelte 5 runes
	private _state = $state<AnalysisState>({
		currentRun: null,
		isRunning: false,
		error: null,
		lastAssessment: null,
		availableModules: []
	});

	// Derived reactive values
	get currentRun() { return this._state.currentRun; }
	get isRunning() { return this._state.isRunning; }
	get error() { return this._state.error; }
	get lastAssessment() { return this._state.lastAssessment; }
	get availableModules() { return this._state.availableModules; }

	/**
	 * Run analysis on conversation messages
	 * Delegates to analysis service, manages UI state
	 */
	async runAnalysis(
		conversationId: string,
		languageCode: string,
		messages: AnalysisMessage[],
		moduleIds?: string[]
	): Promise<void> {
		if (this._state.isRunning) return;

		this._state.isRunning = true;
		this._state.error = null;

		try {
			const result = await analysisService.runAnalysis(
				conversationId,
				languageCode,
				messages,
				moduleIds
			);

			this._state.currentRun = result;

		} catch (error) {
			this._state.error = error instanceof Error ? error.message : 'Analysis failed';
		} finally {
			this._state.isRunning = false;
		}
	}

	/**
	 * Run language level assessment
	 * Delegates to analysis service, updates state
	 */
	async assessLanguageLevel(
		messages: AnalysisMessage[],
		languageCode: string
	): Promise<LevelAssessmentResult | null> {
		try {
			const assessment = await analysisService.assessLevel(messages, languageCode);
			this._state.lastAssessment = assessment;
			return assessment;
		} catch (error) {
			this._state.error = error instanceof Error ? error.message : 'Level assessment failed';
			return null;
		}
	}

	/**
	 * Load available analysis modules
	 */
	async loadAvailableModules(): Promise<void> {
		try {
			this._state.availableModules = await analysisService.getAvailableModules();
		} catch (error) {
			this._state.error = error instanceof Error ? error.message : 'Failed to load modules';
		}
	}

	/**
	 * Clear current analysis results
	 */
	clearResults() {
		this._state.currentRun = null;
		this._state.error = null;
	}

	/**
	 * Reset store state
	 */
	reset() {
		this._state = {
			currentRun: null,
			isRunning: false,
			error: null,
			lastAssessment: null,
			availableModules: []
		};
	}
}

// Export singleton instance following Kaiwa patterns
export const analysisStore = new AnalysisStore();