<!-- src/lib/components/ScenarioSelector.svelte -->
<script lang="ts">
	import type { Scenario } from '$lib/server/db/types';

	// Props-based design - no direct store access
	interface Props {
		scenarios: Scenario[];
		selectedScenario: Scenario | null;
		onScenarioSelect: (scenario: Scenario) => void;
		disabled?: boolean;
		tooltipMessage?: string;
		isGuest?: boolean;
	}

	const {
		scenarios,
		selectedScenario,
		onScenarioSelect,
		disabled = false,
		tooltipMessage,
		isGuest = false
	} = $props();

	let isOpen = $state(false);

	function selectScenario(scenario: Scenario) {
		// Only allow onboarding scenario for guests
		if (isGuest && scenario.category !== 'onboarding') {
			return;
		}
		onScenarioSelect(scenario);
		isOpen = false;
	}
</script>

<div class="relative w-full">
	<!-- Scenario selector button -->
	{#if disabled && tooltipMessage}
		<div class="tooltip tooltip-top w-full" data-tip={tooltipMessage}>
			<button
				class="group btn flex w-full items-center justify-between border-2 px-6 py-4 text-base-content transition-all duration-200 btn-outline btn-lg hover:border-primary hover:bg-primary hover:text-primary-content"
				class:opacity-50={disabled}
				class:cursor-not-allowed={disabled}
				onclick={() => !disabled && (isOpen = !isOpen)}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				{disabled}
			>
				<div class="flex items-center gap-3">
					<span class="text-lg">🎯</span>
					<div class="flex flex-col items-start">
						<span class="text-base font-medium">Scenario</span>
						{#if selectedScenario}
							<span class="text-sm opacity-70">{selectedScenario.title}</span>
						{:else}
							<span class="animate-pulse text-sm opacity-50">Loading...</span>
						{/if}
					</div>
				</div>
				<svg
					class="h-5 w-5 transition-transform duration-200"
					class:rotate-180={isOpen}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>
		</div>
	{:else}
		<button
			class="group btn flex w-full items-center justify-between border-2 px-6 py-4 text-base-content transition-all duration-200 btn-outline btn-lg hover:border-primary hover:bg-primary hover:text-primary-content"
			class:opacity-50={disabled}
			class:cursor-not-allowed={disabled}
			onclick={() => !disabled && (isOpen = !isOpen)}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
			{disabled}
		>
			<div class="flex items-center gap-3">
				<span class="text-lg">🎯</span>
				<div class="flex flex-col items-start">
					<span class="text-base font-medium">Scenario</span>
					{#if selectedScenario}
						<span class="text-sm opacity-70">{selectedScenario.title}</span>
					{:else}
						<span class="animate-pulse text-sm opacity-50">Loading...</span>
					{/if}
				</div>
			</div>
			<svg
				class="h-5 w-5 transition-transform duration-200"
				class:rotate-180={isOpen}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>
	{/if}

	<!-- Scenario dropdown -->
	{#if isOpen}
		<div
			class="absolute top-full left-1/2 z-50 mt-3 w-96 -translate-x-1/2 transform rounded-2xl border border-base-200 bg-base-100 py-4 shadow-2xl backdrop-blur-md"
		>
			<div class="mb-3 px-4">
				<h3 class="mb-2 text-sm font-semibold text-base-content/70">🎯 Choose Learning Scenario</h3>
			</div>
			<div class="max-h-80 overflow-y-auto px-2">
				{#each scenarios as scenario (scenario.id)}
					{@const isLocked = isGuest && scenario.category !== 'onboarding'}
					<button
						onclick={() => selectScenario(scenario)}
						class="group btn my-1 flex w-full items-start justify-between rounded-xl px-4 py-3 text-left btn-ghost transition-colors duration-150"
						class:bg-primary={selectedScenario?.id === scenario.id}
						class:text-primary-content={selectedScenario?.id === scenario.id}
						class:hover:bg-primary={selectedScenario?.id === scenario.id}
						class:opacity-50={isLocked}
						class:cursor-not-allowed={isLocked}
						disabled={isLocked}
					>
						<div class="flex items-center gap-2">
							<span class="font-medium">{scenario.title}</span>
							{#if isLocked}
								<span class="text-xs opacity-60">🔒</span>
							{/if}
						</div>

						{#if selectedScenario?.id === scenario.id}
							<svg
								class="mt-1 h-5 w-5 flex-shrink-0"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
