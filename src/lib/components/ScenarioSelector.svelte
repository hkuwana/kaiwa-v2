<!-- src/lib/components/ScenarioSelector.svelte -->
<script lang="ts">
	import type { Scenario } from '$lib/server/db/types';

	// Props-based design - no direct store access
	interface Props {
		scenarios: Scenario[];
		selectedScenario: Scenario | null;
		onScenarioSelect: (scenario: Scenario) => void;
		onReset: () => void;
	}

	const { scenarios, selectedScenario, onScenarioSelect, onReset } = $props();
</script>

<div class="scenario-selector">
	<h3 class="mb-4 text-lg font-semibold">Choose a Learning Scenario</h3>

	<div class="grid gap-4">
		{#each scenarios as scenario}
			<button
				class="scenario-card cursor-pointer rounded-lg border p-4 transition-colors {selectedScenario?.id ===
				scenario.id
					? 'border-primary bg-primary/10'
					: 'border-base-300 hover:border-primary/50'}"
				onclick={() => onScenarioSelect(scenario)}
			>
				<h4 class="text-lg font-medium">{scenario.title}</h4>
				<p class="mt-1 text-sm opacity-70">{scenario.description}</p>
				<div class="mt-2 flex gap-2">
					<span class="badge badge-outline badge-sm">{scenario.category}</span>
					<span class="badge badge-outline badge-sm">{scenario.difficulty}</span>
				</div>
			</button>
		{/each}
	</div>

	{#if selectedScenario}
		<div class="mt-6 rounded-lg bg-base-200 p-4">
			<h4 class="mb-2 font-medium">Selected: {selectedScenario.title}</h4>
			<p class="mb-3 text-sm opacity-70">{selectedScenario.instructions}</p>
			<button class="btn btn-outline btn-sm" onclick={onReset}> Reset to Onboarding </button>
		</div>
	{/if}
</div>
