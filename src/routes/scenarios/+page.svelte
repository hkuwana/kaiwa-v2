<script lang="ts">
	import { scenariosData, type Scenario } from '$lib/data/scenarios';
	import { getDifficultyLevel, getDifficultyTier } from '$lib/utils/cefr';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { tryScenarioNow } from '$lib/services/scenarios/scenario-interaction.service';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import { notificationStore } from '$lib/stores/notification.store.svelte';
	import ScenarioCreatorModal from '$lib/features/scenarios/components/ScenarioCreatorModal.svelte';

	const { data } = $props();
	const user = userManager.user;
	const isGuest = user.id === 'guest';

	// State
	let searchQuery = $state('');
	let isCreatorOpen = $state(false);
	let savedScenarioIds = $state<Set<string>>(new Set(data.savedScenarioIds || []));
	let selectedScenario = $state<Scenario | null>(null); // For modal overlay
	let isLoading = $state(true);

	// Simulate initial load completion
	$effect(() => {
		if (data) {
			isLoading = false;
		}
	});

	const DIFFICULTY_SEGMENTS = [1, 2, 3] as const;
	const SKELETON_COUNT = 6; // Number of skeleton loaders to show

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

	// Placeholder image function - generates a nice gradient based on scenario role
	function getPlaceholderImage(scenario: Scenario): string {
		const gradients: Record<string, string> = {
			tutor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			character: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
			friendly_chat: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
			expert: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
		};
		return gradients[scenario.role] || gradients.tutor;
	}

	function getScenarioMeta(scenario: Scenario) {
		const rating = scenario.difficultyRating ?? 1;
		return getDifficultyLevel(rating);
	}

	// Delegate all logic to service - keep component dumb
	function handleTryScenario(scenario: Scenario) {
		tryScenarioNow(scenario, scenarioStore);
	}

	function isUserOwned(scenario: Scenario) {
		return scenario.createdByUserId === user.id;
	}

	function openScenarioDetails(scenario: Scenario) {
		selectedScenario = scenario;
	}

	function closeScenarioDetails() {
		selectedScenario = null;
	}

	async function toggleFavorite(scenarioId: string, event?: Event) {
		// Prevent card click when clicking favorite button
		event?.stopPropagation();

		if (isGuest) {
			// Redirect to auth
			window.location.href = '/auth?from=scenarios&message=Sign in to favorite scenarios';
			return;
		}

		const isSaved = savedScenarioIds.has(scenarioId);

		// Optimistic update - update UI immediately
		if (isSaved) {
			savedScenarioIds.delete(scenarioId);
		} else {
			savedScenarioIds.add(scenarioId);
		}
		savedScenarioIds = new Set(savedScenarioIds);

		// Save in background
		try {
			const method = isSaved ? 'DELETE' : 'POST';

			const response = await fetch(`/api/scenarios/${scenarioId}/save`, {
				method
			});

			if (response.ok) {
				// Show success toast
				notificationStore.success(isSaved ? 'Removed from favorites' : 'Added to favorites');
			} else {
				// Revert on error
				if (isSaved) {
					savedScenarioIds.add(scenarioId);
				} else {
					savedScenarioIds.delete(scenarioId);
				}
				savedScenarioIds = new Set(savedScenarioIds);
				notificationStore.error('Failed to update favorites. Please try again.');
			}
		} catch (error) {
			console.error('Error toggling favorite:', error);
			// Revert on error
			if (isSaved) {
				savedScenarioIds.add(scenarioId);
			} else {
				savedScenarioIds.delete(scenarioId);
			}
			savedScenarioIds = new Set(savedScenarioIds);
			notificationStore.error('Failed to update favorites. Please try again.');
		}
	}

	async function shareScenario(scenario: Scenario, event?: Event) {
		// Prevent card click when clicking share button
		event?.stopPropagation();

		const shareUrl = scenario.shareSlug
			? `${window.location.origin}/s/${scenario.shareSlug}`
			: `${window.location.origin}/s/${scenario.id}`;

		try {
			await navigator.clipboard.writeText(shareUrl);
			notificationStore.success('Link copied to clipboard!');
		} catch (error) {
			console.error('Error copying link:', error);
			// Fallback for older browsers
			try {
				const textArea = document.createElement('textarea');
				textArea.value = shareUrl;
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand('copy');
				document.body.removeChild(textArea);
				notificationStore.success('Link copied to clipboard!');
			} catch (fallbackError) {
				notificationStore.error('Failed to copy link. Please copy manually.');
			}
		}
	}

	function handleEdit(scenario: Scenario, event?: Event) {
		event?.stopPropagation();
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
				<h1 class="mb-3 text-4xl font-light tracking-tight md:text-5xl">Practice Scenarios</h1>
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
							class="input-bordered input w-full rounded-full pr-4 pl-12 shadow-sm transition-all focus:shadow-md"
							bind:value={searchQuery}
						/>
						{#if searchQuery}
							<button
								class="btn absolute top-1/2 right-2 btn-circle -translate-y-1/2 btn-ghost btn-sm"
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
							class="btn gap-2 shadow-md btn-primary hover:shadow-lg"
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
						<div
							role="button"
							tabindex="0"
							class="group card cursor-pointer overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-lg"
							onclick={() => openScenarioDetails(scenario)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									openScenarioDetails(scenario);
								}
							}}
						>
							<!-- Thumbnail image -->
							<figure class="relative h-40 overflow-hidden bg-base-200">
								<enhanced:img
									src={scenario.thumbnailUrl}
									alt={scenario.title}
									class="h-full w-full object-cover transition-transform group-hover:scale-105"
									sizes="(min-width: 1024px) 300px, (min-width: 768px) 250px, 100vw"
								/>
								<!-- Favorite badge overlay -->
								<div class="absolute top-3 right-3">
									<button
										class="btn btn-circle border-none bg-base-100/90 shadow-md backdrop-blur-sm transition-transform btn-sm hover:scale-110 hover:bg-base-100"
										onclick={(e) => toggleFavorite(scenario.id, e)}
										aria-label="Unfavorite scenario"
									>
										<span class="icon-[mdi--heart] h-5 w-5 text-error"></span>
									</button>
								</div>
							</figure>

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

								<!-- Learning Goal (replaced description) -->
								<p class="mb-4 line-clamp-2 text-sm text-base-content/70">
									{scenario.learningGoal || scenario.description || ''}
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
										class="btn flex-1 gap-1 shadow-sm btn-sm btn-primary"
										onclick={(e) => handleTryScenario(scenario)}
									>
										<span class="icon-[mdi--play] h-4 w-4"></span>
										<span>Start</span>
									</button>
									<button
										class="btn btn-square btn-ghost btn-sm"
										onclick={(e) => shareScenario(scenario, e)}
										aria-label="Share scenario"
									>
										<span class="icon-[mdi--share-variant] h-4 w-4"></span>
									</button>
									{#if userOwned}
										<button
											class="btn btn-square btn-ghost btn-sm"
											onclick={(e) => handleEdit(scenario, e)}
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
		{#if isLoading}
			<!-- Skeleton Loading State -->
			<div>
				<div class="mb-6 flex items-center gap-3">
					<div class="h-8 w-48 skeleton"></div>
					<div class="h-6 w-12 skeleton"></div>
				</div>
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each Array(SKELETON_COUNT) as _, i (i)}
						<div
							class="card overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-sm"
						>
							<!-- Skeleton image -->
							<div class="h-40 w-full skeleton bg-base-300"></div>

							<div class="card-body p-6">
								<!-- Skeleton role badge -->
								<div class="mb-3 flex items-center justify-between">
									<div class="h-5 w-5 skeleton"></div>
									<div class="h-5 w-20 skeleton"></div>
								</div>

								<!-- Skeleton title -->
								<div class="mb-2 space-y-2">
									<div class="h-5 w-full skeleton"></div>
									<div class="h-5 w-3/4 skeleton"></div>
								</div>

								<!-- Skeleton description -->
								<div class="mb-4 space-y-2">
									<div class="h-4 w-full skeleton"></div>
									<div class="h-4 w-5/6 skeleton"></div>
								</div>

								<!-- Skeleton difficulty -->
								<div class="mb-4 flex gap-2">
									<div class="h-1.5 w-5 skeleton"></div>
									<div class="h-1.5 w-5 skeleton"></div>
									<div class="h-1.5 w-5 skeleton"></div>
									<div class="h-4 w-12 skeleton"></div>
								</div>

								<!-- Skeleton buttons -->
								<div class="flex gap-2">
									<div class="h-8 flex-1 skeleton"></div>
									<div class="h-8 w-8 skeleton"></div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else if filteredScenarios.length > 0}
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
						<div
							role="button"
							tabindex="0"
							class="group card cursor-pointer overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 text-left shadow-sm transition-all hover:border-primary/30 hover:shadow-lg"
							onclick={() => openScenarioDetails(scenario)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									openScenarioDetails(scenario);
								}
							}}
						>
							<!-- Thumbnail image -->
							<figure class="relative h-40 overflow-hidden bg-base-200">
								<enhanced:img
									src={scenario.thumbnailUrl}
									alt={scenario.title}
									class="h-full w-full object-cover transition-transform group-hover:scale-105"
									sizes="(min-width: 1024px) 300px, (min-width: 768px) 250px, 100vw"
								/>
								<!-- Favorite button overlay -->
								{#if !isGuest}
									<div class="absolute top-3 right-3">
										<button
											class="btn btn-circle border-none bg-base-100/90 shadow-md backdrop-blur-sm transition-transform btn-sm hover:scale-110 hover:bg-base-100"
											onclick={(e) => toggleFavorite(scenario.id, e)}
											aria-label={isFavorited ? 'Unfavorite scenario' : 'Favorite scenario'}
										>
											{#if isFavorited}
												<span class="icon-[mdi--heart] h-5 w-5 text-error"></span>
											{:else}
												<span class="icon-[mdi--heart-outline] h-5 w-5"></span>
											{/if}
										</button>
									</div>
								{/if}
							</figure>

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

								<!-- Learning Goal (replaced description) -->
								<p class="mb-4 line-clamp-2 text-sm text-base-content/70">
									{scenario.learningGoal || scenario.description || ''}
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
										class="btn flex-1 gap-1 shadow-sm btn-sm btn-primary"
										onclick={(e) => handleTryScenario(scenario)}
									>
										<span class="icon-[mdi--play] h-4 w-4"></span>
										<span>Start</span>
									</button>
									<button
										class="btn btn-square btn-ghost btn-sm"
										onclick={(e) => shareScenario(scenario, e)}
										aria-label="Share scenario"
									>
										<span class="icon-[mdi--share-variant] h-4 w-4"></span>
									</button>
									{#if userOwned}
										<button
											class="btn btn-square btn-ghost btn-sm"
											onclick={(e) => handleEdit(scenario, e)}
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
					{searchQuery ? `No scenarios found matching "${searchQuery}"` : 'No scenarios available'}
				</p>
				{#if searchQuery}
					<button class="btn mt-4 btn-sm btn-primary" onclick={() => (searchQuery = '')}>
						Clear search
					</button>
				{/if}
			</div>
		{/if}
	</section>

	<!-- CTA Footer -->
	<section
		class="border-t border-base-content/10 bg-gradient-to-b from-base-100 to-base-200/30 py-16"
	>
		<div class="container mx-auto max-w-4xl px-6 text-center">
			<h2 class="mb-4 text-2xl font-light">Create your own scenario</h2>
			<p class="mb-6 font-light text-base-content/70">
				Practice the exact moments that matter to you. AI-assisted and personalized.
			</p>
			{#if isGuest}
				<a href="/auth?from=scenarios" class="btn shadow-md btn-lg btn-primary">
					Sign Up to Create
				</a>
			{:else}
				<button class="btn shadow-md btn-lg btn-primary" onclick={() => (isCreatorOpen = true)}>
					<span class="icon-[mdi--plus-circle] h-5 w-5"></span>
					<span>Create Scenario</span>
				</button>
			{/if}
		</div>
	</section>
</div>

<!-- Scenario Details Modal -->
{#if selectedScenario}
	{@const scenario = selectedScenario}
	{@const meta = getScenarioMeta(scenario)}
	{@const difficultyTier = getDifficultyTier(scenario.difficultyRating)}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		onclick={closeScenarioDetails}
	>
		<div
			class="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-base-100 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Close button -->
			<button
				class="btn absolute top-4 right-4 z-10 btn-circle btn-ghost btn-sm"
				onclick={closeScenarioDetails}
				aria-label="Close"
			>
				<span class="icon-[mdi--close] h-5 w-5"></span>
			</button>

			<!-- Thumbnail image -->
			<figure class="h-64 overflow-hidden bg-base-200">
				<enhanced:img
					src={scenario.thumbnailUrl}
					alt={scenario.title}
					class="h-full w-full object-cover"
					sizes="(min-width: 1024px) 400px, 100vw"
				/>
			</figure>

			<div class="p-8">
				<!-- Header -->
				<div class="mb-6">
					<div class="mb-3 flex items-center gap-3">
						<span
							class="{roleIcons[scenario.role] ||
								'icon-[mdi--lightbulb-on-outline]'} h-8 w-8 text-primary"
						></span>
						<span class="badge badge-lg capitalize">
							{roleDisplayNames[scenario.role] || scenario.role}
						</span>
					</div>
					<h2 class="mb-4 text-3xl font-light">{scenario.title}</h2>

					<!-- Metadata -->
					<div class="flex flex-wrap items-center gap-3 text-sm">
						<!-- Difficulty -->
						<div class="flex items-center gap-2">
							<div class="flex items-center gap-1">
								{#each DIFFICULTY_SEGMENTS as segment (segment)}
									<span
										class="h-1.5 w-5 rounded-full bg-base-200 transition-colors"
										class:bg-success={segment <= difficultyTier && meta.color === 'success'}
										class:bg-warning={segment <= difficultyTier && meta.color === 'warning'}
										class:bg-error={segment <= difficultyTier && meta.color === 'error'}
									></span>
								{/each}
							</div>
							<span class="font-medium text-base-content/80">{meta.label}</span>
						</div>

						{#if scenario.cefrLevel}
							<span class="text-base-content/40">·</span>
							<span
								class="rounded-full border border-base-content/20 px-3 py-1 text-xs font-semibold tracking-tight"
							>
								{scenario.cefrLevel}
							</span>
						{/if}

						{#if scenario.estimatedDurationSeconds}
							<span class="text-base-content/40">·</span>
							<div class="flex items-center gap-1.5 text-base-content/70">
								<span class="icon-[mdi--clock-outline] h-4 w-4"></span>
								<span>{Math.round(scenario.estimatedDurationSeconds / 60)} min</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- Learning Goal -->
				{#if scenario.learningGoal}
					<div class="mb-6">
						<h3 class="mb-2 flex items-center gap-2 text-lg font-medium">
							<span class="icon-[mdi--target] h-5 w-5 text-primary"></span>
							<span>Learning Goal</span>
						</h3>
						<p class="text-base-content/80">{scenario.learningGoal}</p>
					</div>
				{/if}

				<!-- Description -->
				{#if scenario.description}
					<div class="mb-6">
						<h3 class="mb-2 text-lg font-medium">About This Scenario</h3>
						<p class="text-base-content/80">{scenario.description}</p>
					</div>
				{/if}

				<!-- Learning Objectives -->
				{#if scenario.learningObjectives && scenario.learningObjectives.length > 0}
					<div class="mb-6">
						<h3 class="mb-3 text-lg font-medium">What You'll Practice</h3>
						<ul class="grid gap-2 md:grid-cols-2">
							{#each scenario.learningObjectives as objective}
								<li class="flex items-start gap-2">
									<span class="mt-0.5 icon-[mdi--check] h-5 w-5 shrink-0 text-success"></span>
									<span class="text-base-content/80 capitalize">{objective}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Actions -->
				<div class="flex gap-3">
					<button
						class="btn flex-1 gap-2 shadow-md btn-primary"
						onclick={(e) => handleTryScenario(scenario)}
					>
						<span class="icon-[mdi--play] h-5 w-5"></span>
						<span>Start Scenario</span>
					</button>
					<button class="btn gap-2 btn-ghost" onclick={(e) => shareScenario(scenario, e)}>
						<span class="icon-[mdi--share-variant] h-5 w-5"></span>
						<span>Share</span>
					</button>
					{#if !isGuest}
						<button
							class="btn btn-square btn-ghost"
							onclick={(e) => toggleFavorite(scenario.id, e)}
							aria-label={savedScenarioIds.has(scenario.id)
								? 'Unfavorite scenario'
								: 'Favorite scenario'}
						>
							{#if savedScenarioIds.has(scenario.id)}
								<span class="icon-[mdi--heart] h-6 w-6 text-error"></span>
							{:else}
								<span class="icon-[mdi--heart-outline] h-6 w-6"></span>
							{/if}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Scenario Creator Modal -->
{#if !isGuest}
	<ScenarioCreatorModal
		open={isCreatorOpen}
		onClose={() => (isCreatorOpen = false)}
		onScenarioCreated={handleScenarioCreated}
	/>
{/if}
