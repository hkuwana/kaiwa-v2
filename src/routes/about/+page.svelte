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

	let scrollY = 0;

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
	<meta
		name="keywords"
		content="Kaiwa story, about Kaiwa, language learning philosophy, conversation-first language learning, AI voice practice"
	/>
	<meta property="og:title" content="About Kaiwa" />
	<meta
		property="og:description"
		content="Why we built Kaiwa: a conversation-first approach focused on meaningful human connection."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<svelte:window bind:scrollY />

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
	<div class="container mx-auto px-4 py-16">
		<!-- Hero Section -->
		<div class="mb-16 text-center" in:fly={{ y: -20, duration: 500, delay: 200 }}>
			<h1 class="mb-4 text-5xl font-bold md:text-7xl">Your personality is not a translation.</h1>
			<p class="mx-auto max-w-4xl text-xl leading-relaxed md:text-2xl">
				Language tools have become robotic. We're making them human again.
			</p>
		</div>

		<!-- The Story -->
		<div class="mx-auto mb-16 max-w-4xl">
			<ul class="steps steps-vertical">
				<li class="step step-primary">
					<div class="p-4 text-left" in:fly={{ y: 20, duration: 500, delay: 400 }}>
						<h3 class="text-lg font-bold">The Dream</h3>
						<p>
							To connect with the people we love, in their language. To make their family laugh.
						</p>
					</div>
				</li>
				<li class="step step-primary">
					<div class="p-4 text-left" in:fly={{ y: 20, duration: 500, delay: 600 }}>
						<h3 class="text-lg font-bold">The Wall</h3>
						<p>
							Language apps felt disconnected with practical needs and too gamified or uncreative.
							Robotic voices, points, streaks.
						</p>
					</div>
				</li>

				<li class="step">
					<div class="p-4 text-left" in:fly={{ y: 20, duration: 500, delay: 1000 }}>
						<h3 class="text-lg font-bold">The Solution: Kaiwa</h3>
						<p>
							So we built a conversation partner. A place for the messy, real talks that build
							relationships.
						</p>
					</div>
				</li>
			</ul>
		</div>

		<!-- Visual Comparison Section -->
		<div class="mb-16" in:fly={{ y: 20, duration: 500, delay: 1200 }}>
			<h2 class="mb-8 text-center text-3xl font-bold">What Went Wrong With Language Apps?</h2>
			<div class="flex justify-center">
				<div class="grid w-full max-w-4xl gap-8 md:grid-cols-2">
					<div
						class="card bg-base-300/50 shadow-lg transition-transform duration-200 ease-out"
						style="transform: translateY({scrollY * 0.03}px);"
					>
						<div class="card-body">
							<h3 class="card-title text-error">The "Old Way"</h3>
							<ul class="space-y-3 opacity-70">
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--robot-outline] text-xl"></span><span
										>Robotic voices</span
									>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--gamepad-variant-outline] text-xl"></span><span
										>Points, streaks, and games</span
									>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--file-document-outline] text-xl"></span><span
										>Sterile translations</span
									>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--format-list-bulleted] text-xl"></span><span
										>Memorizing lists</span
									>
								</li>
							</ul>
							<div
								class="mt-3 border-t border-base-content/10 pt-3 font-bold text-error-content/80"
							>
								Result: You sound like a textbook.
							</div>
						</div>
					</div>
					<div
						class="card bg-primary text-primary-content shadow-xl transition-transform duration-200 ease-out"
						style="transform: translateY({scrollY * -0.03}px);"
					>
						<div class="card-body">
							<h3 class="card-title">The Kaiwa Way</h3>
							<ul class="space-y-3">
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--human-greeting-variant] text-xl"></span><span
										>Natural, human-like voices</span
									>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--forum-outline] text-xl"></span><span
										>Real conversations</span
									>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--heart-outline] text-xl"></span><span
										>Emotional connection</span
									>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--emoticon-happy-outline] text-xl"></span><span
										>Sharing your actual personality</span
									>
								</li>
							</ul>
							<div class="mt-3 border-t border-primary-content/20 pt-3 font-bold">
								Result: You sound like you.
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Call to Action -->
		<div class="text-center" in:fly={{ y: 20, duration: 500, delay: 1400 }}>
			<div class="mx-auto max-w-2xl rounded-2xl border p-4 sm:p-8">
				<h2 class="mb-4 text-2xl font-bold">Ready to Connect?</h2>
				<p class="mb-6">Practice the conversations that will define your relationships.</p>
				<div class="mb-4 text-sm">Get your speaking level assessed in 3 minutes</div>
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
