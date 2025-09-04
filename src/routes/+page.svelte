<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import LanguageStartButton from '$lib/components/LanguageStartButton.svelte';
	import ScenarioStartButton from '$lib/components/ScenarioStartButton.svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { getFeatureFlag, trackABTest } from '$lib/analytics/posthog';

	// Get user data from page data
	const user = userManager.user;

	// A/B Testing for headlines
	const headlineVariants = {
		original: 'Stop Learning. Start Talking.',
		cure: 'The cure for the common language app.',
		onePercent: 'For the 1% of learners who will actually become speakers.'
	};

	// Get the headline variant from PostHog feature flag
	let headlineVariant = $state('original');
	let headlineText = $state(headlineVariants.original);

	// Initialize A/B test on client side
	if (browser) {
		// Get the feature flag value
		const variant = getFeatureFlag('headline_ab_test');

		// Map feature flag values to our variants
		let currentVariant = 'original';
		let currentText = headlineVariants.original;

		if (variant === 'cure') {
			currentVariant = 'cure';
			currentText = headlineVariants.cure;
		} else if (variant === 'one_percent') {
			currentVariant = 'onePercent';
			currentText = headlineVariants.onePercent;
		}

		// Update state
		headlineVariant = currentVariant;
		headlineText = currentText;

		// Track which variant the user saw
		trackABTest.headlineVariantShown(currentVariant, currentText);
	}

	// Function to track when user clicks start speaking
	function trackStartSpeakingClick() {
		// Get current values to avoid state reference issues
		const currentVariant = headlineVariant;
		const currentText = headlineText;
		const userType = user ? 'logged_in' : 'guest';

		trackABTest.startSpeakingClicked(currentVariant, currentText, userType);
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
					<ScenarioStartButton />
				{:else}
					<p class="mb-6 text-xl opacity-90">Learn languages through AI-assisted conversations</p>
					<ScenarioStartButton forceOnboarding={true} />
				{/if}
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
				{#if user && user.id !== 'guest'}
					<ScenarioStartButton />
					<p class="mt-4 text-lg opacity-80">Experience scenarios and onboarding</p>
				{:else}
					<ScenarioStartButton forceOnboarding={true} />
					<p class="mt-4 text-lg opacity-80">Experience onboarding - sign up for full access</p>
				{/if}
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
