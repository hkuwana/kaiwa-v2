<!-- ChatBubbleFlow.svelte - Animated chat conversations showcasing the app -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	// Sample conversation data showcasing different languages and scenarios
	const conversations = [
		{
			language: 'Japanese',
			flag: '🇯🇵',
			messages: [
				{
					type: 'user',
					text: 'こんにちは! はじめまして。',
					translation: 'Hello! Nice to meet you.'
				},
				{
					type: 'ai',
					text: 'はじめまして! お名前は何ですか？',
					translation: 'Nice to you! What is your name?'
				},
				{
					type: 'user',
					text: '田中です。よろしくお願いします。',
					translation: "I'm Tanaka. Please treat me favorably."
				}
			]
		},
		{
			language: 'Spanish',
			flag: '🇪🇸',
			messages: [
				{
					type: 'user',
					text: '¿Dónde está el restaurante?',
					translation: 'Where is the restaurant?'
				},
				{
					type: 'ai',
					text: 'Está a dos cuadras de aquí.',
					translation: 'It is two blocks from here.'
				},
				{ type: 'user', text: 'Perfecto, ¡gracias!', translation: 'Perfect, thank you!' }
			]
		},
		{
			language: 'French',
			flag: '🇫🇷',
			messages: [
				{
					type: 'user',
					text: "Je voudrais commander, s'il vous plaît.",
					translation: 'I would like to order, please.'
				},
				{
					type: 'ai',
					text: 'Bien sûr! Que désirez-vous?',
					translation: 'Of course! What would you like?'
				},
				{
					type: 'user',
					text: 'Un café au lait, merci.',
					translation: 'A coffee with milk, thank you.'
				}
			]
		}
	];

	interface BubbleData {
		id: string;
		conversation: (typeof conversations)[0];
		messageIndex: number;
		message: (typeof conversations)[0]['messages'][0];
		leftPercent: number;
		delay: number;
		column: number;
	}

	let visibleBubbles = $state<BubbleData[]>([]);
	let translationsVisible = $state(new Set<string>());
	let bubbleCounter = $state(0);
	let animationInterval: NodeJS.Timeout | undefined = $state(undefined);
	let numColumns = $state(3);

	// Derived reactive values
	const currentTime = $derived(new Date().toLocaleTimeString());

	function toggleTranslation(bubbleId: string) {
		const newSet = new Set(translationsVisible);
		if (newSet.has(bubbleId)) {
			newSet.delete(bubbleId);
		} else {
			newSet.add(bubbleId);
		}
		translationsVisible = newSet;
	}

	function getInitials(language: string): string {
		if (!language) return 'AI';
		const parts = language.trim().split(/\s+/);
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		const firstTwo = language.slice(0, 2).toUpperCase();
		return firstTwo || 'AI';
	}

	function updateColumns() {
		if (typeof window === 'undefined') return;
		const w = window.innerWidth;
		numColumns = w < 640 ? 1 : w < 1024 ? 2 : 3; // mobile:1, tablet:2, desktop:3
	}

	function createBubble(column: number) {
		const conversation = conversations[Math.floor(Math.random() * conversations.length)];
		const messageIndex = Math.floor(Math.random() * conversation.messages.length);
		const message = conversation.messages[messageIndex];

		const colWidth = 100 / Math.max(1, numColumns);
		const jitter = Math.max(0, colWidth - 18); // leave some margin for bubble width
		const bubble = {
			id: `bubble-${bubbleCounter++}`,
			conversation,
			messageIndex,
			message,
			leftPercent: column * colWidth + Math.random() * jitter,
			delay: Math.random() * 2000, // Random delay up to 2 seconds
			column
		};

		visibleBubbles = [...visibleBubbles, bubble];

		// Remove bubble after animation completes
		setTimeout(() => {
			visibleBubbles = visibleBubbles.filter((b) => b.id !== bubble.id);
		}, 8000);
	}

	onMount(() => {
		updateColumns();
		window.addEventListener('resize', updateColumns);
		// Create initial bubbles
		for (let i = 0; i < 5; i++) {
			// Seed a few bubbles quickly so something is visible immediately
			setTimeout(() => createBubble(i % Math.max(1, numColumns)), i * 300);
		}

		// Continue creating bubbles at intervals
		animationInterval = setInterval(() => {
			const column = Math.floor(Math.random() * Math.max(1, numColumns));
			createBubble(column);
		}, 3000);

		return () => {
			if (animationInterval) {
				clearInterval(animationInterval);
			}
			window.removeEventListener('resize', updateColumns);
		};
	});
