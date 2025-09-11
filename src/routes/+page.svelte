<script lang="ts">
	import { browser } from '$app/environment';
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
	import ChatBubbleFlow from '$lib/components/ChatBubbleFlow.svelte';
	import InteractiveScenarioPreview from '$lib/components/InteractiveScenarioPreview.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import { trackABTest } from '$lib/analytics/posthog';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import { languages as allLanguages } from '$lib/data/languages';
	import type { Scenario } from '$lib/server/db/types';
	import { dev } from '$app/environment';

	// Get user data from page data
	const user = userManager.user;

	// State management for language, speaker, and scenario selection
	let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);
	let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);
	let selectedScenario = $state<Scenario | null>(scenarioStore.getSelectedScenario());

	// A/B Testing for headlines - Relationship-first positioning
	const headlineVariants = {
		// Main control (solution-oriented)
		main: 'Finally speak to the people you love in their language.',

		// Anti-competitor positioning variant
		variant1: 'Stop drills. Start dinner‑table conversations.',

		// Specific emotional scenario variant
		variant2: 'Learn to talk to their family.'
	};

	// Random headline selection - Don Draper's approach
	let headlineVariant = $state('main');
	let headlineText = $state(headlineVariants.main);

	// Initialize random A/B test on client side
	if (browser) {
		// Test the 2 refined variants
		const shortlist = ['variant1', 'variant2'] as const;
		const selectedVariant = shortlist[Math.floor(Math.random() * shortlist.length)];

		// Update state
		headlineVariant = selectedVariant;
		headlineText = headlineVariants[selectedVariant as keyof typeof headlineVariants];

		// Track which variant the user saw
		const selectedText = headlineVariants[selectedVariant as keyof typeof headlineVariants];
		trackABTest.headlineVariantShown(selectedVariant, selectedText);
	}

	// Function to track when user clicks start speaking
	function trackStartSpeakingClick() {
		// Get current values to avoid state reference issues
		const currentVariant = headlineVariant;
		const currentText = headlineText;
		const userType = user ? 'logged_in' : 'guest';

		trackABTest.startSpeakingClicked(currentVariant, currentText, userType);
	}

	// Event handlers for component callbacks
	function handleLanguageChange(language: DataLanguage) {
		selectedLanguage = language;
		settingsStore.setLanguageObject(language);
	}

	function handleSpeakerChange(speakerId: string) {
		selectedSpeaker = speakerId;
		settingsStore.setSpeaker(speakerId);
	}

	function handleScenarioChange(scenario: Scenario) {
		scenarioStore.setScenarioById(scenario.id);
		selectedScenario = scenario;
	}
</script>

<svelte:head>
	<title>Kaiwa - Language Learning Platform</title>
	<meta name="description" content="Practice conversation with AI tutor" />
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 px-2 text-base-content sm:px-4"
>
	<header class="flex min-h-screen items-start justify-center pt-20">
		<div class="text-center">
			<div class="max-w-md">
				<h4 class="  text-3xl font-semibold opacity-90 mb-2 sm:mb-4">
					{headlineText}
				</h4>

				{#if user.id !== 'guest'}
					<div class="mb-6 text-xl opacity-90">
						Welcome back, {user ? user.displayName : 'Dev'}!
					</div>
				{:else}
					<p class="mb-6 text-xl opacity-90">
						Practice life-like conversations for relationships and family — quick 3‑minute onboarding.
					</p>
				{/if}

				<UnifiedStartButton
					{user}
					{selectedLanguage}
					{selectedSpeaker}
					{selectedScenario}
					onLanguageChange={handleLanguageChange}
					onSpeakerChange={handleSpeakerChange}
					onScenarioChange={handleScenarioChange}
					onStartClick={trackStartSpeakingClick}
				/>
			</div>
		</div>
	</header>

	<!-- Quick value props strip -->
	<section class="border-y border-white/10 bg-secondary/20 py-6 rounded-2xl">
		<div class="container mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 md:grid-cols-3">
			<div>
				<div class="text-sm font-semibold tracking-wide uppercase">Who it's for</div>
				<div class="text-base opacity-90">Couples across languages • Diaspora families</div>
			</div>
			<div>
				<div class="text-sm font-semibold tracking-wide uppercase">How it works</div>
				<div class="text-base opacity-90">
					3‑minute onboarding • Personalized scenarios • Quick daily chats
				</div>
			</div>
			<div>
				<div class="text-sm font-semibold tracking-wide uppercase">What users say</div>
				<div class="text-base italic opacity-90">
					“Kaiwa is like WD‑40 for being rusty at a language.” — Scott H.
				</div>
			</div>
		</div>
	</section>

	{#if dev}
		<!-- Dev-only demo video slot -->
		<section class="container mx-auto max-w-3xl py-8">
			<div class="/80 rounded-xl border border-white/10 bg-secondary/20 p-4">
				<div class="mb-2 text-sm tracking-wide uppercase">Demo (dev only)</div>
				<video class="w-full rounded-lg" src="/demo.mp4" controls preload="metadata">
					Sorry, add your demo video to static/demo.mp4
				</video>
				<p class="mt-2 text-xs opacity-70">
					Place your demo at static/demo.mp4. Hidden in production.
				</p>
			</div>
		</section>
	{/if}
	<!-- New Component Showcase Section -->
	<main class="container mx-auto space-y-16 py-12">
		<!-- Section Header -->
		<div class="mx-auto max-w-3xl text-center">
			<h2 class="mb-4 text-4xl font-bold">Experience Real Conversations</h2>
			<p class="text-xl opacity-90">Practice speaking naturally with AI-powered conversations</p>
		</div>

		<!-- Option 1: Chat Bubble Flow Animation -->
		<section class="space-y-8">
			<div class="text-center">
				<h3 class="mb-3 text-2xl font-bold">💬 Live Conversation Flow</h3>
				<p class="text-lg opacity-80">
					See real conversations happening across different languages
				</p>
			</div>
			<ChatBubbleFlow />
		</section>

		<!-- Option 3: Interactive Scenario Preview -->
		<section class="space-y-8">
			<div class="text-center">
				<div class="mb-3 text-2xl font-bold">Craft Your Adventure</div>
				<p class="text-lg opacity-80">Explore places, moments, and moods to practice</p>
			</div>
			<InteractiveScenarioPreview {selectedLanguage} />
		</section>
	</main>
	<!-- CTA Section -->
	<div class="py-8 text-center">
		<div class="bold pb-4">Try getting started with our free onboarding session!</div>
		<UnifiedStartButton
			{user}
			{selectedLanguage}
			{selectedSpeaker}
			{selectedScenario}
			onLanguageChange={handleLanguageChange}
			onSpeakerChange={handleSpeakerChange}
			onScenarioChange={handleScenarioChange}
			onStartClick={trackStartSpeakingClick}
		/>
		<p class="mt-4 text-lg opacity-80">
			{#if user && user.id !== 'guest'}
				Ready to start your next conversation?
			{:else}
				Try your first conversation - sign up for full access
			{/if}
		</p>
	</div>
</div>
