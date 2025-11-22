<!-- src/lib/components/LanguageScenarioShowcase.svelte -->
<!-- Language tab selector with auto-rotating scenario carousel -->
<script lang="ts">
	import { languages } from '$lib/data/languages';
	import { scenariosData } from '$lib/data/scenarios';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { getSpeakersByLanguage } from '$lib/data/speakers';
	import BriefingCard from './BriefingCard.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Language } from '$lib/data/languages';
	import type { Scenario } from '$lib/data/scenarios';

	interface Props {
		/** Auto-rotate interval in milliseconds (default: 6000 = 6 seconds) */
		autoRotateInterval?: number;
		/** Show only featured scenarios (default: first 6) */
		featuredScenariosCount?: number;
		/** Enable auto-rotation (default: true) */
		enableAutoRotate?: boolean;
	}

	const {
		autoRotateInterval = 6000,
		featuredScenariosCount = 6,
		enableAutoRotate = true
	}: Props = $props();

	// Get featured scenarios
	const featuredScenarios = scenariosData.slice(0, featuredScenariosCount);

	// Carousel state
	let currentScenarioIndex = $state(0);
	let isHovering = $state(false);
	let autoRotateTimer: ReturnType<typeof setInterval> | null = null;

	// Get current scenario and speaker
	const currentScenario = $derived(featuredScenarios[currentScenarioIndex]);
	const currentSpeaker = $derived.by(() => {
		if (!settingsStore.selectedLanguage) return null;
		const speakersForLanguage = getSpeakersByLanguage(settingsStore.selectedLanguage.code);
		return speakersForLanguage?.[0] || null;
	});

	// Language selection handler
	function selectLanguage(language: Language) {
		settingsStore.setLanguage(language);
		// Also auto-select first speaker for that language
		const speakersForLanguage = getSpeakersByLanguage(language.code);
		if (speakersForLanguage?.[0]) {
			settingsStore.setSpeaker(speakersForLanguage[0]);
		}
	}

	// Carousel navigation
	function nextScenario() {
		currentScenarioIndex = (currentScenarioIndex + 1) % featuredScenarios.length;
	}

	function previousScenario() {
		currentScenarioIndex =
			(currentScenarioIndex - 1 + featuredScenarios.length) % featuredScenarios.length;
	}

	function goToScenario(index: number) {
		currentScenarioIndex = index;
	}

	// Auto-rotate logic
	function startAutoRotate() {
		if (!enableAutoRotate) return;
		stopAutoRotate(); // Clear any existing timer
		autoRotateTimer = setInterval(() => {
			if (!isHovering) {
				nextScenario();
			}
		}, autoRotateInterval);
	}

	function stopAutoRotate() {
		if (autoRotateTimer) {
			clearInterval(autoRotateTimer);
			autoRotateTimer = null;
		}
	}

	// Lifecycle
	onMount(() => {
		startAutoRotate();
	});

	onDestroy(() => {
		stopAutoRotate();
	});
</script>

