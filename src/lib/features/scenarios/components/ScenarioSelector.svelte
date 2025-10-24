<!-- src/lib/components/ScenarioSelector.svelte -->
<script lang="ts">
	import type { ScenarioWithHints } from '$lib/data/scenarios';
	import { difficultyRatingToStars } from '$lib/utils/cefr';
	import { onMount } from 'svelte';

	// Props-based design - no direct store access
	interface Props {
		scenarios: ScenarioWithHints[];
		selectedScenario: ScenarioWithHints | null;
		onScenarioSelect: (scenario: ScenarioWithHints) => void;
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

	type ScenarioRole = 'tutor' | 'character' | 'friendly_chat' | 'expert';

	// Icons and colors by scenario role
	const roleIcons: Record<ScenarioRole, string> = {
		tutor: 'icon-[mdi--coffee]',
		character: 'icon-[mdi--account-group]',
		friendly_chat: 'icon-[mdi--heart-multiple]',
		expert: 'icon-[mdi--brain]'
	};

	const roleColors: Record<ScenarioRole, string> = {
		tutor: 'primary',
		character: 'info',
		friendly_chat: 'warning',
		expert: 'accent'
	};

	const roleDisplayNames: Record<ScenarioRole, string> = {
		tutor: 'Tutor',
		character: 'Roleplay',
		friendly_chat: 'Friendly Chat',
		expert: 'Expert'
	};

	let isOpen = $state(false);
	let componentRef: HTMLDivElement;
	let searchQuery = $state('');

	const createRange = (count: number) => Array.from({ length: Math.max(0, count) });

	// Filtered scenarios based on search query
	let filteredScenarios = $state<ScenarioWithHints[]>([]);

	$effect(() => {
		if (!searchQuery.trim()) {
			filteredScenarios = scenarios;
		} else {
			const query = searchQuery.toLowerCase();
			filteredScenarios = scenarios.filter(
				(scenario) =>
					scenario.title.toLowerCase().includes(query) ||
					scenario.description?.toLowerCase().includes(query) ||
					scenario.role.toLowerCase().includes(query)
			);
		}
	});

	// Click outside to close dropdown
	onMount(() => {
		function handleClickOutside(event: MouseEvent) {
			if (componentRef && !componentRef.contains(event.target as Node)) {
				isOpen = false;
				searchQuery = '';
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function getScenarioMeta(scenario: ScenarioWithHints) {
		const rating = scenario.difficultyRating ?? 1;
		return {
			stars: difficultyRatingToStars(rating)
		};
	}

	function selectScenario(scenario: ScenarioWithHints) {
		// Only allow onboarding scenario for guests
		if (isGuest && scenario.id !== 'onboarding-welcome') {
			return;
		}
		onScenarioSelect(scenario);
		isOpen = false;
	}
</script>

<div class="relative w-full" bind:this={componentRef}>
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
							<span
								class="{roleIcons[selectedScenario.role] ||
									'icon-[mdi--lightbulb-on-outline]'} h-5 w-5 text-{roleColors[
									selectedScenario.role
								] || 'primary'}"
							></span>
						{:else}
							<span class="icon-[mdi--lightbulb-on-outline] h-5 w-5 text-primary"></span>
						{/if}
					</span>
					<div class="flex items-center gap-2">
						<span class="text-base font-medium">{disabled ? 'Meet Your Tutor' : 'Scenario'}</span>
						{#if selectedScenario}
							<span class="badge badge-sm capitalize">
								{roleDisplayNames[selectedScenario.role] ?? selectedScenario.role}
							</span>
						{/if}
					</div>
				</div>
				<span
					class="icon-[mdi--chevron-down] h-5 w-5 transition-transform duration-200"
					class:rotate-180={isOpen}
				></span>
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
						<span
							class="{roleIcons[selectedScenario.role] ||
								'icon-[mdi--lightbulb-on-outline]'} h-5 w-5 text-{roleColors[
								selectedScenario.role
							] || 'primary'}"
						></span>
					{:else}
						<span class="icon-[mdi--lightbulb-on-outline] h-5 w-5 text-primary"></span>
					{/if}
				</span>
				<div class="flex items-center gap-2">
					{#if selectedScenario}
						<span class="max-w-xs truncate text-base font-medium">{selectedScenario.title}</span>
						<span class="badge badge-sm capitalize">
							{roleDisplayNames[selectedScenario.role] ?? selectedScenario.role}
						</span>
					{:else}
						<span class="animate-pulse text-sm opacity-50">Loading...</span>
					{/if}
				</div>
			</div>
			<span
				class="icon-[mdi--chevron-down] h-5 w-5 transition-transform duration-200"
				class:rotate-180={isOpen}
			></span>
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

			<!-- Search Input -->
			<div class="px-4 pb-3">
				<div class="relative">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search scenarios..."
						class="input-bordered input input-sm w-full pl-8"
					/>
					<span
						class="absolute top-1/2 left-3 icon-[mdi--magnify] h-4 w-4 -translate-y-1/2 text-base-content/50"
					></span>
				</div>
			</div>

			<div class="max-h-80 overflow-y-auto px-2">
				{#if filteredScenarios.length === 0}
					<div class="py-8 text-center text-base-content/60">
						<span class="mx-auto mb-2 icon-[mdi--magnify] block h-8 w-8"></span>
						<p>No scenarios found</p>
						<p class="text-sm">Try a different search term</p>
					</div>
				{:else}
					{#each filteredScenarios as scenario (scenario.id)}
						{@const isLocked = isGuest && scenario.id !== 'onboarding-welcome'}
						{@const meta = getScenarioMeta(scenario)}
						<button
							onclick={() => selectScenario(scenario)}
							class="group btn relative my-1 flex w-full items-center justify-start rounded-xl px-4 py-3 text-left btn-ghost transition-colors duration-150"
							class:bg-primary={selectedScenario?.id === scenario.id}
							class:text-primary-content={selectedScenario?.id === scenario.id}
							class:hover:bg-primary={selectedScenario?.id === scenario.id}
							class:opacity-50={isLocked}
							class:cursor-not-allowed={isLocked}
							disabled={isLocked}
						>
							<span
								class="{roleIcons[scenario.role] ||
									'icon-[mdi--lightbulb-on-outline]'} mr-3 h-5 w-5 flex-shrink-0 text-{roleColors[
									scenario.role
								] || 'primary'}"
							></span> <span class="flex-1 truncate text-sm font-medium">{scenario.title}</span>
							<span class="ml-3 flex flex-shrink-0 items-center gap-0.5 text-amber-300">
								{#each createRange(meta.stars) as _, i (i)}
									<span class="icon-[mdi--star] h-3.5 w-3.5"></span>
								{/each}
							</span>
							{#if isLocked}
								<span class="ml-2 icon-[mdi--lock] h-4 w-4 text-base-content/40"></span>
							{/if}

							{#if selectedScenario?.id === scenario.id}
								<span class="absolute top-3 right-3 icon-[mdi--check] h-5 w-5"></span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
