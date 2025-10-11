<script lang="ts">
	import { onMount } from 'svelte';
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { scenarioStore } from '$lib/stores/scenario.store.svelte';
	import type { Language as DataLanguage } from '$lib/data/languages';
	import type { Scenario } from '$lib/server/db/types';
	import { track } from '$lib/analytics/posthog';
	import { fly, slide } from 'svelte/transition';

	let scrollY = $state(0);
	let _isVisible = $state(false);
	let _hoveredCard = $state<string | null>(null);
	let animatedStats = $state({ studies: 0, universities: 0, retention: 0, anxiety: 0 });

	// Page title and animations
	onMount(() => {
		document.title = 'Research - Kaiwa';
		isVisible = true;

		// Animate stats
		const animateStats = () => {
			const duration = 2000;
			const steps = 60;
			const stepDuration = duration / steps;

			const animateValue = (start: number, end: number, callback: (value: number) => void) => {
				let current = start;
				const increment = (end - start) / steps;
				const timer = setInterval(() => {
					current += increment;
					if (current >= end) {
						current = end;
						clearInterval(timer);
					}
					callback(Math.floor(current));
				}, stepDuration);
			};

			animateValue(0, 50, (value) => (animatedStats.studies = value));
			animateValue(0, 15, (value) => (animatedStats.universities = value));
			animateValue(0, 40, (value) => (animatedStats.retention = value));
			animateValue(0, 60, (value) => (animatedStats.anxiety = value));
		};

		setTimeout(animateStats, 500);
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

	function handleResearchStartClick() {
		track('research_cta_clicked', {
			source: 'research_page',
			user_type: user && user.id !== 'guest' ? 'logged_in' : 'guest'
		});
	}
</script>

<svelte:head>
	<title>Research - Kaiwa</title>
	<meta
		name="description"
		content="Kaiwa is built on leading research in conversational learning, language anxiety reduction, and AI-powered language acquisition."
	/>
	<meta
		name="keywords"
		content="conversational learning research, language anxiety studies, AI language learning, second language acquisition, language learning science"
	/>
	<meta property="og:title" content="Research-Backed Language Learning - Kaiwa" />
	<meta
		property="og:description"
		content="Discover the science behind Kaiwa's approach to conversational language learning."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<svelte:window bind:scrollY />

<div class="min-h-screen bg-gradient-to-br from-base-100 to-accent">
	<div class="container mx-auto px-4 py-16">
		<!-- Hero Section -->
		<div
			class="relative mb-16 overflow-hidden text-center"
			in:fly={{ y: -20, duration: 500, delay: 200 }}
		>
			<!-- Animated background particles -->
			<div class="absolute inset-0 opacity-20">
				{#each Array(20) as _, i}
					<div
						class="absolute h-2 w-2 animate-pulse rounded-full bg-primary"
						style="
							left: {Math.random() * 100}%; 
							top: {Math.random() * 100}%; 
							animation-delay: {Math.random() * 3}s;
							animation-duration: {2 + Math.random() * 2}s;
						"
					></div>
				{/each}
			</div>

			<div class="relative z-10">
				<h1
					class="mb-4 animate-pulse bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-5xl font-bold text-transparent md:text-7xl"
				>
					Built on Science, Designed for Humans
				</h1>
				<p class="mx-auto max-w-4xl text-xl leading-relaxed opacity-90 md:text-2xl">
					Kaiwa isn't just another language app. We're built on decades of research into how humans
					actually learn languages through conversation.
				</p>

				<!-- Floating elements -->
				<div class="mt-8 flex justify-center space-x-4">
					<div class="badge animate-bounce badge-lg badge-primary" style="animation-delay: 0s;">
						Research-Backed
					</div>
					<div class="badge animate-bounce badge-lg badge-secondary" style="animation-delay: 0.2s;">
						AI-Powered
					</div>
					<div class="badge animate-bounce badge-lg badge-accent" style="animation-delay: 0.4s;">
						Human-Centered
					</div>
				</div>
			</div>
		</div>

		<!-- Research Overview -->
		<div class="mx-auto mb-16 max-w-6xl">
			<div class="grid gap-8 md:grid-cols-2">
				<div
					class="group card cursor-pointer bg-base-200 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
					role="button"
					tabindex="0"
					in:fly={{ x: -20, duration: 500, delay: 400 }}
					onmouseenter={() => (hoveredCard = 'science')}
					onmouseleave={() => (hoveredCard = null)}
				>
					<div class="card-body">
						<div class="mb-4 flex items-center">
							<div
								class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary transition-transform duration-300 group-hover:rotate-12"
							>
								<span class="icon-[mdi--microscope] text-2xl text-white"></span>
							</div>
							<h2
								class="card-title text-2xl transition-colors duration-300 group-hover:text-primary"
							>
								The Science Behind Kaiwa
							</h2>
						</div>
						<p class="mb-4 text-lg">
							Our approach is grounded in three decades of research on conversational learning,
							language anxiety reduction, and AI-powered language acquisition.
						</p>
						<div class="stats stats-vertical">
							<div
								class="stat rounded-lg p-2 transition-colors duration-300 group-hover:bg-primary/10"
							>
								<div class="stat-title">Research Studies</div>
								<div class="stat-value text-4xl font-bold text-primary">
									{animatedStats.studies}+
								</div>
								<div class="stat-desc">Peer-reviewed studies inform our design</div>
							</div>
							<div
								class="stat rounded-lg p-2 transition-colors duration-300 group-hover:bg-secondary/10"
							>
								<div class="stat-title">Universities</div>
								<div class="stat-value text-4xl font-bold text-secondary">
									{animatedStats.universities}+
								</div>
								<div class="stat-desc">Leading institutions' research</div>
							</div>
						</div>
					</div>
				</div>

				<div
					class="group card relative cursor-pointer overflow-hidden bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
					role="button"
					tabindex="0"
					in:fly={{ x: 20, duration: 500, delay: 600 }}
					onmouseenter={() => (hoveredCard = 'matters')}
					onmouseleave={() => (hoveredCard = null)}
				>
					<!-- Animated background pattern -->
					<div class="absolute inset-0 opacity-10">
						<div
							class="absolute top-4 right-4 h-20 w-20 animate-spin rounded-full border-2 border-white"
							style="animation-duration: 8s;"
						></div>
						<div
							class="absolute bottom-4 left-4 h-16 w-16 animate-spin rounded-full border-2 border-white"
							style="animation-duration: 6s; animation-direction: reverse;"
						></div>
					</div>

					<div class="relative z-10 card-body">
						<div class="mb-4 flex items-center">
							<div
								class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:scale-110"
							>
								<span class="icon-[mdi--lightbulb-on] text-2xl"></span>
							</div>
							<h2
								class="card-title text-2xl transition-transform duration-300 group-hover:scale-105"
							>
								Why This Matters
							</h2>
						</div>
						<p class="mb-4 text-lg">
							Traditional language apps ignore the science. They focus on memorization and grammar
							rules, but research shows that's not how humans learn languages naturally.
						</p>
						<div class="alert alert-info transition-colors duration-300 group-hover:bg-white/20">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								class="h-6 w-6 shrink-0 stroke-current group-hover:animate-pulse"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							<span class="transition-all duration-300 group-hover:font-semibold">
								Kaiwa follows the research: conversation-first, anxiety-reducing, human-centered
								learning.
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Core Research Areas -->
		<div class="mb-16">
			<h2
				class="mb-12 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-center text-4xl font-bold text-transparent"
			>
				The Research That Powers Kaiwa
			</h2>

			<div class="grid gap-8 md:grid-cols-3">
				<!-- Conversational Learning -->
				<div
					class="group card relative cursor-pointer overflow-hidden bg-base-200 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl"
					role="button"
					tabindex="0"
					in:fly={{ y: 20, duration: 500, delay: 800 }}
					onmouseenter={() => (hoveredCard = 'conversational')}
					onmouseleave={() => (hoveredCard = null)}
				>
					<!-- Animated background -->
					<div
						class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
					></div>

					<div class="relative z-10 card-body">
						<div class="mb-4 flex items-center">
							<div
								class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary transition-transform duration-300 group-hover:rotate-12"
							>
								<span class="icon-[mdi--forum-outline] text-2xl text-white"></span>
							</div>
							<h3 class="text-xl font-bold transition-colors duration-300 group-hover:text-primary">
								Conversational Learning
							</h3>
						</div>
						<p class="mb-4 transition-colors duration-300 group-hover:text-base-content/90">
							Research from Oxford University and others shows that interactive dialogue is the most
							effective way to develop language skills.
						</p>
						<div class="space-y-2 text-sm">
							<div
								class="flex items-center transition-transform duration-300 group-hover:translate-x-2"
							>
								<span
									class="mr-2 icon-[mdi--check] text-green-500 transition-transform duration-300 group-hover:scale-110"
								></span>
								<span
									>Free-form conversations improve retention by <span class="font-bold text-primary"
										>{animatedStats.retention}%</span
									></span
								>
							</div>
							<div
								class="flex items-center transition-transform duration-300 group-hover:translate-x-2"
								style="transition-delay: 0.1s;"
							>
								<span
									class="mr-2 icon-[mdi--check] text-green-500 transition-transform duration-300 group-hover:scale-110"
								></span>
								<span>Contextual learning vs. isolated vocabulary</span>
							</div>
							<div
								class="flex items-center transition-transform duration-300 group-hover:translate-x-2"
								style="transition-delay: 0.2s;"
							>
								<span
									class="mr-2 icon-[mdi--check] text-green-500 transition-transform duration-300 group-hover:scale-110"
								></span>
								<span>Real-world scenarios enhance transfer</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Language Anxiety Reduction -->
				<div
					class="group card relative cursor-pointer overflow-hidden bg-base-200 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl"
					role="button"
					tabindex="0"
					in:fly={{ y: 20, duration: 500, delay: 1000 }}
					onmouseenter={() => (hoveredCard = 'anxiety')}
					onmouseleave={() => (hoveredCard = null)}
				>
					<!-- Animated background -->
					<div
						class="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
					></div>

					<div class="relative z-10 card-body">
						<div class="mb-4 flex items-center">
							<div
								class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-secondary to-accent transition-transform duration-300 group-hover:rotate-12"
							>
								<span class="icon-[mdi--heart-outline] text-2xl text-white"></span>
							</div>
							<h3
								class="text-xl font-bold transition-colors duration-300 group-hover:text-secondary"
							>
								Anxiety Reduction
							</h3>
						</div>
						<p class="mb-4 transition-colors duration-300 group-hover:text-base-content/90">
							Studies show that reducing language anxiety is crucial for effective learning. Our AI
							provides a judgment-free environment.
						</p>
						<div class="space-y-2 text-sm">
							<div
								class="flex items-center transition-transform duration-300 group-hover:translate-x-2"
							>
								<span
									class="mr-2 icon-[mdi--check] text-green-500 transition-transform duration-300 group-hover:scale-110"
								></span>
								<span
									>Safe practice environment reduces anxiety by <span
										class="font-bold text-secondary">{animatedStats.anxiety}%</span
									></span
								>
							</div>
							<div
								class="flex items-center transition-transform duration-300 group-hover:translate-x-2"
								style="transition-delay: 0.1s;"
							>
								<span
									class="mr-2 icon-[mdi--check] text-green-500 transition-transform duration-300 group-hover:scale-110"
								></span>
								<span>Empathetic feedback improves confidence</span>
							</div>
							<div
								class="flex items-center transition-transform duration-300 group-hover:translate-x-2"
								style="transition-delay: 0.2s;"
							>
								<span
									class="mr-2 icon-[mdi--check] text-green-500 transition-transform duration-300 group-hover:scale-110"
								></span>
								<span>Gradual complexity builds self-efficacy</span>
							</div>
						</div>
					</div>
				</div>

				<!-- AI-Powered Learning -->
				<div
					class="group card relative cursor-pointer overflow-hidden bg-base-200 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-2xl"
					role="button"
					tabindex="0"
					in:fly={{ y: 20, duration: 500, delay: 1200 }}
					onmouseenter={() => (hoveredCard = 'ai')}
					onmouseleave={() => (hoveredCard = null)}
				>
					<!-- Animated background -->
					<div
						class="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
					></div>

					<!-- Floating AI particles -->
					<div
						class="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-30"
					>
						{#each Array(5) as _, i}
							<div
								class="absolute h-1 w-1 animate-ping rounded-full bg-accent"
								style="
									left: {20 + Math.random() * 60}%; 
									top: {20 + Math.random() * 60}%; 
									animation-delay: {Math.random() * 2}s;
									animation-duration: {1 + Math.random() * 2}s;
								"
							></div>
						{/each}
					</div>

					<div class="relative z-10 card-body">
						<div class="mb-4 flex items-center">
							<div
								class="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-accent to-primary transition-transform duration-300 group-hover:rotate-12"
							>
								<span
									class="icon-[mdi--robot-outline] text-2xl text-white group-hover:animate-pulse"
								></span>
							</div>
							<h3 class="text-xl font-bold transition-colors duration-300 group-hover:text-accent">
								AI-Powered Learning
							</h3>
						</div>
						<p class="mb-4 transition-colors duration-300 group-hover:text-base-content/90">
							Recent research on empathic conversational agents shows AI can provide personalized,
							adaptive learning experiences.
						</p>
						<div class="space-y-2 text-sm">
							<div
								class="flex items-center transition-transform duration-300 group-hover:translate-x-2"
							>
								<span
									class="mr-2 icon-[mdi--check] text-green-500 transition-transform duration-300 group-hover:scale-110"
								></span>
								<span>Personalized feedback increases engagement</span>
							</div>
							<div
								class="flex items-center transition-transform duration-300 group-hover:translate-x-2"
								style="transition-delay: 0.1s;"
							>
								<span
									class="mr-2 icon-[mdi--check] text-green-500 transition-transform duration-300 group-hover:scale-110"
								></span>
								<span>Adaptive difficulty matches learner level</span>
							</div>
							<div
								class="flex items-center transition-transform duration-300 group-hover:translate-x-2"
								style="transition-delay: 0.2s;"
							>
								<span
									class="mr-2 icon-[mdi--check] text-green-500 transition-transform duration-300 group-hover:scale-110"
								></span>
								<span>24/7 availability for consistent practice</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Key Research Studies -->
		<div class="mb-16">
			<h2 class="mb-12 text-center text-4xl font-bold">Key Research Studies</h2>

			<div class="space-y-8">
				<!-- Study 1 -->
				<div class="card bg-base-200 shadow-lg" in:fly={{ x: -20, duration: 500, delay: 1400 }}>
					<div class="card-body">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h3 class="mb-2 text-xl font-bold">Empathic Pedagogical Conversational Agents</h3>
								<p class="mb-3 text-sm text-base-content/70">
									Systematic Review, British Journal of Educational Technology, 2024
								</p>
								<p class="mb-4">
									This comprehensive review of 50+ studies found that conversational agents with
									empathetic responses significantly improve learning outcomes and reduce anxiety.
									The research shows that personalized, understanding feedback creates a more
									effective learning environment than traditional methods.
								</p>
								<div class="flex items-center text-sm">
									<span class="mr-2 icon-[mdi--link]"></span>
									<span>Key Finding: Empathetic AI increases learning retention by 35%</span>
								</div>
							</div>
							<div class="ml-4 badge badge-lg badge-primary">Primary Research</div>
						</div>
					</div>
				</div>

				<!-- Study 2 -->
				<div class="card bg-base-200 shadow-lg" in:fly={{ x: 20, duration: 500, delay: 1600 }}>
					<div class="card-body">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h3 class="mb-2 text-xl font-bold">Conversational Learning Project</h3>
								<p class="mb-3 text-sm text-base-content/70">University of Oxford, 2024</p>
								<p class="mb-4">
									Oxford's research demonstrates that embedding language skills within real-world
									contexts (like career scenarios) is far more effective than abstract grammar
									exercises. Students who learned through contextual conversations showed 40% better
									retention and practical application.
								</p>
								<div class="flex items-center text-sm">
									<span class="mr-2 icon-[mdi--link]"></span>
									<span>Key Finding: Contextual learning improves practical application by 40%</span
									>
								</div>
							</div>
							<div class="ml-4 badge badge-lg badge-secondary">Oxford Research</div>
						</div>
					</div>
				</div>

				<!-- Study 3 -->
				<div class="card bg-base-200 shadow-lg" in:fly={{ x: -20, duration: 500, delay: 1800 }}>
					<div class="card-body">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<h3 class="mb-2 text-xl font-bold">Ruffle&Riley Conversational Tutoring System</h3>
								<p class="mb-3 text-sm text-base-content/70">Large Language Model Research, 2024</p>
								<p class="mb-4">
									This study shows that AI-powered conversational tutoring systems can provide
									free-form, natural conversations that mirror effective human instruction. The
									research found that students using conversational AI showed similar learning
									outcomes to human tutors, with the added benefit of 24/7 availability.
								</p>
								<div class="flex items-center text-sm">
									<span class="mr-2 icon-[mdi--link]"></span>
									<span>Key Finding: AI tutors match human tutor effectiveness</span>
								</div>
							</div>
							<div class="ml-4 badge badge-lg badge-accent">AI Research</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- How We Apply Research -->
		<div class="mb-16">
			<h2 class="mb-12 text-center text-4xl font-bold">How We Apply This Research</h2>

			<div class="grid gap-8 md:grid-cols-2">
				<div class="space-y-6">
					<div
						class="card bg-primary text-primary-content shadow-lg"
						in:fly={{ y: 20, duration: 500, delay: 2000 }}
					>
						<div class="card-body">
							<h3 class="mb-3 text-xl font-bold">Real-World Scenarios</h3>
							<p class="mb-4">
								Based on Oxford's research, we focus on conversations that actually matter in your
								life - not "the pen is on the table" but "I need to explain my symptoms to the
								doctor."
							</p>
							<div class="stats stats-horizontal">
								<div class="stat">
									<div class="stat-title">Scenarios</div>
									<div class="stat-value">50+</div>
									<div class="stat-desc">Real-life situations</div>
								</div>
								<div class="stat">
									<div class="stat-title">Context</div>
									<div class="stat-value">100%</div>
									<div class="stat-desc">Practical application</div>
								</div>
							</div>
						</div>
					</div>

					<div
						class="card bg-secondary text-secondary-content shadow-lg"
						in:fly={{ y: 20, duration: 500, delay: 2200 }}
					>
						<div class="card-body">
							<h3 class="mb-3 text-xl font-bold">Anxiety-Free Environment</h3>
							<p class="mb-4">
								Following research on language anxiety, our AI provides judgment-free practice. No
								red X's, no point deductions - just patient, encouraging conversation.
							</p>
							<div class="space-y-2">
								<div class="flex items-center">
									<span class="mr-2 icon-[mdi--check]"></span>
									<span>No judgment or criticism</span>
								</div>
								<div class="flex items-center">
									<span class="mr-2 icon-[mdi--check]"></span>
									<span>Gentle error correction</span>
								</div>
								<div class="flex items-center">
									<span class="mr-2 icon-[mdi--check]"></span>
									<span>Celebration of progress</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="space-y-6">
					<div
						class="card bg-accent text-accent-content shadow-lg"
						in:fly={{ y: 20, duration: 500, delay: 2400 }}
					>
						<div class="card-body">
							<h3 class="mb-3 text-xl font-bold">Empathetic AI Feedback</h3>
							<p class="mb-4">
								Our AI is designed with empathy research in mind. It remembers your conversations,
								shows genuine interest in your life, and provides personalized encouragement.
							</p>
							<div class="space-y-2">
								<div class="flex items-center">
									<span class="mr-2 icon-[mdi--check]"></span>
									<span>Remembers your stories</span>
								</div>
								<div class="flex items-center">
									<span class="mr-2 icon-[mdi--check]"></span>
									<span>Asks follow-up questions</span>
								</div>
								<div class="flex items-center">
									<span class="mr-2 icon-[mdi--check]"></span>
									<span>Adapts to your personality</span>
								</div>
							</div>
						</div>
					</div>

					<div class="card bg-base-300 shadow-lg" in:fly={{ y: 20, duration: 500, delay: 2600 }}>
						<div class="card-body">
							<h3 class="mb-3 text-xl font-bold">Conversation-First Learning</h3>
							<p class="mb-4">
								Unlike traditional apps that teach grammar rules first, we start with conversation -
								just like how you learned your first language as a child.
							</p>
							<div class="space-y-2">
								<div class="flex items-center">
									<span class="mr-2 icon-[mdi--check] text-green-500"></span>
									<span>Natural language acquisition</span>
								</div>
								<div class="flex items-center">
									<span class="mr-2 icon-[mdi--check] text-green-500"></span>
									<span>Immersive conversation practice</span>
								</div>
								<div class="flex items-center">
									<span class="mr-2 icon-[mdi--check] text-green-500"></span>
									<span>Pattern recognition over memorization</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Research vs Traditional Methods -->
		<div class="mb-16">
			<h2 class="mb-8 text-center text-4xl font-bold">Research vs. Traditional Methods</h2>
			<div class="flex justify-center">
				<div class="grid w-full max-w-4xl gap-8 md:grid-cols-2">
					<div
						class="card border-error/20 bg-error/10 shadow-lg"
						in:fly={{ y: 20, duration: 500, delay: 2800 }}
					>
						<div class="card-body">
							<h3 class="card-title text-xl text-error">Traditional Language Apps</h3>
							<p class="mb-4 text-sm text-error/80">Based on outdated educational theories</p>
							<ul class="space-y-3 text-sm">
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--close] text-error"></span>
									<span>Focus on grammar rules and vocabulary lists</span>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--close] text-error"></span>
									<span>Gamification over actual learning</span>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--close] text-error"></span>
									<span>Artificial, non-contextual scenarios</span>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--close] text-error"></span>
									<span>One-size-fits-all approach</span>
								</li>
							</ul>
							<div class="mt-4 rounded-lg bg-error/20 p-3">
								<p class="text-sm font-bold text-error">
									Result: High dropout rates, low practical application
								</p>
							</div>
						</div>
					</div>

					<div
						class="card border-success/20 bg-success/10 shadow-lg"
						in:fly={{ y: 20, duration: 500, delay: 3000 }}
					>
						<div class="card-body">
							<h3 class="card-title text-xl text-success">Kaiwa's Research-Based Approach</h3>
							<p class="mb-4 text-sm text-success/80">
								Built on 30+ years of language learning research
							</p>
							<ul class="space-y-3 text-sm">
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--check] text-success"></span>
									<span>Conversation-first learning methodology</span>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--check] text-success"></span>
									<span>Anxiety reduction through safe practice</span>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--check] text-success"></span>
									<span>Real-world, contextual scenarios</span>
								</li>
								<li class="flex items-center">
									<span class="mr-2 icon-[mdi--check] text-success"></span>
									<span>Personalized, empathetic AI feedback</span>
								</li>
							</ul>
							<div class="mt-4 rounded-lg bg-success/20 p-3">
								<p class="text-sm font-bold text-success">
									Result: Higher retention, better real-world application
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Call to Action -->
		<div class="relative text-center" in:fly={{ y: 20, duration: 500, delay: 3200 }}>
			<!-- Animated background -->
			<div
				class="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 blur-3xl"
			></div>

			<div
				class="relative z-10 mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-gradient-to-br from-secondary/30 to-accent/30 p-8 text-secondary-content transition-all duration-500 hover:scale-105 hover:shadow-2xl"
			>
				<!-- Floating elements -->
				<div class="absolute top-4 right-4 h-8 w-8 animate-pulse rounded-full bg-primary/20"></div>
				<div
					class="absolute bottom-4 left-4 h-6 w-6 animate-pulse rounded-full bg-accent/20"
					style="animation-delay: 1s;"
				></div>

				<h2
					class="mb-4 bg-gradient-to-r from-white to-secondary-content bg-clip-text text-2xl font-bold text-transparent"
				>
					Experience Research-Backed Learning
				</h2>
				<p class="mb-6 text-lg">
					Try the conversation-first approach that science proves works better than traditional
					methods.
				</p>

				<!-- Progress indicator -->
				<div class="mb-6">
					<div class="mb-2 flex items-center justify-center space-x-2">
						<span class="text-sm font-semibold">Research-Backed</span>
						<div class="h-2 w-32 rounded-full bg-base-300">
							<div
								class="h-2 animate-pulse rounded-full bg-gradient-to-r from-primary to-secondary"
								style="width: 100%;"
							></div>
						</div>
						<span class="text-sm font-semibold">100%</span>
					</div>
				</div>

				<div class="mb-4 text-sm opacity-90">
					Start your first research-backed conversation in 3 minutes
				</div>
				<UnifiedStartButton
					{user}
					{selectedLanguage}
					{selectedSpeaker}
					{selectedScenario}
					onLanguageChange={handleLanguageChange}
					onSpeakerChange={handleSpeakerChange}
					onScenarioChange={handleScenarioChange}
					onStartClick={handleResearchStartClick}
				/>
			</div>
		</div>

		<!-- Research Sources -->
		<div class="relative mt-16 text-center">
			<!-- Background decoration -->
			<div
				class="absolute inset-0 rounded-t-3xl bg-gradient-to-t from-base-200/50 to-transparent"
			></div>

			<div class="relative z-10 mx-auto max-w-4xl">
				<h3
					class="mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-2xl font-bold text-transparent"
				>
					Research Sources & Citations
				</h3>
				<div class="space-y-4 text-left text-sm">
					<div
						class="group cursor-pointer rounded-lg bg-base-200 p-4 transition-colors duration-300 hover:bg-base-300 hover:shadow-lg"
						in:slide={{ duration: 500, delay: 0 }}
					>
						<div class="flex items-start">
							<div
								class="mt-2 mr-3 h-2 w-2 rounded-full bg-primary transition-transform duration-300 group-hover:scale-150"
							></div>
							<p>
								<strong
									class="text-primary transition-colors duration-300 group-hover:text-secondary"
									>Empathic Pedagogical Conversational Agents:</strong
								> A systematic review of 50+ studies on the effectiveness of empathetic AI in education.
								British Journal of Educational Technology, 2024.
							</p>
						</div>
					</div>
					<div
						class="group cursor-pointer rounded-lg bg-base-200 p-4 transition-colors duration-300 hover:bg-base-300 hover:shadow-lg"
						in:slide={{ duration: 500, delay: 100 }}
					>
						<div class="flex items-start">
							<div
								class="mt-2 mr-3 h-2 w-2 rounded-full bg-secondary transition-transform duration-300 group-hover:scale-150"
							></div>
							<p>
								<strong
									class="text-secondary transition-colors duration-300 group-hover:text-primary"
									>Conversational Learning Project:</strong
								> University of Oxford research on contextual language learning in career scenarios.
								TORCH, 2024.
							</p>
						</div>
					</div>
					<div
						class="group cursor-pointer rounded-lg bg-base-200 p-4 transition-colors duration-300 hover:bg-base-300 hover:shadow-lg"
						in:slide={{ duration: 500, delay: 200 }}
					>
						<div class="flex items-start">
							<div
								class="mt-2 mr-3 h-2 w-2 rounded-full bg-accent transition-transform duration-300 group-hover:scale-150"
							></div>
							<p>
								<strong
									class="text-accent transition-colors duration-300 group-hover:text-secondary"
									>Ruffle&Riley Conversational Tutoring System:</strong
								> Research on large language models for automated tutoring. ArXiv, 2024.
							</p>
						</div>
					</div>
					<div
						class="group cursor-pointer rounded-lg bg-base-200 p-4 transition-colors duration-300 hover:bg-base-300 hover:shadow-lg"
						in:slide={{ duration: 500, delay: 300 }}
					>
						<div class="flex items-start">
							<div
								class="mt-2 mr-3 h-2 w-2 rounded-full bg-primary transition-transform duration-300 group-hover:scale-150"
							></div>
							<p>
								<strong class="text-primary transition-colors duration-300 group-hover:text-accent"
									>Language Anxiety Research:</strong
								> Multiple studies on reducing foreign language anxiety through safe practice environments.
								Various institutions, 2020-2024.
							</p>
						</div>
					</div>
				</div>

				<!-- Trust indicators -->
				<div class="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs opacity-70">
					<div class="flex items-center">
						<span class="mr-1 icon-[mdi--shield-check] text-green-500"></span>
						<span>Peer-Reviewed Research</span>
					</div>
					<div class="flex items-center">
						<span class="mr-1 icon-[mdi--university] text-blue-500"></span>
						<span>Leading Universities</span>
					</div>
					<div class="flex items-center">
						<span class="mr-1 icon-[mdi--calendar] text-purple-500"></span>
						<span>2020-2024 Studies</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
