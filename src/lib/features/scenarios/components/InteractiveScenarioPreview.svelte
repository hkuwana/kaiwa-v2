<!-- InteractiveScenarioPreview.svelte - Interactive carousel showcasing conversation scenarios -->
<script lang="ts">
	import { scenariosData } from '$lib/data/scenarios';
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import { onMount } from 'svelte';
	import type { Message } from '$lib/server/db/types';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		selectedLanguage?: { name: string; code: string; flag: string } | null;
	}

	const { selectedLanguage = null }: Props = $props();

	// State for tracking which messages show translations
	const showTranslations = $state<{ [messageId: string]: boolean }>({});

	// Create Message objects for better integration with MessageBubble
	const createMessage = (
		role: 'user' | 'assistant',
		content: string,
		originalText?: string,
		romanization?: string,
		hiragana?: string,
		otherScripts?: Record<string, string>,
		sourceLang?: string
	): Message => ({
		id: crypto.randomUUID(),
		conversationId: 'preview',
		role,
		content,
		timestamp: new SvelteDate(),
		sequenceId: null,
		// Here `content` is the foreign-language text and `originalText` is the English translation
		translatedContent: originalText ? originalText : null,
		sourceLanguage: sourceLang || (originalText ? selectedLanguage?.code || null : null),
		targetLanguage: originalText ? 'en' : null,
		userNativeLanguage: null,
		romanization: romanization || null,
		hiragana: hiragana || null,
		otherScripts: otherScripts || null,
		translationConfidence: null,
		translationProvider: null,
		translationNotes: null,
		isTranslated: !!originalText,
		grammarAnalysis: null,
		vocabularyAnalysis: null,
		pronunciationScore: null,
		audioUrl: null,
		audioDuration: null,
		speechTimings: null,
		difficultyLevel: null,
		learningTags: null,
		conversationContext: null,
		messageIntent: null
	});

	// Toggle translation for a message
	function toggleTranslation(messageId: string) {
		showTranslations[messageId] = !showTranslations[messageId];
	}

	// Enhanced scenario data with preview conversations and visual elements
	const getScenarioPreviewsData = () => {
		const scenarios = [];

		// 1) Japanese romance (furigana + romaji)
		const familyDinnerScenario = scenariosData.find((s) => s.id === 'family-dinner-introduction');
		if (familyDinnerScenario) {
			scenarios.push({
				...familyDinnerScenario,
				icon: '💕',
				messages: [
					createMessage(
						'user',
						'はじめまして、どうぞよろしくお願いいたします。',
						'Nice to meet you, I look forward to getting to know you.',
						'Hajimemashite, dōzo yoroshiku onegai itashimasu.',
						'はじめまして、どうぞよろしくお願<rt>ねが</rt>いいたします。',
						undefined,
						'ja'
					),
					createMessage(
						'assistant',
						'こちらこそ。どうぞ、お座りください。',
						"It's a pleasure to meet you too. Please, have a seat.",
						'Kochira koso. Dōzo, o-suwari kudasai.',
						'こちらこそ。どうぞ、お座<rt>すわ</rt>りください。',
						undefined,
						'ja'
					),
					createMessage(
						'user',
						'お招きいただき、ありがとうございます。',
						'Thank you for inviting me.',
						'O-maneki itadaki, arigatō gozaimasu.',
						'お招<rt>まね</rt>きいただき、ありがとうございます。',
						undefined,
						'ja'
					)
				],
				color: 'from-pink-400 to-rose-500',
				bgPattern: 'heart'
			});
		}

		// 2) Korean: Calling home from the platform
		const clinicScenario = scenariosData.find((s) => s.id === 'clinic-night-triage');
		if (clinicScenario) {
			scenarios.push({
				...clinicScenario,
				icon: '👨‍👩‍👧‍👦',
				messages: [
					createMessage(
						'user',
						'すみません、急に気分が悪くなってしまって。',
						'Excuse me, I suddenly feel unwell.',
						'Sumimasen, kyū ni kibun ga waruku natte shimatte.',
						'すみません、急<rt>きゅう</rt>に気分<rt>きぶん</rt>が悪<rt>わる</rt>くなってしまって。',
						undefined,
						'ja'
					),
					createMessage(
						'assistant',
						'大丈夫ですか？どのような症状ですか？',
						'Are you alright? What are your symptoms?',
						'Daijōbu desu ka? Dono yō na shōjō desu ka?',
						'大丈夫<rt>だいじょうぶ</rt>ですか？どのような症状<rt>しょうじょう</rt>ですか？',
						undefined,
						'ja'
					),
					createMessage(
						'user',
						'頭痛と吐き気がします。',
						'I have a headache and feel nauseous.',
						'Zutsū to hakike ga shimasu.',
						'頭痛<rt>ずつう</rt>と吐<rt>は</rt>き気<rt>け</rt>がします。',
						undefined,
						'ja'
					)
				],
				color: 'from-green-400 to-teal-500',
				bgPattern: 'family'
			});
		}

		return scenarios;
	};

	const scenarioPreviewsData = $derived(getScenarioPreviewsData());

	let currentIndex = $state(0);
	let isAutoPlaying = $state(true);
	let autoPlayInterval: NodeJS.Timeout;
	let animatingMessages = $state(false);

	// Auto-advance carousel
	function startAutoPlay() {
		if (autoPlayInterval) clearInterval(autoPlayInterval);
		autoPlayInterval = setInterval(() => {
			if (isAutoPlaying) {
				nextScenario();
			}
		}, 5000);
	}

	function stopAutoPlay() {
		isAutoPlaying = false;
		if (autoPlayInterval) {
			clearInterval(autoPlayInterval);
		}
	}

	function resumeAutoPlay() {
		isAutoPlaying = true;
		startAutoPlay();
	}

	function nextScenario() {
		stopAutoPlay(); // Stop auto-play when manually navigating
		currentIndex = (currentIndex + 1) % scenarioPreviewsData.length;
		animateMessages();
		setTimeout(() => resumeAutoPlay(), 3000); // Resume after 3 seconds
	}

	function prevScenario() {
		stopAutoPlay(); // Stop auto-play when manually navigating
		currentIndex = (currentIndex - 1 + scenarioPreviewsData.length) % scenarioPreviewsData.length;
		animateMessages();
		setTimeout(() => resumeAutoPlay(), 3000); // Resume after 3 seconds
	}

	function goToScenario(index: number) {
		stopAutoPlay(); // Stop auto-play when manually navigating
		currentIndex = index;
		animateMessages();
		setTimeout(() => resumeAutoPlay(), 3000); // Resume after 3 seconds
	}

	function animateMessages() {
		animatingMessages = true;
		setTimeout(() => {
			animatingMessages = false;
		}, 100);
	}

	onMount(() => {
		startAutoPlay();
		return () => {
			if (autoPlayInterval) {
				clearInterval(autoPlayInterval);
			}
		};
	});

	const currentScenario = $derived(scenarioPreviewsData[currentIndex]);