</script>

<div
	class="relative mx-auto h-72 w-full max-w-5xl overflow-hidden rounded-xl bg-gradient-to-b from-base-200/50 to-base-300/30 backdrop-blur-sm sm:h-80 md:h-96"
>
	<!-- Animated chat bubbles -->
	{#each visibleBubbles as bubble (bubble.id)}
		<div
			class="animate-float-up-fade absolute z-10"
			style="left: {bubble.leftPercent}%; bottom: 8px; animation-delay: {bubble.delay}ms;"
		>
			<!-- Language flag and indicator -->
			<div class="mb-2 flex items-center gap-2 text-sm font-medium opacity-80">
				<span class="text-lg">{bubble.conversation.flag}</span>
				<span class="badge badge-sm text-xs badge-primary">{bubble.conversation.language}</span>
			</div>

			<!-- Chat bubble -->
			<div class="chat {bubble.message.type === 'user' ? 'chat-end' : 'chat-start'}">
				<div class="avatar chat-image">
					<div
						class={`flex w-8 items-center justify-center rounded-full ${
							bubble.message.type === 'user' ? 'bg-primary/20' : 'bg-secondary/20'
						}`}
					>
						<span class="text-xs font-semibold">
							{bubble.message.type === 'user' ? '👤' : getInitials(bubble.conversation.language)}
						</span>
					</div>
				</div>
				<div
					class="chat-bubble max-w-xs shadow-lg {bubble.message.type === 'user'
						? 'chat-bubble-primary'
						: 'chat-bubble-secondary'} bg-base-100/90 text-base-content"
				>
					<div class="text-sm font-medium">
						{bubble.message.text}
					</div>

					{#if bubble.message.translation}
						<button
							class="btn mt-1 opacity-60 btn-ghost btn-xs hover:opacity-100"
							onclick={() => toggleTranslation(bubble.id)}
						>
							<span class="mr-1 icon-[mdi--google-translate]"></span>
							Translate
						</button>
					{/if}

					{#if translationsVisible.has(bubble.id)}
						<div transition:slide={{ duration: 300 }}>
							<div class="mt-2 border-t border-base-content/10 pt-2 text-xs italic opacity-80">
								{bubble.message.translation}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/each}

	<!-- Floating elements for visual interest -->
	<div class="animate-bounce-slow absolute top-4 right-4">
		<div class="badge gap-2 badge-outline badge-lg backdrop-blur-sm badge-primary">
			💬 Real conversations
		</div>
	</div>

	<div class="animate-bounce-slow absolute bottom-4 left-4" style="animation-delay: 1s;">
		<div class="badge gap-2 badge-outline badge-lg backdrop-blur-sm badge-secondary">
			🎯 Practice speaking
		</div>
	</div>

	<div class="animate-bounce-slow absolute top-1/2 right-8" style="animation-delay: 2s;">
		<div class="badge gap-2 badge-outline badge-lg backdrop-blur-sm badge-accent">
			<span class="icon-[mdi--earth]"></span> Multiple languages
		</div>
	</div>
</div>

<style>
	@keyframes float-up-fade {
		0% {
			transform: translateY(0);
			opacity: 0;
		}
		5% {
			opacity: 1;
		}
		95% {
			opacity: 1;
		}
		100% {
			transform: translateY(-140px);
			opacity: 0;
		}
	}

	@keyframes bounce-slow {
		0%,
		100% {
			transform: translateY(-5px);
		}
		50% {
			transform: translateY(0px);
		}
	}

	.animate-float-up-fade {
		animation: float-up-fade 8s linear forwards;
	}

	.animate-bounce-slow {
		animation: bounce-slow 3s ease-in-out infinite;
	}
</style>
