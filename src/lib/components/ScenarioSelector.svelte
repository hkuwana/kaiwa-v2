<!-- 🎯 Scenario Selector Component -->
<!-- Displays available learning scenarios with scaffolding features -->

<script lang="ts">
	import { getBeginnerScenariosForLanguage, scenarioCategories } from '$lib/kernel/scenarios';
	import type { LearningScenario } from '$lib/kernel/learning';
	import { languages } from '$lib/data/languages';

	// Props
	export let selectedLanguage: string = 'ja';
	export let onScenarioSelect: (scenario: LearningScenario) => void;

	// State
	let selectedCategory: string = 'all';
	let showScaffolding: boolean = true;
	let selectedScenario: LearningScenario | null = null;

	// Derived data
	$: availableScenarios = getBeginnerScenariosForLanguage(selectedLanguage);
	$: filteredScenarios =
		selectedCategory === 'all'
			? availableScenarios
			: availableScenarios.filter((s) => s.category === selectedCategory);

	// Functions
	function selectScenario(scenario: LearningScenario) {
		selectedScenario = scenario;
		onScenarioSelect(scenario);
	}

	function getCategoryEmoji(category: string): string {
		return scenarioCategories.find((c) => c.id === category)?.emoji || '📚';
	}

	function getCategoryName(category: string): string {
		return scenarioCategories.find((c) => c.id === category)?.name || 'Other';
	}
</script>

