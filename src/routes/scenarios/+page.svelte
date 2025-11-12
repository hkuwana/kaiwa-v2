<script lang="ts">
	import { scenariosData, type Scenario } from '$lib/data/scenarios';
	import { getDifficultyLevel } from '$lib/utils/cefr';
	import { goto } from '$app/navigation';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import { track } from '$lib/analytics/posthog';

	const user = userManager.user;

	// Top 3 featured scenarios
	const TOP_SCENARIOS = [
		'beginner-confidence-bridge', // Zero to Hero
		'first-date-drinks', // First Date Drinks
		'family-dinner-introduction' // Partner's Parents Dinner
	];

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
				<p class="mx-auto mb-8 max-w-2xl text-lg font-light opacity-70">
					A flight simulator for the conversations your heart needs to have. Practice difficult
					conversations in a safe, judgment-free space.
				</p>

				<!-- Search bar -->
				<div class="mx-auto max-w-md">
					<div class="relative">
						<span
							class="icon-[mdi--magnify] pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-50"
						></span>
						<input
							type="text"
							placeholder="Search scenarios..."
							class="input input-bordered w-full pl-12 pr-4"
							bind:value={searchQuery}
						/>
						{#if searchQuery}
							<button
								class="btn btn-ghost btn-sm absolute right-2 top-1/2 -translate-y-1/2"
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
						<button
							class="card group cursor-pointer border-2 border-base-300 bg-base-100 text-left transition-all hover:border-primary hover:shadow-lg"
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
								<h3 class="card-title mb-2 text-xl font-medium">{scenario.title}</h3>

								<!-- Description -->
								<p class="mb-4 line-clamp-3 text-sm opacity-70">
									{scenario.description}
								</p>

								<!-- Difficulty badge -->
								<div class="flex items-center gap-2">
									<span class="badge badge-{meta.color} badge-sm">
										{meta.label}
									</span>
									{#if scenario.cefrLevel}
										<span class="badge badge-outline badge-sm">{scenario.cefrLevel}</span>
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
						<button
							class="card group cursor-pointer border-2 border-base-300 bg-base-100 text-left transition-all hover:border-primary hover:shadow-lg"
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

								<!-- Difficulty badge -->
								<div class="flex items-center gap-2">
									<span class="badge badge-{meta.color} badge-sm">
										{meta.label}
									</span>
									{#if scenario.cefrLevel}
										<span class="badge badge-outline badge-sm">{scenario.cefrLevel}</span>
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
				<span class="icon-[mdi--magnify-close] mb-4 inline-block h-16 w-16 opacity-30"></span>
				<p class="text-lg opacity-50">No scenarios found matching "{searchQuery}"</p>
				<button class="btn btn-primary btn-sm mt-4" onclick={() => (searchQuery = '')}>
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
				<a href="/auth" class="btn btn-primary btn-lg">Sign Up to Start</a>
			{:else}
				<a href="/conversation" class="btn btn-primary btn-lg">Go to Practice</a>
			{/if}
		</div>
	</section>
</div>
