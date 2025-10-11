<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
	import ChatBubbleFlow from '$lib/components/ChatBubbleFlow.svelte';
	import InteractiveScenarioPreview from '$lib/features/scenarios/components/InteractiveScenarioPreview.svelte';
	import DynamicLanguageText from '$lib/components/DynamicLanguageText.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import { trackABTest } from '$lib/analytics/posthog';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { Scenario } from '$lib/server/db/types';
	import WhyDifferent from '$lib/components/WhyDifferent.svelte';

	const user = userManager.user;

	// State management for language, speaker, and scenario selection
	let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);
	let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);
	let selectedScenario = $state<Scenario | null>(scenarioStore.getSelectedScenario());

	// Handle scenario query parameter from URL (e.g., from email links)
	onMount(() => {
		const scenarioId = page.url.searchParams.get('scenario');
		if (scenarioId && browser) {
			// Set the scenario in the store so it's pre-selected
			scenarioStore.setScenarioById(scenarioId);
			selectedScenario = scenarioStore.getSelectedScenario();
		}
	});

	// A/B Testing for headlines - Family connection & anxiety-free positioning
	const headlineVariants = {
		// Main control (family connection)
		main: 'Connect with family in their language.',

		// Dynamic language-specific variations
		grandmother: 'dynamic-grandmother',
		practice: 'dynamic-practice',
		connect: 'dynamic-connect'
	};

	// Random headline selection
	let headlineVariant = $state('main');
	let headlineText = $state(headlineVariants.main);
	let useDynamicLanguage = $state(false);
	let dynamicVariant: 'grandmother' | 'practice' | 'connect' = $state('grandmother');

	// Initialize random A/B test on client side
	if (browser) {
		// Test dynamic language variants
		const dynamicVariants = ['grandmother', 'practice', 'connect'] as const;
		const selectedVariant = dynamicVariants[Math.floor(Math.random() * dynamicVariants.length)];

		// Update state
		headlineVariant = selectedVariant;
		useDynamicLanguage = true;
		dynamicVariant = selectedVariant;
		headlineText = `dynamic-${selectedVariant}`;

		// Track which variant the user saw
		const trackingTexts = {
			grandmother: 'Talk to your grandmother in [Language]',
			practice: 'Practice [Language] without fear',
			connect: 'Connect through heart in [Language]'
		};

		trackABTest.headlineVariantShown(selectedVariant, trackingTexts[selectedVariant]);
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

	function handleDynamicLanguageSelect(language: DataLanguage) {
		selectedLanguage = language;
		settingsStore.setLanguageObject(language);
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
				{#if user.id !== 'guest'}
					<div class="mb-6 text-xl opacity-90">
						Welcome back, {user ? user.displayName : 'Dev'}!
					</div>
				{:else}
					<h4 class="mb-2 text-2xl font-semibold opacity-90 sm:mb-4 sm:text-3xl">
						{#if useDynamicLanguage}
							<DynamicLanguageText
								bind:selectedLanguage
								onLanguageSelect={handleDynamicLanguageSelect}
								variant={dynamicVariant}
								animationInterval={2800}
								interactive={false}
							/>
						{:else}
							{headlineText}
						{/if}
					</h4>
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

	<section class="space-y-8">
		<div class="text-center">
			<div class="mb-3 text-2xl font-bold">Craft Your Adventure</div>
			<p class="text-lg opacity-80">Explore places, moments, and moods to practice</p>
		</div>
		<InteractiveScenarioPreview {selectedLanguage} />
	</section>

	<!-- Simplified content for mobile -->
	<main class="container mx-auto space-y-8 py-8 md:space-y-16 md:py-12">
		<!-- Hide complex sections on mobile to reduce clutter -->
		<div class="hidden md:block">
			<!-- Section Header -->
			<div class="mx-auto max-w-3xl text-center">
				<h2 class="mb-4 text-4xl font-bold">Why Kaiwa Works: Real Conversation Practice</h2>
				<p class="text-xl opacity-90">
					Unlike traditional language apps that focus on grammar and vocab lists, Kaiwa immerses you
					in realistic conversations that mirror real-life situations. Practice speaking naturally
					with our AI conversation partner.
				</p>
			</div>

			<!-- Benefits Section -->
			<section class="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
				<div class="rounded-xl bg-base-100 p-6 shadow-lg">
					<h3 class="mb-3 flex items-center gap-2 text-xl font-semibold text-primary">
						<span class="icon-[mdi--target] h-6 w-6 text-primary"></span>
						Conversation-First Learning
					</h3>
					<p class="opacity-90">
						Skip the flashcards and grammar drills. Jump straight into meaningful conversations that
						teach you how languages are actually spoken.
					</p>
				</div>
				<div class="rounded-xl bg-base-100 p-6 shadow-lg">
					<h3 class="mb-3 flex items-center gap-2 text-xl font-semibold text-secondary">
						<span class="icon-[mdi--microphone] h-6 w-6 text-secondary"></span>
						Build Speaking Confidence
					</h3>
					<p class="opacity-90">
						Practice speaking without fear of judgment. Our AI conversation partner helps you build
						confidence through natural, encouraging dialogue.
					</p>
				</div>
				<div class="rounded-xl bg-base-100 p-6 shadow-lg">
					<h3 class="mb-3 flex items-center gap-2 text-xl font-semibold text-accent">
						<span class="icon-[mdi--cellphone] h-6 w-6 text-accent"></span>
						Learn Anywhere, Anytime
					</h3>
					<p class="opacity-90">
						Web-based platform works on all devices. Practice during your commute, lunch break, or
						whenever you have a few minutes.
					</p>
				</div>
				<div class="rounded-xl bg-base-100 p-6 shadow-lg">
					<h3 class="mb-3 flex items-center gap-2 text-xl font-semibold text-success">
						<span class="icon-[mdi--drama-masks] h-6 w-6 text-success"></span>
						Real-Life Scenarios
					</h3>
					<p class="opacity-90">
						From ordering coffee in Tokyo to having deep conversations with your in-laws, practice
						scenarios that actually matter to your life.
					</p>
				</div>
			</section>

			<!-- Option 1: Chat Bubble Flow Animation -->
			<section class="space-y-8">
				<div class="text-center">
					<h3 class="mb-3 flex items-center justify-center gap-2 text-2xl font-bold">
						<span class="icon-[mdi--chat] h-7 w-7 text-primary"></span>
						Live Conversation Flow
					</h3>
					<p class="text-lg opacity-80">
						See real conversations happening across different languages
					</p>
				</div>
				<ChatBubbleFlow />
			</section>
		</div>

		<!-- Mobile-only simplified preview -->
		<section class="block md:hidden">
			<div class="text-center">
				<h3 class="mb-4 text-xl font-bold">Real Conversations, Real Progress</h3>
				<ChatBubbleFlow />
			</div>
		</section>
	</main>

	<!-- CTA Section -->
	<section
		class="mx-4 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 py-16 text-center"
	>
		<div class="container mx-auto max-w-2xl">
			<h2 class="mb-4 text-3xl font-bold">Ready to Start Speaking?</h2>
			<p class="mb-2 text-lg opacity-90">
				Join thousands of learners who've chosen conversation over cramming.
			</p>
			<div class="flex items-center justify-center gap-2 pb-6 text-sm opacity-70">
				<span class="icon-[mdi--check] h-4 w-4 text-green-500"></span> Free to try
				<span class="mx-1">•</span>
				<span class="icon-[mdi--check] h-4 w-4 text-green-500"></span> No credit card required
				<span class="mx-1">•</span>
				<span class="icon-[mdi--check] h-4 w-4 text-green-500"></span> 3-minute setup
			</div>
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

	<!-- Hide comparison section on mobile -->
	<div class="hidden md:block">
		<WhyDifferent variant="compact" />
	</div>

	<!-- Newsletter removed: keep simple contact CTA -->
	<section class="py-8 md:py-12">
		<div class="container mx-auto max-w-2xl px-4 text-center">
			<div class="rounded-xl bg-base-200 p-6">
				<div class="text-lg font-semibold">Stay in the loop</div>
				<div class="mt-1 text-sm opacity-80">Questions or feedback? Email support@trykaiwa.com</div>
			</div>
		</div>
	</section>

	<!-- Early Access Section -->
	<section class="py-8 text-center md:py-12">
		<div class="container mx-auto max-w-4xl px-4">
			<h3 class="mb-6 text-xl font-semibold opacity-90 md:mb-8 md:text-2xl">
				Early Access — Build This With Us
			</h3>
			<div class="grid gap-6 md:grid-cols-2">
				<div class="rounded-lg bg-base-200 p-6 text-left">
					<div class="mb-3 text-3xl">🎯</div>
					<div class="mb-2 text-lg font-semibold">Honest Feedback Welcome</div>
					<div class="text-sm opacity-80">
						We're working with the first 100 users to build conversation scenarios that actually
						matter. Tell us what works and what doesn't — we're building this with you, not for you.
					</div>
				</div>
				<div class="rounded-lg bg-base-200 p-6 text-left">
					<div class="mb-3 text-3xl">💬</div>
					<div class="mb-2 text-lg font-semibold">Focus: Cross-Language Relationships</div>
					<div class="text-sm opacity-80">
						Especially if you're preparing to talk with your partner's family in their language. We
						know this anxiety intimately, and we're building scenarios that help.
					</div>
				</div>
			</div>
		</div>
	</section>
</div>
