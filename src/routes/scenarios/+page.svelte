<script lang="ts">
	import { scenariosData, type Scenario } from '$lib/data/scenarios';
import { getDifficultyLevel, getDifficultyTier } from '$lib/utils/cefr';
	import { goto } from '$app/navigation';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import { track } from '$lib/analytics/posthog';

const user = userManager.user;

// Top 3 featured scenarios
const TOP_SCENARIOS = [
	'beginner-confidence-bridge', // Your First Conversation
	'first-date-drinks', // Dinner & Drinks Date
	'family-dinner-introduction' // Meeting Your Partner's Parents
];
const DIFFICULTY_SEGMENTS = [1, 2, 3] as const;

	// Filter to only show public scenarios
	const publicScenarios = scenariosData.filter(
		(scenario) => scenario.visibility === 'public' && scenario.isActive
	);

	// Separate featured and other scenarios
	const featuredScenarios = publicScenarios
		.filter((scenario) => TOP_SCENARIOS.includes(scenario.id))
		.sort((a, b) => TOP_SCENARIOS.indexOf(a.id) - TOP_SCENARIOS.indexOf(b.id));

	const otherScenarios = publicScenarios.filter((scenario) => !TOP_SCENARIOS.includes(scenario.id));

	let searchQuery = $state('');

	// Filtered scenarios based on search
	const filteredScenarios = $derived.by(() => {
		if (!searchQuery.trim()) {
			return { featured: featuredScenarios, other: otherScenarios };
		}

		const query = searchQuery.toLowerCase();
		const allMatches = publicScenarios.filter(
			(scenario) =>
				scenario.title.toLowerCase().includes(query) ||
				scenario.description?.toLowerCase().includes(query) ||
				scenario.learningGoal?.toLowerCase().includes(query) ||
				scenario.role.toLowerCase().includes(query)
		);

		return {
			featured: allMatches.filter((s) => TOP_SCENARIOS.includes(s.id)),
			other: allMatches.filter((s) => !TOP_SCENARIOS.includes(s.id))
		};
	});

	const roleIcons: Record<string, string> = {
		tutor: 'icon-[mdi--school]',
		character: 'icon-[mdi--account-group]',
		friendly_chat: 'icon-[mdi--heart-multiple]',
		expert: 'icon-[mdi--brain]'
	};

	const roleDisplayNames: Record<string, string> = {
		tutor: 'Guided Practice',
		character: 'Roleplay',
		friendly_chat: 'Casual Chat',
		expert: 'Expert Advice'
	};

	function getScenarioMeta(scenario: Scenario) {
		const rating = scenario.difficultyRating ?? 1;
		return getDifficultyLevel(rating);
	}

	function handleScenarioClick(scenario: Scenario) {
		// Set the scenario in the store
		scenarioStore.setScenarioById(scenario.id);

		// Track the click
		track('scenario_selected_from_browse', {
			scenario_id: scenario.id,
			scenario_title: scenario.title,
			source: 'scenarios_page'
		});

		// Navigate to conversation page
		goto('/conversation');
	}
</script>

<svelte:head>
	<title>Practice Scenarios - Flight Simulator for the Heart | Kaiwa</title>
	<meta
		name="description"
		content="Explore all conversation scenarios on Kaiwa. From building confidence to high-stakes family dinners, practice the conversations that matter most."
	/>
</svelte:head>

