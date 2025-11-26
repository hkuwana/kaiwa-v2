<script lang="ts">
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
	import { getDifficultyLevel, getDifficultyTier } from '$lib/utils/cefr';
	import { type Language as DataLanguage } from '$lib/data/languages';
	import type { Scenario } from '$lib/server/db/types';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';

	const { data } = $props();
	const scenario: Scenario = data.scenario;
	const user = userManager.user;

	// State for language and speaker selection
	let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);
	let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);
	let selectedAudioMode = $state<'vad' | 'ptt'>('ptt');

	const DIFFICULTY_SEGMENTS = [1, 2, 3] as const;
	const meta = getDifficultyLevel(scenario.difficultyRating ?? 1);
	const difficultyTier = getDifficultyTier(scenario.difficultyRating);

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

	function handleSpeakerChange(speakerId: string) {
		selectedSpeaker = speakerId;
		settingsStore.setSpeaker(speakerId);
	}
</script>

<svelte:head>
	<title>{scenario.title} - Practice Scenario | Kaiwa</title>
	<meta
		name="description"
		content={scenario.description ||
			`Practice ${scenario.title} with Kaiwa's AI conversation partner`}
	/>
	<meta property="og:title" content={`${scenario.title} - Kaiwa`} />
	<meta
		property="og:description"
		content={scenario.description ||
			`Practice ${scenario.title} with Kaiwa's AI conversation partner`}
	/>
	{#if scenario.thumbnailUrl}
		<meta property="og:image" content={scenario.thumbnailUrl} />
	{/if}
</svelte:head>

<div class="min-h-screen bg-base-100">
	<!-- Hero Section -->
	<section class="border-b border-base-content/10 bg-gradient-to-b from-base-200/40 to-base-100">
		<div class="container mx-auto max-w-4xl px-6 py-16">
			<!-- Back to scenarios link -->
			<div class="mb-8">
				<a
					href="/scenarios"
					class="inline-flex items-center gap-2 text-sm text-base-content/60 transition-colors hover:text-base-content"
				>
					<span class="icon-[mdi--arrow-left] h-4 w-4"></span>
					<span>Browse more scenarios</span>
				</a>
			</div>

			<!-- Scenario Header -->
			<div class="mb-8 text-center">
				<!-- Icon and Role Badge -->
				<div class="mb-4 flex items-center justify-center gap-3">
					<span
						class="{roleIcons[scenario.role] ||
							'icon-[mdi--lightbulb-on-outline]'} h-12 w-12 text-primary"
					></span>
					<span class="badge badge-lg capitalize">
						{roleDisplayNames[scenario.role] || scenario.role}
					</span>
				</div>

				<!-- Title -->
				<h1 class="mb-4 text-4xl font-light tracking-tight md:text-5xl">
					{scenario.title}
				</h1>

				<!-- Description -->
				{#if scenario.description}
					<p class="mx-auto max-w-2xl text-lg text-base-content/70">
						{scenario.description}
					</p>
				{/if}

				<!-- Metadata -->
				<div class="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
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

					{#if scenario.authorDisplayName}
						<span class="text-base-content/40">·</span>
						<div class="flex items-center gap-1.5 text-base-content/70">
							<span class="icon-[mdi--account] h-4 w-4"></span>
							<span>{scenario.authorDisplayName}</span>
						</div>
					{/if}
				</div>

				<!-- Categories -->
				{#if scenario.categories && scenario.categories.length > 0}
					<div class="mt-4 flex flex-wrap justify-center gap-2">
						{#each scenario.categories as category}
							<span class="badge badge-outline badge-sm capitalize">
								{category.replace(/_/g, ' ')}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Thumbnail -->
			{#if scenario.thumbnailUrl}
				<div class="mb-8 overflow-hidden rounded-2xl shadow-lg">
					<img src={scenario.thumbnailUrl} alt={scenario.title} class="h-64 w-full object-cover" />
				</div>
			{/if}

			<!-- Start Button -->
			<div class="mx-auto max-w-md">
				<UnifiedStartButton
					{user}
					{selectedLanguage}
					{selectedSpeaker}
					selectedScenario={scenario}
					{selectedAudioMode}
					onModeChange={(mode) => (selectedAudioMode = mode)}
				/>
			</div>
		</div>
	</section>

	<!-- Details Section -->
	<section class="container mx-auto max-w-4xl px-6 py-12">
		<div class="grid gap-8 md:grid-cols-2">
			<!-- Learning Goal -->
			{#if scenario.learningGoal}
				<div
					class="rounded-2xl border border-base-content/10 bg-base-200/30 p-6 transition-all hover:border-primary/30"
				>
					<div class="mb-3 flex items-center gap-2">
						<span class="icon-[mdi--target] h-6 w-6 text-primary"></span>
						<h2 class="text-lg font-medium">Learning Goal</h2>
					</div>
					<p class="text-base-content/80">{scenario.learningGoal}</p>
				</div>
			{/if}

			<!-- Expected Outcome -->
			{#if scenario.expectedOutcome}
				<div
					class="rounded-2xl border border-base-content/10 bg-base-200/30 p-6 transition-all hover:border-primary/30"
				>
					<div class="mb-3 flex items-center gap-2">
						<span class="icon-[mdi--check-circle-outline] h-6 w-6 text-success"></span>
						<h2 class="text-lg font-medium">What You'll Achieve</h2>
					</div>
					<p class="text-base-content/80">{scenario.expectedOutcome}</p>
				</div>
			{/if}

			<!-- Context -->
			{#if scenario.context}
				<div
					class="rounded-2xl border border-base-content/10 bg-base-200/30 p-6 transition-all hover:border-primary/30 md:col-span-2"
				>
					<div class="mb-3 flex items-center gap-2">
						<span class="icon-[mdi--map-marker-outline] h-6 w-6 text-primary"></span>
						<h2 class="text-lg font-medium">Scenario Context</h2>
					</div>
					<p class="text-base-content/80">{scenario.context}</p>
				</div>
			{/if}

			<!-- Learning Objectives -->
			{#if scenario.learningObjectives && scenario.learningObjectives.length > 0}
				<div
					class="rounded-2xl border border-base-content/10 bg-base-200/30 p-6 transition-all hover:border-primary/30 md:col-span-2"
				>
					<div class="mb-3 flex items-center gap-2">
						<span class="icon-[mdi--lightbulb-outline] h-6 w-6 text-primary"></span>
						<h2 class="text-lg font-medium">What You'll Practice</h2>
					</div>
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

			<!-- CEFR Recommendation -->
			{#if scenario.cefrRecommendation}
				<div
					class="rounded-2xl border border-base-content/10 bg-base-200/30 p-6 transition-all hover:border-primary/30 md:col-span-2"
				>
					<div class="mb-3 flex items-center gap-2">
						<span class="icon-[mdi--information-outline] h-6 w-6 text-info"></span>
						<h2 class="text-lg font-medium">Recommended For</h2>
					</div>
					<p class="text-base-content/80">{scenario.cefrRecommendation}</p>
				</div>
			{/if}
		</div>
	</section>

	<!-- CTA Section -->
	<section class="border-t border-base-content/10 bg-base-200/30 py-16">
		<div class="container mx-auto max-w-2xl px-6 text-center">
			<h2 class="mb-4 text-2xl font-light">Ready to practice?</h2>
			<p class="mb-6 text-base-content/70">Choose your language and start this scenario now.</p>
			<div class="mx-auto max-w-md">
				<UnifiedStartButton
					{user}
					{selectedLanguage}
					{selectedSpeaker}
					selectedScenario={scenario}
					{selectedAudioMode}
					onModeChange={(mode) => (selectedAudioMode = mode)}
				/>
			</div>
		</div>
	</section>
</div>
