import { analysisFindingsRepository } from '$lib/server/repositories/analysis-findings.repository';
import { linguisticFeaturesRepository } from '$lib/server/repositories/linguistic-features.repository';
import type {
	AnalysisFinding,
	AnalysisFindingAction,
	AnalysisSuggestionSeverity,
	LinguisticMacroSkill,
	NewAnalysisFinding
} from '$lib/server/db/types';
import type { AnalysisSuggestion } from '../types/analysis-suggestion.types';
import type { AnalysisFindingDraft } from '../types/analysis-logbook.types';

export interface FindingBuildContext {
	conversationId: string;
	languageId?: string | null;
	userId?: string | null;
}

export class AnalysisLogbookService {
	private mapCategoryToMacroSkill(category: string | null | undefined): LinguisticMacroSkill {
		const normalized = category?.toLowerCase() ?? '';
		if (normalized.includes('pronunciation')) return 'pronunciation';
		if (normalized.includes('fluency')) return 'fluency';
		if (normalized.includes('vocabulary')) return 'lexis';
		if (normalized.includes('discourse')) return 'discourse';
		if (normalized.includes('pragmatics')) return 'pragmatics';
		return 'grammar';
	}

	private normalize(value: string | null | undefined, fallback: string): string {
		return (value || fallback).trim().toLowerCase().replace(/\s+/g, '-');
	}

	async buildDrafts(
		suggestions: AnalysisSuggestion[],
		context: FindingBuildContext
	): Promise<AnalysisFindingDraft[]> {
		const drafts: AnalysisFindingDraft[] = [];

		for (const suggestion of suggestions) {
			const macroSkill = this.mapCategoryToMacroSkill(suggestion.category);
			const subSkill = this.normalize(suggestion.category, 'usage');
			const microRule = this.normalize(suggestion.ruleId, suggestion.originalText || suggestion.suggestedText || 'phrase');
			const alias = `${macroSkill}:${subSkill}:${microRule}`;

			let featureId = alias;
			let featureLabel = suggestion.category ?? macroSkill;

			try {
				const feature = await linguisticFeaturesRepository.resolveFeature({
					languageId: context.languageId ?? null,
					macroSkill,
					subSkill,
					microRule,
					alias,
					featureIdHint: alias,
					coachingCopy: suggestion.explanation,
					metadata: {
						sourceRuleId: suggestion.ruleId,
						sourceCategory: suggestion.category
					},
					createIfMissing: true
				});
				if (feature) {
					featureId = feature.id;
					featureLabel = `${feature.macroSkill} · ${feature.subSkill}`;
				}
			} catch (error) {
				console.warn('Failed to resolve linguistic feature', { error, alias });
			}

			const draft: AnalysisFindingDraft = {
				userId: context.userId ?? null,
				languageId: context.languageId ?? null,
				conversationId: context.conversationId,
				messageId: suggestion.messageId,
				featureId,
				moduleId: suggestion.ruleId,
				runId: suggestion.id,
				severity: (suggestion.severity ?? 'hint') as AnalysisSuggestionSeverity,
				actionStatus: 'pending',
				actionUpdatedAt: null,
				offsetStart: suggestion.offsets?.start ?? null,
				offsetEnd: suggestion.offsets?.end ?? null,
				originalText: suggestion.originalText,
				suggestedText: suggestion.suggestedText,
				explanation: suggestion.explanation,
				example: suggestion.example,
				metadata: {
					draft: true
				},
				featureLabel,
				suggestionId: suggestion.id
			};

			drafts.push(draft);
		}

		return drafts;
	}

	async persistDrafts(drafts: AnalysisFindingDraft[]): Promise<AnalysisFinding[]> {
		if (!drafts.length) return [];

		const payload: NewAnalysisFinding[] = drafts.map(({ featureLabel: _label, suggestionId: _suggestionId, ...rest }) => rest);
		return await analysisFindingsRepository.bulkInsert(payload);
	}

	async updateActionStatus(id: string, action: AnalysisFindingAction): Promise<AnalysisFinding | null> {
		return await analysisFindingsRepository.updateActionStatus(id, action);
	}
}

export const analysisLogbookService = new AnalysisLogbookService();
export type { AnalysisFindingDraft } from '../types/analysis-logbook.types';
