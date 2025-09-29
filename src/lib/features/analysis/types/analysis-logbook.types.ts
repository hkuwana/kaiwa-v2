export type AnalysisLogbookAction = 'pending' | 'accepted' | 'ignored' | 'dismissed_auto';
export type AnalysisLogbookSeverity = 'info' | 'hint' | 'warning';

export interface AnalysisFindingDraft {
	userId: string | null;
	languageId: string | null;
	conversationId: string;
	messageId: string;
	featureId: string;
	featureLabel: string;
	moduleId?: string | null;
	runId?: string | null;
	severity: AnalysisLogbookSeverity;
	actionStatus: AnalysisLogbookAction;
	actionUpdatedAt: string | null | Date | undefined;
	offsetStart: number | null;
	offsetEnd: number | null;
	originalText: string | null;
	suggestedText: string | null;
	explanation: string | null;
	example: string | null;
	metadata: Record<string, unknown>;
	suggestionId: string;
}
