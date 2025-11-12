<!-- src/lib/components/ScenarioSelector.svelte -->
<script lang="ts">
	import { scenariosData, type Scenario } from '$lib/data/scenarios';
	import { getDifficultyLevel } from '$lib/utils/cefr';
	import { onMount } from 'svelte';
	import ScenarioCreatorModal from './ScenarioCreatorModal.svelte';
	import {
		customScenarioStore,
		type SaveScenarioResult
	} from '$lib/stores/custom-scenarios.store.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';

	interface Props {
		scenarios: Scenario[];
		selectedScenario: Scenario;
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

	type ScenarioRole = 'tutor' | 'character' | 'friendly_chat' | 'expert';

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
	let isCreatorOpen = $state(false);
	let componentRef: HTMLDivElement;
	let searchQuery = $state('');
	let userMemories = $state<string[]>([]);

	const limits = $derived(customScenarioStore.limits);
	const limitReached = $derived(limits.totalUsed >= limits.total && limits.total > 0);
	const customScenarios = $derived(customScenarioStore.customScenarios);

	const curatedScenarios = $derived.by(() => {
		const map = new Map<string, Scenario>();
		for (const scenario of scenariosData) {
			map.set(scenario.id, scenario);
		}
		for (const scenario of scenarios) {
			map.set(scenario.id, scenario);
		}
		return Array.from(map.values());
	});

	const combinedScenarios = $derived.by(() => {
		const map = new Map<string, Scenario>();
		for (const scenario of curatedScenarios) {
			map.set(scenario.id, scenario);
		}
		for (const scenario of customScenarios) {
			map.set(scenario.id, scenario);
		}
		return Array.from(map.values());
	});

	let filteredScenarios = $state<Scenario[]>([]);

	$effect(() => {
		const source = combinedScenarios;
		if (!searchQuery.trim()) {
			filteredScenarios = source;
		} else {
			const query = searchQuery.toLowerCase();
			filteredScenarios = source.filter(
				(scenario) =>
					scenario.title.toLowerCase().includes(query) ||
					scenario.description?.toLowerCase().includes(query) ||
					scenario.role.toLowerCase().includes(query)
			);
		}
	});

	onMount(() => {
		customScenarioStore.loadScenarios().catch((error) => {
			console.warn('Unable to load custom scenarios', error);
		});

		// Load user memories for generating scenarios
		loadUserMemories();

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

	async function loadUserMemories() {
		try {
			const user = userManager.user;
			// Only load memories if user is logged in
			if (!user || user.id === 'guest') return;

			// Fetch user preferences which includes memories
			const response = await fetch(`/api/users/${user.id}/preferences`);
			if (response.ok) {
				const data = await response.json();
				const preferences = data?.success ? data?.data : data;
				if (preferences?.memories && Array.isArray(preferences.memories)) {
					userMemories = preferences.memories;
				}
			}
		} catch (error) {
			console.warn('Unable to load user memories', error);
		}
	}

	function getScenarioMeta(scenario: Scenario) {
		const rating = scenario.difficultyRating ?? 1;
		return getDifficultyLevel(rating);
	}

	function selectScenario(scenario: Scenario) {
		if (isGuest && scenario.id !== 'onboarding-welcome') {
			return;
		}

		onScenarioSelect(scenario);
		isOpen = false;
		searchQuery = '';
	}

	function openCreator() {
		isCreatorOpen = true;
		isOpen = false;
	}

	function handleScenarioCreated(result: SaveScenarioResult) {
		const scenario: Scenario = {
			...result.scenario,
			id: result.summary.id
		};
		onScenarioSelect(scenario);
		isCreatorOpen = false;
		isOpen = false;
	}
</script>

<div class="relative w-full" bind:this={componentRef}>
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
								class:text-success={selectedScenario &&
									getScenarioMeta(selectedScenario).color === 'success'}
								class:text-warning={selectedScenario &&
									getScenarioMeta(selectedScenario).color === 'warning'}
								class:text-error={selectedScenario &&
									getScenarioMeta(selectedScenario).color === 'error'}
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
		<div class="flex w-full gap-2">
			<div
				class="tooltip flex-1"
				data-tip={selectedScenario?.learningGoal || getScenarioMeta(selectedScenario).description}
			>
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
									class:text-success={selectedScenario &&
										getScenarioMeta(selectedScenario).color === 'success'}
									class:text-warning={selectedScenario &&
										getScenarioMeta(selectedScenario).color === 'warning'}
									class:text-error={selectedScenario &&
										getScenarioMeta(selectedScenario).color === 'error'}
								></span>
							{:else}
								<span class="icon-[mdi--lightbulb-on-outline] h-5 w-5 text-primary"></span>
							{/if}
						</span>
						<div class="flex items-center gap-2">
							{#if selectedScenario}
								<span class="max-w-xs truncate text-base font-medium">{selectedScenario.title}</span
								>
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
			</div>
		</div>
	{/if}

	{#if isOpen}
		<div
			class="absolute top-full left-1/2 z-50 mt-3 w-96 -translate-x-1/2 transform rounded-2xl border border-base-200 bg-base-100 py-4 shadow-2xl backdrop-blur-md"
		>
			<div class="mb-3 px-4 text-center">
				<h3 class="mb-2 text-sm font-semibold text-base-content/70">Choose Learning Scenario</h3>
				<div class="flex justify-center gap-4 text-xs text-base-content/60">
					<div class="flex items-center gap-1">
						<span class="icon-[mdi--circle] h-3 w-3 text-success"></span>
						<span>Beginner</span>
					</div>
					<div class="flex items-center gap-1">
						<span class="icon-[mdi--circle] h-3 w-3 text-warning"></span>
						<span>Intermediate</span>
					</div>
					<div class="flex items-center gap-1">
						<span class="icon-[mdi--circle] h-3 w-3 text-error"></span>
						<span>Advanced</span>
					</div>
				</div>
			</div>

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
								class:text-success={meta.color === 'success'}
								class:text-warning={meta.color === 'warning'}
								class:text-error={meta.color === 'error'}
							></span>
							<span class="flex-1 truncate text-sm font-medium">{scenario.title}</span>

							{#if isLocked}
								<span class="ml-2 icon-[mdi--lock] h-4 w-4 text-base-content/40"></span>
							{/if}

							{#if selectedScenario?.id === scenario.id}
								<span class="absolute top-3 right-3 icon-[mdi--check] h-5 w-5"></span>
							{/if}
						</button>
					{/each}
				{/if}

				<div class="my-3 px-2">
					<button
						class="btn flex w-full items-center justify-center gap-2 rounded-xl border-dashed btn-outline btn-primary"
						onclick={openCreator}
						disabled={limitReached}
					>
						<span class="icon-[mdi--plus-circle] h-5 w-5"></span>
						<span>{limitReached ? 'Upgrade to add more' : 'Create your own scenario'}</span>
					</button>
				</div>
			</div>
		</div>
	{/if}

	<ScenarioCreatorModal
		open={isCreatorOpen}
		onClose={() => (isCreatorOpen = false)}
		onScenarioCreated={handleScenarioCreated}
		{userMemories}
	/>
</div>
