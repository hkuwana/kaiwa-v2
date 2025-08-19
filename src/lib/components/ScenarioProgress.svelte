<!-- 🎯 Scenario Progress Component -->
<!-- Shows learning progress and provides scaffolding during scenario practice -->

<script lang="ts">
	import type {
		LearningScenario,
		ScenarioOutcome,
		ConversationState
	} from '$lib/types/conversation';

	let { scenario, state, onUseHint, onUseTranslation, onViewExample } = $props<{
		scenario: LearningScenario;
		state: ConversationState;
		onUseHint: (word: string) => void;
		onUseTranslation: (word: string) => void;
		onViewExample: () => void;
	}>();

	// Derived state
	let scenarioSession = $derived(state.scenarioSession);
	let goalProgress = $derived(scenarioSession?.goalProgress || 0);
	let vocabularyProgress = $derived(scenarioSession?.vocabularyProgress || 0);
	let grammarProgress = $derived(scenarioSession?.grammarProgress || 0);
	let usedVocabulary = $derived(scenarioSession?.usedVocabulary || []);
	let hintsUsed = $derived(scenarioSession?.hintsUsed || 0);
	let translationsUsed = $derived(scenarioSession?.translationsUsed || 0);
	let exampleResponsesViewed = $derived(scenarioSession?.exampleResponsesViewed || 0);

	// Functions
	function getProgressColor(progress: number): string {
		if (progress >= 0.8) return 'bg-green-500';
		if (progress >= 0.6) return 'bg-yellow-500';
		if (progress >= 0.4) return 'bg-orange-500';
		return 'bg-red-500';
	}

	function getProgressText(progress: number): string {
		if (progress >= 0.8) return 'Excellent';
		if (progress >= 0.6) return 'Good';
		if (progress >= 0.4) return 'Fair';
		return 'Needs Work';
	}

	function getUnusedVocabulary(): string[] {
		return (scenario.targetVocabulary || []).filter(
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
			<p class="text-sm font-medium text-gray-800">{scenario.goal}</p>
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
					class="h-2 {getProgressColor(goalProgress)} rounded-full transition-all duration-300"
					style="width: {goalProgress * 100}%"
				></div>
			</div>
		</div>

		<!-- Vocabulary Progress -->
		<div class="metric-card rounded-lg border border-yellow-200 bg-yellow-50 p-4">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm font-medium text-gray-700">Vocabulary</span>
				<span class="text-lg font-bold text-yellow-600">
					{Math.round(vocabularyProgress * 100)}%
				</span>
			</div>
			<div class="mb-2 text-xs text-gray-600">
				{usedVocabulary.length} / {scenario.targetVocabulary.length} words used
			</div>
			<div class="h-2 w-full rounded-full bg-yellow-200">
				<div
					class="h-2 {getProgressColor(
						vocabularyProgress
					)} rounded-full transition-all duration-300"
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
				{scenario.targetGrammar || 'Not specified'}
			</div>
			<div class="h-2 w-full rounded-full bg-purple-200">
				<div
					class="h-2 {getProgressColor(grammarProgress)} rounded-full transition-all duration-300"
					style="width: {grammarProgress * 100}%"
				></div>
			</div>
		</div>
	</div>

	<!-- Vocabulary Status -->
	<div class="vocabulary-status mb-6">
		<h4 class="mb-3 font-medium text-gray-700">Vocabulary Progress</h4>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<!-- Used Vocabulary -->
			<div class="used-vocabulary">
				<h5 class="mb-2 text-sm font-medium text-green-700">✅ Used Words</h5>
				<div class="flex flex-wrap gap-2">
					{#each usedVocabulary as word}
						<span class="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
							{word}
						</span>
					{/each}
					{#if usedVocabulary.length === 0}
						<span class="text-xs text-gray-400">No words used yet</span>
					{/if}
				</div>
			</div>

			<!-- Unused Vocabulary -->
			<div class="unused-vocabulary">
				<h5 class="mb-2 text-sm font-medium text-gray-700">📚 Still Need to Use</h5>
				<div class="flex flex-wrap gap-2">
					{#each getUnusedVocabulary() as word}
						<span class="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
							{word}
						</span>
					{/each}
					{#if getUnusedVocabulary().length === 0}
						<span class="text-xs text-green-600">All words used! 🎉</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Scaffolding Features -->
	<div class="scaffolding-features">
		<h4 class="mb-3 font-medium text-gray-700">Learning Support</h4>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<!-- Translation Hints -->
			<div class="scaffolding-card rounded-lg border border-yellow-200 bg-yellow-50 p-4">
				<div class="mb-3 flex items-center justify-between">
					<h5 class="text-sm font-medium text-yellow-800">Translation Hints</h5>
					<span class="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-600">
						{hintsUsed} used
					</span>
				</div>
				<p class="mb-3 text-xs text-yellow-700">Get help with specific words</p>
				<div class="space-y-2">
					{#each getUnusedVocabulary().slice(0, 3) as word}
						<button
							class="w-full rounded bg-yellow-100 px-3 py-2 text-left text-sm text-yellow-800 transition-colors hover:bg-yellow-200"
							onclick={() => onUseHint(word)}
						>
							{word} → {scenario.translationHints[word] || 'Click for hint'}
						</button>
					{/each}
				</div>
			</div>

			<!-- Example Responses -->
			<div class="scaffolding-card rounded-lg border border-green-200 bg-green-50 p-4">
				<div class="mb-3 flex items-center justify-between">
					<h5 class="text-sm font-medium text-green-800">Example Responses</h5>
					<span class="rounded bg-green-100 px-2 py-1 text-xs text-green-600">
						{exampleResponsesViewed} viewed
					</span>
				</div>
				<p class="mb-3 text-xs text-green-700">See how to respond naturally</p>
				<button
					class="w-full rounded bg-green-100 px-3 py-2 text-sm text-green-800 transition-colors hover:bg-green-200"
					onclick={onViewExample}
				>
					View Examples
				</button>
			</div>

			<!-- Progress Summary -->
			<div class="scaffolding-card rounded-lg border border-blue-200 bg-blue-50 p-4">
				<h5 class="mb-3 text-sm font-medium text-blue-800">Session Summary</h5>
				<div class="space-y-2 text-xs text-blue-700">
					<div class="flex justify-between">
						<span>Hints used:</span>
						<span class="font-medium">{hintsUsed}</span>
					</div>
					<div class="flex justify-between">
						<span>Translations:</span>
						<span class="font-medium">{translationsUsed}</span>
					</div>
					<div class="flex justify-between">
						<span>Examples viewed:</span>
						<span class="font-medium">{exampleResponsesViewed}</span>
					</div>
					<div class="flex justify-between">
						<span>Exchanges:</span>
						<span class="font-medium">{Math.floor(state.messages.length / 2)}</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Encouragement Message -->
	{#if goalProgress >= 0.8}
		<div class="encouragement mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
			<div class="mb-2 text-2xl">🎉</div>
			<p class="font-medium text-green-800">Great progress! You're almost there!</p>
		</div>
	{:else if goalProgress >= 0.5}
		<div class="encouragement mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
			<div class="mb-2 text-xl">💪</div>
			<p class="font-medium text-blue-800">Keep going! You're making good progress.</p>
		</div>
	{:else}
		<div
			class="encouragement mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center"
		>
			<div class="mb-2 text-xl">🚀</div>
			<p class="font-medium text-yellow-800">
				You're just getting started! Use the hints above to help you.
			</p>
		</div>
	{/if}
</div>

<style>
	.scenario-progress {
		@apply mx-auto max-w-4xl;
	}

	.metric-card {
		@apply transition-all duration-200;
	}

	.scaffolding-card {
		@apply transition-all duration-200;
	}

	.scaffolding-card:hover {
		@apply -translate-y-1 transform;
	}

	.encouragement {
		@apply transition-all duration-300;
	}
</style>