<div class="min-h-screen bg-base-100">
	<!-- Header -->
	<section class="border-b border-base-content/10 bg-base-200/30">
		<div class="container mx-auto max-w-6xl px-6 py-16">
			<div class="text-center">
				<h1 class="mb-4 text-4xl font-light tracking-tight md:text-5xl">Practice Scenarios</h1>

				<!-- Search bar -->
				<div class="mx-auto max-w-md">
					<div class="relative">
						<span
							class="pointer-events-none absolute top-1/2 left-4 icon-[mdi--magnify] h-5 w-5 -translate-y-1/2 opacity-50"
						></span>
						<input
							type="text"
							placeholder="Search scenarios..."
							class="input-bordered input w-full pr-4 pl-12"
							bind:value={searchQuery}
						/>
						{#if searchQuery}
							<button
								class="btn absolute top-1/2 right-2 -translate-y-1/2 btn-ghost btn-sm"
								onclick={() => (searchQuery = '')}
							>
								<span class="icon-[mdi--close] h-4 w-4"></span>
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Main content -->
	<section class="container mx-auto max-w-6xl px-6 py-12">
		<!-- Featured Scenarios -->
		{#if filteredScenarios.featured.length > 0}
			<div class="mb-16">
				<div class="mb-6 flex items-center gap-3">
					<h2 class="text-2xl font-light">Featured Scenarios</h2>
					<span class="badge badge-primary">Top 3</span>
				</div>
				<div class="grid gap-6 md:grid-cols-3">
					{#each filteredScenarios.featured as scenario (scenario.id)}
						{@const meta = getScenarioMeta(scenario)}
						{@const difficultyTier = getDifficultyTier(scenario.difficultyRating)}
						<button
							class="group card cursor-pointer border-2 border-base-300 bg-base-100 text-left transition-all hover:border-primary hover:shadow-lg"
							onclick={() => handleScenarioClick(scenario)}
						>
							<div class="card-body p-6">
								<!-- Icon and role -->
								<div class="mb-3 flex items-center justify-between">
									<span
										class="{roleIcons[scenario.role] ||
											'icon-[mdi--lightbulb-on-outline]'} h-8 w-8 text-primary"
									></span>
									<span class="badge badge-sm capitalize">
										{roleDisplayNames[scenario.role] || scenario.role}
									</span>
								</div>

								<!-- Title -->
								<h3 class="mb-2 card-title text-xl font-medium">{scenario.title}</h3>

								<!-- Description -->
								<p class="mb-4 line-clamp-3 text-sm opacity-70">
									{scenario.description}
								</p>

								<!-- Difficulty indicator -->
								<div class="flex flex-wrap items-center gap-2 text-xs font-medium text-base-content/80">
									<div
										class="flex items-center gap-1"
										aria-label={`${meta.label} difficulty`}
									>
										{#each DIFFICULTY_SEGMENTS as segment}
											<span
												class="h-1.5 w-5 rounded-full bg-base-200 transition-colors"
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

								<!-- CTA -->
								<div class="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
									<span>Start Practice</span>
									<span class="icon-[mdi--arrow-right] h-4 w-4"></span>
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Other Scenarios -->
		{#if filteredScenarios.other.length > 0}
			<div>
				<h2 class="mb-6 text-2xl font-light">All Scenarios</h2>
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredScenarios.other as scenario (scenario.id)}
						{@const meta = getScenarioMeta(scenario)}
						{@const difficultyTier = getDifficultyTier(scenario.difficultyRating)}
						<button
							class="group card cursor-pointer border-2 border-base-300 bg-base-100 text-left transition-all hover:border-primary hover:shadow-lg"
							onclick={() => handleScenarioClick(scenario)}
						>
							<div class="card-body p-6">
								<!-- Icon and role -->
								<div class="mb-3 flex items-center justify-between">
									<span
										class="{roleIcons[scenario.role] ||
											'icon-[mdi--lightbulb-on-outline]'} h-6 w-6 text-primary"
									></span>
									<span class="badge badge-sm capitalize">
										{roleDisplayNames[scenario.role] || scenario.role}
									</span>
								</div>

								<!-- Title -->
								<h3 class="mb-2 text-lg font-medium">{scenario.title}</h3>

								<!-- Description -->
								<p class="mb-4 line-clamp-2 text-sm opacity-70">
									{scenario.description}
								</p>

								<!-- Difficulty indicator -->
								<div class="flex flex-wrap items-center gap-2 text-xs font-medium text-base-content/80">
									<div
										class="flex items-center gap-1"
										aria-label={`${meta.label} difficulty`}
									>
										{#each DIFFICULTY_SEGMENTS as segment}
											<span
												class="h-1.5 w-5 rounded-full bg-base-200 transition-colors"
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
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- No results message -->
		{#if filteredScenarios.featured.length === 0 && filteredScenarios.other.length === 0}
			<div class="py-16 text-center">
				<span class="mb-4 icon-[mdi--magnify-close] inline-block h-16 w-16 opacity-30"></span>
				<p class="text-lg opacity-50">No scenarios found matching "{searchQuery}"</p>
				<button class="btn mt-4 btn-sm btn-primary" onclick={() => (searchQuery = '')}>
					Clear search
				</button>
			</div>
		{/if}
	</section>

	<!-- CTA Footer -->
	<section class="border-t border-base-content/10 bg-base-200/30 py-16">
		<div class="container mx-auto max-w-4xl px-6 text-center">
			<h2 class="mb-4 text-2xl font-light">Ready to practice?</h2>
			<p class="mb-6 font-light opacity-70">
				Choose a scenario and start practicing the conversations that matter most to you.
			</p>
			{#if !user || user.id === 'guest'}
				<a href="/auth" class="btn btn-lg btn-primary">Sign Up to Start</a>
			{:else}
				<a href="/conversation" class="btn btn-lg btn-primary">Go to Practice</a>
			{/if}
		</div>
	</section>
</div>
