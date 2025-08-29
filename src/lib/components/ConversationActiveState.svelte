<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
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

	// Get timer state from conversation store
	let timerState = $derived(conversationStore.timerState);

	// Debug timer state
	$effect(() => {
		console.log('🔍 Timer state changed:', timerState);
	});

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
</script>

<div
	class="min-h-screen bg-gradient-to-br from-base-100 to-base-200"
	in:fly={{ y: 20, duration: 400 }}
>
	<div class="container mx-auto flex h-screen max-w-4xl flex-col px-4 py-4">
		<!-- Live Transcription -->
		{#if currentTranscript}
			<div class="mb-4 flex-shrink-0" in:fly={{ y: -10, duration: 200 }}>
				<div class="card border-l-4 border-l-info bg-info/5">
					<div class="card-body p-4">
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

		<!-- Conversation Messages - Takes up remaining space -->
		<div class="mb-4 min-h-0 flex-1">
			<div class="card h-full bg-base-100 shadow-lg">
				<div class="card-body flex h-full flex-col">
					<h3 class="mb-4 card-title flex-shrink-0 text-xl">
						{isGuestUser && messages.length < 4 ? 'Getting to Know You' : 'Conversation'}
					</h3>
					<div class="flex-1 space-y-3 overflow-y-auto">
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
		<div class="mb-4 flex-shrink-0">
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body p-4">
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

		<!-- Live Audio Indicator -->
		<div class="mb-4 flex-shrink-0" in:fade={{ duration: 300, delay: 200 }}>
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

		<!-- End Conversation -->
		<div class="flex flex-shrink-0 justify-center">
			<button onclick={onEndConversation} class="btn btn-outline btn-error">
				{isGuestUser ? 'Finish & Get My Results' : 'End Conversation'}
			</button>
		</div>
	</div>
</div>
