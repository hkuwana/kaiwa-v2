<script lang="ts">
	import { scenariosData, type Scenario } from '$lib/data/scenarios';
	import { getDifficultyLevel, getDifficultyTier } from '$lib/utils/cefr';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { tryScenarioNow } from '$lib/services/scenarios/scenario-interaction.service';
	import ScenarioCreatorModal from '$lib/features/scenarios/components/ScenarioCreatorModal.svelte';

	const { data } = $props();
	const user = userManager.user;
	const isGuest = user.id === 'guest';

	// State
	let searchQuery = $state('');
	let isCreatorOpen = $state(false);
	let savedScenarioIds = $state<Set<string>>(new Set(data.savedScenarioIds || []));
	let isSavingScenario = $state<Record<string, boolean>>({});
	let copiedScenarioId = $state<string | null>(null);

	const DIFFICULTY_SEGMENTS = [1, 2, 3] as const;

	// Combine static scenarios with user-created scenarios
	const allScenarios = $derived.by(() => {
		const publicScenarios = scenariosData.filter(
			(scenario) => scenario.visibility === 'public' && scenario.isActive
		);
		const userScenarios = (data.userCreatedScenarios || []) as Scenario[];
		return [...publicScenarios, ...userScenarios];
	});

	// Get favorite scenarios
	const favoriteScenarios = $derived.by(() => {
		if (isGuest) return [];
		return allScenarios.filter((s) => savedScenarioIds.has(s.id));
	});

	// Filtered scenarios based on search (excluding favorites to avoid duplicates)
	const filteredScenarios = $derived.by(() => {
		if (!searchQuery.trim()) {
			return allScenarios.filter((s) => !savedScenarioIds.has(s.id));
		}

		const query = searchQuery.toLowerCase();
		const matches = allScenarios.filter(
			(scenario) =>
				scenario.title.toLowerCase().includes(query) ||
				scenario.description?.toLowerCase().includes(query) ||
				scenario.learningGoal?.toLowerCase().includes(query) ||
				scenario.role.toLowerCase().includes(query)
		);

		return matches;
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

	function handleTryScenario(scenario: Scenario) {
		tryScenarioNow(scenario);
	}

	function isUserOwned(scenario: Scenario) {
		return scenario.createdByUserId === user.id;
	}

	async function toggleFavorite(scenarioId: string) {
		if (isGuest) {
			// Redirect to auth
			window.location.href = '/auth?from=scenarios&message=Sign in to favorite scenarios';
			return;
		}

		isSavingScenario[scenarioId] = true;

		try {
			const isSaved = savedScenarioIds.has(scenarioId);
			const method = isSaved ? 'DELETE' : 'POST';

			const response = await fetch(`/api/scenarios/${scenarioId}/save`, {
				method
			});

			if (response.ok) {
				if (isSaved) {
					savedScenarioIds.delete(scenarioId);
				} else {
					savedScenarioIds.add(scenarioId);
				}
				savedScenarioIds = new Set(savedScenarioIds);
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
		} finally {
			isSavingScenario[scenarioId] = false;
		}
	}

	async function shareScenario(scenario: Scenario) {
		const shareUrl = scenario.shareSlug
			? `${window.location.origin}/s/${scenario.shareSlug}`
			: `${window.location.origin}/s/${scenario.id}`;

		try {
			await navigator.clipboard.writeText(shareUrl);
			copiedScenarioId = scenario.id;
			setTimeout(() => {
				copiedScenarioId = null;
			}, 2000);
		} catch (error) {
			console.error('Error copying link:', error);
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = shareUrl;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copiedScenarioId = scenario.id;
			setTimeout(() => {
				copiedScenarioId = null;
			}, 2000);
		}
	}

	function handleEdit(scenario: Scenario) {
		// TODO: Open edit modal
		console.log('Edit scenario:', scenario.id);
	}

	function handleScenarioCreated() {
		// Refresh the page to show the new scenario
		window.location.reload();
	}
</script>

<svelte:head>
	<title>Practice Scenarios - Create & Share | Kaiwa</title>
	<meta
		name="description"
		content="Browse, create, and share conversation scenarios. Practice the moments that matter most in a safe, judgment-free space."
	/>
</svelte:head>

<div class="min-h-screen bg-base-100">
	<!-- Header -->
	<section class="border-b border-base-content/10 bg-gradient-to-b from-base-200/30 to-base-100">
		<div class="container mx-auto max-w-6xl px-6 py-16">
			<div class="text-center">
				<h1 class="mb-3 text-4xl font-light tracking-tight md:text-5xl">
					Practice Scenarios
				</h1>
				<p class="mx-auto max-w-2xl text-lg font-light text-base-content/70">
					Browse curated scenarios or create your own moments to practice
				</p>

				<!-- Search bar -->
				<div class="mx-auto mt-8 max-w-md">
					<div class="relative">
						<span
							class="pointer-events-none absolute top-1/2 left-4 icon-[mdi--magnify] h-5 w-5 -translate-y-1/2 text-base-content/50"
						></span>
						<input
							type="text"
							placeholder="Search scenarios..."
							class="input input-bordered w-full rounded-full pr-4 pl-12 shadow-sm transition-all focus:shadow-md"
							bind:value={searchQuery}
						/>
						{#if searchQuery}
							<button
								class="btn absolute top-1/2 right-2 -translate-y-1/2 btn-circle btn-ghost btn-sm"
								onclick={() => (searchQuery = '')}
							>
								<span class="icon-[mdi--close] h-4 w-4"></span>
							</button>
						{/if}
					</div>
				</div>

				<!-- Create Scenario Button -->
				{#if !isGuest}
					<div class="mt-6">
						<button
							class="btn btn-primary gap-2 shadow-md hover:shadow-lg"
							onclick={() => (isCreatorOpen = true)}
						>
							<span class="icon-[mdi--plus-circle] h-5 w-5"></span>
							<span>Create Scenario</span>
						</button>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- Main content -->
	<section class="container mx-auto max-w-6xl px-6 py-12">
		<!-- My Favorites Section -->
		{#if !isGuest && favoriteScenarios.length > 0}
			<div class="mb-16">
				<div class="mb-6 flex items-center gap-3">
					<span class="icon-[mdi--heart] h-6 w-6 text-error"></span>
					<h2 class="text-2xl font-light">My Favorites</h2>
					<span class="badge badge-primary">{favoriteScenarios.length}</span>
				</div>
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each favoriteScenarios as scenario (scenario.id)}
						{@const meta = getScenarioMeta(scenario)}
						{@const difficultyTier = getDifficultyTier(scenario.difficultyRating)}
						{@const userOwned = isUserOwned(scenario)}
						{@const isCopied = copiedScenarioId === scenario.id}
						<div
							class="group card overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-lg"
						>
							<!-- Thumbnail -->
							{#if scenario.thumbnailUrl}
								<figure class="relative h-40 overflow-hidden bg-base-200">
									<img
										src={scenario.thumbnailUrl}
										alt={scenario.title}
										class="h-full w-full object-cover transition-transform group-hover:scale-105"
									/>
									<!-- Favorite badge overlay -->
									<div class="absolute top-3 right-3">
										<button
											class="btn btn-circle btn-sm border-none bg-base-100/90 shadow-md backdrop-blur-sm transition-transform hover:scale-110 hover:bg-base-100"
											onclick={() => toggleFavorite(scenario.id)}
											disabled={isSavingScenario[scenario.id]}
											aria-label="Unfavorite scenario"
										>
											<span class="icon-[mdi--heart] h-5 w-5 text-error"></span>
										</button>
									</div>
								</figure>
							{/if}

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
								<h3 class="mb-2 line-clamp-2 text-lg font-medium">{scenario.title}</h3>

								<!-- Description -->
								<p class="mb-4 line-clamp-2 text-sm text-base-content/70">
									{scenario.description}
								</p>

								<!-- Difficulty indicator -->
								<div
									class="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-base-content/80"
								>
									<div class="flex items-center gap-1" aria-label="{meta.label} difficulty">
										{#each DIFFICULTY_SEGMENTS as segment (segment)}
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
									{#if scenario.estimatedDurationSeconds}
										<span class="text-base-content/40">·</span>
										<span class="flex items-center gap-1">
											<span class="icon-[mdi--clock-outline] h-3.5 w-3.5"></span>
											<span>{Math.round(scenario.estimatedDurationSeconds / 60)}min</span>
										</span>
									{/if}
								</div>

								<!-- Actions -->
								<div class="flex gap-2">
									<button
										class="btn btn-primary btn-sm flex-1 gap-1 shadow-sm"
										onclick={() => handleTryScenario(scenario)}
									>
										<span class="icon-[mdi--play] h-4 w-4"></span>
										<span>Start</span>
									</button>
									<button
										class="btn btn-ghost btn-sm btn-square"
										onclick={() => shareScenario(scenario)}
										aria-label="Share scenario"
									>
										{#if isCopied}
											<span class="icon-[mdi--check] h-4 w-4 text-success"></span>
										{:else}
											<span class="icon-[mdi--share-variant] h-4 w-4"></span>
										{/if}
									</button>
									{#if userOwned}
										<button
											class="btn btn-ghost btn-sm btn-square"
											onclick={() => handleEdit(scenario)}
											aria-label="Edit scenario"
										>
											<span class="icon-[mdi--pencil] h-4 w-4"></span>
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- All Scenarios -->
		{#if filteredScenarios.length > 0}
			<div>
				<div class="mb-6 flex items-center gap-3">
					<h2 class="text-2xl font-light">
						{searchQuery ? 'Search Results' : 'All Scenarios'}
					</h2>
					<span class="badge badge-ghost">{filteredScenarios.length}</span>
				</div>
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredScenarios as scenario (scenario.id)}
						{@const meta = getScenarioMeta(scenario)}
						{@const difficultyTier = getDifficultyTier(scenario.difficultyRating)}
						{@const userOwned = isUserOwned(scenario)}
						{@const isFavorited = savedScenarioIds.has(scenario.id)}
						{@const isCopied = copiedScenarioId === scenario.id}
						<div
							class="group card overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-lg"
						>
							<!-- Thumbnail -->
							{#if scenario.thumbnailUrl}
								<figure class="relative h-40 overflow-hidden bg-base-200">
									<img
										src={scenario.thumbnailUrl}
										alt={scenario.title}
										class="h-full w-full object-cover transition-transform group-hover:scale-105"
									/>
									<!-- Favorite button overlay -->
									{#if !isGuest}
										<div class="absolute top-3 right-3">
											<button
												class="btn btn-circle btn-sm border-none bg-base-100/90 shadow-md backdrop-blur-sm transition-transform hover:scale-110 hover:bg-base-100"
												onclick={() => toggleFavorite(scenario.id)}
												disabled={isSavingScenario[scenario.id]}
												aria-label={isFavorited ? 'Unfavorite scenario' : 'Favorite scenario'}
											>
												{#if isSavingScenario[scenario.id]}
													<span class="loading loading-sm loading-spinner"></span>
												{:else if isFavorited}
													<span class="icon-[mdi--heart] h-5 w-5 text-error"></span>
												{:else}
													<span class="icon-[mdi--heart-outline] h-5 w-5"></span>
												{/if}
											</button>
										</div>
									{/if}
								</figure>
							{/if}

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
								<h3 class="mb-2 line-clamp-2 text-lg font-medium">{scenario.title}</h3>

								<!-- Description -->
								<p class="mb-4 line-clamp-2 text-sm text-base-content/70">
									{scenario.description}
								</p>

								<!-- Difficulty indicator -->
								<div
									class="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-base-content/80"
								>
									<div class="flex items-center gap-1" aria-label="{meta.label} difficulty">
										{#each DIFFICULTY_SEGMENTS as segment (segment)}
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
									{#if scenario.estimatedDurationSeconds}
										<span class="text-base-content/40">·</span>
										<span class="flex items-center gap-1">
											<span class="icon-[mdi--clock-outline] h-3.5 w-3.5"></span>
											<span>{Math.round(scenario.estimatedDurationSeconds / 60)}min</span>
										</span>
									{/if}
								</div>

								<!-- Actions -->
								<div class="flex gap-2">
									<button
										class="btn btn-primary btn-sm flex-1 gap-1 shadow-sm"
										onclick={() => handleTryScenario(scenario)}
									>
										<span class="icon-[mdi--play] h-4 w-4"></span>
										<span>Start</span>
									</button>
									<button
										class="btn btn-ghost btn-sm btn-square"
										onclick={() => shareScenario(scenario)}
										aria-label="Share scenario"
									>
										{#if isCopied}
											<span class="icon-[mdi--check] h-4 w-4 text-success"></span>
										{:else}
											<span class="icon-[mdi--share-variant] h-4 w-4"></span>
										{/if}
									</button>
									{#if !isGuest && !scenario.thumbnailUrl}
										<button
											class="btn btn-ghost btn-sm btn-square"
											onclick={() => toggleFavorite(scenario.id)}
											disabled={isSavingScenario[scenario.id]}
											aria-label={isFavorited ? 'Unfavorite scenario' : 'Favorite scenario'}
										>
											{#if isSavingScenario[scenario.id]}
												<span class="loading loading-sm loading-spinner"></span>
											{:else if isFavorited}
												<span class="icon-[mdi--heart] h-5 w-5 text-error"></span>
											{:else}
												<span class="icon-[mdi--heart-outline] h-5 w-5"></span>
											{/if}
										</button>
									{/if}
									{#if userOwned}
										<button
											class="btn btn-ghost btn-sm btn-square"
											onclick={() => handleEdit(scenario)}
											aria-label="Edit scenario"
										>
											<span class="icon-[mdi--pencil] h-4 w-4"></span>
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- No results message -->
		{#if filteredScenarios.length === 0 && (!favoriteScenarios || favoriteScenarios.length === 0)}
			<div class="py-16 text-center">
				<span class="mb-4 icon-[mdi--magnify-close] inline-block h-16 w-16 text-base-content/20"
				></span>
				<p class="text-lg text-base-content/50">
					{searchQuery
						? `No scenarios found matching "${searchQuery}"`
						: 'No scenarios available'}
				</p>
				{#if searchQuery}
					<button class="btn mt-4 btn-primary btn-sm" onclick={() => (searchQuery = '')}>
						Clear search
					</button>
				{/if}
			</div>
		{/if}
	</section>

	<!-- CTA Footer -->
	<section class="border-t border-base-content/10 bg-gradient-to-b from-base-100 to-base-200/30 py-16">
		<div class="container mx-auto max-w-4xl px-6 text-center">
			<h2 class="mb-4 text-2xl font-light">Create your own scenario</h2>
			<p class="mb-6 font-light text-base-content/70">
				Practice the exact moments that matter to you. AI-assisted and personalized.
			</p>
			{#if isGuest}
				<a href="/auth?from=scenarios" class="btn btn-primary btn-lg shadow-md">
					Sign Up to Create
				</a>
			{:else}
				<button class="btn btn-primary btn-lg shadow-md" onclick={() => (isCreatorOpen = true)}>
					<span class="icon-[mdi--plus-circle] h-5 w-5"></span>
					<span>Create Scenario</span>
				</button>
			{/if}
		</div>
	</section>
</div>

<!-- Scenario Creator Modal -->
{#if !isGuest}
	<ScenarioCreatorModal
		open={isCreatorOpen}
		onClose={() => (isCreatorOpen = false)}
		onScenarioCreated={handleScenarioCreated}
	/>
{/if}
