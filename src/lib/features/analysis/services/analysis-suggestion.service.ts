import type { AnalysisRunResult, AnalysisMessage } from './analysis.service';
import type {
	AnalysisSuggestion,
	SuggestionExtractionContext
} from '../types/analysis-suggestion.types';

interface RawSuggestion {
	id?: string;
	ruleId?: string;
	category?: string;
	severity?: 'info' | 'hint' | 'warning';
	messageId?: string;
	text?: string;
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

		for (const result of run.results ?? []) {
			const rawSuggestions = this.resolveRawSuggestions(result.data);
			for (const raw of rawSuggestions) {
				const messageId = raw.messageId ?? this.resolveMessageId(raw, messageMap);
				if (!messageId || !messageMap.has(messageId)) continue;

				suggestions.push({
					id: raw.id ?? `${result.moduleId}-${suggestions.length}`,
					ruleId: raw.ruleId ?? `${result.moduleId}-rule`,
					category: raw.category ?? result.moduleId ?? 'general',
					severity: raw.severity ?? 'hint',
					messageId,
					originalText: raw.text ?? messageMap.get(messageId)?.content ?? '',
					suggestedText: raw.suggestion ?? raw.example ?? raw.text ?? '',
					explanation: raw.explanation ?? 'Consider this tweak to sound more natural.',
					example: raw.example,
					offsets: raw.offsets
				});
			}
		}

		if (suggestions.length === 0 && context.messages.length > 0) {
			const fallback = context.messages.find((msg) => msg.role === 'user') ?? context.messages[0];
			if (fallback) {
				suggestions.push({
					id: 'fallback-politeness',
					ruleId: 'politeness-modal',
					category: 'politeness',
					severity: 'info',
					messageId: fallback.id,
					originalText: fallback.content,
					suggestedText: 'Could you tell me if you have any local beers?',
					explanation: "Adding 'could' can make your requests sound more polite.",
					example:
						"Instead of 'Do you have any local beers?', try 'Could you tell me if you have any local beers?'"
				});
			}
		}

		return suggestions;
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
		if (!raw.text) return undefined;
		const lower = raw.text.toLowerCase();
		for (const [id, message] of messageMap.entries()) {
			if (message.content.toLowerCase().includes(lower)) {
				return id;
			}
		}
		return undefined;
	}
}

export const analysisSuggestionService = new AnalysisSuggestionService();
