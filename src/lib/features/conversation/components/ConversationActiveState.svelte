<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import AudioVisualizer from '$lib/features/audio/components/AudioVisualizer.svelte';
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import ConversationFab from '$lib/features/conversation/components/ConversationFab.svelte';
	import type { Message, Language, UserPreferences } from '$lib/server/db/types';
	import type { Speaker } from '$lib/types';
	import { translationStore } from '$lib/stores/translation.store.svelte';
	import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { shouldTriggerOnboarding } from '$lib/services/onboarding-manager.service';
	import { autoScrollToBottom } from '$lib/actions/auto-scroll-to-bottom';

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
		timeRemaining?: number; // in seconds
		isTimerActive?: boolean;
		maxSessionLengthSeconds?: number; // total session length in seconds
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
		speaker,
		timeRemaining = 180,
		isTimerActive = false,
		maxSessionLengthSeconds = 180
	}: Props = $props();

	// Get audio input mode from conversation store
	const audioInputMode = $derived(conversationStore.audioInputMode);

	// Get speech detection state for VAD visualization
	const speechDetected = $derived(conversationStore.speechDetected);

	const pressBehavior = $derived(() => {
		const pref = userPreferencesStore.getPressBehavior();
		return pref === 'tap_toggle' ? 'press_hold' : pref;
	});

	let messageInput = $state('');
	let translationData = $state(new SvelteMap<string, Partial<Message>>());
	let messagesContainer = $state<HTMLDivElement | null>(null);
	let conversationMode = $state(true); // Default to calm mode (transcript hidden)

	// UI state for chat visibility
	let enableTyping = $state(false);

	// Audio control state
	let hasUsedAudioControl = $state(false);
	let isEnding = $state(false);
	let hasTriggeredInitialGreeting = $state(false);

	// AudioVisualizer positioning state
	let audioVisualizerCentered = $state(true);

	// Determine if we are in an onboarding-like session for hinting
	const showOnboardingHint = $derived(() => {
		const provider = {
			isGuest: () => userPreferencesStore.isGuest(),
			getPreference: (key: any) => userPreferencesStore.getPreference(key),
			updatePreferences: (updates: UserPreferences) =>
				userPreferencesStore.updatePreferences(updates)
		};
		return shouldTriggerOnboarding(provider);
	});

	// Check if we're waiting for user to start
	const waitingForUserToStart = $derived(conversationStore.waitingForUserToStart);

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

	function handleEndRequest() {
		if (isEnding) return;
		isEnding = true;
		onEndConversation();
	}

	function handleRestartConversation() {
		isEnding = false;
		conversationStore.startNewConversationFromReview();
	}

	$effect(() => {
		if (status !== 'connected' && status !== 'streaming') {
			isEnding = false;
		}
	});

	// Auto-mute in toggle-to-talk mode when AI starts responding
	$effect(() => {
		// Only auto-mute in PTT (toggle-to-talk) mode, not in pure VAD mode
		if (audioInputMode === 'ptt' && status === 'streaming' && !conversationStore.isMicMuted) {
			// Check if there's an active assistant message (AI is responding)
			const hasActiveAssistantMessage = messages.some(
				(m) => m.role === 'assistant' && (m.id.startsWith('streaming_') || !m.content)
			);

			if (hasActiveAssistantMessage) {
				console.log('🤖 AI started responding in toggle-to-talk mode - auto-muting mic');
				conversationStore.pauseStreaming();
			}
		}
	});

	async function handleTranslation(
		event: string,
		data: {
			messageId: string;
			message: Message;
			speaker?: Speaker;
		}
	) {
		const { messageId, message } = data;

		try {
			// Set loading state
			translationStore.setTranslating(messageId, true);

			// Get source and target languages
			const sourceLanguage = selectedLanguage?.code || 'en';
			const targetLanguage = sourceLanguage === 'en' ? 'ja' : 'en';

			// Call the server-side API endpoint
			const response = await fetch('/api/features/translate', {
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
	class="min-h-[100dvh] bg-gradient-to-br from-base-100 to-base-200"
	in:fly={{ y: 20, duration: 400 }}
>
	<div class="container mx-auto flex h-[100dvh] box-border max-w-4xl flex-col px-4 py-4">
		<div class="mb-4 flex items-center justify-center">
			<button
				type="button"
				class={`btn btn-sm ${conversationMode ? 'btn-primary' : 'btn-secondary'}`}
				aria-pressed={conversationMode}
				onclick={() => {
					conversationMode = !conversationMode;
				}}
			>
				{#if conversationMode}
					<span class="mr-1 icon-[mdi--eye] h-4 w-4"></span>
					Show Transcript
				{:else}
					<span class="mr-1 icon-[mdi--eye-off] h-4 w-4"></span>
					Focus Mode
				{/if}
			</button>
		</div>

		<!-- Live Transcription -->
		{#if !conversationMode && currentTranscript}
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
		<!-- Added bottom padding (pb-32) to prevent messages from hiding behind the fixed AudioVisualizer -->
		<div class="mb-4 min-h-0 flex-1 pb-32">
			{#if conversationMode}
				<div class="card h-full bg-base-100 shadow-lg">
					<div class="card-body flex h-full flex-col items-center justify-center gap-6 text-center">
						<div class="conversation-visual relative h-56 w-56" data-speech-active={speechDetected}>
							<div
								class="conversation-visual__wave conversation-visual__wave--outer"
								class:conversation-visual__wave--active={speechDetected}
							></div>
							<div
								class="conversation-visual__wave conversation-visual__wave--middle"
								class:conversation-visual__wave--active={speechDetected}
							></div>
							<div
								class="conversation-visual__wave conversation-visual__wave--inner"
								class:conversation-visual__wave--active={speechDetected}
							></div>
							<div
								class="conversation-visual__core"
								class:conversation-visual__core--active={speechDetected}
								style="transform: scale({speechDetected ? 1 + audioLevel * 0.3 : 1})"
							></div>
						</div>
						<div class="hidden space-y-2 md:block">
							<p class="text-lg opacity-80">Conversation mode active</p>
							<p class="text-sm opacity-60">
								Focus on listening and speaking. Transcript and messages are hidden for now.
							</p>
						</div>
					</div>
				</div>
			{:else}
				<div class="card h-full bg-base-100 shadow-lg">
					<div class="card-body flex h-full flex-col pb-8">
						<div class="mb-4 card-title flex-shrink-0 text-xl">
							{isGuestUser && messages.length < 4 ? 'Getting to Know You' : 'Conversation'}
							<span class="text-sm font-normal opacity-70">({messages.length} messages)</span>
						</div>
						<div
							class="flex-1 space-y-3 overflow-y-auto pb-4"
							bind:this={messagesContainer}
							use:autoScrollToBottom={{
								enabled: messages.length > 0,
								trigger: messages[messages.length - 1]?.id,
								delayMs: 100
							}}
						>
							{#if messages.length === 0}
								<div class="flex h-full items-center justify-center">
									<div class="text-center">
										<div class="text-lg opacity-70">No messages yet</div>
										<div class="text-sm opacity-50">
											{#if status === 'connecting'}
												Connecting to conversation...
											{:else if status === 'connected'}
												Start talking to begin the conversation
											{:else if status === 'streaming'}
												Listening for your voice...
											{:else}
												Status: {status}
											{/if}
										</div>
									</div>
								</div>
							{:else}
								{#each messages as message, index (message.id)}
									<div in:fly={{ y: 20, duration: 300, delay: index * 50 }}>
										<MessageBubble
											{message}
											{speaker}
											translation={translationData.get(message.id)}
											dispatch={handleTranslation}
										/>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Text Input - hidden by default to promote audio; flip enableTyping to true to show -->
		{#if enableTyping && !conversationMode}
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

		<!-- AudioVisualizer - Only shown in PTT (toggle-to-talk) mode, hidden in pure VAD mode -->
		{#if audioInputMode === 'ptt'}
			<div class="fixed bottom-8 left-1/2 z-30 -translate-x-1/2 transform">
				<AudioVisualizer
					{audioLevel}
					{timeRemaining}
					{isTimerActive}
					{maxSessionLengthSeconds}
					controlMode="external"
					pressBehavior="tap_toggle"
					{audioInputMode}
					onRecordStart={() => {
						hasUsedAudioControl = true;

						// In PTT mode, resume streaming when user presses button (unmute)
						console.log('▶️ Toggle-to-Talk: User toggled mic ON - resuming streaming');
						conversationStore.resumeStreaming();
						// Mark that we've triggered greeting
						if (waitingForUserToStart) {
							hasTriggeredInitialGreeting = true;
						}
					}}
					onRecordStop={() => {
						// In PTT toggle mode, this mutes the mic
						console.log('⏸️ Toggle-to-Talk: User toggled mic OFF - pausing streaming');
						conversationStore.pauseStreaming();
					}}
				/>
			</div>
		{/if}

		<!-- Centered Hint - Only show when AudioVisualizer is at bottom -->
		{#if !audioVisualizerCentered && showOnboardingHint() && !hasUsedAudioControl}
			<div class="pointer-events-none fixed inset-x-0 bottom-28 z-50 select-none">
				<div
					class="mx-auto w-auto max-w-[80vw] rounded-md bg-base-200 px-4 py-2 text-center text-sm text-base-content shadow-lg md:max-w-[40vw]"
				>
					{#if audioInputMode === 'ptt'}
						<div class="flex items-center justify-center gap-2">
							<span class="icon-[mdi--microphone] h-4 w-4"></span>
							<span>Press and hold the microphone to talk</span>
						</div>
						<div class="mt-1 text-xs opacity-70">Release to hear Kaiwa's response</div>
					{:else}
						<div class="flex items-center justify-center gap-2">
							<span class="icon-[mdi--microphone] h-4 w-4"></span>
							<span>Just start talking - Kaiwa will respond automatically</span>
						</div>
					{/if}
				</div>
				<span class="mx-auto mt-2 icon-[mdi--chevron-down] h-7 w-7 animate-bounce text-base-content"
				></span>
			</div>
		{/if}

		<!-- FAB Flower - uses fixed positioning viewport-relative wrapper -->
		<div class="fab-container">
			<ConversationFab
				user={userManager.user}
				{timeRemaining}
				timerActive={isTimerActive}
				onEndConversation={handleEndRequest}
				onRestartConversation={handleRestartConversation}
			/>
		</div>
	</div>
</div>

<style>
	.conversation-visual {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.conversation-visual__core {
		position: relative;
		height: 7rem;
		width: 7rem;
		border-radius: 9999px;
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.55), rgba(14, 165, 233, 0.4));
		box-shadow:
			0 0 30px rgba(99, 102, 241, 0.35),
			0 0 60px rgba(56, 189, 248, 0.25);
		backdrop-filter: blur(4px);
		transition: transform 0.1s ease-out;
	}

	/* Active state: increased glow and warmer colors when speaking */
	.conversation-visual__core--active {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.65), rgba(14, 165, 233, 0.5));
		box-shadow:
			0 0 40px rgba(16, 185, 129, 0.5),
			0 0 80px rgba(56, 189, 248, 0.35);
	}

	.conversation-visual__wave {
		position: absolute;
		inset: 0;
		border-radius: 9999px;
		border: 2px solid rgba(99, 102, 241, 0.2);
		animation: conversationPulse 6s ease-in-out infinite;
	}

	/* Active state: faster pulse animation when speaking */
	.conversation-visual__wave--active {
		animation: conversationPulseActive 2s ease-in-out infinite;
		border-color: rgba(16, 185, 129, 0.3);
	}

	.conversation-visual__wave--middle {
		animation-delay: 2s;
		border-color: rgba(56, 189, 248, 0.25);
	}

	.conversation-visual__wave--middle.conversation-visual__wave--active {
		animation-delay: 0.66s;
	}

	.conversation-visual__wave--inner {
		animation-delay: 4s;
		border-color: rgba(59, 130, 246, 0.25);
	}

	.conversation-visual__wave--inner.conversation-visual__wave--active {
		animation-delay: 1.33s;
	}

	.conversation-visual__wave--outer {
		transform: scale(1.1);
	}

	@keyframes conversationPulse {
		0% {
			transform: scale(1);
			opacity: 0.35;
		}

		50% {
			transform: scale(1.35);
			opacity: 0.1;
		}

		100% {
			transform: scale(1.65);
			opacity: 0;
		}
	}

	/* Faster pulse animation for active speech detection */
	@keyframes conversationPulseActive {
		0% {
			transform: scale(1);
			opacity: 0.5;
		}

		50% {
			transform: scale(1.25);
			opacity: 0.2;
		}

		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}

	/* FAB Container - breaks out of parent's position context */
	/* Aligned with FeedbackButton (left-4 bottom-6) at button baseline */
	:global(.fab-container) {
		position: fixed;
		bottom: 1.5rem; /* Matches FeedbackButton's bottom-6 */
		right: 1rem; /* Matches FeedbackButton's left-4 */
		z-index: 40;
	}

	@media (min-width: 768px) {
		:global(.fab-container) {
			bottom: 2rem; /* Matches FeedbackButton's md:bottom-8 */
			right: 2rem; /* Matches FeedbackButton's md:left-8 */
		}
	}
</style>
