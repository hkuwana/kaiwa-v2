<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import { getFeatureFlag, trackABTest } from '$lib/analytics/posthog';
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
		variant9: 'AI partner for messy conversations.',
		variant10: 'The conversation app Japan needed.'
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

	function handleScenarioStart(scenario: Scenario) {
		console.log('Starting scenario:', scenario.title);
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
	{#if dev}
		<main class="container mx-auto px-4 py-8">
			<div class="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
				<div class="card border border-base-300/20 bg-base-100/10 shadow-xl backdrop-blur-sm">
					<div class="card-body">
						<h3 class="mb-4 card-title text-2xl text-warning">🚀 3-Day MVP Architecture</h3>
						<p class="mb-4">Clean, simple, and maintainable codebase with three clear layers:</p>
						<ul class="space-y-2">
							<li class="flex items-center gap-2">
								<span class="badge badge-sm badge-primary">Services</span>
								<span>Business logic (WebRTC, Audio, Conversation)</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="badge badge-sm badge-secondary">Stores</span>
								<span>State management with Svelte 5 runes</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="badge badge-sm badge-accent">Components</span>
								<span>UI that displays data and calls actions</span>
							</li>
						</ul>
					</div>
				</div>

				<div class="card border border-base-300/20 bg-base-100/10 shadow-xl backdrop-blur-sm">
					<div class="card-body">
						<h3 class="mb-4 card-title text-2xl text-warning">🎤 Real-time Audio</h3>
						<p>Practice speaking with instant AI responses using WebRTC technology.</p>
					</div>
				</div>

				<div class="card border border-base-300/20 bg-base-100/10 shadow-xl backdrop-blur-sm">
					<div class="card-body">
						<h3 class="mb-4 card-title text-2xl text-warning">🌍 Multiple Languages</h3>
						<p>
							Learn English, Japanese, Spanish, German, and more with native-like pronunciation.
						</p>
					</div>
				</div>
			</div>

			<div class="my-12 text-center">
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
						Experience scenarios and onboarding
					{:else}
						Experience onboarding - sign up for full access
					{/if}
				</p>
			</div>

			<div class="card border border-base-300/20 bg-base-100/10 p-8 shadow-xl backdrop-blur-sm">
				<h3 class="mb-8 text-center text-3xl font-bold text-warning">🏗️ Architecture Benefits</h3>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					<div class="text-center">
						<div class="placeholder avatar mb-4">
							<div class="w-16 rounded-full bg-warning/20 text-warning">
								<span class="text-2xl">🧠</span>
							</div>
						</div>
						<h4 class="mb-2 text-lg font-semibold text-warning">Simple Mental Model</h4>
						<p class="text-sm opacity-90">Three clear layers: Services → Stores → Components</p>
					</div>
					<div class="text-center">
						<div class="placeholder avatar mb-4">
							<div class="w-16 rounded-full bg-warning/20 text-warning">
								<span class="text-2xl">🔧</span>
							</div>
						</div>
						<h4 class="mb-2 text-lg font-semibold text-warning">Easy to Change</h4>
						<p class="text-sm opacity-90">Modify one layer without breaking others</p>
					</div>
					<div class="text-center">
						<div class="placeholder avatar mb-4">
							<div class="w-16 rounded-full bg-warning/20 text-warning">
								<span class="text-2xl">🐛</span>
							</div>
						</div>
						<h4 class="mb-2 text-lg font-semibold text-warning">Easy to Debug</h4>
						<p class="text-sm opacity-90">Clear data flow and separation of concerns</p>
					</div>
					<div class="text-center">
						<div class="placeholder avatar mb-4">
							<div class="w-16 rounded-full bg-warning/20 text-warning">
								<span class="text-2xl">⚡</span>
							</div>
						</div>
						<h4 class="mb-2 text-lg font-semibold text-warning">Fast Development</h4>
						<p class="text-sm opacity-90">No complex event buses or orchestrators</p>
					</div>
				</div>
			</div>
		</main>
	{/if}
</div>
