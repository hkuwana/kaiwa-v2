<script lang="ts">
	import ScenarioSelector from '$lib/features/scenarios/components/ScenarioSelector.svelte';
	import ScenarioEngagement from '$lib/features/scenarios/components/ScenarioEngagement.svelte';
	import { scenariosData, type Scenario } from '$lib/data/scenarios';
	import { customScenarioStore } from '$lib/stores/custom-scenarios.store.svelte';

	const baseScenarios = scenariosData;
	const scenarios = baseScenarios;

	let currentScenario = $state<Scenario | null>(baseScenarios[0]);
	let isSaved = $state(false);
	let userRating = $state<number | null>(null);
	let engagementIsLoading = $state(false);

	const draft = $derived(customScenarioStore.draft);
	const savedSummaries = $derived(customScenarioStore.scenarios);
	const customScenarios = $derived(customScenarioStore.customScenarios);

	function handleScenarioSelect(scenario: Scenario) {
		currentScenario = scenario;
		// Reset engagement state when switching scenarios
		isSaved = false;
		userRating = null;
	}

	function handleSaveChange(newSavedState: boolean) {
		isSaved = newSavedState;
		console.log('✅ Scenario save status changed:', newSavedState);
	}

	function handleRatingChange(newRating: number) {
		userRating = newRating;
		console.log('⭐ Scenario rating changed:', newRating);
	}
</script>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
	<section class="space-y-4">
		<h1 class="text-2xl font-bold">Scenario Selector Playground</h1>
		<p class="text-base-content/70">
			Use the selector button below to pick a scenario or create your own. This page displays the
			raw JSON output so you can verify the generated data.
		</p>
		<div class="max-w-xl">
			<ScenarioSelector
				{scenarios}
				selectedScenario={currentScenario}
				onScenarioSelect={handleScenarioSelect}
			/>
		</div>
	</section>

	<section class="grid gap-6 md:grid-cols-2">
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<div class="flex items-center justify-between">
					<h2 class="card-title text-lg">Selected Scenario</h2>
					<span class="badge badge-info">TEST</span>
				</div>
				{#if currentScenario}
					<div class="mt-4 space-y-4">
						<div class="rounded-lg bg-base-200/50 p-3">
							<p class="mb-3 text-xs font-semibold tracking-wide uppercase opacity-70">
								Engagement Controls (Demo)
							</p>
							<ScenarioEngagement
								scenario={currentScenario}
								{isSaved}
								{userRating}
								onSaveChange={handleSaveChange}
								onRatingChange={handleRatingChange}
								isLoading={engagementIsLoading}
								size="md"
							/>
							<div class="mt-3 space-y-1 text-xs text-base-content/60">
								<p>💾 Saved: <span class="font-mono font-semibold">{isSaved}</span></p>
								<p>
									⭐ Rating: <span class="font-mono font-semibold">{userRating ?? 'null'}</span>
								</p>
							</div>
						</div>
					</div>

					<pre class="mt-3 max-h-72 overflow-auto rounded bg-base-200/80 p-4 text-xs">
{JSON.stringify(currentScenario, null, 2)}
</pre>
				{:else}
					<p class="text-sm text-base-content/60">No scenario selected.</p>
				{/if}
			</div>
		</div>

		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title text-lg">Scenario Draft (raw JSON)</h2>
				{#if draft.result}
					<pre class="mt-3 max-h-72 overflow-auto rounded bg-base-200/80 p-4 text-xs">
{JSON.stringify(draft.result, null, 2)}
</pre>
				{:else}
					<p class="text-sm text-base-content/60">
						No draft yet — open the creator and describe a scenario to generate JSON.
					</p>
				{/if}
			</div>
		</div>
	</section>

	<section class="card bg-base-100 shadow">
		<div class="card-body">
			<h2 class="card-title text-lg">Saved Custom Scenarios</h2>
			{#if customScenarios.length === 0}
				<p class="text-sm text-base-content/60">
					No custom scenarios saved yet. Create one above to see it listed here.
				</p>
			{:else}
				<div class="grid gap-4 md:grid-cols-2">
					{#each customScenarios as scenario (scenario.id)}
						<div class="rounded-lg border border-base-300 p-4 text-sm">
							<p class="font-semibold">{scenario.title}</p>
							<p class="mt-1 text-xs text-base-content/60">{scenario.description}</p>
							<pre class="mt-3 max-h-48 overflow-auto rounded bg-base-200/80 p-3 text-[11px]">
{JSON.stringify(scenario, null, 2)}
</pre>
						</div>
					{/each}
				</div>
			{/if}

			{#if savedSummaries.length > 0}
				<div class="divider"></div>
				<h3 class="text-sm font-semibold tracking-wide uppercase">Summary Metadata</h3>
				<ul class="space-y-2 text-xs">
					{#each savedSummaries as summary (summary.id)}
						<li class="rounded border border-base-300 p-3">
							<div class="flex justify-between">
								<span>{summary.title}</span>
								<span class="badge badge-outline">{summary.role}</span>
							</div>
							<p class="mt-1">
								Creator:
								<strong>{summary.createdBy || 'Unknown (server will populate)'}</strong>
							</p>
							<p class="text-base-content/60">
								Added: {summary.createdAt} · Visibility: {summary.visibility}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
</main>
