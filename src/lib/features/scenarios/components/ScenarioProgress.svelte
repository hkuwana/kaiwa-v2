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
	<div class="header mb-6">
		<div class="mb-3 flex items-center justify-between">
			<h3 class="text-lg font-semibold text-gray-800">
				{scenario.title}
			</h3>
			<span class="rounded-full bg-blue-100 px-2 py-1 text-sm font-medium text-blue-700">
				{scenario.difficulty}
			</span>
		</div>
		<p class="text-sm text-gray-600">
			{scenario.context}
		</p>
	</div>

	<!-- Goal Display -->
	<div class="goal-display mb-6">
		<div class="mb-2 flex items-center justify-between">
			<h4 class="font-medium text-gray-700">Your Goal:</h4>
			<span class="text-sm text-gray-500">
				{Math.round(goalProgress * 100)}% Complete
			</span>
		</div>
		<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
			<p class="text-sm font-medium text-gray-800">{scenario.instructions}</p>
		</div>
		<!-- Goal Progress Bar -->
		<div class="mt-3">
			<div class="h-2 w-full rounded-full bg-gray-200">
				<div
					class="h-2 rounded-full bg-blue-500 transition-all duration-300"
					style="width: {goalProgress * 100}%"
				></div>
			</div>
		</div>
	</div>

	<!-- Progress Metrics -->
	<div class="progress-metrics mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
		<!-- Goal Progress -->
		<div class="metric-card rounded-lg border border-green-200 bg-green-50 p-4">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm font-medium text-gray-700">Goal Progress</span>
				<span class="text-lg font-bold text-green-600">
					{Math.round(goalProgress * 100)}%
				</span>
			</div>
			<div class="mb-2 text-xs text-gray-600">
				{getProgressText(goalProgress)}
			</div>
			<div class="h-2 w-full rounded-full bg-green-200">
				<div
					class="h-2 rounded-full bg-green-500 transition-all duration-300"
					style="width: {goalProgress * 100}%"
				></div>
			</div>
		</div>

		<!-- Vocabulary Progress -->
		<div class="metric-card rounded-lg border border-blue-200 bg-blue-50 p-4">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm font-medium text-gray-700">Vocabulary</span>
				<span class="text-lg font-bold text-blue-600">
					{Math.round(vocabularyProgress * 100)}%
				</span>
			</div>
			<div class="mb-2 text-xs text-gray-600">
				{getProgressText(vocabularyProgress)}
			</div>
			<div class="h-2 w-full rounded-full bg-blue-200">
				<div
					class="h-2 rounded-full bg-blue-500 transition-all duration-300"
					style="width: {vocabularyProgress * 100}%"
				></div>
			</div>
		</div>

		<!-- Grammar Progress -->
		<div class="metric-card rounded-lg border border-purple-200 bg-purple-50 p-4">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm font-medium text-gray-700">Grammar</span>
				<span class="text-lg font-bold text-purple-600">
					{Math.round(grammarProgress * 100)}%
				</span>
			</div>
			<div class="mb-2 text-xs text-gray-600">
				{getProgressText(grammarProgress)}
			</div>
			<div class="h-2 w-full rounded-full bg-purple-200">
				<div
					class="h-2 rounded-full bg-purple-500 transition-all duration-300"
					style="width: {grammarProgress * 100}%"
				></div>
			</div>
		</div>
	</div>

	<!-- Vocabulary Usage -->
	<div class="vocabulary-usage mb-6">
		<h4 class="mb-3 font-medium text-gray-700">Vocabulary Progress</h4>
		<div class="space-y-3">
			<!-- Used Vocabulary -->
			<div class="used-vocabulary">
				<h5 class="mb-2 text-sm font-medium text-green-700">Used Successfully:</h5>
				<div class="flex flex-wrap gap-2">
					{#each usedVocabulary as word (word)}
						<span class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
							{word}
						</span>
					{/each}
				</div>
			</div>

			<!-- Unused Vocabulary -->
			<div class="unused-vocabulary">
				<h5 class="mb-2 text-sm font-medium text-orange-700">Still to Use:</h5>
				<div class="flex flex-wrap gap-2">
					{#each getUnusedVocabulary() as word (word)}
						<span class="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
							{word}
						</span>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Scaffolding Usage -->
	<div class="scaffolding-usage mb-6">
		<h4 class="mb-3 font-medium text-gray-700">Learning Support Usage</h4>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<!-- Hints Used -->
			<div class="scaffolding-card rounded-lg border border-yellow-200 bg-yellow-50 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-700">Hints Used</span>
					<span class="text-lg font-bold text-yellow-600">{hintsUsed}</span>
				</div>
				<button
					class="w-full rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600"
					onclick={() => onUseHint('next')}
				>
					Get Next Hint
				</button>
			</div>

			<!-- Translations Used -->
			<div class="scaffolding-card rounded-lg border border-blue-200 bg-blue-50 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-700">Translations</span>
					<span class="text-lg font-bold text-blue-600">{translationsUsed}</span>
				</div>
				<button
					class="w-full rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
					onclick={() => onUseTranslation('current')}
				>
					Translate Current
				</button>
			</div>

			<!-- Examples Viewed -->
			<div class="scaffolding-card rounded-lg border border-green-200 bg-green-50 p-4">
				<div class="mb-2 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-700">Examples</span>
					<span class="text-lg font-bold text-green-600">{exampleResponsesViewed}</span>
				</div>
				<button
					class="w-full rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
					onclick={onViewExample}
				>
					View Example
				</button>
			</div>
		</div>
	</div>

	<!-- Expected Outcome -->
	{#if scenario.expectedOutcome}
		<div class="expected-outcome">
			<h4 class="mb-3 font-medium text-gray-700">Expected Outcome</h4>
			<div class="rounded-lg border border-purple-200 bg-purple-50 p-4">
				<p class="text-sm text-gray-800">{scenario.expectedOutcome}</p>
			</div>
		</div>
	{/if}
</div>
