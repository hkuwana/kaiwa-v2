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
	import type { Scenario } from '$lib/server/db/types';

	// Get user data from page data
	const user = userManager.user;

	// State management for language, speaker, and scenario selection
	let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);
	let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);
	let selectedScenario = $state<Scenario | null>(scenarioStore.getSelectedScenario());

	// A/B Testing for headlines - Don Draper Edition
	const headlineVariants = {
		// Main control
		main: 'No Writing or Reading. Just Talks.',

		// Revolutionary/New variants (excitement + novelty)
		variant1: 'The anti-language-learning app.',
		variant2: 'Language learning for the streets.',
		variant3: "Practice like you're living there.",
		variant4: 'Finally. Stress-free conversation practice.',
		variant5: 'The app Duolingo fears.',
		// Innovation variants (breakthrough positioning)
		variant6: 'Conversation AI that gets you.',
		variant7: 'Practice real situations safely.',
		variant8: 'Your Japanese survival trainer.',
		variant9: 'AI partner for messy conversations.'
	};

	// Random headline selection - Don Draper's approach
	let headlineVariant = $state('main');
	let headlineText = $state(headlineVariants.main);

	// Initialize random A/B test on client side
	if (browser) {
		// Get all variant keys
		const variantKeys = Object.keys(headlineVariants);

		// Separate main from variants
		const mainVariant = variantKeys.filter((key) => key === 'main');
		const testVariants = variantKeys.filter((key) => key.startsWith('variant'));

		let selectedVariant: string;
		const random = Math.random();

		if (random < 0.2) {
			// 20% chance for main control
			selectedVariant = mainVariant[0];
		} else {
			// 80% chance for test variants
			selectedVariant = testVariants[Math.floor(Math.random() * testVariants.length)];
		}

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

<div class="min-h-screen bg-gradient-to-br from-primary to-secondary text-primary-content">
	<header class="flex min-h-screen items-start justify-center pt-20">
		<div class="text-center">
			<div class="max-w-md">
				<h1 class="  text-5xl font-bold">Kaiwa</h1>
				<h4 class="  text-2xl font-medium opacity-90">
					{headlineText}
				</h4>

				{#if user.id !== 'guest'}
					<div class="mb-6 text-xl opacity-90">
						Welcome back, {user ? user.displayName : 'Dev'}!
					</div>
				{:else}
					<p class="mb-6 text-xl opacity-90">Learn languages through AI-assisted conversations</p>
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
	<!-- New Component Showcase Section -->
	<main class="container mx-auto px-4 py-12 space-y-16">
		<!-- Section Header -->
		<div class="text-center max-w-3xl mx-auto">
			<h2 class="text-4xl font-bold mb-4 text-white">Experience Real Conversations</h2>
			<p class="text-xl opacity-90 text-white">
				Practice speaking naturally with AI-powered conversations in multiple languages
			</p>
		</div>

		<!-- Option 1: Chat Bubble Flow Animation -->
		<section class="space-y-8">
			<div class="text-center">
				<h3 class="text-2xl font-bold mb-3 text-white">💬 Live Conversation Flow</h3>
				<p class="text-lg opacity-80 text-white">See real conversations happening across different languages</p>
			</div>
			<ChatBubbleFlow />
		</section>

		<!-- CTA Section -->
		<div class="text-center py-8">
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
			<p class="mt-4 text-lg opacity-80 text-white">
				{#if user && user.id !== 'guest'}
					Ready to start your next conversation?
				{:else}
					Try your first conversation - sign up for full access
				{/if}
			</p>
		</div>

		<!-- Option 3: Interactive Scenario Preview -->
		<section class="space-y-8">
			<div class="text-center">
				<h3 class="text-2xl font-bold mb-3 text-white">Choose Your Scenario</h3>
				<p class="text-lg opacity-80 text-white">Explore different conversation topics and practice situations</p>
			</div>
			<InteractiveScenarioPreview {selectedLanguage} />
		</section>

		<!-- Features Grid -->
		<section class="mt-16">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="card border border-base-300/20 bg-base-100/10 shadow-xl backdrop-blur-sm">
					<div class="card-body text-center">
						<div class="text-4xl mb-4">🎤</div>
						<h3 class="text-xl font-bold mb-3 text-white">Real-time Audio</h3>
						<p class="text-white/80">Practice speaking with instant AI responses using advanced speech technology</p>
					</div>
				</div>

				<div class="card border border-base-300/20 bg-base-100/10 shadow-xl backdrop-blur-sm">
					<div class="card-body text-center">
						<div class="text-4xl mb-4">🌍</div>
						<h3 class="text-xl font-bold mb-3 text-white">Multiple Languages</h3>
						<p class="text-white/80">Learn Japanese, Spanish, French, German, and more with native-like pronunciation</p>
					</div>
				</div>

				<div class="card border border-base-300/20 bg-base-100/10 shadow-xl backdrop-blur-sm">
					<div class="card-body text-center">
						<div class="text-4xl mb-4">🎯</div>
						<h3 class="text-xl font-bold mb-3 text-white">Practical Scenarios</h3>
						<p class="text-white/80">Real-world situations from ordering food to job interviews</p>
					</div>
				</div>
			</div>
		</section>
	</main>
</div>
