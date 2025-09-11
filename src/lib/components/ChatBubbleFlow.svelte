<!-- ChatBubbleFlow.svelte - Animated chat conversations showcasing the app -->
<script lang="ts">
	import { onMount } from 'svelte';

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
					translation: 'Nice to meet you! What is your name?'
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

	let visibleBubbles: Array<{
		id: string;
		conversation: (typeof conversations)[0];
		messageIndex: number;
		message: (typeof conversations)[0]['messages'][0];
		leftPercent: number;
		delay: number;
		column: number;
	}> = [];

	let bubbleCounter = 0;
	let animationInterval: NodeJS.Timeout;
	let numColumns = $state(3);

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
		for (let i = 0; i < 3; i++) {
			setTimeout(() => createBubble(i % Math.max(1, numColumns)), i * 1000);
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
	class="relative mx-auto w-full max-w-5xl overflow-hidden rounded-xl bg-gradient-to-b from-base-200/50 to-base-300/30 backdrop-blur-sm h-72 sm:h-80 md:h-96"
>
	<!-- Background pattern -->
	<div class="absolute inset-0 opacity-10">
		<svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
			<defs>
				<pattern id="chat-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
					<circle cx="10" cy="10" r="1" fill="currentColor" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#chat-pattern)" />
		</svg>
	</div>

	<!-- Animated chat bubbles -->
	{#each visibleBubbles as bubble (bubble.id)}
		<div
			class="animate-float-up-fade absolute"
			style="left: {bubble.leftPercent}%; animation-delay: {bubble.delay}ms;"
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
						class="w-8 rounded-full bg-{bubble.message.type === 'user'
							? 'primary'
							: 'secondary'}/20 flex items-center justify-center"
					>
						<span class="text-xs">
							{bubble.message.type === 'user' ? '👤' : '🤖'}
						</span>
					</div>
				</div>
				<div
					class="chat-bubble max-w-xs {bubble.message.type === 'user'
						? 'chat-bubble-primary'
						: 'chat-bubble-secondary'} shadow-lg"
				>
					<div class="text-sm font-medium">
						{bubble.message.text}
					</div>
					{#if bubble.message.translation}
						<div class="mt-1 text-xs italic opacity-70">
							{bubble.message.translation}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/each}

	<!-- Floating elements for visual interest -->
	<div class="animate-bounce-slow absolute top-4 right-4">
		<div
			class="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-medium backdrop-blur-sm"
		>
			💬 Real conversations
		</div>
	</div>

	<div class="animate-bounce-slow absolute bottom-4 left-4" style="animation-delay: 1s;">
		<div
			class="flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-2 text-xs font-medium backdrop-blur-sm"
		>
			🎯 Practice speaking
		</div>
	</div>

	<div class="animate-bounce-slow absolute top-1/2 right-8" style="animation-delay: 2s;">
		<div
			class="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-2 text-xs font-medium backdrop-blur-sm"
		>
			🌍 Multiple languages
		</div>
	</div>
</div>

<style>
	@keyframes float-up-fade {
		0% {
			transform: translateY(100px);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			transform: translateY(-100px);
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
