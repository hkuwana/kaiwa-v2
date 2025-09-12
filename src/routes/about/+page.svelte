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
			<h1 class="mb-6 text-5xl font-bold md:text-7xl">Languages Open Doors to Human Connection</h1>
			<p class="mx-auto max-w-4xl text-xl leading-relaxed md:text-2xl">
				The story behind Kaiwa: Why we built an AI language learning app that prioritizes meaningful conversation over test scores
			</p>
			<div class="mt-6 flex justify-center space-x-4 text-sm opacity-70">
				<span>🌍 Global Community</span>
				<span>💬 Conversation-First</span>
				<span>🤖 AI-Powered</span>
				<span>❤️ Heart-to-Heart</span>
			</div>
		</div>

		<!-- My Story -->
		<div class="mx-auto mb-16 max-w-4xl">
			<div
				class="rounded-2xl border border-primary/20 bg-secondary/30 p-8 text-secondary-content backdrop-blur-sm"
			>
				<h2 class="mb-6 text-3xl font-bold">The Problem with Traditional Language Learning</h2>
				<div class="space-y-4 leading-relaxed">
					<p>
						I always loved learning languages, but I struggled with traditional methods. Like millions of others, I tried Duolingo, attended formal classes, and memorized vocabulary lists. But I never built real confidence until I actually talked to native speakers. Despite growing up bilingual in Japanese and Chinese, my breakthrough with learning foreign languages only came when I immersed myself in real conversations during my time in Taiwan.
					</p>
					<p>
						Within 2 months of living in Taiwan, something clicked. I became conversational, played
						Mahjong with my host family, talked about life and school. It wasn't because I suddenly
						mastered grammar rules—it was because I fell in love with the learning process through
						real conversations.
					</p>
					<p>
						That's when I realized: each language is like an opening to an experience. Sure, you
						need to memorize vocabulary sometimes, but the most important part is building the
						confidence to actually use it with real people.
					</p>
					<p class="font-semibold">
						Most language apps prepare you for tests, not for touching people's hearts.
					</p>
				</div>
			</div>
		</div>

		<!-- Our Solution -->
		<div class="mx-auto mb-16 max-w-4xl">
			<h2 class="font-bold-content mb-8 text-center text-3xl">How Kaiwa Solves the Conversation Gap</h2>
			<div
				class="rounded-2xl border border-primary/20 bg-secondary/30 p-8 text-secondary-content backdrop-blur-sm"
			>
				<div class="space-y-4 leading-relaxed">
					<p>
						Kaiwa is an AI language learning platform designed for people who want to build real communication skills through conversation practice. Unlike traditional language apps that focus on vocabulary drills and grammar exercises, we prioritize the conversations that actually matter—the ones that create human connections and lasting memories.
					</p>
					<p>
						We recognize that AI will soon handle routine translations for business emails and basic interactions. But when you're laughing with friends in an izakaya in Tokyo, sharing personal stories at a tapas bar in Granada, or having heart-to-heart conversations with your in-laws in their native tongue—that's when you touch people's hearts, not just exchange information.
					</p>
					<p class="font-semibold">
						These authentic, emotional moments are what keep the human element of communication alive. Kaiwa helps you practice for these real-world scenarios through AI-powered conversation practice that prepares you for meaningful human connection.
					</p>
				</div>
			</div>
		</div>

		<!-- How We Do It -->
		<div class="mx-auto mb-16 max-w-6xl">
			<h2 class="font-bold-content mb-8 text-center text-3xl">How We Do It</h2>
			<div class="grid gap-8 md:grid-cols-3">
				<div
					class="rounded-2xl border border-primary/20 bg-secondary/30 p-6 text-secondary-content backdrop-blur-sm"
				>
					<h3 class="font-semibold-content mb-4 text-xl">Real Conversations</h3>
					<p class="">
						Practice the scenarios that actually happen: meeting your partner's parents, sharing
						personal stories, navigating emotional moments with warmth and authenticity.
					</p>
				</div>
				<div
					class="rounded-2xl border border-primary/20 bg-secondary/30 p-6 text-secondary-content backdrop-blur-sm"
				>
					<h3 class="font-semibold-content mb-4 text-xl">Conversation-First</h3>
					<p class="">
						Skip the streaks and points. Focus on building the confidence to speak naturally in
						situations that matter to you and your relationships.
					</p>
				</div>
				<div
					class="rounded-2xl border border-primary/20 bg-secondary/30 p-6 text-secondary-content backdrop-blur-sm"
				>
					<h3 class="font-semibold-content mb-4 text-xl">Learning Through Connection</h3>
					<p class="">
						We're preparing you for the beautiful, messy reality of human connection—not just
						passing tests or completing lessons.
					</p>
				</div>
			</div>
		</div>

		<!-- Why This Matters -->
		<div class="mx-auto mb-16 max-w-4xl">
			<div
				class="rounded-2xl border border-primary/20 bg-secondary/30 p-8 text-secondary-content backdrop-blur-sm"
			>
				<h2 class="mb-6 text-3xl font-bold">Why This Matters</h2>
				<div class="space-y-4 leading-relaxed">
					<p>
						Language learning isn't really about the language—it's about the doors it opens. When
						you can laugh with strangers at a local cafe, comfort someone in their mother tongue, or
						share your thoughts without needing translation, you create experiences that stick with
						you.
					</p>
					<p>
						We believe the people who use Kaiwa won't just "know" a language—they'll live it.
						They'll build relationships that wouldn't have existed otherwise and create memories
						that make all the practice worth it.
					</p>
					<p class="text-lg font-semibold">
						Because the best part of learning a language isn't the learning—it's what becomes
						possible afterward.
					</p>
				</div>
			</div>
		</div>

		<!-- Call to Action -->
		<div class="text-center">
			<div
				class="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-secondary/30 p-8 text-secondary-content"
			>
				<h2 class="mb-4 text-2xl font-bold">Ready to start exploring?</h2>
				<p class="mb-6">
					Begin building the conversations that will create your next great memory.
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
