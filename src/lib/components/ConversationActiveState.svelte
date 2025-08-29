<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import type { Message, Language } from '$lib/server/db/types';

	interface Props {
		status: string;
		messages: Message[];
		audioLevel: number;
		selectedLanguage: Language | null;
		isGuestUser: boolean;
		currentTranscript: string;
		isTranscribing: boolean;
		onSendMessage: (content: string) => void;
		onEndConversation: () => void;
	}

	let {
		status,
		messages,
		audioLevel,
		selectedLanguage,
		isGuestUser,
		currentTranscript,
		isTranscribing,
		onSendMessage,
		onEndConversation
	}: Props = $props();

	let messageInput = $state('');

	function handleSendMessage() {
		if (messageInput.trim() && (status === 'connected' || status === 'streaming')) {
			onSendMessage(messageInput.trim());
			messageInput = '';
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSendMessage();
		}
	}

	const headerInfo = $derived(() => {
		if (isGuestUser && messages.length < 4) {
			return {
				title: `Welcome to ${selectedLanguage?.name || 'Language'} Learning!`,
				subtitle: "Let's get to know you and create your perfect learning plan",
				badge: 'Personalizing'
			};
		} else {
			return {
				title: `${selectedLanguage?.name || 'Language'} Conversation`,
				subtitle: null,
				badge: 'Active'
			};
		}
	});
</script>

<div class="container mx-auto max-w-4xl px-4 py-6" in:fly={{ y: 20, duration: 400 }}>
	<!-- Header -->
	<header class="mb-6 text-center">
		<div class="mb-4 flex items-center justify-center gap-4">
			<h1 class="text-2xl font-bold text-primary">
				{headerInfo().title}
			</h1>
			<div class="badge badge-success">{headerInfo().badge}</div>
		</div>
		{#if headerInfo().subtitle}
			<p class="text-base-content/70">{headerInfo().subtitle}</p>
		{/if}
	</header>

	<!-- Live Audio Indicator -->
	<div class="mb-6 flex justify-center" in:fade={{ duration: 300, delay: 200 }}>
		<div class="card border border-success/20 bg-success/5 shadow-lg">
			<div class="card-body p-4 text-center">
				<div class="mb-2 flex justify-center">
					<AudioVisualizer {audioLevel} />
				</div>
				<p class="text-sm text-success">
					{isGuestUser && messages.length < 4
						? 'Getting to know you - Speak naturally'
						: 'Voice chat active - Speak naturally'}
				</p>
			</div>
		</div>
	</div>

	<!-- Live Transcription -->
	{#if currentTranscript}
		<div class="mb-6" in:fly={{ y: -10, duration: 200 }}>
			<div class="card border-l-4 border-l-info bg-info/5">
				<div class="card-body">
					<h3 class="card-title text-lg text-info">You're saying:</h3>
					<div class="rounded-lg bg-base-100 p-4">
						<p class="text-lg">{currentTranscript}</p>
						{#if isTranscribing}
							<div class="mt-2 flex items-center gap-2 text-sm opacity-70">
								<div class="loading loading-sm loading-dots"></div>
								<span>Listening...</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Guest User Helper Text -->
	{#if isGuestUser && messages.length < 3}
		<div class="mb-6" in:fade={{ duration: 300 }}>
			<div class="alert alert-info">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					class="h-6 w-6 shrink-0 stroke-current"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<div>
					<h3 class="font-bold">Welcome to your first lesson!</h3>
					<div class="mt-1 text-xs">
						Our AI tutor will chat with you to understand your goals and assess your level. This
						helps us create the perfect learning experience for you!
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Conversation Messages -->
	<div class="mb-6">
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<h3 class="mb-4 card-title text-xl">
					{isGuestUser && messages.length < 4 ? 'Getting to Know You' : 'Conversation'}
				</h3>
				<div class="max-h-96 space-y-3 overflow-y-auto">
					{#each messages as message, index (message.id)}
						<div in:fly={{ y: 20, duration: 300, delay: index * 50 }}>
							<MessageBubble {message} />
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Text Input -->
	<div class="mb-6">
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={messageInput}
						onkeypress={handleKeyPress}
						placeholder="Type your response..."
						class="input-bordered input flex-1"
					/>
					<button
						onclick={handleSendMessage}
						class="btn btn-primary"
						disabled={!messageInput.trim()}
					>
						Send
					</button>
				</div>
				{#if isGuestUser && messages.length < 4}
					<div class="mt-2 text-xs text-base-content/60">
						Pro tip: You can speak out loud or type your responses - whatever feels more
						comfortable!
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- End Conversation -->
	<div class="flex justify-center">
		<button onclick={onEndConversation} class="btn btn-outline btn-error">
			{isGuestUser ? 'Finish & Get My Results' : 'End Conversation'}
		</button>
	</div>
</div>