<div class="w-full space-y-8">
	<!-- Language Selection Section -->
	<div class="space-y-4">
		<div class="text-center">
			<h2 class="text-2xl font-bold text-base-content sm:text-3xl">Choose Your Language</h2>
			<p class="mt-2 text-sm text-base-content/70">
				Select the language you want to practice speaking
			</p>
		</div>

		<!-- Language Tabs - Scrollable on mobile, wrapped on desktop -->
		<div
			class="flex justify-center overflow-x-auto px-4 pb-2 scrollbar-hide sm:px-0"
			role="tablist"
			aria-label="Language selection"
		>
			<div class="tabs tabs-boxed gap-2 bg-base-200/50 p-2 backdrop-blur-sm">
				{#each languages as language (language.code)}
					<button
						role="tab"
						aria-selected={settingsStore.selectedLanguage?.code === language.code}
						class="tab tab-lg whitespace-nowrap transition-all duration-200 hover:scale-105"
						class:tab-active={settingsStore.selectedLanguage?.code === language.code}
						onclick={() => selectLanguage(language)}
					>
						<span class="mr-2 text-xl sm:text-2xl">{language.flag}</span>
						<span class="hidden sm:inline">{language.name}</span>
						<span class="sm:hidden">{language.code.toUpperCase()}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Selected Language Display (Mobile) -->
		{#if settingsStore.selectedLanguage}
			<div class="text-center sm:hidden" transition:fade={{ duration: 200 }}>
				<p class="text-sm font-medium text-base-content/80">
					Learning: <span class="text-primary">{settingsStore.selectedLanguage.name}</span>
					<span class="text-base-content/50">({settingsStore.selectedLanguage.nativeName})</span>
				</p>
			</div>
		{/if}
	</div>

	<!-- Scenario Showcase Section -->
	<div class="space-y-4">
		<div class="text-center">
			<h3 class="text-xl font-semibold text-base-content sm:text-2xl">Featured Scenarios</h3>
			<p class="mt-2 text-sm text-base-content/60">
				Scenarios automatically adapt to your skill level
			</p>
		</div>

		<!-- Carousel Container -->
		<div
			class="relative mx-auto w-full max-w-2xl"
			onmouseenter={() => (isHovering = true)}
			onmouseleave={() => (isHovering = false)}
		>
			<!-- Main Carousel -->
			<div class="relative overflow-hidden rounded-3xl">
				<div class="flex items-center justify-center px-4 py-8">
					{#key currentScenarioIndex}
						<div
							class="w-full"
							in:fade={{ duration: 300, delay: 150, easing: cubicOut }}
							out:fade={{ duration: 150 }}
						>
							<BriefingCard
								selectedLanguage={settingsStore.selectedLanguage}
								selectedSpeaker={currentSpeaker}
								selectedScenario={currentScenario}
							/>
						</div>
					{/key}
				</div>

				<!-- Navigation Arrows (Desktop) -->
				<button
					class="btn btn-circle btn-ghost absolute left-2 top-1/2 hidden -translate-y-1/2 sm:flex"
					onclick={previousScenario}
					aria-label="Previous scenario"
				>
					❮
				</button>
				<button
					class="btn btn-circle btn-ghost absolute right-2 top-1/2 hidden -translate-y-1/2 sm:flex"
					onclick={nextScenario}
					aria-label="Next scenario"
				>
					❯
				</button>
			</div>

			<!-- Carousel Indicators -->
			<div class="mt-6 flex justify-center gap-2">
				{#each featuredScenarios as _, index}
					<button
						class="h-2 rounded-full transition-all duration-300"
						class:w-8={currentScenarioIndex === index}
						class:w-2={currentScenarioIndex !== index}
						class:bg-primary={currentScenarioIndex === index}
						class:bg-base-300={currentScenarioIndex !== index}
						onclick={() => goToScenario(index)}
						aria-label={`Go to scenario ${index + 1}`}
					></button>
				{/each}
			</div>

			<!-- Scenario Counter -->
			<div class="mt-4 text-center text-sm text-base-content/60">
				<span class="font-medium">{currentScenarioIndex + 1}</span> of {featuredScenarios.length}
				scenarios
			</div>

			<!-- Auto-rotate Indicator (when paused on hover) -->
			{#if isHovering && enableAutoRotate}
				<div
					class="mt-2 text-center text-xs text-base-content/50"
					transition:fade={{ duration: 200 }}
				>
					⏸️ Paused
				</div>
			{/if}
		</div>

		<!-- Touch Gesture Hint (Mobile) -->
		<div class="text-center text-xs text-base-content/50 sm:hidden">
			👆 Tap the dots or arrows to explore scenarios
		</div>
	</div>
</div>

<style>
	@reference "tailwindcss";

	/* Hide scrollbar but keep functionality */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Smooth tab transitions */
	.tab {
		@apply transition-all duration-200;
	}

	.tab-active {
		@apply scale-105 shadow-md;
	}

	/* Indicator animation */
	button[aria-label^='Go to scenario'] {
		@apply cursor-pointer transition-all duration-300 hover:scale-125;
	}
</style>
