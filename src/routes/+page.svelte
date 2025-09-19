<script lang="ts">
	import { browser } from '$app/environment';
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
	import ChatBubbleFlow from '$lib/components/ChatBubbleFlow.svelte';
	import InteractiveScenarioPreview from '$lib/components/InteractiveScenarioPreview.svelte';
	import DynamicLanguageText from '$lib/components/DynamicLanguageText.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import { trackABTest } from '$lib/analytics/posthog';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { Scenario } from '$lib/server/db/types';
	import { dev } from '$app/environment';
	import WhyDifferent from '$lib/components/WhyDifferent.svelte';
	// Newsletter signup removed for MVP

	const user = userManager.user;

	// State management for language, speaker, and scenario selection
	let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);
	let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);
	let selectedScenario = $state<Scenario | null>(scenarioStore.getSelectedScenario());

	// A/B Testing for headlines - Family connection & anxiety-free positioning
	const headlineVariants = {
		// Main control (family connection)
		main: 'Connect with your family in the language of their heart.',

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

				{#if user.id !== 'guest'}
					<div class="mb-6 text-xl opacity-90">
						Welcome back, {user ? user.displayName : 'Dev'}!
					</div>
				{:else}
					<!-- Simplified guest value prop -->
					<div class="mb-6 space-y-3">
						<p class="text-lg opacity-90 sm:text-xl">
							3-minute onboarding to create personalized conversation scenarios just for you.
						</p>
						<p class="hidden text-sm opacity-70 sm:block">
							Free practice • No signup required • Start speaking in minutes
						</p>
					</div>
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
	<section class="hidden rounded-2xl border-y border-white/10 bg-secondary/20 py-8 md:block">
		<div class="container mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
			<div>
				<div class="text-sm font-semibold tracking-wide text-primary uppercase">Perfect For</div>
				<div class="mt-2 text-base opacity-90">
					Multicultural couples • Heritage language learners • Business professionals • Travel
					enthusiasts
				</div>
			</div>
			<div>
				<div class="text-sm font-semibold tracking-wide text-primary uppercase">
					Languages Available
				</div>
				<div class="mt-2 text-base opacity-90">
					Japanese • Spanish • French • Italian • German • Portuguese • Chinese • Korean
				</div>
			</div>
			<div>
				<div class="text-sm font-semibold tracking-wide text-primary uppercase">Proven Results</div>
				<div class="mt-2 text-base italic opacity-90">
					"Kaiwa is like WD‑40 for being rusty at a language. I gained confidence in weeks, not
					months." — Scott H.
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
					<track kind="captions" srcLang="en" label="English" default />
					Sorry, add your demo video to static/demo.mp4
				</video>
				<p class="mt-2 text-xs opacity-70">
					Place your demo at static/demo.mp4. Hidden in production.
				</p>
			</div>
		</section>
	{/if}
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
					<h3 class="mb-3 text-xl font-semibold text-primary">🎯 Conversation-First Learning</h3>
					<p class="opacity-90">
						Skip the flashcards and grammar drills. Jump straight into meaningful conversations that
						teach you how languages are actually spoken.
					</p>
				</div>
				<div class="rounded-xl bg-base-100 p-6 shadow-lg">
					<h3 class="mb-3 text-xl font-semibold text-primary">🗣️ Build Speaking Confidence</h3>
					<p class="opacity-90">
						Practice speaking without fear of judgment. Our AI conversation partner helps you build
						confidence through natural, encouraging dialogue.
					</p>
				</div>
				<div class="rounded-xl bg-base-100 p-6 shadow-lg">
					<h3 class="mb-3 text-xl font-semibold text-primary">📱 Learn Anywhere, Anytime</h3>
					<p class="opacity-90">
						Web-based platform works on all devices. Practice during your commute, lunch break, or
						whenever you have a few minutes.
					</p>
				</div>
				<div class="rounded-xl bg-base-100 p-6 shadow-lg">
					<h3 class="mb-3 text-xl font-semibold text-primary">🎭 Real-Life Scenarios</h3>
					<p class="opacity-90">
						From ordering coffee in Tokyo to having deep conversations with your in-laws, practice
						scenarios that actually matter to your life.
					</p>
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
			<div class="pb-6 text-sm opacity-70">
				✓ Free to try • ✓ No credit card required • ✓ 3-minute setup
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
				<div class="mt-1 text-sm opacity-80">Questions or feedback? Email support@kaiwa.app</div>
			</div>
		</div>
	</section>

	<!-- Simplified Social Proof Section -->
	<section class="py-8 text-center md:py-12">
		<div class="container mx-auto max-w-4xl">
			<h3 class="mb-6 text-xl font-semibold opacity-90 md:mb-8 md:text-2xl">
				Trusted by Language Learners Worldwide
			</h3>
			<div class="grid gap-4 md:grid-cols-3 md:gap-6">
				<div class="text-center">
					<div class="text-2xl font-bold text-primary md:text-3xl">5,000+</div>
					<div class="text-xs opacity-70 md:text-sm">Conversations Completed</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-primary md:text-3xl">8</div>
					<div class="text-xs opacity-70 md:text-sm">Languages Supported</div>
				</div>
				<div class="text-center">
					<div class="text-2xl font-bold text-primary md:text-3xl">95%</div>
					<div class="text-xs opacity-70 md:text-sm">Report Improved Confidence</div>
				</div>
			</div>
		</div>
	</section>
</div>
