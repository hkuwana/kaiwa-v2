<!-- src/lib/components/ScenarioStartButton.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import type { Scenario } from '$lib/server/db/types';

	// Props-based design - no direct store access
	interface Props {
		onScenarioStart?: (scenario: Scenario) => void;
	}

	const { onScenarioStart }: Props = $props();

	// Get current scenario from store
	const currentScenario = scenarioStore.getSelectedScenario();

	function startScenario() {
		// If no scenario is selected, default to onboarding
		if (!currentScenario) {
			scenarioStore.setScenarioById('onboarding-welcome');
		}

		// Call the callback if provided
		if (onScenarioStart) {
			onScenarioStart(currentScenario || scenarioStore.getSelectedScenario()!);
		}

		// Navigate to conversation with scenario
		const scenarioId = scenarioStore.getScenarioId();
		goto(`/conversation?scenario=${scenarioId}`);
	}

	function selectScenario(scenarioId: string) {
		scenarioStore.setScenarioById(scenarioId);
		console.log('🎯 Scenario selected:', scenarioId);
	}
</script>

<div class="scenario-start-section">
	<div class="mb-4">
		<h3 class="mb-2 text-lg font-medium">Ready to Practice?</h3>
		<p class="text-sm opacity-70">
			{currentScenario
				? `Selected: ${currentScenario.title}`
				: 'Choose a learning scenario to begin'}
		</p>
	</div>

	<div class="flex gap-3">
		<!-- Quick scenario selection -->
		<button class="btn btn-outline btn-sm" onclick={() => selectScenario('onboarding-welcome')}>
			🎯 Onboarding
		</button>

		<button class="btn btn-outline btn-sm" onclick={() => selectScenario('business-meeting')}>
			💼 Business
		</button>

		<button class="btn btn-outline btn-sm" onclick={() => selectScenario('travel-conversation')}>
			✈️ Travel
		</button>
	</div>

	<!-- Start button -->
	<button class="btn mt-4 w-full btn-lg btn-primary" onclick={startScenario}>
		🚀 Start Learning
	</button>
</div>
