<!-- src/lib/features/scenarios/components/TopScenariosQuickPicker.svelte -->
<script lang="ts">
	import { scenariosData, type Scenario } from '$lib/data/scenarios';
import { getDifficultyLevel, getDifficultyTier } from '$lib/utils/cefr';
	import { goto } from '$app/navigation';

	interface Props {
		onScenarioSelect?: (scenario: Scenario) => void;
		onExploreMore?: () => void;
		onCreateCustom?: () => void;
		selectedScenario?: Scenario | null;
	}

	const { onScenarioSelect, onExploreMore, onCreateCustom, selectedScenario }: Props = $props();

	// Top 3 featured scenarios
	const TOP_SCENARIOS = [
		'beginner-confidence-bridge',
		'first-date-drinks',
		'family-dinner-introduction'
	];

	const topScenarios = $derived.by(() => {
		const map = new Map<string, Scenario>();
		for (const scenario of scenariosData) {
			if (scenario.visibility === 'public' && scenario.isActive) {
				map.set(scenario.id, scenario);
			}
		}
		return TOP_SCENARIOS.map((id) => map.get(id)).filter(Boolean) as Scenario[];
	});

	const roleIcons: Record<string, string> = {
		tutor: 'icon-[mdi--coffee]',
		character: 'icon-[mdi--account-group]',
		friendly_chat: 'icon-[mdi--heart-multiple]',
		expert: 'icon-[mdi--brain]'
	};

	const roleColors: Record<string, string> = {
		tutor: 'primary',
		character: 'info',
		friendly_chat: 'warning',
		expert: 'accent'
	};

const roleDisplayNames: Record<string, string> = {
	tutor: 'Guided Practice',
	character: 'Roleplay',
	friendly_chat: 'Casual Chat',
	expert: 'Expert Advice'
};
const DIFFICULTY_SEGMENTS = [1, 2, 3] as const;

	function getScenarioMeta(scenario: Scenario) {
		const rating = scenario.difficultyRating ?? 1;
		return getDifficultyLevel(rating);
	}

	function handleScenarioClick(scenario: Scenario) {
		if (onScenarioSelect) {
			onScenarioSelect(scenario);
		}
	}

	function handleExploreMore() {
		if (onExploreMore) {
			onExploreMore();
		} else {
			goto('/scenarios');
		}
	}

	function handleCreateCustom() {
		if (onCreateCustom) {
			onCreateCustom();
		}
	}
</script>

<div class="w-full space-y-6">
	<!-- Header -->
	<div class="text-center">
		<h3 class="mb-2 text-lg font-semibold">Featured Scenarios</h3>
		<p class="text-sm text-base-content/70">Start with one of our most popular learning moments</p>
	</div>

	<!-- Top 3 Scenarios Grid -->
	<div class="grid gap-4 md:grid-cols-3">
		{#each topScenarios as scenario (scenario.id)}
			{@const meta = getScenarioMeta(scenario)}
			<button
				class="group card cursor-pointer border-2 border-base-300 bg-base-100 text-left transition-all hover:border-primary hover:shadow-lg"
				class:border-primary={selectedScenario?.id === scenario.id}
				class:bg-primary/5={selectedScenario?.id === scenario.id}
				onclick={() => handleScenarioClick(scenario)}
			>
				<div class="card-body p-4">
					<!-- Icon and role -->
					<div class="mb-3 flex items-center justify-between">
						<span
							class="{roleIcons[scenario.role] ||
								'icon-[mdi--lightbulb-on-outline]'} h-6 w-6 text-{roleColors[scenario.role] || 'primary'}"
						></span>
						<span class="badge badge-sm capitalize">
							{roleDisplayNames[scenario.role] || scenario.role}
						</span>
					</div>

					<!-- Title -->
					<h4 class="mb-2 line-clamp-2 font-medium">{scenario.title}</h4>

					<!-- Description -->
					<p class="mb-3 line-clamp-2 text-xs opacity-70">
						{scenario.description}
					</p>

					{@const difficultyTier = getDifficultyTier(scenario.difficultyRating)}
					<!-- Difficulty -->
					<div class="flex flex-wrap items-center gap-2 text-xs font-medium text-base-content/80">
						<div
							class="flex items-center gap-1"
							aria-label={`${meta.label} difficulty`}
						>
							{#each DIFFICULTY_SEGMENTS as segment}
								<span
									class="h-1.5 w-4 rounded-full bg-base-200 transition-colors"
									class:bg-success={segment <= difficultyTier && meta.color === 'success'}
									class:bg-warning={segment <= difficultyTier && meta.color === 'warning'}
									class:bg-error={segment <= difficultyTier && meta.color === 'error'}
								></span>
							{/each}
						</div>
						<span>{meta.label}</span>
						{#if scenario.cefrLevel}
							<span class="text-base-content/40">·</span>
							<span
								class="rounded-full border border-base-content/20 px-2 py-0.5 text-[11px] font-semibold tracking-tight"
							>
								{scenario.cefrLevel}
							</span>
						{/if}
					</div>

					<!-- Selection indicator -->
					{#if selectedScenario?.id === scenario.id}
						<div class="mt-2 flex items-center gap-1 text-xs text-primary">
							<span class="icon-[mdi--check-circle] h-4 w-4"></span>
							<span>Selected</span>
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<!-- Action Buttons -->
	<div class="flex flex-col gap-3 sm:flex-row">
		<button
			onclick={handleExploreMore}
			class="btn btn-outline flex-1"
		>
			<span class="icon-[mdi--magnify] h-4 w-4"></span>
			Explore All Scenarios
		</button>

		<button
			onclick={handleCreateCustom}
			class="btn btn-outline flex-1"
		>
			<span class="icon-[mdi--plus-circle] h-4 w-4"></span>
			Create Custom Scenario
		</button>
	</div>
</div>
