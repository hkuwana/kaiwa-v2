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
	}: Props = $props();

	// Icons and colors by scenario category (onboarding | comfort | basic | intermediate | relationships)
	const categoryIcons: Record<
		'onboarding' | 'comfort' | 'basic' | 'intermediate' | 'relationships',
		string
	> = {
		onboarding: 'icon-[mdi--coffee]',
		comfort: 'icon-[mdi--city]',
		basic: 'icon-[mdi--book-open]',
		intermediate: 'icon-[mdi--compass]',
		relationships: 'icon-[mdi--heart-multiple]'
	};

	const categoryColors: Record<
		'onboarding' | 'comfort' | 'basic' | 'intermediate' | 'relationships',
		string
	> = {
		onboarding: 'primary',
		comfort: 'secondary',
		basic: 'accent',
		intermediate: 'success',
		relationships: 'warning'
	};

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
				class="group btn flex w-full items-center justify-center border-2 px-6 py-4 text-base-content transition-all duration-200 btn-outline btn-lg hover:border-primary hover:bg-primary hover:text-primary-content"
				class:opacity-50={disabled}
				class:cursor-not-allowed={disabled}
				onclick={() => !disabled && (isOpen = !isOpen)}
				aria-haspopup="listbox"
				aria-expanded={isOpen}
				{disabled}
			>
				<div class="flex w-full items-center justify-center gap-3 text-center">
					<span class="h-5 w-5">
						{#if disabled}
							<span class="icon-[mdi--lock] h-5 w-5 text-base-content/60"></span>
						{:else if selectedScenario}
							<span class="{categoryIcons[selectedScenario.category] || 'icon-[mdi--target]'} h-5 w-5 text-{categoryColors[selectedScenario.category] || 'primary'}"></span>
						{:else}
							<span class="icon-[mdi--target] h-5 w-5 text-primary"></span>
						{/if}
					</span>
					<div class="flex flex-col items-center">
						<span class="text-base font-medium"
							>{disabled ? 'Scenario - Onboarding' : 'Scenario'}</span
						>
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
			class="group btn flex w-full items-center justify-center border-2 px-6 py-4 text-base-content transition-all duration-200 btn-outline btn-lg hover:border-primary hover:bg-primary hover:text-primary-content"
			class:opacity-50={disabled}
			class:cursor-not-allowed={disabled}
			onclick={() => !disabled && (isOpen = !isOpen)}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
			{disabled}
		>
			<div class="flex w-full items-center justify-center gap-3 text-center">
				<span class="h-5 w-5">
					{#if selectedScenario}
						<span class="{categoryIcons[selectedScenario.category] || 'icon-[mdi--target]'} h-5 w-5 text-{categoryColors[selectedScenario.category] || 'primary'}"></span>
					{:else}
						<span class="icon-[mdi--target] h-5 w-5 text-primary"></span>
					{/if}
				</span>
				<div class="flex flex-col items-center">
					<span class="text-base font-medium"
						>Scenario – {selectedScenario
							? selectedScenario?.category.slice(0, 1).toLocaleUpperCase() +
								selectedScenario?.category.slice(1)
							: ''}</span
					>
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
			<div class="mb-3 px-4 text-center">
				<h3 class="mb-2 text-sm font-semibold text-base-content/70">Choose Learning Scenario</h3>
			</div>
			<div class="max-h-80 overflow-y-auto px-2">
				{#each scenarios as scenario (scenario.id)}
					{@const isLocked = isGuest && scenario.category !== 'onboarding'}
					<button
						onclick={() => selectScenario(scenario)}
						class="group btn relative my-1 flex w-full flex-col items-center justify-center rounded-xl px-4 py-4 text-center btn-ghost transition-colors duration-150"
						class:bg-primary={selectedScenario?.id === scenario.id}
						class:text-primary-content={selectedScenario?.id === scenario.id}
						class:hover:bg-primary={selectedScenario?.id === scenario.id}
						class:opacity-50={isLocked}
						class:cursor-not-allowed={isLocked}
						disabled={isLocked}
					>
						<div class="flex items-center gap-2">
							<span class="{categoryIcons[scenario.category] || 'icon-[mdi--target]'} h-5 w-5 text-{categoryColors[scenario.category] || 'primary'}"></span>
							<span class="font-medium">{scenario.title}</span>
							{#if isLocked}
								<span class="icon-[mdi--lock] h-4 w-4 text-base-content/40"></span>
							{/if}
						</div>

						{#if selectedScenario?.id === scenario.id}
							<svg
								class="absolute top-3 right-3 h-5 w-5"
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
