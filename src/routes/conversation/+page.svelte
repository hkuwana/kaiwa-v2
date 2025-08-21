<script lang="ts">
	import { page } from '$app/state';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';

	// Get user ID from page data (from your +layout.server.ts)
	const userId = page.data.user?.id ?? null;

	// Use $derived to get reactive values from the store
	const status = $derived(conversationStore.status);
	const messages = $derived(conversationStore.messages);
	const error = $derived(conversationStore.error);
	const audioLevel = $derived(conversationStore.audioLevel);
	const availableDevices = $derived(conversationStore.availableDevices);
	const selectedDeviceId = $derived(conversationStore.selectedDeviceId);

	// Get settings from settings store
	const selectedLanguage = $derived(settingsStore.selectedLanguage);
	const selectedSpeaker = $derived(settingsStore.selectedSpeaker);

	function handleStart() {
		conversationStore.startConversation(selectedLanguage?.code, selectedSpeaker);
	}

	function handleStartStreaming() {
		conversationStore.startStreaming();
	}

	function handleStopStreaming() {
		conversationStore.stopStreaming();
	}

	function handleEndConversation() {
		conversationStore.endConversation();
	}

	function handleSelectDevice(deviceId: string) {
		conversationStore.selectDevice(deviceId);
	}

	function handleClearError() {
		conversationStore.clearError();
	}
</script>

<div class="conversation-container">
	<header>
		<h1>Language Conversation</h1>
		{#if userId}
			<p>Welcome back, user!</p>
		{:else}
			<p>Guest mode - your conversation won't be saved</p>
		{/if}
	</header>

	<main>
		{#if status === 'idle' || status === 'error'}
			<div class="start-section">
				<button onclick={handleStart} class="start-btn"> Start Conversation </button>
				{#if error}
					<div class="error-message">
						<p>Something went wrong: {error}</p>
						<button onclick={handleClearError}>Try Again</button>
					</div>
				{/if}
			</div>
		{:else if status === 'connecting'}
			<LoadingScreen />
		{:else if status === 'connected'}
			<div class="connected">
				<p>Connected! Ready to start streaming.</p>
				<button onclick={handleStartStreaming} class="stream-btn"> Start Streaming </button>
				<button onclick={handleEndConversation} class="end-btn"> End Conversation </button>
			</div>
		{:else if status === 'streaming'}
			<div class="streaming">
				<p>Streaming audio...</p>
				<AudioVisualizer audioLevel={audioLevel * 100} />
				<button onclick={handleStopStreaming} class="stop-btn"> Stop Streaming </button>
				<button onclick={handleEndConversation} class="end-btn"> End Conversation </button>
			</div>
		{/if}

		{#if messages.length > 0}
			<div class="messages">
				<h3>Conversation</h3>
				<div class="messages-container">
					{#each messages as message}
						<MessageBubble {message} />
					{/each}
				</div>
			</div>
		{/if}

		{#if availableDevices.length > 0}
			<div class="device-selector">
				<h3>Audio Device</h3>
				<select
					value={selectedDeviceId}
					onchange={(e) => handleSelectDevice((e.target as HTMLSelectElement).value)}
				>
					{#each availableDevices as device}
						<option value={device.deviceId}>
							{device.label || `Device ${device.deviceId.slice(0, 8)}`}
						</option>
					{/each}
				</select>
			</div>
		{/if}
	</main>
</div>

<style>
	.conversation-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.start-section,
	.connected,
	.streaming {
		text-align: center;
		margin: 2rem 0;
		padding: 2rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
	}

	.start-btn,
	.stream-btn,
	.stop-btn,
	.end-btn {
		padding: 0.75rem 1.5rem;
		margin: 0.5rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.start-btn {
		background: #3b82f6;
		color: white;
	}

	.start-btn:hover {
		background: #2563eb;
	}

	.stream-btn {
		background: #10b981;
		color: white;
	}

	.stream-btn:hover {
		background: #059669;
	}

	.stop-btn {
		background: #f59e0b;
		color: white;
	}

	.stop-btn:hover {
		background: #d97706;
	}

	.end-btn {
		background: #ef4444;
		color: white;
	}

	.end-btn:hover {
		background: #dc2626;
	}

	.error-message {
		margin-top: 1rem;
		padding: 1rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
		color: #dc2626;
	}

	.messages {
		margin: 2rem 0;
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
	}

	.messages-container {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.device-selector {
		margin: 2rem 0;
		padding: 1rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
	}

	.device-selector select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 1rem;
	}
</style>
