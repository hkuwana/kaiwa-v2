<script lang="ts">
	import { onMount } from 'svelte';
	import { createConversationStore } from '$lib/features/conversation/store.svelte';
	import { goto } from '$app/navigation';
	import { languages } from '$lib/data/languages';
	import { speakersData } from '$lib/data/speakers';

	// Create the conversation store
	const conversation = createConversationStore();

	// Language selection state
	let selectedLanguage = $state('en');

	// Get available speakers for the selected language
	const availableSpeakers = $derived(
		speakersData.filter((speaker) => speaker.languageId === selectedLanguage && speaker.openAIId)
	);

	// Allow manual override, but default to the first available speaker
	let selectedVoiceManual = $state<string | null>(null);
	const selectedVoice = $derived(selectedVoiceManual ?? (availableSpeakers[0]?.openAIId ?? 'alloy'));

	// Available languages from data source (following your architecture principle)
	// Filter to only show supported languages
	const availableLanguages = languages.filter(lang => lang.isSupported);



	// Cleanup on unmount
	onMount(() => {
		return () => {
			conversation.cleanup();
		};
	});

	// Handle starting realtime conversation
	async function startRealtimeConversation() {
		// Store language/voice preferences in sessionStorage for the orchestrator
		sessionStorage.setItem('kaiwa_language', selectedLanguage);
		sessionStorage.setItem('kaiwa_voice', selectedVoice);
		
		// Route to realtime page with auto-start
		await goto('/realtime');
	}

	// Handle recording toggle (traditional mode)
	async function handleRecordingToggle() {
		await conversation.toggleRecording();
	}

	// Get status display
	function getStatusDisplay() {
		if (conversation.hasError) return '❌ Error';
		if (conversation.isRecording) return '🎤 Recording...';
		if (conversation.isProcessing) return '🤔 Processing...';
		if (conversation.isSpeaking) return '🔊 Speaking...';
		return '💬 Ready to chat';
	}

	// Get button text
	function getButtonText() {
		if (conversation.isRecording) return '⏹️ Stop Recording';
		return '🎤 Start Conversation';
	}

	// Get button class
	function getButtonClass() {
		if (conversation.isRecording) return 'btn btn-error btn-lg';
		if (conversation.canRecord) return 'btn btn-primary btn-lg';
		return 'btn btn-disabled btn-lg';
	}
</script>

<svelte:head>
	<title>Kaiwa - Language Learning Conversations</title>
</svelte:head>

<main class="container mx-auto px-4 py-8">
	<div class="max-w-2xl mx-auto text-center">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-4xl font-bold text-primary mb-4">Kaiwa</h1>
			<p class="text-lg text-base-content/70 mb-6">
				Practice languages through natural conversations with AI
			</p>
		</div>

		<!-- Language & Voice Selection -->
		<div class="mb-8">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
				<!-- Language Selection -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">🌍 Choose Your Language</h3>
						<div class="grid grid-cols-2 gap-3">
							{#each availableLanguages as language}
								<button
									class="btn btn-outline h-auto p-4 flex-col {selectedLanguage === language.code ? 'btn-primary' : ''}"
									onclick={() => selectedLanguage = language.code}
								>
									<span class="text-2xl mb-2">{language.flag}</span>
									<span class="text-sm font-medium">{language.name}</span>
									<span class="text-xs opacity-70">{language.nativeName}</span>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Voice Selection -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title text-lg mb-4">🎭 Choose Your AI Voice</h3>
						{#if availableSpeakers.length > 0}
							<div class="space-y-2">
								{#each availableSpeakers as speaker}
									<button
										class="btn btn-outline w-full justify-start h-auto p-3 {selectedVoice === speaker.openAIId ? 'btn-primary' : ''}"
										onclick={() => selectedVoiceManual = speaker.openAIId}
									>
										<div class="text-left">
											<div class="font-medium">{speaker.voiceName}</div>
											<div class="text-xs opacity-70">
												{speaker.gender === 'male' ? '👨' : '👩'} {speaker.dialectName} • {speaker.region}
											</div>
										</div>
									</button>
								{/each}
							</div>
						{:else}
							<div class="text-center text-base-content/60 py-4">
								<p>No voices available for {availableLanguages.find(l => l.code === selectedLanguage)?.name}</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Start Realtime Conversation Button -->
		<div class="mb-8 text-center">
			<button
				class="btn btn-primary btn-lg px-12 py-6 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
				onclick={startRealtimeConversation}
			>
				🚀 Start Real-time Conversation
			</button>
			<p class="text-sm text-base-content/60 mt-2">
				Click to begin practicing {availableLanguages.find(l => l.code === selectedLanguage)?.name} with {availableSpeakers.find(s => s.openAIId === selectedVoice)?.voiceName || 'AI Voice'}
			</p>
		</div>

		<!-- Divider -->
		<div class="divider my-8">OR</div>

		<!-- Traditional Mode Section -->
		<div class="mb-8">
			<h2 class="text-2xl font-semibold text-center mb-4">Traditional Mode</h2>
			<p class="text-center text-base-content/70 mb-6">
				Practice with turn-based conversations
			</p>
			
			<!-- Navigation -->
			<div class="flex justify-center space-x-4 mb-6">
				<a href="/" class="btn btn-sm btn-primary">Traditional</a>
				<a href="/realtime" class="btn btn-sm btn-outline">Real-time</a>
				<a href="/dev" class="btn btn-sm btn-ghost">🧪 Dev</a>
			</div>
		</div>

		<!-- Status Display -->
		<div class="mb-8">
			<div class="text-xl font-semibold mb-2">
				{getStatusDisplay()}
			</div>
			{#if conversation.messageCount > 0}
				<div class="text-sm text-base-content/60">
					{conversation.messageCount} message{conversation.messageCount === 1 ? '' : 's'} exchanged
				</div>
			{/if}
		</div>

		<!-- Main Button -->
		<div class="mb-8">
			<button
				class={getButtonClass()}
				onclick={handleRecordingToggle}
				disabled={!conversation.canRecord && !conversation.isRecording}
			>
				{getButtonText()}
			</button>
		</div>

		<!-- Error Display -->
		{#if conversation.hasError}
			<div class="alert alert-error mb-4">
				<span>⚠️ {conversation.state.error}</span>
			</div>
		{/if}

		<!-- Conversation History -->
		{#if conversation.state.messages.length > 0}
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Conversation History</h2>
					<div class="space-y-4 max-h-96 overflow-y-auto">
						{#each conversation.state.messages as message}
							<div class="chat {message.role === 'user' ? 'chat-start' : 'chat-end'}">
								<div class="chat-bubble {message.role === 'user' ? 'chat-bubble-primary' : 'chat-bubble-secondary'}">
									{message.content}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Instructions -->
		<div class="mt-8 text-sm text-base-content/60">
			<p>Click the button above to start a conversation. Speak naturally and the AI will respond.</p>
		</div>
	</div>
</main>
