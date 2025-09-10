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
	const createMessage = (
		role: 'user' | 'assistant',
		content: string,
		originalText?: string
	): Message => ({
		id: crypto.randomUUID(),
		conversationId: 'preview',
		role,
		content,
		timestamp: new Date(),
		translatedContent: originalText ? content : null,
		sourceLanguage: originalText ? selectedLanguage?.code || null : null,
		targetLanguage: originalText ? 'en' : null,
		userNativeLanguage: null,
		romanization: null,
		hiragana: null,
		otherScripts: null,
		translationConfidence: null,
		translationProvider: null,
		translationNotes: null,
		isTranslated: !!originalText,
		grammarAnalysis: null,
		vocabularyAnalysis: null,
		pronunciationScore: null,
		audioUrl: null,
		audioDuration: null,
		difficultyLevel: null,
		learningTags: null,
		conversationContext: null,
		messageIntent: null
	});

	// Language-specific travel destinations and contexts with proper Message objects
	const getTravelScenarioData = (_language: string | null) => {
		const travelOptions = {
			ja: {
				destinations: ['Shibuya izakaya', 'Kyoto temple', 'Osaka market'],
				messages: [
					createMessage(
						'user',
						"Let's grab drinks at this cozy izakaya!",
						'この居心地の良い居酒屋で飲みましょう！'
					),
					createMessage(
						'assistant',
						"Great idea! What's your favorite Japanese drink?",
						'いいアイデアですね！好きな日本のお酒は何ですか？'
					),
					createMessage(
						'user',
						'I love sake, especially junmai types.',
						'日本酒が好きで、特に純米タイプが好きです。'
					)
				],
				flag: '🇯🇵'
			},
			es: {
				destinations: ['Ibiza', 'Sevilla', 'Valencia'],
				messages: [
					createMessage(
						'user',
						"Let's go to that tapas bar in Ibiza!",
						'¡Vamos a ese bar de tapas en Ibiza!'
					),
					createMessage(
						'assistant',
						'Great choice! What tapas should we try?',
						'¡Buena elección! ¿Qué tapas deberíamos probar?'
					),
					createMessage(
						'user',
						'I want to try the famous jamón ibérico.',
						'Quiero probar el famoso jamón ibérico.'
					)
				],
				flag: '🇪🇸'
			},
			fr: {
				destinations: ['Rooftop café', 'Montmartre', 'Seine riverside'],
				messages: [
					createMessage(
						'user',
						'This rooftop café has such a romantic view!',
						'Ce café sur le toit a une vue si romantique !'
					),
					createMessage(
						'assistant',
						'Perfect for our evening together. What shall we order?',
						'Parfait pour notre soirée ensemble. Que voulons-nous commander ?'
					),
					createMessage(
						'user',
						'Wine and cheese sound perfect right now.',
						'Du vin et du fromage semblent parfaits en ce moment.'
					)
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
				messages:
					language === 'es'
						? [
								createMessage(
									'user',
									'I want to plan a romantic rooftop dinner.',
									'Quiero planear una cena romántica en la azotea.'
								),
								createMessage(
									'assistant',
									'What a lovely idea! What cuisine should we choose?',
									'¡Qué idea tan encantadora! ¿Qué cocina deberíamos elegir?'
								),
								createMessage(
									'user',
									'Spanish tapas would be perfect for sharing.',
									'Las tapas españolas serían perfectas para compartir.'
								)
							]
						: language === 'fr'
							? [
									createMessage(
										'user',
										"Let's have a candlelit dinner by the Seine.",
										'Prenons un dîner aux chandelles au bord de la Seine.'
									),
									createMessage(
										'assistant',
										'So romantic! What should we order?',
										'Si romantique ! Que devons-nous commander ?'
									),
									createMessage(
										'user',
										'Wine and French pastries sound perfect.',
										'Du vin et des pâtisseries françaises semblent parfaits.'
									)
								]
							: [
									createMessage(
										'user',
										'I want to plan something special for us.',
										language === 'ja' ? '私たちのために何か特別なことを計画したいです。' : undefined
									),
									createMessage(
										'assistant',
										'How sweet! What kind of activities do you both enjoy?',
										language === 'ja'
											? 'それは素敵ですね！二人はどのような活動が好きですか？'
											: undefined
									),
									createMessage(
										'user',
										'We love trying new restaurants together.',
										language === 'ja' ? '一緒に新しいレストランを試すのが好きです。' : undefined
									)
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
					createMessage(
						'user',
						'I got promoted at work!',
						language === 'ja' ? '仕事で昇進しました！' : undefined
					),
					createMessage(
						'assistant',
						'Congratulations! Your family must be so proud.',
						language === 'ja'
							? 'おめでとうございます！ご家族もとても誇らしく思われるでしょうね。'
							: undefined
					),
					createMessage(
						'user',
						"I can't wait to tell them the good news.",
						language === 'ja' ? '良いニュースを伝えるのが待ちきれません。' : undefined
					)
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
					createMessage(
						'user',
						'What do you value most in life?',
						language === 'ja' ? '人生で最も大切にしていることは何ですか？' : undefined
					),
					createMessage(
						'assistant',
						"That's a beautiful question. What about you?",
						language === 'ja' ? 'それは美しい質問ですね。あなたはどうですか？' : undefined
					),
					createMessage(
						'user',
						'Authentic connections with people.',
						language === 'ja' ? '人との本物のつながりです。' : undefined
					)
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
				messages:
					language === 'es'
						? [
								createMessage(
									'user',
									'This paella smells incredible!',
									'¡Esta paella huele increíble!'
								),
								createMessage(
									'assistant',
									'My grandmother taught me this recipe. Try some!',
									'Mi abuela me enseñó esta receta. ¡Prueba un poco!'
								),
								createMessage(
									'user',
									'The seafood and saffron taste so authentic.',
									'Los mariscos y el azafrán saben muy auténticos.'
								)
							]
						: language === 'fr'
							? [
									createMessage(
										'user',
										'These croissants are perfectly flaky.',
										'Ces croissants sont parfaitement feuilletés.'
									),
									createMessage(
										'assistant',
										'Fresh from the boulangerie this morning!',
										'Frais de la boulangerie ce matin !'
									),
									createMessage(
										'user',
										'Nothing beats French pastry craftsmanship.',
										"Rien ne vaut l'artisanat pâtissier français."
									)
								]
							: language === 'ja'
								? [
										createMessage(
											'user',
											'This ramen broth is so rich and flavorful!',
											'このラーメンのスープはとても濃厚で味わい深いです！'
										),
										createMessage(
											'assistant',
											'It simmered for 12 hours. The secret is the pork bones.',
											'12時間煮込みました。秘密は豚骨です。'
										),
										createMessage(
											'user',
											'I can taste the dedication in every spoonful.',
											'一口ごとに愛情を感じます。'
										)
									]
								: [
										createMessage('user', 'I love sharing meals with friends.'),
										createMessage(
											'assistant',
											"Food brings people together! What's your favorite to cook?"
										),
										createMessage('user', "I make a great pasta from my grandmother's recipe.")
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
		<div
			class="relative h-[600px] bg-gradient-to-br {currentScenario.color} flex flex-col p-6 text-white"
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
						: ''} max-h-[420px] overflow-y-auto"
				>
					{#each currentScenario.messages as message, i}
						<div
							class="scale-[0.9] opacity-95 transition-all duration-300 hover:scale-95"
							style="animation-delay: {i * 0.2}s"
						>
							<MessageBubble {message} conversationLanguage={selectedLanguage?.code} />
						</div>
					{/each}
				</div>

				<!-- Translation hint -->
				{#if selectedLanguage && selectedLanguage.code !== 'en'}
					<div class="mt-2 flex-shrink-0 text-center">
						<p
							class="inline-block rounded-full bg-black/20 px-3 py-1 text-xs text-white/70 backdrop-blur-sm"
						>
							💬 Hover messages to see {selectedLanguage.name} translations
						</p>
					</div>
				{/if}
			</div>
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
