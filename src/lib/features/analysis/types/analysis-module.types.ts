export type AnalysisModality = 'text' | 'audio';

export interface AnalysisModuleContext {
	conversationId?: string;
	userId?: string;
	languageCode: string;
	messages: Array<{
		id: string;
		role: 'user' | 'assistant' | 'system';
		content: string;
		timestamp?: Date;
	}>;
}

export interface AnalysisModuleResult {
	moduleId: AnalysisModuleId;
	summary: string;
	details?: Record<string, unknown>;
	recommendations?: string[];
	score?: number;
}

export interface AnalysisModuleDefinition {
	id: AnalysisModuleId;
	label: string;
	description: string;
	modality: AnalysisModality;
	tier?: 'free' | 'pro' | 'premium';
	requiresAudio?: boolean;
	run(context: AnalysisModuleContext): Promise<AnalysisModuleResult> | AnalysisModuleResult;
}

export type AnalysisModuleId =
	| 'quick-stats'
	| 'grammar-suggestions'
	| 'advanced-grammar'
	| 'fluency-analysis'
	| 'phrase-suggestions'
	| 'onboarding-profile'
	| 'pronunciation-analysis'
	| 'speech-rhythm'
	| 'language-level-assessment';
