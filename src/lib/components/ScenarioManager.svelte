<!-- src/lib/components/ScenarioManager.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import type { Scenario } from '$lib/server/db/types';
	import ScenarioSelector from './ScenarioSelector.svelte';

	// Local state for component
	let scenarios = $state<Scenario[]>([]);
	let selectedScenario = $state<Scenario | null>(null);

	// Initialize scenarios on mount
	onMount(() => {
		// Get scenarios from store
		scenarios = [
			...scenarioStore.getScenariosByCategory('comfort'),
			...scenarioStore.getScenariosByCategory('custom')
		];

		// Get current scenario from store
		selectedScenario = scenarioStore.getSelectedScenario();
	});

	// Event handlers
	function handleScenarioSelect(scenario: Scenario) {
		// Update local state
		selectedScenario = scenario;

		// Update store
		scenarioStore.setScenario(scenario);

		console.log('🎯 Scenario selected:', scenario.title);
	}

	function handleReset() {
		// Reset local state
		selectedScenario = null;

		// Reset store
		scenarioStore.reset();

		console.log('🔄 Reset to onboarding scenario');
	}

	// Get current state for debugging
	function debugState() {
		const state = scenarioStore.getCurrentState();
		console.log('🔍 Current State:', state);
		return state;
	}
</script>

<div class="scenario-manager p-6">
	<div class="mb-6 flex items-center justify-between">
		<h2 class="text-2xl font-bold">Learning Scenarios</h2>
		<button class="btn btn-outline btn-sm" onclick={debugState}> Debug State </button>
	</div>

	<!-- Pass all data through props - no direct store access -->
	<ScenarioSelector
		{scenarios}
		{selectedScenario}
		onScenarioSelect={handleScenarioSelect}
		tooltipMessage={''}
	/>

	<!-- Additional info -->
	<div class="mt-6 rounded-lg border bg-base-100 p-4">
		<h4 class="mb-2 font-medium">Current Store State</h4>
		<div class="space-y-1 text-sm">
			<p><strong>Selected ID:</strong> {scenarioStore.getScenarioId()}</p>
			<p><strong>Is Onboarding:</strong> {scenarioStore.isOnboarding() ? 'Yes' : 'No'}</p>
			<p><strong>History Count:</strong> {scenarioStore.getScenarioHistory().length}</p>
		</div>
	</div>
</div>
