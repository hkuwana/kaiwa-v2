<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import type { Message, Language } from '$lib/server/db/types';
	import type { Speaker } from '$lib/types';
	import { translationStore } from '$lib/stores/translation.store.svelte';
	import { userPreferencesStore } from '$lib/stores/userPreferences.store.svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { shouldTriggerOnboarding } from '$lib/services/onboarding-manager.service';

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
		speaker?: Speaker;
	}

	const {
		status,
		messages,
		audioLevel,
		selectedLanguage,
		isGuestUser,
		currentTranscript,
		isTranscribing,
		onSendMessage,
		onEndConversation,
		speaker
	}: Props = $props();

	let messageInput = $state('');
	let translationData = $state<Map<string, Partial<Message>>>(new Map());
	let messagesContainer: HTMLElement;

	// UI state for chat visibility
	const enableTyping = $state(false);

	// Audio control state
	let hasUsedAudioControl = $state(false);

	// Determine if we are in an onboarding-like session for hinting
	const showOnboardingHint = $derived(() => {
		const provider = {
			isGuest: () => userPreferencesStore.isGuest(),
			getPreference: (key: any) => userPreferencesStore.getPreference(key),
			updatePreferences: (updates: any) => userPreferencesStore.updatePreferences(updates)
		};
		return shouldTriggerOnboarding(provider);
	});

	// Auto-scroll to latest message when new messages arrive
	$effect(() => {
		if (messages.length > 0 && messagesContainer) {
			// Use a small delay to ensure the new message DOM is rendered
			setTimeout(() => {
				messagesContainer.scrollTo({
					top: messagesContainer.scrollHeight,
					behavior: 'smooth'
				});
			}, 100);
		}
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

	async function handleTranslation(_event: string, data: any) {
		const { messageId, message } = data;

		try {
			// Set loading state
			translationStore.setTranslating(messageId, true);

			// Get source and target languages
			const sourceLanguage = selectedLanguage?.code || 'en';
			const targetLanguage = sourceLanguage === 'en' ? 'ja' : 'en';

			// Call the server-side API endpoint
			const response = await fetch('/api/translate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text: message.content,
					messageId,
					sourceLanguage,
					targetLanguage
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Translation failed');
			}

			const result = await response.json();

			// Store the translation data
			const organizedTranslation = translationStore.organizeTranslationData(messageId, result);
			translationStore.setTranslationData(messageId, organizedTranslation);

			// Update local translation data for display
			translationData.set(messageId, organizedTranslation);
			translationData = new SvelteMap(translationData); // Trigger reactivity

			// Show the translation
			translationStore.showTranslation(messageId);
		} catch (error) {
			console.error('Translation failed:', error);
		} finally {
			translationStore.setTranslating(messageId, false);
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
						<div class="card-title text-lg text-info">You're saying:</div>
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

		<!-- Conversation Messages - Always visible; input may be hidden -->
		<div class="mb-4 min-h-0 flex-1">
			<div class="card h-full bg-base-100 shadow-lg">
				<div class="card-body flex h-full flex-col">
					<div class="mb-4 card-title flex-shrink-0 text-xl">
						{isGuestUser && messages.length < 4 ? 'Getting to Know You' : 'Conversation'}
					</div>
					<div class="flex-1 space-y-3 overflow-y-auto" bind:this={messagesContainer}>
						{#each messages as message, index (message.id)}
							<div in:fly={{ y: 20, duration: 300, delay: index * 50 }}>
								<MessageBubble
									{message}
									{speaker}
									translation={translationData.get(message.id)}
									conversationLanguage={selectedLanguage?.code}
									dispatch={handleTranslation}
								/>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Text Input - hidden by default to promote audio; flip enableTyping to true to show -->
		{#if enableTyping}
			<div class="mb-4 flex-shrink-0" in:fade={{ duration: 120 }}>
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
					</div>
				</div>
			</div>
		{/if}

		<!-- AudioVisualizer - Fixed at bottom center -->
		<div class="fixed bottom-8 left-1/2 z-30 -translate-x-1/2 transform">
			<AudioVisualizer
				{audioLevel}
				controlMode="external"
				pressBehavior={userPreferencesStore.getPressBehavior()}
				highContrast={true}
				onRecordStart={() => {
					hasUsedAudioControl = true;
					// If not already in push-to-talk, switch immediately when user clicks the control
					if (userPreferencesStore.getAudioMode() !== 'push_to_talk') {
						userPreferencesStore.setAudioMode('push_to_talk');
						if (userPreferencesStore.getPressBehavior() !== 'press_hold') {
							userPreferencesStore.setPressBehavior('press_hold');
						}
					}
					conversationStore.resumeStreaming();
				}}
				onRecordStop={() => {
					if (userPreferencesStore.getAudioMode() === 'push_to_talk') {
						conversationStore.pauseStreaming();
					}
				}}
			/>
		</div>

		<!-- Centered Hint - Managed by ConversationActiveState -->
		{#if showOnboardingHint() && !hasUsedAudioControl}
			<div class="pointer-events-none fixed inset-x-0 bottom-28 z-50 select-none">
				<div
					class="mx-auto w-auto max-w-[80vw] rounded-md bg-base-200 px-4 py-2 text-center text-sm text-base-content shadow-lg md:max-w-[40vw]"
				>
					Tap and hold to talk, then release to hear Kaiwa
				</div>
				<svg
					class="mx-auto mt-2 h-7 w-7 animate-bounce text-base-content"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path d="M6 9l6 6 6-6" />
				</svg>
			</div>
		{/if}

		<!-- End Conversation (fixed bottom-right) -->
		<div class="pointer-events-none fixed right-4 bottom-4 z-40">
			<button
				onclick={onEndConversation}
				class="btn-small sm:btn-medium btn pointer-events-auto btn-outline btn-error"
			>
				{isGuestUser ? 'Finish Chat' : 'End Conversation'}
			</button>
		</div>
	</div>
</div>
