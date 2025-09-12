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
		main: 'Connect with your family in the language of their heart.',

		// Anti-competitor positioning variant
		variant1: 'Skip the flashcards. Share your feelings.',

		// Specific emotional scenario variant
		variant2: "Speak your grandmother's language fluently.",
		variant3: 'Conversations that matter. In any language.',
		variant4: 'Turn language learning into love stories.'
	};

	// Random headline selection
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
				<h4 class="mb-2 text-2xl sm:text-3xl font-semibold opacity-90 sm:mb-4">
					{headlineText}
				</h4>

				{#if user.id !== 'guest'}
					<div class="mb-6 text-xl opacity-90">
						Welcome back, {user ? user.displayName : 'Dev'}!
					</div>
				{:else}
					<p class="mb-6 text-xl opacity-90 hidden sm:block">
						Practice life-like conversations for relationships and family — quick 3‑minute
						onboarding.
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
<section class="rounded-2xl border-y border-white/10 bg-secondary/20 py-8 hidden md:block">
		<div class="container mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
			<div>
				<div class="text-sm font-semibold tracking-wide uppercase text-primary">Perfect For</div>
				<div class="text-base opacity-90 mt-2">Multicultural couples • Heritage language learners • Business professionals • Travel enthusiasts</div>
			</div>
			<div>
				<div class="text-sm font-semibold tracking-wide uppercase text-primary">Languages Available</div>
				<div class="text-base opacity-90 mt-2">
					Japanese • Spanish • French • Italian • German • Portuguese • Chinese • Korean
				</div>
			</div>
			<div>
				<div class="text-sm font-semibold tracking-wide uppercase text-primary">Proven Results</div>
				<div class="text-base italic opacity-90 mt-2">
					"Kaiwa is like WD‑40 for being rusty at a language. I gained confidence in weeks, not months." — Scott H.
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
			<h2 class="mb-4 text-4xl font-bold">Why Kaiwa Works: Real Conversation Practice</h2>
			<p class="text-xl opacity-90">Unlike traditional language apps that focus on grammar and vocab lists, Kaiwa immerses you in realistic conversations that mirror real-life situations. Practice speaking naturally with our AI conversation partner.</p>
		</div>

		<!-- Benefits Section -->
		<section class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
			<div class="bg-base-100 rounded-xl p-6 shadow-lg">
				<h3 class="text-xl font-semibold mb-3 text-primary">🎯 Conversation-First Learning</h3>
				<p class="opacity-90">Skip the flashcards and grammar drills. Jump straight into meaningful conversations that teach you how languages are actually spoken.</p>
			</div>
			<div class="bg-base-100 rounded-xl p-6 shadow-lg">
				<h3 class="text-xl font-semibold mb-3 text-primary">🗣️ Build Speaking Confidence</h3>
				<p class="opacity-90">Practice speaking without fear of judgment. Our AI conversation partner helps you build confidence through natural, encouraging dialogue.</p>
			</div>
			<div class="bg-base-100 rounded-xl p-6 shadow-lg">
				<h3 class="text-xl font-semibold mb-3 text-primary">📱 Learn Anywhere, Anytime</h3>
				<p class="opacity-90">Web-based platform works on all devices. Practice during your commute, lunch break, or whenever you have a few minutes.</p>
			</div>
			<div class="bg-base-100 rounded-xl p-6 shadow-lg">
				<h3 class="text-xl font-semibold mb-3 text-primary">🎭 Real-Life Scenarios</h3>
				<p class="opacity-90">From ordering coffee in Tokyo to having deep conversations with your in-laws, practice scenarios that actually matter to your life.</p>
			</div>
		</section>

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
	<section class="py-16 text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl mx-4">
		<div class="container mx-auto max-w-2xl">
			<h2 class="text-3xl font-bold mb-4">Ready to Start Speaking?</h2>
			<p class="text-lg opacity-90 mb-2">Join thousands of learners who've chosen conversation over cramming.</p>
			<div class="text-sm opacity-70 pb-6">✓ Free to try • ✓ No credit card required • ✓ 3-minute setup</div>
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
		<p class="mt-6 text-base opacity-80">
				{#if user && user.id !== 'guest'}
					Welcome back! Continue building your language confidence.
				{:else}
					Start your first AI conversation in under 3 minutes
				{/if}
			</p>
		</div>
	</section>

	<!-- Social Proof Section -->
	<section class="py-12 text-center">
		<div class="container mx-auto max-w-4xl">
			<h3 class="text-2xl font-semibold mb-8 opacity-90">Trusted by Language Learners Worldwide</h3>
			<div class="grid md:grid-cols-3 gap-6">
				<div class="text-center">
					<div class="text-3xl font-bold text-primary">5,000+</div>
					<div class="text-sm opacity-70">Conversations Completed</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-bold text-primary">8</div>
					<div class="text-sm opacity-70">Languages Supported</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-bold text-primary">95%</div>
					<div class="text-sm opacity-70">Report Improved Confidence</div>
				</div>
			</div>
		</div>
	</section>
</div>
