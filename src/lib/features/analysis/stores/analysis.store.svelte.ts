import { analysisService } from '../services/analysis.service';
import type {
	AnalysisMessage,
	AnalysisRunResult,
	LevelAssessmentResult
} from '../services/analysis.service';
import { growthPlaybookService } from '../services/growth-playbook.service';
import { analysisSuggestionService } from '../services/analysis-suggestion.service';
import type {
	GrowthPlaybook,
	GrowthPlaybookPersona,
	ScenarioMasterySignal
} from '../types/analysis-playbook.types';
import type { AnalysisSuggestion } from '../types/analysis-suggestion.types';
import { SvelteDate } from 'svelte/reactivity';

interface UnifiedConversationState {
	messages: AnalysisMessage[];
	suggestions: AnalysisSuggestion[];
	lastUpdated: Date | null;
}

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
	persona: GrowthPlaybookPersona;
	playbook: GrowthPlaybook | null;
	suggestions: AnalysisSuggestion[];
	messagesSnapshot: AnalysisMessage[];
	unifiedConversation: UnifiedConversationState;
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
		availableModules: [],
		persona: 'relationship-navigator',
		playbook: null,
		suggestions: [],
		messagesSnapshot: [],
		unifiedConversation: {
			messages: [],
			suggestions: [],
			lastUpdated: null
		}
	});

	// Derived reactive values
	get currentRun() {
		return this._state.currentRun;
	}
	get isRunning() {
		return this._state.isRunning;
	}
	get error() {
		return this._state.error;
	}
	get lastAssessment() {
		return this._state.lastAssessment;
	}
	get availableModules() {
		return this._state.availableModules;
	}
	get persona() {
		return this._state.persona;
	}
	get playbook() {
		return this._state.playbook;
	}
	get suggestions() {
		return this._state.suggestions;
	}
	get messagesSnapshot() {
		return this._state.messagesSnapshot;
	}

	get unifiedConversation() {
		return this._state.unifiedConversation;
	}

	/**
	 * Run analysis on conversation messages
	 * Delegates to analysis service, manages UI state
	 */
	async runAnalysis(
		conversationId: string,
		languageCode: string,
		messages: AnalysisMessage[],
		moduleIds?: string[],
		options?: {
			persona?: GrowthPlaybookPersona;
			scenarioSignals?: ScenarioMasterySignal[];
			autoGeneratePlaybook?: boolean;
		}
	): Promise<void> {
		if (this._state.isRunning) return;

		this._state.isRunning = true;
		this._state.error = null;
		this._state.playbook = null;
		this._state.suggestions = [];
		this._state.messagesSnapshot = messages;
		if (options?.persona) {
			this._state.persona = options.persona;
		}

		try {
			const result = await analysisService.runAnalysis(
				conversationId,
				languageCode,
				messages,
				moduleIds
			);

			this._state.currentRun = result;
			this._state.suggestions = analysisSuggestionService.extract(result, {
				runId: result.runId,
				messages: messages
			});
			this.updateUnifiedConversation(messages, this._state.suggestions);
			if (options?.autoGeneratePlaybook) {
				this._state.playbook = growthPlaybookService.buildFromAnalysis(result, {
					persona: this._state.persona,
					scenarioMastery: options.scenarioSignals
				});
			}
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
		this._state.playbook = null;
		this._state.suggestions = [];
		this._state.messagesSnapshot = [];
		this._state.unifiedConversation = {
			messages: [],
			suggestions: [],
			lastUpdated: null
		};
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
			availableModules: [],
			persona: 'relationship-navigator',
			playbook: null,
			suggestions: [],
			messagesSnapshot: [],
			unifiedConversation: {
				messages: [],
				suggestions: [],
				lastUpdated: null
			}
		};
	}

	setPersona(persona: GrowthPlaybookPersona) {
		this._state.persona = persona;
	}

	generatePlaybook(options?: { scenarioSignals?: ScenarioMasterySignal[] }) {
		if (!this._state.currentRun) {
			this._state.playbook = growthPlaybookService.buildFromAnalysis(null, {
				persona: this._state.persona,
				scenarioMastery: options?.scenarioSignals
			});
			return this._state.playbook;
		}

		this._state.playbook = growthPlaybookService.buildFromAnalysis(this._state.currentRun, {
			persona: this._state.persona,
			scenarioMastery: options?.scenarioSignals
		});

		return this._state.playbook;
	}

	setUnifiedConversationMessages(messages: AnalysisMessage[]): void {
		this._state.unifiedConversation = {
			...this._state.unifiedConversation,
			messages,
			lastUpdated: new SvelteDate()
		};
	}

	setUnifiedConversation(messages: AnalysisMessage[], suggestions: AnalysisSuggestion[]): void {
		this.updateUnifiedConversation(messages, suggestions);
	}

	/**
	 * Update the current analysis run and suggestions
	 * Used when analysis results come from external sources (like dev/analysis page)
	 */
	setAnalysisResults(
		run: AnalysisRunResult,
		suggestions: AnalysisSuggestion[],
		messages: AnalysisMessage[]
	): void {
		this._state.currentRun = run;
		this._state.suggestions = suggestions;
		this._state.messagesSnapshot = messages;
		this.updateUnifiedConversation(messages, suggestions);
	}

	private updateUnifiedConversation(
		messages: AnalysisMessage[],
		suggestions: AnalysisSuggestion[]
	): void {
		this._state.unifiedConversation = {
			messages,
			suggestions,
			lastUpdated: new SvelteDate()
		};
	}
}

// Export singleton instance following Kaiwa patterns
export const analysisStore = new AnalysisStore();
