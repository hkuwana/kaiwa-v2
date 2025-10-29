<!-- src/lib/components/ScenarioStartButton.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { User } from '$lib/server/db/types';
	import { scenariosData, sortScenariosByDifficulty, type Scenario } from '$lib/data/scenarios';
	import { difficultyRatingToCefr, formatCefrBadge } from '$lib/utils/cefr';
	import { resolve } from '$app/paths';

	// Props-based design - no direct store access
	interface Props {
		user: User;
		selectedScenario?: Scenario | null;
		onScenarioChange?: (scenarioId: string) => void;
		onScenarioStart?: (scenario: Scenario) => void;
		forceOnboarding?: boolean; // Force onboarding for guests
	}

	const {
		user,
		selectedScenario = null,
		onScenarioChange,
		onScenarioStart,
		forceOnboarding = false
	}: Props = $props();

	// Determine if user is a guest
	const isGuest = user.id === 'guest';

	// Available scenarios - use data from scenarios.ts
	const scenarios = sortScenariosByDifficulty(scenariosData);

	// Get available scenarios based on user status
	const availableScenarios = $derived(
		forceOnboarding || isGuest ? scenarios.filter((s) => s.id === 'onboarding-welcome') : scenarios
	);

	// Current scenario or default to onboarding
	const currentScenario = $derived(selectedScenario || scenarios[0]);

	function startScenario() {
		// If no scenario is selected, default to onboarding
		const scenarioToUse = currentScenario || scenariosData[0];

		// Call the callback if provided
		if (onScenarioStart) {
			onScenarioStart(scenarioToUse);
		}

		// Navigate to conversation with scenario
		goto(`/conversation?scenario=${scenarioToUse.id}`);
	}

	function selectScenario(scenarioId: string) {
		// If forcing onboarding or user is guest, only allow onboarding
		if (forceOnboarding || isGuest) {
			if (onScenarioChange) {
				onScenarioChange('onboarding-welcome');
			}
			console.log('🎯 Scenario locked to onboarding for guest');
			return;
		}

		// Call the parent callback to update scenario
		if (onScenarioChange) {
			onScenarioChange(scenarioId);
		}
		console.log('🎯 Scenario selected:', scenarioId);
	}

	function handleLoginRedirect() {
		goto(resolve('/auth'));
	}
</script>

<div class="scenario-start-section">
	<div class="mb-4">
		<h3 class="mb-2 text-lg font-medium">Ready to Practice?</h3>
		<p class="text-sm opacity-70">
			{#if forceOnboarding || isGuest}
				Start with our guided onboarding experience
			{:else}
				{currentScenario
					? `Selected: ${currentScenario.title}`
					: 'Choose a learning scenario to begin'}
			{/if}
		</p>
	</div>

	<!-- Scenario Selection Dropdown -->
	<div class="mb-4">
		{#if forceOnboarding || isGuest}
			<!-- Disabled select with tooltip for guests -->
			<div class="tooltip tooltip-primary" data-tip="Only logged in users can choose scenarios">
				<label class="label" for="scenario-select-disabled">
					<span class="label-text font-medium">Choose Scenario</span>
				</label>
				<select id="scenario-select-disabled" class="select-bordered select w-full" disabled>
					<option>You can't touch this</option>
				</select>
			</div>
		{:else}
			<!-- Regular select for logged in users -->
			<label class="label" for="scenario-select">
				<span class="label-text font-medium">Choose Scenario</span>
			</label>
			<select
				id="scenario-select"
				class="select-bordered select w-full"
				onchange={(e) => {
					const target = e.target as HTMLSelectElement;
					selectScenario(target.value);
				}}
				value={currentScenario?.id || 'onboarding-welcome'}
			>
				{#each availableScenarios as scenario (scenario.id)}
					<option value={scenario.id}>
						{scenario.title} ·
						{formatCefrBadge(
							scenario.cefrLevel || difficultyRatingToCefr(scenario.difficultyRating),
							{ withDescriptor: true }
						)}
					</option>
				{/each}
			</select>
		{/if}
	</div>

	<!-- Start button -->
	<button class="btn w-full btn-lg btn-primary" onclick={startScenario}> 🚀 Start Learning </button>

	<!-- Login prompt for guests -->
	{#if forceOnboarding || isGuest}
		<div class="mt-4 text-center">
			<p class="mb-2 text-sm opacity-70">Want more scenarios?</p>
			<button class="btn btn-outline btn-sm" onclick={handleLoginRedirect}>
				🔐 Sign Up / Login
			</button>
		</div>
	{/if}
</div>
