<!-- InteractiveScenarioPreview.svelte - Interactive carousel showcasing conversation scenarios -->
<script lang="ts">
	import { scenariosData } from '$lib/data/scenarios';
	import MessageBubble from './MessageBubble.svelte';
	import { onMount } from 'svelte';
	import type { Message } from '$lib/server/db/types';

	interface Props {
		selectedLanguage?: { name: string; code: string; flag: string } | null;
	}

	const { selectedLanguage = null }: Props = $props();

	// Create Message objects for better integration with MessageBubble
	const createMessage = (role: 'user' | 'assistant', content: string, originalText?: string): Message => ({
		id: crypto.randomUUID(),
		conversationId: 'preview',
		role,
		content,
		 
		timestamp: new Date(),
		isTranscript: role === 'user',
		translatedText: originalText ? content : undefined
	});

	// Language-specific travel destinations and contexts with proper Message objects
	const getTravelScenarioData = (language: string | null) => {
		const travelOptions = {
			ja: {
				destinations: ['Tokyo', 'Kyoto', 'Osaka'],
				messages: [
					createMessage('user', "I'm planning a trip to Tokyo!", "東京に旅行を計画しています！"),
					createMessage('assistant', "That's exciting! What would you like to see there?", "それはワクワクしますね！そこで何を見たいですか？"),
					createMessage('user', 'I want to visit traditional temples.', "伝統的なお寺を訪れたいです。")
				],
				flag: '🇯🇵'
			},
			es: {
				destinations: ['Madrid', 'Barcelona', 'Sevilla'],
				messages: [
					createMessage('user', "I'm excited to visit Barcelona!", "¡Estoy emocionado de visitar Barcelona!"),
					createMessage('assistant', 'What attracts you to Barcelona?', '¿Qué te atrae de Barcelona?'),
					createMessage('user', 'The architecture and beaches look amazing.', 'La arquitectura y las playas se ven increíbles.')
				],
				flag: '🇪🇸'
			},
			fr: {
				destinations: ['Paris', 'Lyon', 'Nice'],
				messages: [
					createMessage('user', "I'm dreaming of visiting Paris!", "Je rêve de visiter Paris !"),
					createMessage('assistant', 'What would you like to experience?', "Qu'aimeriez-vous découvrir ?"),
					createMessage('user', 'The art museums and cafés.', 'Les musées d\'art et les cafés.')
				],
				flag: '🇫🇷'
			},
			default: {
				destinations: ['around the world'],
				messages: [
					createMessage('user', 'I love exploring new places!'),
					createMessage('assistant', "That's wonderful! Where would you like to go next?"),
					createMessage('user', 'Somewhere with rich culture and history.')
				],
				flag: '🌍'
			}
		};

		const langCode = selectedLanguage?.code || 'default';
		return travelOptions[langCode as keyof typeof travelOptions] || travelOptions.default;
	};

	// Enhanced scenario data with preview conversations and visual elements - focused on relationships
	const getScenarioPreviewsData = (language: string | null) => {
		const travelData = getTravelScenarioData(language);

		const scenarios = [];

		// Relationship scenarios with multi-language examples
		const datePlanningScenario = scenariosData.find((s) => s.id === 'relationship-date-planning');
		if (datePlanningScenario) {
			scenarios.push({
				...datePlanningScenario,
				icon: '💕',
				messages: [
					createMessage('user', 'I want to plan something special for us.', language === 'ja' ? '私たちのために何か特別なことを計画したいです。' : undefined),
					createMessage('assistant', 'How sweet! What kind of activities do you both enjoy?', language === 'ja' ? 'それは素敵ですね！二人はどのような活動が好きですか？' : undefined),
					createMessage('user', 'We love trying new restaurants together.', language === 'ja' ? '一緒に新しいレストランを試すのが好きです。' : undefined)
				],
				color: 'from-pink-400 to-rose-500',
				bgPattern: 'heart'
			});
		}

		const familyUpdateScenario = scenariosData.find((s) => s.id === 'relationship-family-update');
		if (familyUpdateScenario) {
			scenarios.push({
				...familyUpdateScenario,
				icon: '👨‍👩‍👧‍👦',
				messages: [
					createMessage('user', 'I got promoted at work!', language === 'ja' ? '仕事で昇進しました！' : undefined),
					createMessage('assistant', 'Congratulations! Your family must be so proud.', language === 'ja' ? 'おめでとうございます！ご家族もとても誇らしく思われるでしょうね。' : undefined),
					createMessage('user', "I can't wait to tell them the good news.", language === 'ja' ? '良いニュースを伝えるのが待ちきれません。' : undefined)
				],
				color: 'from-green-400 to-teal-500',
				bgPattern: 'family'
			});
		}

		// Travel scenario (always available) - uses language-specific data
		const travelScenario = scenariosData.find((s) => s.id === 'saturday-travel');
		if (travelScenario) {
			scenarios.push({
				...travelScenario,
				icon: '✈️',
				messages: travelData.messages,
				color: 'from-blue-400 to-purple-500',
				bgPattern: 'travel',
				languageFlag: travelData.flag
			});
		}

		const deepConnectionScenario = scenariosData.find(
			(s) => s.id === 'relationship-deep-connection'
		);
		if (deepConnectionScenario) {
			scenarios.push({
				...deepConnectionScenario,
				icon: '🤝',
				messages: [
					createMessage('user', 'What do you value most in life?', language === 'ja' ? '人生で最も大切にしていることは何ですか？' : undefined),
					createMessage('assistant', "That's a beautiful question. What about you?", language === 'ja' ? 'それは美しい質問ですね。あなたはどうですか？' : undefined),
					createMessage('user', 'Authentic connections with people.', language === 'ja' ? '人との本物のつながりです。' : undefined)
				],
				color: 'from-purple-400 to-indigo-500',
				bgPattern: 'connection'
			});
		}

		// Food scenario with language variations
		const foodScenario = scenariosData.find((s) => s.id === 'wednesday-food');
		if (foodScenario) {
			scenarios.push({
				...foodScenario,
				icon: '🍽️',
				messages: [
					createMessage('user', 'I love sharing meals with friends.', language === 'ja' ? '友達と食事を共有するのが大好きです。' : undefined),
					createMessage('assistant', "Food brings people together! What's your favorite to cook?", language === 'ja' ? '食べ物は人をつなげますね！何を作るのが好きですか？' : undefined),
					createMessage('user', "I make a great pasta from my grandmother's recipe.", language === 'ja' ? '祖母のレシピで美味しいパスタを作ります。' : undefined)
				],
				color: 'from-orange-400 to-red-500',
				bgPattern: 'food'
			});
		}

		return scenarios;
	};

	const scenarioPreviewsData = $derived(getScenarioPreviewsData(selectedLanguage?.code || null));

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
		currentIndex = (currentIndex + 1) % scenarioPreviewsData.length;
		animateMessages();
	}

	function prevScenario() {
		currentIndex = (currentIndex - 1 + scenarioPreviewsData.length) % scenarioPreviewsData.length;
		animateMessages();
	}

	function goToScenario(index: number) {
		currentIndex = index;
		animateMessages();
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

	let currentScenario = $derived(scenarioPreviewsData[currentIndex]);
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
		<div class="relative h-[600px] bg-gradient-to-br {currentScenario.color} p-6 text-white flex flex-col"
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
				<div class="space-y-1 {animatingMessages ? 'animate-fade-in' : ''} max-h-[420px] overflow-y-auto">
					{#each currentScenario.messages as message, i}
						<div
							class="opacity-95 scale-[0.9] transition-all duration-300 hover:scale-95"
							style="animation-delay: {i * 0.2}s"
						>
							<MessageBubble 
								{message} 
								conversationLanguage={selectedLanguage?.code}
							/>
						</div>
					{/each}
				</div>
				
				<!-- Translation hint -->
				{#if selectedLanguage && selectedLanguage.code !== 'en'}
					<div class="mt-2 text-center flex-shrink-0">
						<p class="text-xs text-white/70 bg-black/20 rounded-full px-3 py-1 backdrop-blur-sm inline-block">
							💬 Hover messages to see {selectedLanguage.name} translations
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Navigation Controls -->
		<div class="absolute inset-y-0 left-0 flex items-center">
			<button
				class="btn ml-4 btn-circle border-white/20 bg-black/20 text-white btn-ghost backdrop-blur-sm hover:bg-black/30"
				onclick={prevScenario}
				aria-label="Previous scenario"
			>
				❮
			</button>
		</div>

		<div class="absolute inset-y-0 right-0 flex items-center">
			<button
				class="btn mr-4 btn-circle border-white/20 bg-black/20 text-white btn-ghost backdrop-blur-sm hover:bg-black/30"
				onclick={nextScenario}
				aria-label="Next scenario"
			>
				❯
			</button>
		</div>
	</div>

	<!-- Indicator Dots -->
	<div class="mt-6 flex justify-center gap-3">
		{#each scenarioPreviewsData as _, i}
			<button
				class="h-3 w-3 rounded-full transition-all duration-300 {i === currentIndex
					? 'scale-125 bg-primary'
					: 'hover:bg-base-400 bg-base-300'}"
				onclick={() => goToScenario(i)}
				aria-label="Go to scenario {i + 1}"
			></button>
		{/each}
	</div>

	<!-- Learning Objectives Preview -->
	<div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="card bg-base-200/50 shadow-lg backdrop-blur-sm">
			<div class="card-body p-4 text-center">
				<div class="mb-2 text-2xl">🎯</div>
				<h4 class="mb-2 text-sm font-semibold">Practice Goals</h4>
				<div class="flex flex-wrap justify-center gap-1">
					{#each (currentScenario.learningObjectives || []).slice(0, 3) as objective}
						<span class="badge badge-xs badge-primary">{objective}</span>
					{/each}
					{#if (currentScenario.learningObjectives || []).length > 3}
						<span class="badge badge-outline badge-xs"
							>+{(currentScenario.learningObjectives || []).length - 3}</span
						>
					{/if}
				</div>
			</div>
		</div>

		<div class="card bg-base-200/50 shadow-lg backdrop-blur-sm">
			<div class="card-body p-4 text-center">
				<div class="mb-2 text-2xl">📊</div>
				<h4 class="mb-2 text-sm font-semibold">Comfort Level</h4>
				<div class="space-y-1 text-xs">
					<div class="flex justify-between">
						<span>Confidence</span>
						<div class="rating-xs rating">
							{#each Array(currentScenario.comfortIndicators?.confidence || 3) as _}
								<div class="mask h-3 w-3 bg-orange-400 mask-star-2"></div>
							{/each}
						</div>
					</div>
					<div class="flex justify-between">
						<span>Engagement</span>
						<div class="rating-xs rating">
							{#each Array(currentScenario.comfortIndicators?.engagement || 3) as _}
								<div class="mask h-3 w-3 bg-green-400 mask-star-2"></div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="card bg-base-200/50 shadow-lg backdrop-blur-sm">
			<div class="card-body p-4 text-center">
				<div class="mb-2 text-2xl">⏱️</div>
				<h4 class="mb-2 text-sm font-semibold">Session Info</h4>
				<div class="space-y-1 text-xs">
					<div>~10-15 minutes</div>
					<div class="text-xs opacity-70">Real-time AI responses</div>
				</div>
			</div>
		</div>
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
