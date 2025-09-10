<!-- ChatBubbleFlow.svelte - Animated chat conversations showcasing the app -->
<script lang="ts">
	import { onMount } from 'svelte';

	// Sample conversation data showcasing different languages and scenarios
	const conversations = [
		{
			language: 'Japanese',
			flag: '🇯🇵',
			messages: [
				{ type: 'user', text: 'こんにちは! はじめまして。', translation: 'Hello! Nice to meet you.' },
				{ type: 'ai', text: 'はじめまして! お名前は何ですか？', translation: 'Nice to meet you! What is your name?' },
				{ type: 'user', text: '田中です。よろしくお願いします。', translation: "I'm Tanaka. Please treat me favorably." }
			]
		},
		{
			language: 'Spanish',
			flag: '🇪🇸',
			messages: [
				{ type: 'user', text: '¿Dónde está el restaurante?', translation: 'Where is the restaurant?' },
				{ type: 'ai', text: 'Está a dos cuadras de aquí.', translation: 'It is two blocks from here.' },
				{ type: 'user', text: 'Perfecto, ¡gracias!', translation: 'Perfect, thank you!' }
			]
		},
		{
			language: 'French',
			flag: '🇫🇷',
			messages: [
				{ type: 'user', text: 'Je voudrais commander, s\'il vous plaît.', translation: 'I would like to order, please.' },
				{ type: 'ai', text: 'Bien sûr! Que désirez-vous?', translation: 'Of course! What would you like?' },
				{ type: 'user', text: 'Un café au lait, merci.', translation: 'A coffee with milk, thank you.' }
			]
		}
	];

	let visibleBubbles: Array<{
		id: string;
		conversation: typeof conversations[0];
		messageIndex: number;
		message: typeof conversations[0]['messages'][0];
		position: { x: number; y: number };
		delay: number;
		column: number;
	}> = [];

	let bubbleCounter = 0;
	let animationInterval: NodeJS.Timeout;

	function createBubble(column: number) {
		const conversation = conversations[Math.floor(Math.random() * conversations.length)];
		const messageIndex = Math.floor(Math.random() * conversation.messages.length);
		const message = conversation.messages[messageIndex];
		
		const bubble = {
			id: `bubble-${bubbleCounter++}`,
			conversation,
			messageIndex,
			message,
			position: {
				x: column * 300 + Math.random() * 100, // Spread across columns with some randomness
				y: 100 // Start from bottom
			},
			delay: Math.random() * 2000, // Random delay up to 2 seconds
			column
		};

		visibleBubbles = [...visibleBubbles, bubble];

		// Remove bubble after animation completes
		setTimeout(() => {
			visibleBubbles = visibleBubbles.filter(b => b.id !== bubble.id);
		}, 8000);
	}

	onMount(() => {
		// Create initial bubbles
		for (let i = 0; i < 3; i++) {
			setTimeout(() => createBubble(i), i * 1000);
		}

		// Continue creating bubbles at intervals
		animationInterval = setInterval(() => {
			const column = Math.floor(Math.random() * 3);
			createBubble(column);
		}, 3000);

		return () => {
			if (animationInterval) {
				clearInterval(animationInterval);
			}
		};
	});
</script>

<div class="relative h-96 w-full overflow-hidden rounded-xl bg-gradient-to-b from-base-200/50 to-base-300/30 backdrop-blur-sm">
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
			class="absolute animate-float-up-fade"
			style="left: {bubble.position.x}px; animation-delay: {bubble.delay}ms;"
		>
			<!-- Language flag and indicator -->
			<div class="mb-2 flex items-center gap-2 text-sm font-medium opacity-80">
				<span class="text-lg">{bubble.conversation.flag}</span>
				<span class="text-xs badge badge-primary badge-sm">{bubble.conversation.language}</span>
			</div>
			
			<!-- Chat bubble -->
			<div class="chat {bubble.message.type === 'user' ? 'chat-end' : 'chat-start'}">
				<div class="chat-image avatar">
					<div class="w-8 rounded-full bg-{bubble.message.type === 'user' ? 'primary' : 'secondary'}/20 flex items-center justify-center">
						<span class="text-xs">
							{bubble.message.type === 'user' ? '👤' : '🤖'}
						</span>
					</div>
				</div>
				<div class="chat-bubble max-w-xs {bubble.message.type === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'} shadow-lg">
					<div class="text-sm font-medium">
						{bubble.message.text}
					</div>
					{#if bubble.message.translation}
						<div class="mt-1 text-xs opacity-70 italic">
							{bubble.message.translation}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/each}

	<!-- Floating elements for visual interest -->
	<div class="absolute top-4 right-4 animate-bounce-slow">
		<div class="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
			💬 Real conversations
		</div>
	</div>
	
	<div class="absolute bottom-4 left-4 animate-bounce-slow" style="animation-delay: 1s;">
		<div class="flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
			🎯 Practice speaking
		</div>
	</div>

	<div class="absolute top-1/2 right-8 animate-bounce-slow" style="animation-delay: 2s;">
		<div class="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-2 text-xs font-medium backdrop-blur-sm">
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
		0%, 100% {
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