<div class="scenario-selector">
	<!-- Header -->
	<div class="header">
		<h2 class="mb-4 text-2xl font-bold text-gray-800">Choose Your Learning Scenario</h2>
		<p class="mb-6 text-gray-600">
			Practice real-world conversations with built-in support to help you succeed.
		</p>
	</div>

	<!-- Language and Category Filters -->
	<div class="filters mb-6 space-y-4">
		<!-- Language Display -->
		<div class="language-display">
			<span class="text-sm font-medium text-gray-700">Learning:</span>
			<span class="ml-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
				{languages.find((l) => l.code === selectedLanguage)?.name || selectedLanguage}
			</span>
		</div>

		<!-- Category Filter -->
		<div class="category-filter">
			<label class="mb-2 block text-sm font-medium text-gray-700">Category:</label>
			<div class="flex flex-wrap gap-2">
				<button
					class="rounded-lg px-3 py-2 text-sm font-medium transition-colors
						{selectedCategory === 'all'
						? 'bg-blue-500 text-white'
						: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
					onclick={() => (selectedCategory = 'all')}
				>
					All Categories
				</button>
				{#each scenarioCategories as category}
					<button
						class="rounded-lg px-3 py-2 text-sm font-medium transition-colors
							{selectedCategory === category.id
							? 'bg-blue-500 text-white'
							: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
						onclick={() => (selectedCategory = category.id)}
					>
						{category.emoji}
						{category.name}
					</button>
				{/each}
			</div>
		</div>

		<!-- Scaffolding Toggle -->
		<div class="scaffolding-toggle">
			<label class="flex cursor-pointer items-center space-x-2">
				<input
					type="checkbox"
					bind:checked={showScaffolding}
					class="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
				/>
				<span class="text-sm font-medium text-gray-700">
					Show learning supports (hints, translations, examples)
				</span>
			</label>
		</div>
	</div>

	<!-- Scenarios Grid -->
	<div class="scenarios-grid">
		{#if filteredScenarios.length === 0}
			<div class="no-scenarios py-12 text-center">
				<div class="mb-4 text-6xl text-gray-400">📚</div>
				<h3 class="mb-2 text-lg font-medium text-gray-600">No scenarios available</h3>
				<p class="text-gray-500">Check back later for more learning scenarios.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredScenarios as scenario}
					<div
						class="scenario-card cursor-pointer rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
						onclick={() => selectScenario(scenario)}
					>
						<!-- Card Header -->
						<div class="card-header p-6 pb-4">
							<div class="mb-3 flex items-center justify-between">
								<span class="text-2xl">{getCategoryEmoji(scenario.category)}</span>
								<span
									class="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
								>
									{scenario.difficulty}
								</span>
							</div>
							<h3 class="mb-2 text-lg font-semibold text-gray-800">
								{scenario.title}
							</h3>
							<p class="text-sm leading-relaxed text-gray-600">
								{scenario.description}
							</p>
						</div>

						<!-- Card Content -->
						<div class="card-content px-6 pb-4">
							<!-- Context -->
							<div class="context mb-4">
								<h4 class="mb-2 text-sm font-medium text-gray-700">Context:</h4>
								<p class="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
									{scenario.context}
								</p>
							</div>

							<!-- Goal -->
							<div class="goal mb-4">
								<h4 class="mb-2 text-sm font-medium text-gray-700">Your Goal:</h4>
								<p
									class="rounded-lg border-l-4 border-blue-200 bg-blue-50 p-3 text-sm text-gray-600"
								>
									{scenario.goal}
								</p>
							</div>

							<!-- Target Vocabulary Preview -->
							{#if showScaffolding && scenario.vocabularyPreview.length > 0}
								<div class="vocabulary-preview mb-4">
									<h4 class="mb-2 text-sm font-medium text-gray-700">Key Words:</h4>
									<div class="flex flex-wrap gap-2">
										{#each scenario.vocabularyPreview as word}
											<span
												class="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
											>
												{word}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Learning Objectives -->
							<div class="learning-objectives">
								<h4 class="mb-2 text-sm font-medium text-gray-700">Learning Focus:</h4>
								<div class="space-y-2">
									{#if scenario.targetGrammar}
										<div class="flex items-center text-sm text-gray-600">
											<span class="mr-2 text-purple-500">🔤</span>
											{scenario.targetGrammar}
										</div>
									{/if}
									<div class="flex items-center text-sm text-gray-600">
										<span class="mr-2 text-blue-500">📚</span>
										{scenario.targetVocabulary.length} vocabulary words
									</div>
								</div>
							</div>
						</div>

						<!-- Card Footer -->
						<div class="card-footer rounded-b-xl bg-gray-50 px-6 py-4">
							<div class="flex items-center justify-between">
								<span class="text-sm text-gray-500">
									{scenario.aiRole}
								</span>
								<button
									class="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
								>
									Start Practice
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Selected Scenario Details Modal -->
	{#if selectedScenario}
		<div
			class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
			onclick={() => (selectedScenario = null)}
		>
			<div
				class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white"
				onclick={(e) => e.stopPropagation()}
			>
				<!-- Modal Header -->
				<div class="modal-header border-b border-gray-200 p-6">
					<div class="flex items-center justify-between">
						<h2 class="text-xl font-bold text-gray-800">
							{selectedScenario.title}
						</h2>
						<button
							class="text-2xl text-gray-400 hover:text-gray-600"
							onclick={() => (selectedScenario = null)}
						>
							×
						</button>
					</div>
				</div>

				<!-- Modal Content -->
				<div class="modal-content p-6">
					<!-- Scenario Overview -->
					<div class="scenario-overview mb-6">
						<div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
							<div class="rounded-lg bg-gray-50 p-4">
								<h4 class="mb-2 font-medium text-gray-700">Context</h4>
								<p class="text-sm text-gray-600">{selectedScenario.context}</p>
							</div>
							<div class="rounded-lg bg-blue-50 p-4">
								<h4 class="mb-2 font-medium text-gray-700">Goal</h4>
								<p class="text-sm text-gray-600">{selectedScenario.goal}</p>
							</div>
						</div>
					</div>

					<!-- Scaffolding Features -->
					{#if showScaffolding}
						<div class="scaffolding-features space-y-4">
							<!-- Translation Hints -->
							<div class="translation-hints">
								<h4 class="mb-3 font-medium text-gray-700">Translation Hints</h4>
								<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
									{#each Object.entries(selectedScenario.translationHints) as [word, translation]}
										<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
											<div class="text-sm font-medium text-gray-800">{word}</div>
											<div class="text-xs text-gray-600">{translation}</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Example Responses -->
							<div class="example-responses">
								<h4 class="mb-3 font-medium text-gray-700">Example Responses</h4>
								<div class="space-y-2">
									{#each selectedScenario.exampleResponses as example}
										<div class="rounded-lg border border-green-200 bg-green-50 p-3">
											<p class="text-sm text-gray-800">{example}</p>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Modal Footer -->
				<div class="modal-footer border-t border-gray-200 p-6">
					<div class="flex justify-end space-x-3">
						<button
							class="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:bg-gray-50"
							onclick={() => (selectedScenario = null)}
						>
							Cancel
						</button>
						<button
							class="rounded-lg bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600"
							onclick={() => {
								onScenarioSelect(selectedScenario);
								selectedScenario = null;
							}}
						>
							Start Practice
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.scenario-selector {
		@apply mx-auto max-w-7xl;
	}

	.scenario-card {
		@apply transition-all duration-200;
	}

	.scenario-card:hover {
		@apply -translate-y-1 transform;
	}

	.modal-content {
		max-height: calc(90vh - 200px);
	}
</style>
