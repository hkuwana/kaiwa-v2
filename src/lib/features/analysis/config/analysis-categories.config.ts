import { runQuickStatsProcessor } from '../processors/quick-stats.processor';
import { runGrammarProcessor } from '../processors/grammar.processor';
import { runPhraseSuggestionsProcessor } from '../processors/phrase-suggestions.processor';
import { runOnboardingProfileProcessor } from '../processors/onboarding-profile.processor';
import { runAudioPlaceholderProcessor } from '../processors/audio-placeholder.processor';

const textProcessors = {
	'quick-stats': ({ messages, language }: { messages: unknown; language: unknown }) =>
		runQuickStatsProcessor({
			messages: messages as Parameters<typeof runQuickStatsProcessor>[0]['messages'],
			language: language as Parameters<typeof runQuickStatsProcessor>[0]['language']
		}),
	'grammar-suggestions': ({ messages }: { messages: unknown }) =>
		runGrammarProcessor({ messages: messages as Parameters<typeof runGrammarProcessor>[0]['messages'] }),
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
	'audio-suggestion': () => runAudioPlaceholderProcessor()
};

export const analysisCategoryConfigs = [
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
		label: 'Grammar Suggestions',
		modality: 'text',
		description: 'Simple grammar heuristics',
		defaultEnabled: true,
		processors: [textProcessors['grammar-suggestions']]
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
	{
		id: 'audio-suggestion',
		label: 'Audio Suggestions',
		modality: 'audio',
		description: 'Placeholder for audio modality',
		defaultEnabled: false,
		processors: [audioProcessors['audio-suggestion']]
	}
] as const;

export function cloneDefaultCategories() {
	return analysisCategoryConfigs.map((category) => ({
		...category,
		processors: [...category.processors]
	}));
}
