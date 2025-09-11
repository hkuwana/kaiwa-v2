<script lang="ts">
	import { onMount } from 'svelte';
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { Scenario } from '$lib/server/db/types';
	import { track } from '$lib/analytics/posthog';
	import ShareKaiwa from '$lib/components/ShareKaiwa.svelte';

	// Page title
	onMount(() => {
		document.title = 'About - Kaiwa';
	});

	// Current user
	const user = userManager.user;

	// Local state for CTA selectors
	let selectedLanguage = $state<DataLanguage | null>(settingsStore.selectedLanguage);
	let selectedSpeaker = $state<string | null>(settingsStore.selectedSpeaker);
	let selectedScenario = $state<Scenario | null>(scenarioStore.getSelectedScenario());

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

	function handleAboutStartClick() {
		track('about_cta_clicked', {
			source: 'about_page',
			user_type: user && user.id !== 'guest' ? 'logged_in' : 'guest'
		});
	}
</script>

<svelte:head>
	<title>About - Kaiwa</title>
	<meta
		name="description"
		content="About Kaiwa and the philosophy behind the anti-language-learning app."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-accent">
	<div class="container mx-auto px-4 py-16">
		<!-- Hero Section -->
		<div class="mb-16 text-center">
			<h1 class="mb-6 text-5xl font-bold md:text-7xl">Only Immersion works</h1>
			<p class="mx-auto max-w-4xl text-xl leading-relaxed md:text-2xl">
				Why I started creating the anti-language-learning app
			</p>
		</div>

		<!-- Founder's Philosophy -->
		<div class="mx-auto mb-16 max-w-4xl">
			<div
				class="rounded-2xl border border-primary/20 bg-secondary/30 p-8 text-secondary-content backdrop-blur-sm"
			>
				<h2 class="mb-6 text-3xl font-bold">A Founder's Philosophy</h2>
				<div class="space-y-4 leading-relaxed">
					<p class="text-lg">
						I think there's only one thing you can take to the afterlife: the wild experiences
						you've lived and the memories that come with it.
					</p>
					<p>
						This philosophy is at the heart of everything we do at Kaiwa. While other language apps
						focus on achievements, progress bars, and certifications, we focus on something far more
						valuable: the ability to create meaningful experiences through real communication.
					</p>
					<p>
						When you're comforting your grandmother in her native language, or expressing your love
						to your partner without translation, or connecting with family members you've never
						really spoken to—these are the moments that matter. These are the experiences that shape
						who you are and create the memories you'll carry with you.
					</p>
					<p class="font-semibold">
						Kaiwa isn't about passing tests. It's about living fully in the language you're
						learning.
					</p>
				</div>
			</div>
		</div>

		<!-- The Problem We're Solving -->
		<div class="mx-auto mb-16 max-w-4xl">
			<h2 class="font-bold-content mb-8 text-center text-3xl">The Problem We're Solving</h2>
			<div
				class="rounded-2xl border border-primary/20 bg-secondary/30 p-8 text-secondary-content backdrop-blur-sm"
			>
				<div class="space-y-4 leading-relaxed">
					<p>
						Traditional language learning apps teach you to say "the pen is on the table" but not "I
						love you" or "I'm sorry." They prepare you for hypothetical conversations in perfect
						grammar, but leave you helpless when real relationships get emotional.
					</p>
					<p>
						We've all been there: you've studied a language for years, you can conjugate verbs
						perfectly, you have a 500-day streak on Duolingo. But when your partner's family asks
						about your intentions, you panic. When your grandmother is crying and you want to
						comfort her, you don't know how. When you need to express your real feelings, you
						freeze.
					</p>
					<p class="font-semibold">
						This is the gap Kaiwa fills. We prepare you for the conversations you'll actually have,
						not the ones in textbooks.
					</p>
				</div>
			</div>
		</div>

		<!-- Our Approach -->
		<div class="mx-auto mb-16 max-w-6xl">
			<h2 class="font-bold-content mb-8 text-center text-3xl">Our Approach</h2>
			<div class="grid gap-8 md:grid-cols-3">
				<div
					class="rounded-2xl border border-primary/20 bg-secondary/30 p-6 text-secondary-content backdrop-blur-sm"
				>
					<h3 class="font-semibold-content mb-4 text-xl">Real Situations</h3>
					<p class="">
						We focus on the conversations you'll actually have: meeting your partner's parents,
						comforting family members, expressing your feelings, handling emotional moments.
					</p>
				</div>
				<div
					class="rounded-2xl border border-primary/20 bg-secondary/30 p-6 text-secondary-content backdrop-blur-sm"
				>
					<h3 class="font-semibold-content mb-4 text-xl">No Gamification</h3>
					<p class="">
						No points, no streaks, no certificates. Just the satisfaction of being able to handle
						real situations when they matter most.
					</p>
				</div>
				<div
					class="rounded-2xl border border-primary/20 bg-secondary/30 p-6 text-secondary-content backdrop-blur-sm"
				>
					<h3 class="font-semibold-content mb-4 text-xl">Survival Focus</h3>
					<p class="">
						We're not preparing you for a test. We're preparing you for life. For the messy,
						chaotic, beautiful reality of actually using the language you care about.
					</p>
				</div>
			</div>
		</div>

		<!-- The Vision -->
		<div class="mx-auto mb-16 max-w-4xl">
			<div
				class="rounded-2xl border border-primary/20 bg-secondary/30 p-8 text-secondary-content backdrop-blur-sm"
			>
				<h2 class="mb-6 text-3xl font-bold">The Vision</h2>
				<div class="space-y-4 leading-relaxed">
					<p>
						Imagine a world where language learning isn't about accumulating knowledge, but about
						building the confidence to create experiences. Where every conversation you have in your
						partner's language becomes a memory you'll treasure, not just another lesson completed.
					</p>
					<p>
						We envision Kaiwa users who don't just "know" a language—they live it. They connect with
						family members they've never really spoken to, build relationships without translation
						apps, and create the kind of deep, authentic connections that make life worth living.
					</p>
					<p class="text-lg font-semibold">
						Because at the end of the day, it's not about what you've learned—it's about what you've
						lived.
					</p>
				</div>
			</div>
		</div>

		<!-- Call to Action -->
		<div class="text-center">
			<div
				class="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-secondary/30 p-8 text-secondary-content backdrop-blur-sm"
			>
				<h2 class="mb-4 text-2xl font-bold">Ready to Start trying?</h2>
				<p class="mb-6">
					Stop passive sessions. Start active learning. Create experiences that matter.
				</p>
				<div class="mb-4 text-sm">Try our free 3‑minute onboarding</div>
				<UnifiedStartButton
					{user}
					{selectedLanguage}
					{selectedSpeaker}
					{selectedScenario}
					onLanguageChange={handleLanguageChange}
					onSpeakerChange={handleSpeakerChange}
					onScenarioChange={handleScenarioChange}
					onStartClick={handleAboutStartClick}
				/>
			</div>
		</div>

		<!-- Share Block -->
		<div class="mt-8 text-center">
			<div class="mx-auto max-w-2xl">
				<ShareKaiwa source="about_page" />
			</div>
		</div>
	</div>
</div>
