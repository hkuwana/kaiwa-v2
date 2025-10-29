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
	import { fly } from 'svelte/transition';

	let scrollY = $state(0);

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

	// Helper function to determine if element should show based on scroll
	function getItemYOffset(threshold: number) {
		const difference = scrollY - threshold;
		if (difference < 0) return 20;
		return Math.max(0, 20 - difference * 0.05);
	}
</script>

<svelte:head>
	<title>About Kaiwa — Build Speaking Confidence in 5 Minutes a Day</title>
	<meta
		name="description"
		content="Master real conversations with your AI language partner in just 5 minutes a day. Practice authentic scenarios for high-stakes moments that matter: meeting your partner's family, important conversations in their language. Get ready, not just prepared."
	/>
	<meta
		name="keywords"
		content="5 minute daily practice, speaking confidence, conversation practice, family connections, bilingual relationships, scenario-based learning, real conversation practice"
	/>
	<meta property="og:title" content="About Kaiwa — Build Speaking Confidence in 5 Minutes a Day" />
	<meta
		property="og:description"
		content="Practice real conversations in 5 minutes a day that connect you with the people you love. Scenario-based learning for the moments that matter."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<svelte:window bind:scrollY />

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
	<div class="container mx-auto px-4 py-16">
		<!-- Hero Section -->
		<div class="mb-16 text-center" in:fly={{ y: -20, duration: 500, delay: 200 }}>
			<h1 class="mb-4 text-5xl font-bold md:text-7xl">Have the conversations you're afraid of.</h1>
			<p class="mx-auto max-w-4xl text-xl leading-relaxed md:text-2xl">
				Practice the conversations that connect you with the people you love. No grammar drills, no
				test prep. Just real moments that matter — in their language.
			</p>
		</div>

		<!-- The Story -->
		<div class="mx-auto mb-16 max-w-4xl">
			<ul class="steps steps-vertical">
				<li class="step step-primary">
					<div
						class="ml-4 rounded-lg bg-primary/10 p-4 text-left"
						in:fly={{ y: 20, duration: 500, delay: 400 }}
					>
						<h3 class="text-lg font-bold text-primary">The Dream</h3>
						<p>
							To communicate with the people you love — their parents, grandparents, and friends —
							in their language.
						</p>
					</div>
				</li>
				<li class="step step-secondary">
					<div
						class="ml-4 rounded-lg bg-secondary/10 p-4 text-left"
						in:fly={{ y: 20, duration: 500, delay: 600 }}
					>
						<h3 class="text-lg font-bold text-secondary">The Wall</h3>
						<p>
							Generic apps drill vocab, not moments. They don’t prepare you for dinner with your
							partner’s parents, real apologies, or sharing big news.
						</p>
					</div>
				</li>

				<li class="step step-accent">
					<div
						class="ml-4 rounded-lg bg-accent/10 p-4 text-left"
						in:fly={{ y: 20, duration: 500, delay: 1000 }}
					>
						<h3 class="text-lg font-bold text-accent">The Solution: Kaiwa</h3>
						<p>
							A practice space for high‑stakes relationship conversations. Rehearse, get feedback,
							and walk into real life ready.
						</p>
					</div>
				</li>
			</ul>
		</div>

		<!-- The Kaiwa Way Section -->
		<div class="mb-16" in:fly={{ y: -20, duration: 500, delay: 200 }}>
			<h2 class="mb-8 text-center text-3xl font-bold">What Actually Gets You Ready</h2>
			<div class="flex justify-center">
				<div class="grid w-full max-w-4xl gap-8 md:grid-cols-2">
					<!-- Robotic Card -->
					<div
						class="card border border-error/30 bg-gradient-to-br from-error/20 to-error/10 shadow-lg"
						style="transform: translateY({getItemYOffset(1000)}px);"
					>
						<div class="card-body">
							<h3 class="card-title text-error" in:fly={{ y: 10, duration: 500, delay: 100 }}>
								The Old Way
							</h3>
							<ul class="space-y-3">
								<li class="flex items-center" in:fly={{ y: 10, duration: 500, delay: 200 }}>
									<span class="mr-2 icon-[mdi--robot-outline] text-xl text-error"></span><span
										>Teaches you isolated lessons</span
									>
								</li>
								<li class="flex items-center" in:fly={{ y: 10, duration: 500, delay: 300 }}>
									<span class="mr-2 icon-[mdi--book-outline] text-xl text-error"></span><span
										>Lectures about grammar</span
									>
								</li>
								<li class="flex items-center" in:fly={{ y: 10, duration: 500, delay: 400 }}>
									<span class="mr-2 icon-[mdi--gamepad-variant-outline] text-xl text-error"
									></span><span>Gamifies learning</span>
								</li>
								<li class="flex items-center" in:fly={{ y: 10, duration: 500, delay: 500 }}>
									<span class="mr-2 icon-[mdi--format-list-bulleted] text-xl text-error"
									></span><span>Expects you to memorize</span>
								</li>
							</ul>
							<div
								class="mt-3 border-t border-error/20 pt-3 font-bold text-error"
								in:fly={{ y: 10, duration: 500, delay: 600 }}
							>
								Result: You’re still outside the family.
							</div>
						</div>
					</div>

					<!-- Kaiwa Card -->
					<div
						class="card border border-accent/20 bg-gradient-to-br from-accent to-accent/70 text-accent-content shadow-2xl"
						style="transform: translateY({getItemYOffset(1000)}px);"
					>
						<div class="card-body">
							<h3 class="card-title" in:fly={{ y: 10, duration: 500, delay: 100 }}>
								The Kaiwa Way
							</h3>
							<ul class="space-y-3">
								<li class="flex items-center" in:fly={{ y: 10, duration: 500, delay: 200 }}>
									<span class="mr-2 icon-[mdi--forum-outline] text-xl"></span><span
										>Rehearses real moments (parents dinner, apology, sharing news)</span
									>
								</li>
								<li class="flex items-center" in:fly={{ y: 10, duration: 500, delay: 300 }}>
									<span class="mr-2 icon-[mdi--chat-outline] text-xl"></span><span
										>Gives feedback you can use tonight</span
									>
								</li>
								<li class="flex items-center" in:fly={{ y: 10, duration: 500, delay: 400 }}>
									<span class="mr-2 icon-[mdi--human-greeting-variant] text-xl"></span><span
										>Natural, human-like voices</span
									>
								</li>
								<li class="flex items-center" in:fly={{ y: 10, duration: 500, delay: 500 }}>
									<span class="mr-2 icon-[mdi--emoticon-happy-outline] text-xl"></span><span
										>Helps your real personality come through</span
									>
								</li>
							</ul>
							<div
								class="mt-3 border-t border-accent-content/20 pt-3 font-bold"
								in:fly={{ y: 10, duration: 500, delay: 600 }}
							>
								Result: You’re understood by the people you love.
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Call to Action -->
		<div class="text-center" in:fly={{ y: 20, duration: 500, delay: 1400 }}>
			<div
				class="mx-auto max-w-2xl rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-accent/15 p-4 shadow-lg sm:p-8"
			>
				<h2 class="mb-4 text-2xl font-bold text-primary">Ready to Have That Conversation?</h2>
				<p class="mb-6">
					Start by telling us: What's the one conversation you're dreading? We'll help you practice
					it until you're ready.
				</p>
				<div class="mb-4 text-sm text-secondary">3 minutes to get started</div>
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
