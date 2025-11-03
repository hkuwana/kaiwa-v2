<script lang="ts">
	import { onMount } from 'svelte';
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { Scenario } from '$lib/server/db/types';
	import { track } from '$lib/analytics/posthog';
	import InteractiveScenarioPreview from '$lib/features/scenarios/components/InteractiveScenarioPreview.svelte';
	import { fade } from 'svelte/transition';

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

	onMount(() => {
		document.title = 'About - Kaiwa';
	});
</script>

<svelte:head>
	<title>About Kaiwa</title>
	<meta
		name="description"
		content="Practice real conversations. Build genuine confidence. Connect with the people who matter."
	/>
</svelte:head>

<div class="bg-base-100">
	<!-- Hero -->
	<section class="mx-auto max-w-5xl px-6 pt-32 pb-32 text-center md:pt-40 md:pb-48">
		<h1
			class="mb-8 text-5xl leading-tight font-light tracking-tight md:text-7xl"
			in:fade={{ duration: 800 }}
		>
			Real conversations.<br />Real confidence.
		</h1>
		<p
			class="mx-auto max-w-2xl text-xl leading-relaxed font-light tracking-wide opacity-70 md:text-2xl"
			in:fade={{ duration: 800, delay: 200 }}
		>
			Practice the moments that matter with someone who listens without judgment.
		</p>
	</section>

	<!-- The Why -->
	<section class="bg-base-200/30 py-24 md:py-32">
		<div class="mx-auto max-w-4xl px-6">
			<div class="space-y-20">
				<!-- Problem -->
				<div class="text-center">
					<h2 class="mb-6 text-3xl font-light tracking-tight md:text-4xl">
						Most apps teach vocabulary.
					</h2>
					<p class="mx-auto max-w-2xl text-lg leading-relaxed font-light opacity-70 md:text-xl">
						But knowing words doesn't prepare you for the conversation with your partner's parents.
						For the apology you need to make. For the moment that matters.
					</p>
				</div>

				<!-- Solution -->
				<div class="text-center">
					<h2 class="mb-6 text-3xl font-light tracking-tight md:text-4xl">
						Kaiwa teaches conversations.
					</h2>
					<p class="mx-auto max-w-2xl text-lg leading-relaxed font-light opacity-70 md:text-xl">
						Practice real scenarios. Get immediate feedback. Build the confidence to show up as
						yourself, in their language.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Craft Your Adventure -->
	<section class="py-24 md:py-32">
		<div class="mx-auto max-w-6xl px-6">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-light tracking-tight md:text-4xl">Craft your practice</h2>
				<p class="mx-auto max-w-2xl text-lg leading-relaxed font-light opacity-70">
					Every conversation is unique. Choose the place, the mood, the moment.
				</p>
			</div>
			<InteractiveScenarioPreview {selectedLanguage} />
		</div>
	</section>

	<!-- Principles -->
	<section class="bg-base-200/30 py-24 md:py-32">
		<div class="mx-auto max-w-5xl px-6">
			<div class="mb-20 text-center">
				<h2 class="text-3xl font-light tracking-tight md:text-4xl">Designed for connection</h2>
			</div>

			<div class="grid gap-16 md:grid-cols-2 md:gap-20">
				<!-- Principle 1 -->
				<div class="text-center md:text-left">
					<div class="mb-4 text-6xl font-thin opacity-20">01</div>
					<h3 class="mb-4 text-2xl font-light tracking-tight">Conversation-first</h3>
					<p class="leading-relaxed font-light opacity-70">
						No flashcards. No drills. Just natural dialogue that teaches you how language is
						actually spoken.
					</p>
				</div>

				<!-- Principle 2 -->
				<div class="text-center md:text-left">
					<div class="mb-4 text-6xl font-thin opacity-20">02</div>
					<h3 class="mb-4 text-2xl font-light tracking-tight">Judgment-free</h3>
					<p class="leading-relaxed font-light opacity-70">
						Practice without fear. Your AI partner listens with patience, offering feedback that
						builds confidence.
					</p>
				</div>

				<!-- Principle 3 -->
				<div class="text-center md:text-left">
					<div class="mb-4 text-6xl font-thin opacity-20">03</div>
					<h3 class="mb-4 text-2xl font-light tracking-tight">Scenario-based</h3>
					<p class="leading-relaxed font-light opacity-70">
						From dinner conversations to deep apologies, practice moments that reflect your real
						life.
					</p>
				</div>

				<!-- Principle 4 -->
				<div class="text-center md:text-left">
					<div class="mb-4 text-6xl font-thin opacity-20">04</div>
					<h3 class="mb-4 text-2xl font-light tracking-tight">Always available</h3>
					<p class="leading-relaxed font-light opacity-70">
						Practice anywhere, anytime. Five minutes on your commute. Twenty minutes before dinner.
						When you're ready.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- The Difference -->
	<section class="py-24 md:py-32">
		<div class="mx-auto max-w-3xl px-6">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-light tracking-tight md:text-4xl">A different approach</h2>
			</div>

			<div class="space-y-8">
				<!-- Row 1 -->
				<div class="grid gap-8 md:grid-cols-2">
					<div class="rounded-2xl bg-base-200/50 p-8 text-center">
						<h3 class="mb-2 font-light opacity-50">Traditional apps</h3>
						<p class="text-lg font-light">Teach you lessons</p>
					</div>
					<div class="rounded-2xl bg-base-content/5 p-8 text-center">
						<h3 class="mb-2 font-light opacity-50">Kaiwa</h3>
						<p class="text-lg font-light">Rehearses real moments</p>
					</div>
				</div>

				<!-- Row 2 -->
				<div class="grid gap-8 md:grid-cols-2">
					<div class="rounded-2xl bg-base-200/50 p-8 text-center">
						<p class="text-lg font-light">Focus on memorization</p>
					</div>
					<div class="rounded-2xl bg-base-content/5 p-8 text-center">
						<p class="text-lg font-light">Focus on understanding</p>
					</div>
				</div>

				<!-- Row 3 -->
				<div class="grid gap-8 md:grid-cols-2">
					<div class="rounded-2xl bg-base-200/50 p-8 text-center">
						<p class="text-lg font-light">Generic scenarios</p>
					</div>
					<div class="rounded-2xl bg-base-content/5 p-8 text-center">
						<p class="text-lg font-light">Your life, your moments</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="bg-base-200/30 py-24 md:py-32">
		<div class="mx-auto max-w-3xl px-6 text-center">
			<h2 class="mb-6 text-3xl font-light tracking-tight md:text-4xl">Begin your practice</h2>
			<p class="mb-12 text-lg leading-relaxed font-light opacity-70">
				Three minutes to your first conversation.
			</p>
			<div class="mx-auto max-w-md">
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
	</section>

	<!-- Early Access -->
	<section class="py-24 md:py-32">
		<div class="mx-auto max-w-4xl px-6 text-center">
			<h2 class="mb-12 text-2xl font-light tracking-tight md:text-3xl">
				Built with early learners
			</h2>
			<div class="grid gap-12 md:grid-cols-2">
				<div>
					<div class="mb-6 text-5xl font-thin opacity-30">🎯</div>
					<h3 class="mb-3 text-xl font-light">Your feedback shapes this</h3>
					<p class="leading-relaxed font-light opacity-70">
						We're building with the first 100 users. What matters to you matters to us.
					</p>
				</div>
				<div>
					<div class="mb-6 text-5xl font-thin opacity-30">💬</div>
					<h3 class="mb-3 text-xl font-light">Focus on relationships</h3>
					<p class="leading-relaxed font-light opacity-70">
						Especially conversations with your partner's family. We understand that anxiety.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<section class="border-t border-base-content/10 py-16">
		<div class="mx-auto max-w-4xl px-6 text-center">
			<p class="font-light opacity-50">Questions? Email support@trykaiwa.com</p>
		</div>
	</section>
</div>
