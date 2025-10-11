<!-- InteractiveScenarioPreview.svelte - Interactive carousel showcasing conversation scenarios -->
<script lang="ts">
	import { scenariosData } from '$lib/data/scenarios';
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import { onMount } from 'svelte';
	import type { Message } from '$lib/server/db/types';
	import { SvelteDate } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';
	import {
		difficultyRatingToCefr,
		difficultyRatingToStars,
		formatCefrBadge
	} from '$lib/utils/cefr';

	interface Props {
		selectedLanguage?: { name: string; code: string; flag: string } | null;
	}

	const { selectedLanguage = null }: Props = $props();

	// State for tracking which messages show translations (all start as visible)
	const showTranslations = $state<{ [messageId: string]: boolean }>({});

	type Analysis = {
		summary: string;
		suggestion: string;
		culturalTip?: string;
	};

	// Create Message objects for better integration with MessageBubble
	const createMessage = (
		role: 'user' | 'assistant',
		content: string,
		originalText?: string,
		romanization?: string,
		hiragana?: string,
		otherScripts?: Record<string, string>,
		sourceLang?: string,
		analysis?: Analysis
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
		grammarAnalysis: analysis ? JSON.stringify(analysis) : null,
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

	let showAnalysisFor = $state<Message | null>(null);

	function handleRevealAnalysis(message: Message) {
		if (message.grammarAnalysis) {
			showAnalysisFor = message;
		}
	}

	// Enhanced scenario data with preview conversations and visual elements
	const createRange = (count: number) => Array.from({ length: Math.max(0, count) }, (_, i) => i);

	const getScenarioPreviewsData = () => {
		const scenarios = [];

		// 1) Japanese romance (furigana + romaji)
		const familyDinnerScenario = scenariosData.find((s) => s.id === 'family-dinner-introduction');
		if (familyDinnerScenario) {
			const rating = familyDinnerScenario.difficultyRating ?? 1;
			const cefr = familyDinnerScenario.cefrLevel || difficultyRatingToCefr(rating);
			scenarios.push({
				...familyDinnerScenario,
				icon: '💕',
				difficultyStars: difficultyRatingToStars(rating),
				cefrBadge: formatCefrBadge(cefr, { withDescriptor: true }),
				messages: [
					createMessage(
						'user',
						'はじめまして、どうぞよろしくお願いいたします。',
						'Nice to meet you, I look forward to getting to know you.',
						'Hajimemashite, dōzo yoroshiku onegai itashimasu.',
						'<ruby>初<rt>はじ</rt></ruby>めまして、どうぞよろしくお<ruby>願<rt>ねが</rt></ruby>いいたします。',
						undefined,
						'ja'
					),
					createMessage(
						'assistant',
						'こちらこそ。どうぞ、お座りください。',
						"It's a pleasure to meet you too. Please, have a seat.",
						'Kochira koso. Dōzo, o-suwari kudasai.',
						'こちらこそ。どうぞ、お<ruby>座<rt>すわ</rt></ruby>りください。',
						undefined,
						'ja'
					),
					createMessage(
						'user',
						'お招きいただき、ありがとうございます。',
						'Thank you for inviting me.',
						'O-maneki itadaki, arigatō gozaimasu.',
						'お<ruby>招<rt>まね</rt></ruby>きいただき、ありがとうございます。',
						undefined,
						'ja',
						{
							summary: 'Great compliment! Very polite.',
							suggestion:
								'For a slightly more natural and humble tone, you could try: 「素敵なオフィスですね。」 (Suteki na ofisu desu ne.)',
							culturalTip:
								"In Japan, complimenting someone's office or home is a common and appreciated way to break the ice."
						}
					)
				],
				color: 'from-pink-400 to-rose-500',
				bgPattern: 'heart'
			});
		}

		// 2) Korean: Calling home from the subway platform
		const clinicScenario = scenariosData.find((s) => s.id === 'clinic-night-triage');
		if (clinicScenario) {
			const rating = clinicScenario.difficultyRating ?? 2;
			const cefr = clinicScenario.cefrLevel || difficultyRatingToCefr(rating);
			scenarios.push({
				...clinicScenario,
				icon: '🚇',
				difficultyStars: difficultyRatingToStars(rating),
				cefrBadge: formatCefrBadge(cefr, { withDescriptor: true }),
				title: 'Calling Home from the Station',
				description: "A quick phone call to let your family know you're running late",
				messages: [
					createMessage(
						'user',
						'엄마, 나야. 지금 지하철역에 있어.',
						"Mom, it's me. I'm at the subway station now.",
						'Eomma, naya. Jigeum jihacheol-yeoge isseo.',
						undefined,
						undefined,
						'ko',
						{
							summary: 'Natural and casual family conversation.',
							suggestion:
								'Perfect! This is exactly how Koreans speak to their parents on the phone.',
							culturalTip:
								"In Korean culture, it's common to call family members to update them on your whereabouts, especially when running late."
						}
					),
					createMessage(
						'assistant',
						'알았어. 조심해서 와. 저녁은 먹었어?',
						'Okay. Come home safely. Did you eat dinner?',
						'Arasseo. Josimhaeseo wa. Jeonyeog-eun meogeosseo?',
						undefined,
						undefined,
						'ko'
					),
					createMessage(
						'user',
						'아직 안 먹었어. 집에 가서 먹을게.',
						"Not yet. I'll eat when I get home.",
						'Ajik an meogeosseo. Jibe gaseo meogeulge.',
						undefined,
						undefined,
						'ko'
					)
				],
				color: 'from-blue-400 to-cyan-500',
				bgPattern: 'family'
			});
		}

		const executiveScenario = scenariosData.find((s) => s.id === 'executive-board-negotiation');
		if (executiveScenario) {
			const rating = executiveScenario.difficultyRating ?? 7;
			const cefr = executiveScenario.cefrLevel || difficultyRatingToCefr(rating);
			scenarios.push({
				...executiveScenario,
				icon: '📈',
				difficultyStars: difficultyRatingToStars(rating),
				cefrBadge: formatCefrBadge(cefr, { withDescriptor: true }),
				messages: [
					createMessage(
						'user',
						'本日の議題は、新しい市場参入戦略の承認です。',
						"Today's agenda is approving the new market entry plan.",
						'Honjitsu no gidai wa, atarashii shijō sannyū senryaku no shōnin desu.',
						'<ruby>本日<rt>ほんじつ</rt></ruby>の<ruby>議題<rt>ぎだい</rt></ruby>は、<ruby>新<rt>あたら</rt></ruby>しい<ruby>市場<rt>しじょう</rt></ruby><ruby>参入<rt>さんにゅう</rt></ruby><ruby>戦略<rt>せんりゃく</rt></ruby>の<ruby>承認<rt>しょうにん</rt></ruby>です。',
						undefined,
						'ja'
					),
					createMessage(
						'assistant',
						'まず、期待される投資回収期間を教えてください。',
						'First, walk us through the expected payback period.',
						'Mazu, kitai sareru tōshi kaishū kikan o oshiete kudasai.',
						'まず、<ruby>期待<rt>きたい</rt></ruby>される<ruby>投資<rt>とうし</rt></ruby><ruby>回収<rt>かいしゅう</rt></ruby><ruby>期間<rt>きかん</rt></ruby>を<ruby>教<rt>おし</rt></ruby>えてください。',
						undefined,
						'ja'
					),
					createMessage(
						'user',
						'18か月で黒字化できますが、為替リスクへの備えを強化する必要があります。',
						'We can hit profitability in 18 months, but we need stronger hedging against FX risk.',
						'Jūhachi-kagetsu de kuroji-ka dekimasu ga, kawase risuku e no sonae o kyōka suru hitsuyō ga arimasu.',
						'18か<ruby>月<rt>げつ</rt></ruby>で<ruby>黒字化<rt>くろじか</rt></ruby>できますが、<ruby>為替<rt>かわせ</rt></ruby>リスクへの<ruby>備<rt>そな</rt></ruby>えを<ruby>強化<rt>きょうか</rt></ruby>する<ruby>必要<rt>ひつよう</rt></ruby>があります。',
						undefined,
						'ja',
						{
							summary: 'Excellent register and precise risk framing.',
							suggestion:
								'To sound even tighter, try 「為替変動に対するヘッジを即時に拡張します」.',
							culturalTip:
								'Directly addressing risk trade-offs builds credibility in senior Japanese boardrooms.'
						}
					)
				],
				color: 'from-slate-700 to-slate-900',
				bgPattern: 'calendar'
			});
		}

		// Sort previews by difficulty to show natural progression
		return scenarios.sort((a, b) => {
			const ratingA = a.difficultyRating ?? 1;
			const ratingB = b.difficultyRating ?? 1;
			if (ratingA === ratingB) return a.title.localeCompare(b.title);
			return ratingA - ratingB;
		});
	};

	const renderStars = (count: number) => createRange(count);

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
			<div class="relative flex h-[520px] flex-col p-6 sm:h-[560px] md:h-[600px]">
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
								<span class="badge badge-xs capitalize badge-accent">{currentScenario.role}</span>
								<span class="badge badge-xs capitalize badge-primary"
									>{currentScenario.difficulty}</span
								>
							</div>
							<div class="mt-2 flex items-center gap-3">
								<span class="badge badge-outline badge-sm">{currentScenario.cefrBadge}</span>
								<div class="flex items-center gap-1 text-amber-400">
									{#each renderStars(currentScenario.difficultyStars || 1) as _}
										<span class="icon-[mdi--star] h-4 w-4"></span>
									{/each}
								</div>
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
							{@const isVisible = showTranslations[message.id] ?? true}
							<div
								class="scale-[0.9] opacity-95 transition-all duration-300 hover:scale-95"
								style="animation-delay: {i * 0.2}s"
							>
								<MessageBubble
									{message}
									clickToToggle={true}
									translation={{
										translatedContent: isVisible ? message.translatedContent : null,
										romanization: isVisible ? message.romanization : null,
										hiragana: isVisible ? message.hiragana : null
									}}
									dispatch={(event: string, data: any) => {
										if (event === 'toggle') {
											showTranslations[message.id] = !isVisible;
										}
									}}
								/>
							</div>
						{/each}
					</div>

					<!-- Preview hint -->
					<div class="mt-2 flex-shrink-0 text-center">
						<div class="badge badge-ghost badge-lg backdrop-blur-sm">
							💬 Click messages to toggle translations and romanization
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Interaction Layer -->
		<div class="pt-4 text-center">
			{#if !showAnalysisFor}
				<div in:fade={{ duration: 500 }}>
					<button
						class="btn animate-pulse btn-outline btn-accent"
						onclick={() => handleRevealAnalysis(currentScenario.messages[2])}
					>
						Was that the best way to say it? Click for feedback.
					</button>
				</div>
			{/if}

			{#if showAnalysisFor}
				<div class="card bg-base-100 shadow-xl" in:fade={{ duration: 500 }}>
					<div class="card-body">
						<h3 class="card-title text-accent">Analysis & Feedback</h3>
						<p class="text-left">
							<strong class="text-base-content/70">Original:</strong> "{showAnalysisFor.content}"
						</p>
						<p class="text-left">
							<strong class="text-base-content/70">Translation:</strong>
							"{showAnalysisFor.translatedContent}"
						</p>
						<div class="divider my-2"></div>
						<div class="space-y-3 text-left">
							<p>
								<strong class="text-success">Suggestion:</strong>
								{JSON.parse(showAnalysisFor.grammarAnalysis).suggestion}
							</p>
							<p>
								<strong class="text-info">Cultural Tip:</strong>
								{JSON.parse(showAnalysisFor.grammarAnalysis).culturalTip}
							</p>
						</div>
						<div class="mt-6 card-actions justify-center">
							<a href="/auth" class="btn btn-wide btn-primary"> Practice Your Own Conversations </a>
						</div>
					</div>
				</div>
			{/if}
		</div>

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
