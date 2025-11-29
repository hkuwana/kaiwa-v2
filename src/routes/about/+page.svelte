<script lang="ts">
	import { onMount } from 'svelte';
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { Scenario } from '$lib/server/db/types';
	import { track } from '$lib/analytics/posthog';
	import InteractiveScenarioPreview from '$lib/features/scenarios/components/InteractiveScenarioPreview.svelte';
	import { createAboutPageJsonLd } from '$lib/seo/jsonld';
	import { fade } from 'svelte/transition';
	import { personalizedPathExamples } from '$lib/data/marketing';

	// Current user
	const user = userManager.user;

	// Local state for CTA selectors
	let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);
	let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);
	let selectedScenario = $state<Scenario | null>(scenarioStore.getSelectedScenario());

	// Animation states
	let showHero1 = $state(false);
	let showHero2 = $state(false);
	let showWhatItIs1 = $state(false);
	let showWhatItIs2 = $state(false);
	// eslint-disable-next-line unused-imports/no-unused-vars
	let showDifference = $state(false);
	let showPersonalized = $state(false);
	let showCTA = $state(false);
	let showCTAButton = $state(false);

	function _handleLanguageChange(language: DataLanguage) {
		selectedLanguage = language;
		settingsStore.setLanguage(language);
	}

	function _handleSpeakerChange(speakerId: string) {
		selectedSpeaker = speakerId;
		settingsStore.setSpeaker(speakerId);
	}

	function handleScenarioChange(scenario: Scenario) {
		scenarioStore.setScenarioById(scenario.id);
		selectedScenario = scenario;
	}

	function handleAboutStartClick() {
		track('about_cta_clicked', {
			source: 'about_page',
			user_type: user && user.id !== 'guest' ? 'logged_in' : 'guest'
		});
	}

	onMount(() => {
		document.title = 'About - Kaiwa';

		// Hero section animations
		setTimeout(() => {
			showHero1 = true;
		}, 100);

		setTimeout(() => {
			showHero2 = true;
		}, 800);

		// What it is section animations
		setTimeout(() => {
			showWhatItIs1 = true;
		}, 1800);

		setTimeout(() => {
			showWhatItIs2 = true;
		}, 2500);

		// Difference section animation
		setTimeout(() => {
			showDifference = true;
		}, 3500);

		// Personalized section animation
		setTimeout(() => {
			showPersonalized = true;
		}, 4200);

		// CTA section animations
		setTimeout(() => {
			showCTA = true;
		}, 5000);

		setTimeout(() => {
			showCTAButton = true;
		}, 5700);
	});

	// eslint-disable-next-line unused-imports/no-unused-vars
	const aboutJsonLd = createAboutPageJsonLd('https://trykaiwa.com');
</script>

<svelte:head>
	<title>About Kaiwa</title>
	<meta
		name="description"
		content="Personalized for you. Kaiwa helps you speak with your loved ones through tailored feedback on conversations that matter."
	/>
	<script type="application/ld+json">
		{@html JSON.stringify(aboutJsonLd)}
	</script>
</svelte:head>

<div class="bg-base-100">
	<!-- Hero: One clear statement -->
	<section class="flex min-h-screen items-center justify-center px-6">
		<div class="mx-auto max-w-4xl text-center">
			{#if showHero1}
				<h1
					class="mb-12 text-4xl leading-tight font-light tracking-tight md:text-5xl lg:text-6xl"
					in:fade={{ duration: 1000 }}
				>
					Personalized for you.
				</h1>
			{/if}
			{#if showHero2}
				<h1
					class="mb-12 text-4xl leading-tight font-light tracking-tight md:text-5xl lg:text-6xl"
					in:fade={{ duration: 1000 }}
				>
					Kaiwa helps you speak with your loved ones.
				</h1>
			{/if}
		</div>
	</section>

	<!-- What it is: One focused message -->
	<section class="flex min-h-screen items-center justify-center bg-base-200/30 px-6">
		<div class="mx-auto max-w-4xl text-center">
			{#if showWhatItIs1}
				<p
					class="mb-8 text-2xl leading-relaxed font-light tracking-wide opacity-90 md:text-3xl lg:text-4xl"
					in:fade={{ duration: 1000 }}
				>
					Get tailored feedback on the conversations that actually matter to you.
				</p>
			{/if}
			{#if showWhatItIs2}
				<p
					class="text-xl leading-relaxed font-light tracking-wide opacity-70 md:text-2xl lg:text-3xl"
					in:fade={{ duration: 1000 }}
				>
					So when you finally speak, their face lights up with pride.
				</p>
			{/if}
		</div>
	</section>

	<!-- Practice: Full display showcase -->
	<section class="flex min-h-screen items-center justify-center px-6 py-24">
		<div class="mx-auto w-full max-w-6xl">
			<InteractiveScenarioPreview {selectedLanguage} />
		</div>
	</section>

	<!-- Personalized Paths: The difference -->
	{#if showPersonalized}
		<section
			class="flex min-h-screen items-center justify-center bg-base-200/30 px-6"
			in:fade={{ duration: 1000 }}
		>
			<div class="mx-auto max-w-4xl">
				<h2 class="mb-8 text-center text-3xl font-light tracking-tight md:text-4xl lg:text-5xl">
					Your situation is unique.
				</h2>
				<p class="mb-12 text-center text-xl font-light opacity-80 md:text-2xl">So is your path.</p>

				<div class="grid gap-8 md:grid-cols-3">
					{#each personalizedPathExamples.slice(0, 3) as example (example.situation)}
						<div class="rounded-2xl bg-base-100 p-6 text-center shadow-sm">
							<div class="mb-4 flex justify-center">
								<span class="{example.iconClass} h-10 w-10 text-primary"></span>
							</div>
							<p class="font-medium">"{example.situation}"</p>
						</div>
					{/each}
				</div>

				<div class="mt-12 text-center">
					<p class="mb-6 text-lg font-light opacity-70">
						15 minutes with me. Then a custom path built just for you.
					</p>
					<a href="/pricing" class="btn btn-lg btn-primary"> See Personalized Paths </a>
				</div>
			</div>
		</section>
	{/if}

	<!-- Begin: Single CTA -->
	<section class="flex min-h-screen items-center justify-center px-6">
		<div class="mx-auto max-w-3xl text-center">
			{#if showCTA}
				<div class="mb-12" in:fade={{ duration: 800 }}>
					<h2 class="mb-8 text-4xl font-light tracking-tight md:text-5xl">Begin your practice</h2>
				</div>
			{/if}
			{#if showCTAButton}
				<div class="mx-auto max-w-md" in:fade={{ duration: 800 }}>
					<UnifiedStartButton
						{user}
						{selectedLanguage}
						{selectedSpeaker}
						{selectedScenario}
						onScenarioChange={handleScenarioChange}
						onStartClick={handleAboutStartClick}
					/>
				</div>
			{/if}
		</div>
	</section>

	<!-- Footer -->
	<section class="border-t border-base-content/10 py-16">
		<div class="mx-auto max-w-4xl px-6 text-center">
			<p class="font-light opacity-50">Questions? Email support@trykaiwa.com</p>
		</div>
	</section>
</div>
