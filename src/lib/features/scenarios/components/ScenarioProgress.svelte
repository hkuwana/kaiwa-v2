<!-- 🎯 Scenario Progress Component -->
<!-- Shows learning progress and provides scaffolding during scenario practice -->

<script lang="ts">
	import type { Scenario, ConversationState } from '$lib/types';

	const { scenario, state, onUseHint, onUseTranslation, onViewExample } = $props<{
		scenario: Scenario;
		state: ConversationState;
		onUseHint: (word: string) => void;
		onUseTranslation: (word: string) => void;
		onViewExample: () => void;
	}>();

	// Derived state
	const scenarioSession = $derived(state.scenarioSession);
	const goalProgress = $derived(scenarioSession?.goalProgress || 0);
	const vocabularyProgress = $derived(scenarioSession?.vocabularyProgress || 0);
	const grammarProgress = $derived(scenarioSession?.grammarProgress || 0);
	const usedVocabulary = $derived(scenarioSession?.usedVocabulary || []);
	const hintsUsed = $derived(scenarioSession?.hintsUsed || 0);
	const translationsUsed = $derived(scenarioSession?.translationsUsed || 0);
	const exampleResponsesViewed = $derived(scenarioSession?.exampleResponsesViewed || 0);

	// Functions

	function getProgressText(progress: number): string {
		if (progress >= 0.8) return 'Excellent';
		if (progress >= 0.6) return 'Good';
		if (progress >= 0.4) return 'Fair';
		return 'Needs Work';
	}

	function getUnusedVocabulary(): string[] {
		return (scenario.learningObjectives || []).filter(
			(word: string) => !usedVocabulary.includes(word)
		);
	}
</script>

<div class="scenario-progress rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
	<!-- Header -->
	<div class="mb-6">
		<h3 class="text-lg font-semibold text-gray-800">{scenario.title}</h3>
		<p class="mt-2 text-sm text-gray-600">{scenario.instructions}</p>
	</div>

	<!-- Progress Bar -->
	<div class="mb-6">
		<div class="flex items-center justify-between text-sm mb-2">
			<span class="text-gray-600">Progress</span>
			<span class="font-medium text-gray-800">{Math.round(goalProgress * 100)}%</span>
		</div>
		<div class="h-2 w-full rounded-full bg-gray-200">
			<div
				class="h-2 rounded-full bg-blue-500 transition-all duration-300"
				style="width: {goalProgress * 100}%"
			></div>
		</div>
	</div>

	<!-- Key Metrics - Simplified -->
	<div class="mb-6 grid grid-cols-3 gap-3">
		<div class="text-center">
			<div class="text-xl font-bold text-gray-800">{Math.round(goalProgress * 100)}%</div>
			<div class="text-xs text-gray-500">Goal</div>
		</div>
		<div class="text-center">
			<div class="text-xl font-bold text-gray-800">{Math.round(vocabularyProgress * 100)}%</div>
			<div class="text-xs text-gray-500">Vocab</div>
		</div>
		<div class="text-center">
			<div class="text-xl font-bold text-gray-800">{Math.round(grammarProgress * 100)}%</div>
			<div class="text-xs text-gray-500">Grammar</div>
		</div>
	</div>

	<!-- Used Vocabulary (if any) -->
	{#if usedVocabulary.length > 0}
		<div class="mb-6">
			<div class="text-xs font-medium text-gray-600 mb-2">Used:</div>
			<div class="flex flex-wrap gap-2">
				{#each usedVocabulary as word (word)}
					<span class="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
						{word}
					</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Support Options -->
	<div class="grid grid-cols-3 gap-2">
		<button
			class="rounded-lg bg-yellow-500 px-2 py-2 text-xs font-medium text-white hover:bg-yellow-600"
			onclick={() => onUseHint('next')}
		>
			Hint
		</button>
		<button
			class="rounded-lg bg-blue-500 px-2 py-2 text-xs font-medium text-white hover:bg-blue-600"
			onclick={() => onUseTranslation('current')}
		>
			Translate
		</button>
		<button
			class="rounded-lg bg-green-500 px-2 py-2 text-xs font-medium text-white hover:bg-green-600"
			onclick={onViewExample}
		>
			Example
		</button>
	</div>
</div>
