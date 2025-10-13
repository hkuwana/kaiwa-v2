<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade, slide } from 'svelte/transition';

	// --- Demo Data Structure ---
	// Mimics the structure of your active conversation state.
	type DemoMessage = {
		role: 'user' | 'assistant';
		content: string;
		translation?: string;
		analysis?: {
			summary: string;
			suggestion: string;
			culturalTip?: string;
		};
		audioUrl?: string; // Placeholder for future audio feature
	};

	const demoScenario: DemoMessage[] = [
		{
			role: 'user',
			content: 'こんにちは、田中です。はじめまして。',
			translation: "Hello, I'm Tanaka. Nice to meet you.",
			audioUrl: '/audio/demo-user-1.mp3'
		},
		{
			role: 'assistant',
			content: 'はじめまして、田中さん。どうぞ、お座りください。',
			translation: 'Nice to meet you, Tanaka-san. Please, have a seat.',
			audioUrl: '/audio/demo-assistant-1.mp3'
		},
		{
			role: 'user',
			content: 'ありがとうございます。あなたのオフィスはとても素敵です。',
			translation: 'Thank you. Your office is very nice.',
			analysis: {
				summary: 'Great compliment! Very polite.',
				suggestion:
					'For a slightly more natural and humble tone, you could try: 「素敵なオフィスですね。」 (Suteki na ofisu desu ne.)',
				culturalTip:
					"In Japan, complimenting someone's office or home is a common and appreciated way to break the ice."
			},
			audioUrl: '/audio/demo-user-2.mp3'
		},
		{
			role: 'assistant',
			content: 'ありがとうございます。お茶はいかがですか？',
			translation: 'Thank you. Would you like some tea?',
			audioUrl: '/audio/demo-assistant-2.mp3'
		}
	];

	// --- Component State ---
	let displayedMessages: DemoMessage[] = $state([]);
	let isTyping = $state(false);
	let demoState: 'playing' | 'paused' | 'revealed' = $state('playing');
	let showAnalysisFor: DemoMessage | null = $state(null);
	let visibleTranslationIndex = $state(-1);

	// --- Logic ---
	onMount(() => {
		let messageIndex = 0;
		const interval = setInterval(() => {
			if (messageIndex < demoScenario.length) {
				const nextMessage = demoScenario[messageIndex];

				if (nextMessage.role === 'assistant') {
					isTyping = true;
					setTimeout(() => {
						isTyping = false;
						displayedMessages = [...displayedMessages, nextMessage];
						messageIndex++;
					}, 1000);
				} else {
					displayedMessages = [...displayedMessages, nextMessage];
					messageIndex++;
				}
			} else {
				clearInterval(interval);
				setTimeout(() => {
					demoState = 'paused';
				}, 500);
			}
		}, 2500);
	});

	function handleRevealAnalysis(message: DemoMessage) {
		if (message.analysis) {
			showAnalysisFor = message;
			demoState = 'revealed';
		}
	}

	function toggleTranslation(index: number) {
		if (visibleTranslationIndex === index) {
			visibleTranslationIndex = -1;
		} else {
			visibleTranslationIndex = index;
		}
	}
</script>

<div class="mx-auto max-w-2xl rounded-2xl border border-base-300 bg-base-200 p-4 shadow-lg">
	<!-- Conversation Area -->
	<div class="h-96 space-y-4 overflow-y-auto rounded-lg bg-base-100 p-4">
		{#each displayedMessages as message, i (i)}
			<div in:fly={{ y: 10, duration: 300 }}>
				{#if message.role === 'user'}
					<div class="chat-end chat">
						<div class="chat-bubble chat-bubble-primary">
							{message.content}
							{#if message.translation}
								<button
									class="btn ml-2 btn-ghost btn-xs"
									onclick={() => toggleTranslation(i)}
									aria-label="Translate"
								>
									<span class="icon-[mdi--google-translate]"></span>
								</button>
							{/if}
							{#if visibleTranslationIndex === i}
								<div
									transition:slide
									class="mt-2 border-t border-primary-content/20 pt-2 text-xs italic opacity-80"
								>
									{message.translation}
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<div class="chat-start chat">
						<div class="chat-bubble">
							{message.content}
							{#if message.translation}
								<button
									class="btn ml-2 btn-ghost btn-xs"
									onclick={() => toggleTranslation(i)}
									aria-label="Translate"
								>
									<span class="icon-[mdi--google-translate]"></span>
								</button>
							{/if}
							{#if visibleTranslationIndex === i}
								<div
									transition:slide
									class="mt-2 border-t border-base-content/10 pt-2 text-xs italic opacity-80"
								>
									{message.translation}
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/each}

		{#if isTyping}
			<div class="chat-start chat" transition:fade>
				<div class="chat-bubble">
					<span class="loading loading-sm loading-dots"></span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Interaction Layer -->
	<div class="pt-4 text-center">
		{#if demoState === 'paused'}
			<div in:fade={{ duration: 500 }}>
				<button
					class="btn animate-pulse btn-outline btn-accent"
					onclick={() => handleRevealAnalysis(demoScenario[2])}
				>
					Was that the best way to say it? Click for feedback.
				</button>
			</div>
		{/if}

		{#if demoState === 'revealed' && showAnalysisFor}
			<div class="card bg-base-100 shadow-xl" in:fade={{ duration: 500 }}>
				<div class="card-body">
					<h3 class="card-title text-accent">Analysis & Feedback</h3>
					<p class="text-left">
						<strong class="text-base-content/70">Original:</strong> "{showAnalysisFor.content}"
					</p>
					<p class="text-left">
						<strong class="text-base-content/70">Translation:</strong>
						"{showAnalysisFor.translation}"
					</p>
					<div class="divider my-2"></div>
					<div class="space-y-3 text-left">
						<p>
							<strong class="text-success">Suggestion:</strong>
							{showAnalysisFor.analysis?.suggestion}
						</p>
						<p>
							<strong class="text-info">Cultural Tip:</strong>
							{showAnalysisFor.analysis?.culturalTip}
						</p>
					</div>
					<div class="mt-6 card-actions justify-center">
						<a href="/auth" class="btn btn-wide btn-primary"> Practice Your Own Conversations </a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
