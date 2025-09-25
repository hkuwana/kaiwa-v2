import { runQuickStatsProcessor } from '../processors/quick-stats.processor';
import { runGrammarProcessor } from '../processors/grammar.processor';
import { runAdvancedGrammarProcessor } from '../processors/advanced-grammar.processor';
import { runFluencyAnalysisProcessor } from '../processors/fluency-analysis.processor';
import { runPhraseSuggestionsProcessor } from '../processors/phrase-suggestions.processor';
import { runOnboardingProfileProcessor } from '../processors/onboarding-profile.processor';
import { runPronunciationAnalysisProcessor } from '../processors/pronunciation-analysis.processor';
import { runSpeechRhythmProcessor } from '../processors/speech-rhythm.processor';
import type {
	AnalysisModuleContext,
	AnalysisModuleDefinition,
	AnalysisModuleId,
	AnalysisModuleResult
} from '../types/analysis-module.types';

function mapProcessorResult(
	moduleId: AnalysisModuleId,
	result: any,
	summaryFallback: string
): AnalysisModuleResult {
	if (result && typeof result === 'object' && 'summary' in result) {
		return {
			moduleId,
			summary: result.summary ?? summaryFallback,
			details: result.findings ? { findings: result.findings } : result.details,
			recommendations: result.recommendations || result.insights,
			score: result.score ?? result.details?.overallScore
		};
	}

	return {
		moduleId,
		summary: summaryFallback,
		details: typeof result === 'object' ? result : undefined
	};
}

const registry: Record<AnalysisModuleId, AnalysisModuleDefinition> = {
	'quick-stats': {
		id: 'quick-stats',
		label: 'Quick Stats',
		description: 'Conversation length, participation, and estimated level',
		modality: 'text',
		run: ({ messages, languageCode }: AnalysisModuleContext) => {
			const processorResult = runQuickStatsProcessor({
				messages: messages as any,
				language: { code: languageCode, name: languageCode }
			});
			return mapProcessorResult('quick-stats', processorResult, 'Quick stats available');
		}
	},
	'grammar-suggestions': {
		id: 'grammar-suggestions',
		label: 'Grammar Suggestions',
		description: 'Heuristic grammar checks with actionable tips',
		modality: 'text',
		run: ({ messages }: AnalysisModuleContext) => {
			const processorResult = runGrammarProcessor({ messages: messages as any });
			return mapProcessorResult('grammar-suggestions', processorResult, 'Grammar suggestions ready');
		}
	},
	'advanced-grammar': {
		id: 'advanced-grammar',
		label: 'Advanced Grammar',
		description: 'Detailed analysis of grammar usage and error patterns',
		modality: 'text',
		tier: 'pro',
		run: ({ messages, languageCode }: AnalysisModuleContext) => {
			const processorResult = runAdvancedGrammarProcessor({
				messages: messages as any,
				language: { code: languageCode, name: languageCode }
			});
			return mapProcessorResult('advanced-grammar', processorResult, 'Advanced grammar analysis complete');
		}
	},
	'fluency-analysis': {
		id: 'fluency-analysis',
		label: 'Fluency Analysis',
		description: 'Measures speech flow, filler usage, and pacing',
		modality: 'text',
		tier: 'pro',
		run: ({ messages, languageCode }: AnalysisModuleContext) => {
			const processorResult = runFluencyAnalysisProcessor({
				messages: messages as any,
				language: { code: languageCode, name: languageCode }
			});
			return mapProcessorResult('fluency-analysis', processorResult, 'Fluency insights generated');
		}
	},
	'phrase-suggestions': {
		id: 'phrase-suggestions',
		label: 'Phrase Suggestions',
		description: 'Alternative phrases to sound more natural',
		modality: 'text',
		run: ({ messages, languageCode }: AnalysisModuleContext) => {
			const processorResult = runPhraseSuggestionsProcessor({
				messages: messages as any,
				language: { code: languageCode, name: languageCode }
			});
			return mapProcessorResult('phrase-suggestions', processorResult, 'Phrase suggestions generated');
		}
	},
	'onboarding-profile': {
		id: 'onboarding-profile',
		label: 'Onboarding Profile',
		description: 'Learning profile and recommendation draft',
		modality: 'text',
		run: ({ messages }: AnalysisModuleContext) => {
			const processorResult = runOnboardingProfileProcessor({
				messages: messages as any,
				preferences: {} as any
			});
			return mapProcessorResult('onboarding-profile', processorResult, 'Onboarding profile ready');
		}
	},
	'pronunciation-analysis': {
		id: 'pronunciation-analysis',
		label: 'Pronunciation',
		description: 'Pronunciation scoring and articulation hints',
		modality: 'audio',
		ier: 'premium',
		requiresAudio: true,
		run: ({ messages }: AnalysisModuleContext) => {
			const processorResult = runPronunciationAnalysisProcessor({
				messages: messages as any,
				audioData: undefined,
				language: { code: 'en', name: 'English' }
			});
			return mapProcessorResult('pronunciation-analysis', processorResult, 'Pronunciation feedback generated');
		}
	},
	'speech-rhythm': {
		id: 'speech-rhythm',
		label: 'Speech Rhythm',
		description: 'Timing and rhythm observations',
		modality: 'audio',
		ier: 'premium',
		requiresAudio: true,
		run: ({ messages }: AnalysisModuleContext) => {
			const processorResult = runSpeechRhythmProcessor({
				messages: messages as any,
				audioData: undefined,
				language: { code: 'en', name: 'English' }
			});
			return mapProcessorResult('speech-rhythm', processorResult, 'Speech rhythm insights generated');
		}
	}
};

export function listAnalysisModules(): AnalysisModuleDefinition[] {
	return Object.values(registry);
}

export function getAnalysisModule(id: AnalysisModuleId): AnalysisModuleDefinition {
	const module = registry[id];
	if (!module) {
		throw new Error(`Analysis module not found: ${id}`);
	}
	return module;
}
