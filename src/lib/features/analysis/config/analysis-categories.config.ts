import { runQuickStatsProcessor } from '../processors/quick-stats.processor';
import { runGrammarProcessor } from '../processors/grammar.processor';
import { runAdvancedGrammarProcessor } from '../processors/advanced-grammar.processor';
import { runFluencyAnalysisProcessor } from '../processors/fluency-analysis.processor';
import { runPhraseSuggestionsProcessor } from '../processors/phrase-suggestions.processor';
import { runOnboardingProfileProcessor } from '../processors/onboarding-profile.processor';
import { runAudioPlaceholderProcessor } from '../processors/audio-placeholder.processor';
import { runPronunciationAnalysisProcessor } from '../processors/pronunciation-analysis.processor';
import { runSpeechRhythmProcessor } from '../processors/speech-rhythm.processor';

const textProcessors = {
	'quick-stats': ({ messages, language }: { messages: unknown; language: unknown }) =>
		runQuickStatsProcessor({
			messages: messages as Parameters<typeof runQuickStatsProcessor>[0]['messages'],
			language: language as Parameters<typeof runQuickStatsProcessor>[0]['language']
		}),
	'grammar-suggestions': ({ messages }: { messages: unknown }) =>
		runGrammarProcessor({ messages: messages as Parameters<typeof runGrammarProcessor>[0]['messages'] }),
	'advanced-grammar': ({ messages, language }: { messages: unknown; language: unknown }) =>
		runAdvancedGrammarProcessor({
			messages: messages as Parameters<typeof runAdvancedGrammarProcessor>[0]['messages'],
			language: language as Parameters<typeof runAdvancedGrammarProcessor>[0]['language']
		}),
	'fluency-analysis': ({ messages, language }: { messages: unknown; language: unknown }) =>
		runFluencyAnalysisProcessor({
			messages: messages as Parameters<typeof runFluencyAnalysisProcessor>[0]['messages'],
			language: language as Parameters<typeof runFluencyAnalysisProcessor>[0]['language']
		}),
	'phrase-suggestions': ({ messages, language }: { messages: unknown; language: unknown }) =>
		runPhraseSuggestionsProcessor({
			messages: messages as Parameters<typeof runPhraseSuggestionsProcessor>[0]['messages'],
			language: language as Parameters<typeof runPhraseSuggestionsProcessor>[0]['language']
		}),
	'onboarding-profile': ({ messages, preferences }: { messages: unknown; preferences: unknown }) =>
		runOnboardingProfileProcessor({
			messages: messages as Parameters<typeof runOnboardingProfileProcessor>[0]['messages'],
			preferences: preferences as Parameters<typeof runOnboardingProfileProcessor>[0]['preferences']
		})
};

const audioProcessors = {
	'audio-suggestion': () => runAudioPlaceholderProcessor(),
	'pronunciation-analysis': ({ messages, audioData, language }: { messages: unknown; audioData?: unknown; language: unknown }) =>
		runPronunciationAnalysisProcessor({
			messages: messages as Parameters<typeof runPronunciationAnalysisProcessor>[0]['messages'],
			audioData: audioData as ArrayBuffer | undefined,
			language: language as Parameters<typeof runPronunciationAnalysisProcessor>[0]['language']
		}),
	'speech-rhythm': ({ messages, audioData, language }: { messages: unknown; audioData?: unknown; language: unknown }) =>
		runSpeechRhythmProcessor({
			messages: messages as Parameters<typeof runSpeechRhythmProcessor>[0]['messages'],
			audioData: audioData as ArrayBuffer | undefined,
			language: language as Parameters<typeof runSpeechRhythmProcessor>[0]['language']
		})
};

export const analysisCategoryConfigs = [
	// === TEXT ANALYSIS ===
	{
		id: 'quick-stats',
		label: 'Quick Stats',
		modality: 'text',
		description: 'Basic counts and estimated level',
		defaultEnabled: true,
		required: true,
		processors: [textProcessors['quick-stats']]
	},
	{
		id: 'grammar-suggestions',
		label: 'Basic Grammar',
		modality: 'text',
		description: 'Simple grammar heuristics',
		defaultEnabled: true,
		processors: [textProcessors['grammar-suggestions']]
	},
	{
		id: 'advanced-grammar',
		label: 'Advanced Grammar',
		modality: 'text',
		description: 'Detailed grammar analysis with explanations',
		defaultEnabled: false,
		tier: 'pro',
		processors: [textProcessors['advanced-grammar']]
	},
	{
		id: 'fluency-analysis',
		label: 'Fluency Analysis',
		modality: 'text',
		description: 'Speech patterns, pace, and flow analysis',
		defaultEnabled: false,
		tier: 'pro',
		processors: [textProcessors['fluency-analysis']]
	},
	{
		id: 'phrase-suggestions',
		label: 'Phrase Suggestions',
		modality: 'text',
		description: 'Alternative phrasing ideas',
		defaultEnabled: true,
		processors: [textProcessors['phrase-suggestions']]
	},
	{
		id: 'onboarding-profile',
		label: 'Onboarding Profile',
		modality: 'text',
		description: 'Level check and profile nudges',
		defaultEnabled: true,
		processors: [textProcessors['onboarding-profile']]
	},

	// === AUDIO ANALYSIS ===
	{
		id: 'pronunciation-analysis',
		label: 'Pronunciation Analysis',
		modality: 'audio',
		description: 'Detailed pronunciation feedback',
		defaultEnabled: false,
		tier: 'premium',
		processors: [audioProcessors['pronunciation-analysis']]
	},
	{
		id: 'speech-rhythm',
		label: 'Speech Rhythm',
		modality: 'audio',
		description: 'Natural rhythm and pacing analysis',
		defaultEnabled: false,
		tier: 'premium',
		processors: [audioProcessors['speech-rhythm']]
	},
	{
		id: 'audio-suggestion',
		label: 'Audio Insights',
		modality: 'audio',
		description: 'Basic audio-based suggestions',
		defaultEnabled: false,
		tier: 'free',
		processors: [audioProcessors['audio-suggestion']]
	}
] as const;

export function cloneDefaultCategories() {
	return analysisCategoryConfigs.map((category) => ({
		...category,
		processors: [...category.processors]
	}));
}
