<!-- src/lib/components/ScenarioStartButton.svelte -->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import type { Scenario } from '$lib/server/db/types';

	// Props-based design - no direct store access
	interface Props {
		onScenarioStart?: (scenario: Scenario) => void;
		forceOnboarding?: boolean; // Force onboarding for guests
	}

	const { onScenarioStart, forceOnboarding = false }: Props = $props();

	// Get current scenario from store
	const currentScenario = scenarioStore.getSelectedScenario();
	const user = userManager.user;

	// Determine if user is a guest
	const isGuest = user.id === 'guest';

	// Available scenarios
	const scenarios = [
		{
			id: 'onboarding-welcome',
			title: '🎯 Onboarding',
			description: 'Get started with guided learning'
		},
		{
			id: 'business-meeting',
			title: '💼 Business Meeting',
			description: 'Practice professional conversations'
		},
		{ id: 'travel-conversation', title: '✈️ Travel', description: 'Learn travel-related phrases' },
		{ id: 'restaurant-ordering', title: '🍽️ Restaurant', description: 'Order food and drinks' },
		{ id: 'shopping-dialogue', title: '🛍️ Shopping', description: 'Shop and negotiate prices' }
	];

	// Get available scenarios based on user status
	const availableScenarios = $derived(
		forceOnboarding || isGuest ? scenarios.filter((s) => s.id === 'onboarding-welcome') : scenarios
	);

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
		// If forcing onboarding or user is guest, only allow onboarding
		if (forceOnboarding || isGuest) {
			scenarioStore.setScenarioById('onboarding-welcome');
			console.log('🎯 Scenario locked to onboarding for guest');
			return;
		}

		scenarioStore.setScenarioById(scenarioId);
		console.log('🎯 Scenario selected:', scenarioId);
	}

	function handleLoginRedirect() {
		goto('/auth');
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
		<label class="label">
			<span class="label-text font-medium">Choose Scenario</span>
		</label>
		<select
			class="select-bordered select w-full"
			onchange={(e) => selectScenario(e.target.value)}
			value={currentScenario?.id || 'onboarding-welcome'}
		>
			{#each scenarios as scenario (scenario.id)}
				<option
					value={scenario.id}
					disabled={forceOnboarding || (isGuest && scenario.id !== 'onboarding-welcome')}
				>
					{scenario.title} - {scenario.description}
				</option>
			{/each}
		</select>

		<!-- Show locked scenarios with hover tooltips -->
		{#if forceOnboarding || isGuest}
			<div class="mt-2">
				<p class="mb-2 text-xs text-base-content/60">Available scenarios:</p>
				<div class="flex flex-wrap gap-2">
					{#each scenarios as scenario (scenario.id)}
						<div class="group relative">
							<button class="btn cursor-not-allowed opacity-50 btn-outline btn-sm" disabled>
								{scenario.title}
							</button>
							{#if scenario.id !== 'onboarding-welcome'}
								<!-- Tooltip -->
								<div
									class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
								>
									Sign up to access scenarios
									<div
										class="absolute top-full left-1/2 -translate-x-1/2 transform border-4 border-transparent border-t-gray-900"
									></div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
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
