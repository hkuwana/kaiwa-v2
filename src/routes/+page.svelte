<script lang="ts">
	import { createConversationStore } from '$lib/orchestrator.svelte.js';
	import ConversationHistory from '$lib/components/ConversationHistory.svelte';
	import RecordButton from '$lib/components/RecordButton.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import VoiceSelector from '$lib/components/VoiceSelector.svelte';
	import ModeSelector from '$lib/components/ModeSelector.svelte';
	import PricingModal from '$lib/components/PricingModal.svelte';
	import { trackConversion, trackFeature } from '$lib/analytics/posthog.js';

	// 🎯 Page data from server
	const { data } = $props();

	// 🎯 Single conversation store - the heart of the app
	const conversation = createConversationStore();

	// 🎨 UI state
	let showDebug = $state(false);
	let selectedLanguage = $state('en');
	let selectedVoice = $state('alloy');
	let selectedMode = $state<'traditional' | 'realtime'>('traditional');
	let showPricingModal = $state(false);
	let pricingModalSource = $state<'limit_modal' | 'navbar' | 'settings' | 'onboarding'>('navbar');

	// 🎯 Main interaction - toggle recording
	async function toggleRecording() {
		try {
			if (conversation.state.sessionId === '') {
				// Start new conversation with selected settings
				await conversation.startConversation(selectedMode, selectedLanguage, selectedVoice);
			}
			await conversation.toggleRecording();
		} catch (error) {
			console.error('Recording toggle failed:', error);
		}
	}

	// 🎯 Start fresh conversation
	async function startFresh() {
		await conversation.endConversation();
		await conversation.startConversation();
	}

	// 🎯 Start conversation with selected settings
	async function startConversationWithSettings() {
		await conversation.endConversation();
		await conversation.startConversation(selectedMode, selectedLanguage, selectedVoice);
	}

	// 🎨 Status text
	const statusText = $derived(() => {
		if (conversation.hasError) return conversation.state.error;
		if (conversation.state.status === 'realtime-connected') return 'Connected - Ready to stream';
		if (conversation.state.status === 'realtime-streaming')
			return 'Live conversation - Speak naturally';
		if (conversation.isRecording) return 'Recording... Speak now!';
		if (conversation.isProcessing) return 'Processing your speech...';
		if (conversation.isSpeaking) return 'AI is speaking...';
		if (conversation.messageCount > 0) return `${conversation.messageCount} exchanges`;
		return conversation.state.mode === 'realtime'
			? 'Click to connect for real-time chat'
			: 'Click to start speaking';
	});

	// 🧹 Cleanup on page unload
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeunload', () => {
			conversation.cleanup();
		});
	}
</script>

<div class="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
	<!-- Header -->
	<header class="space-y-6 p-6">
		<!-- Title and User Menu -->
		<div class="flex items-center justify-between">
			<div class="flex-1 text-center">
				<h1 class="mb-2 text-4xl font-bold text-gray-800">Kaiwa</h1>
				<p class="text-gray-600">Practice speaking with AI</p>
			</div>

			<!-- User Menu -->
			<div class="flex items-center space-x-4">
				{#if data.user}
					<div class="flex items-center space-x-3">
						{#if data.user.avatarUrl}
							<img src={data.user.avatarUrl} alt="Profile" class="h-8 w-8 rounded-full" />
						{/if}
						<span class="hidden text-sm text-gray-700 sm:inline">
							{data.user.displayName || 'User'}
						</span>
						<form action="/logout" method="post" class="inline">
							<button
								type="submit"
								class="text-sm text-gray-500 transition-colors hover:text-gray-700"
							>
								Sign out
							</button>
						</form>
					</div>
				{:else}
					<a href="/login" class="text-sm text-blue-600 transition-colors hover:text-blue-800">
						Sign in
					</a>
				{/if}
			</div>
		</div>

		<!-- Conversation Settings -->
		<div class="flex flex-wrap items-center justify-center gap-4">
			<!-- Mode Selector -->
			<div class="flex flex-col items-center space-y-2">
				<label for="mode" class="text-sm font-medium text-gray-700">Mode</label>
				<ModeSelector {selectedMode} onModeChange={(mode) => (selectedMode = mode)} />
			</div>

			<!-- Language Selector -->
			<div class="flex flex-col items-center space-y-2">
				<label for="language" class="text-sm font-medium text-gray-700">Language</label>
				<LanguageSelector
					{selectedLanguage}
					onLanguageChange={(language) => (selectedLanguage = language)}
				/>
			</div>

			<!-- Voice Selector -->
			<div class="flex flex-col items-center space-y-2">
				<label for="voice" class="text-sm font-medium text-gray-700">Voice</label>
				<VoiceSelector {selectedVoice} onVoiceChange={(voice) => (selectedVoice = voice)} />
			</div>
		</div>
	</header>

	<!-- Main conversation area -->
	<main class="flex flex-1 flex-col items-center justify-center space-y-8 p-6">
		<!-- Conversation history -->
		<ConversationHistory messages={conversation.state.messages} />

		<!-- Main record button -->
		<div class="flex flex-col items-center space-y-8">
			<RecordButton
				isRecording={conversation.isRecording}
				isProcessing={conversation.isProcessing}
				isSpeaking={conversation.isSpeaking}
				hasError={conversation.hasError}
				onclick={toggleRecording}
			/>

			<!-- Status text -->
			<p class="max-w-md text-center text-lg font-medium">
				{statusText()}
			</p>
		</div>

		<!-- Action buttons -->
		<div class="flex space-x-4">
			{#if conversation.state.messages.length > 0}
				<button
					class="rounded-lg bg-gray-500 px-6 py-2 text-white transition-colors hover:bg-gray-600"
					onclick={startFresh}
				>
					🔄 New Conversation
				</button>
			{/if}

			<button
				class="rounded-lg bg-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-400"
				onclick={() => (showDebug = !showDebug)}
			>
				{showDebug ? '🙈 Hide' : '🔍 Debug'}
			</button>
		</div>
	</main>

	<!-- Debug panel -->
	{#if showDebug}
		<div class="max-h-48 overflow-y-auto bg-gray-900 p-4 font-mono text-sm text-green-400">
			<h3 class="mb-2 text-white">🐛 Debug Info</h3>
			<pre>{JSON.stringify(conversation.state, null, 2)}</pre>
		</div>
	{/if}

	<!-- Footer -->
	<footer class="p-4 text-center text-sm text-gray-500">
		<p>Speak naturally • AI will respond • Keep practicing</p>
		<button
			class="mt-2 text-blue-600 hover:underline"
			onclick={() => {
				showPricingModal = true;
				pricingModalSource = 'navbar';
			}}
		>
			Upgrade for unlimited conversations
		</button>
	</footer>

	<!-- Pricing Modal -->
	<PricingModal bind:isOpen={showPricingModal} currentTier="free" source={pricingModalSource} />
</div>
