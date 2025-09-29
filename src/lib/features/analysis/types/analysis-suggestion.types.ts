import type { AnalysisMessage } from './analysis.types';

export type SuggestionSeverity = 'info' | 'hint' | 'warning';

export interface AnalysisSuggestion {
	id: string;
	ruleId: string;
	category: string;
	severity: SuggestionSeverity;
	messageId: string;
	originalText: string;
	suggestedText: string;
	explanation: string;
	example?: string;
	offsets?: {
		start: number;
		end: number;
	};
}

export interface SuggestionExtractionContext {
	runId?: string;
	messages: AnalysisMessage[];
}
