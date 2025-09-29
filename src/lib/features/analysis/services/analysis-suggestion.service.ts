import type { AnalysisRunResult, AnalysisMessage } from './analysis.service';
import type {
	AnalysisSuggestion,
	SuggestionExtractionContext
} from '../types/analysis-suggestion.types';

interface RawSuggestion {
	id?: string;
	ruleId?: string;
	category?: string;
	macroSkill?: string;
	subSkill?: string;
	microRule?: string;
	severity?: 'info' | 'hint' | 'warning';
	messageId?: string;
	text?: string;
	originalText?: string;
	suggestedText?: string;
	suggestion?: string;
	explanation?: string;
	example?: string;
	offsets?: { start: number; end: number };
}

export class AnalysisSuggestionService {
	extract(
		run: AnalysisRunResult | null,
		context: SuggestionExtractionContext
	): AnalysisSuggestion[] {
		if (!run) return [];

		const messageMap = new Map(context.messages.map((msg) => [msg.id, msg]));
		const suggestions: AnalysisSuggestion[] = [];

		for (const result of run.moduleResults ?? []) {
			const rawSuggestions = this.resolveRawSuggestions(result.details);
			for (const raw of rawSuggestions) {
				const messageId = raw.messageId ?? this.resolveMessageId(raw, messageMap);
				if (!messageId || !messageMap.has(messageId)) continue;

				const severity = this.normalizeSeverity(raw.severity);

				suggestions.push({
					id: raw.id ?? `${result.moduleId}-${suggestions.length}`,
					ruleId: raw.ruleId ?? raw.microRule ?? `${result.moduleId}-rule`,
					category:
						raw.category ??
						`${raw.macroSkill ?? 'grammar'}${raw.subSkill ? `:${raw.subSkill}` : ''}`,
					severity,
					messageId,
					originalText: raw.originalText ?? raw.text ?? messageMap.get(messageId)?.content ?? '',
					suggestedText: raw.suggestedText ?? raw.suggestion ?? raw.example ?? raw.text ?? '',
					explanation: raw.explanation ?? 'Consider this tweak to sound more natural.',
					example: raw.example,
					offsets: raw.offsets
				});
			}
		}

		return suggestions;
	}

	private normalizeSeverity(severity?: string | null): 'info' | 'hint' | 'warning' {
		const value = (severity ?? '').toLowerCase();
		if (value === 'warning') return 'warning';
		if (value === 'info') return 'info';
		return 'hint';
	}

	private resolveRawSuggestions(details: unknown): RawSuggestion[] {
		if (!details || typeof details !== 'object') return [];
		const maybeList = (details as Record<string, unknown>).suggestions;
		if (Array.isArray(maybeList)) {
			return maybeList as RawSuggestion[];
		}
		const maybeIssues = (details as Record<string, unknown>).issues;
		if (Array.isArray(maybeIssues)) {
			return maybeIssues as RawSuggestion[];
		}

		return [];
	}

	private resolveMessageId(
		raw: RawSuggestion,
		messageMap: Map<string, AnalysisMessage>
	): string | undefined {
		const sourceText = raw.originalText ?? raw.text;
		if (!sourceText) return undefined;
		const lower = sourceText.toLowerCase();
		for (const [id, message] of messageMap.entries()) {
			if (message.content.toLowerCase().includes(lower)) {
				return id;
			}
		}
		return undefined;
	}
}

export const analysisSuggestionService = new AnalysisSuggestionService();