</script>

<div class="mx-auto flex w-full max-w-5xl flex-col items-center">
	<!-- Carousel Container -->
	<div
		class="relative w-full overflow-hidden rounded-2xl shadow-2xl"
		onmouseenter={stopAutoPlay}
		onmouseleave={resumeAutoPlay}
		role="region"
		aria-label="Conversation scenario previews"
	>
		<!-- Main Scenario Card - Uniform height -->
		{#if currentScenario}
		<div
			class="relative h-[520px] sm:h-[560px] md:h-[600px] flex flex-col p-6"
		>
			<!-- Background Pattern -->
			<div class="absolute inset-0 opacity-10">
				{#if currentScenario.bgPattern === 'food'}
					<div class="absolute top-4 right-4 rotate-12 transform text-8xl">🍜</div>
					<div class="absolute bottom-8 left-8 -rotate-12 transform text-6xl">🥢</div>
				{:else if currentScenario.bgPattern === 'travel'}
					<div class="absolute top-4 right-4 rotate-12 transform text-8xl">🗺️</div>
					<div class="absolute bottom-8 left-8 -rotate-12 transform text-6xl">
						{'languageFlag' in currentScenario ? currentScenario.languageFlag : '🎒'}
					</div>
				{:else if currentScenario.bgPattern === 'music'}
					<div class="absolute top-4 right-4 rotate-12 transform text-8xl">🎵</div>
					<div class="absolute bottom-8 left-8 -rotate-12 transform text-6xl">🎼</div>
				{:else if currentScenario.bgPattern === 'calendar'}
					<div class="absolute top-4 right-4 rotate-12 transform text-8xl">📊</div>
					<div class="absolute bottom-8 left-8 -rotate-12 transform text-6xl">⏰</div>
				{:else if currentScenario.bgPattern === 'heart'}
					<div class="absolute top-4 right-4 rotate-12 transform text-8xl">💖</div>
					<div class="absolute bottom-8 left-8 -rotate-12 transform text-6xl">🌹</div>
				{:else if currentScenario.bgPattern === 'family'}
					<div class="absolute top-4 right-4 rotate-12 transform text-8xl">🏠</div>
					<div class="absolute bottom-8 left-8 -rotate-12 transform text-6xl">💝</div>
				{:else if currentScenario.bgPattern === 'connection'}
					<div class="absolute top-4 right-4 rotate-12 transform text-8xl">💫</div>
					<div class="absolute bottom-8 left-8 -rotate-12 transform text-6xl">🌟</div>
				{/if}
			</div>

			<!-- Scenario Header -->
			<div class="relative z-10 mb-4 flex-shrink-0">
				<div class="mb-3 flex items-center gap-4">
					<div class="rounded-full bg-white/20 p-2 text-3xl backdrop-blur-sm">
						{currentScenario.icon}
					</div>
					<div>
						<h3 class="mb-1 text-xl font-bold">{currentScenario.title}</h3>
						<div class="flex items-center gap-2">
							<span class="badge badge-xs capitalize badge-accent">{currentScenario.category}</span>
							<span class="badge badge-xs capitalize badge-primary"
								>{currentScenario.difficulty}</span
							>
						</div>
					</div>
				</div>
				<p class="max-w-md text-base opacity-90">{currentScenario.description}</p>
			</div>

			<!-- Preview Conversation with MessageBubble -->
			<div class="relative z-10 flex-1 overflow-hidden">
				<div
					class="space-y-1 {animatingMessages
						? 'animate-fade-in'
						: ''} max-h-64 overflow-y-auto sm:max-h-80 md:max-h-[420px]"
				>
					{#each currentScenario.messages as message, i (message.id)}
						<div
							class="scale-[0.9] opacity-95 transition-all duration-300 hover:scale-95"
							style="animation-delay: {i * 0.2}s"
						>
							<MessageBubble
								{message}
								clickToToggle={true}
								translation={{
									translatedContent: showTranslations[message.id]
										? message.translatedContent
										: null,
									romanization: showTranslations[message.id] ? message.romanization : null,
									hiragana: showTranslations[message.id] ? message.hiragana : null
								}}
								dispatch={(event: string, _data: any) => {
									if (event === 'translate' || event === 'toggle') {
										toggleTranslation(message.id);
									}
								}}
							/>
						</div>
					{/each}
				</div>

				<!-- Translation hint -->
				<div class="mt-2 flex-shrink-0 text-center">
					<div class="badge badge-ghost badge-lg backdrop-blur-sm">
						💬 Click any message to show English translation and romanization
					</div>
				</div>
			</div>
		</div>
		{/if}

		<!-- Navigation Controls -->
		<div class="absolute inset-y-0 left-0 z-20 flex items-center">
			<button
				class="btn ml-2 btn-circle border-white/30 bg-black/30 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-black/50"
				onclick={prevScenario}
				aria-label="Previous scenario"
				style="backdrop-filter: blur(8px);"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
						clip-rule="evenodd"
					></path>
				</svg>
			</button>
		</div>

		<div class="absolute inset-y-0 right-0 z-20 flex items-center">
			<button
				class="btn mr-2 btn-circle border-white/30 bg-black/30 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-black/50"
				onclick={nextScenario}
				aria-label="Next scenario"
				style="backdrop-filter: blur(8px);"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
						clip-rule="evenodd"
					></path>
				</svg>
			</button>
		</div>
	</div>

	<!-- Indicator Dots -->
	<div class="mt-6 flex justify-center gap-3">
		{#each scenarioPreviewsData as scenario, i (scenario.id)}
			<button
				class="h-3 w-3 rounded-full transition-all duration-300 {i === currentIndex
					? 'scale-125 bg-primary'
					: 'hover:bg-base-400 bg-base-300'}"
				onclick={() => goToScenario(i)}
				aria-label="Go to scenario {i + 1}"
			></button>
		{/each}
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in > div {
		animation: fade-in 0.5s ease-out forwards;
		opacity: 0;
	}
</style>