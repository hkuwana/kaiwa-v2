<script lang="ts">
	import { page } from '$app/state';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import MessageBubble from '$lib/components/MessageBubble.svelte';
	import { invalidateAll } from '$app/navigation';

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

	// Manual message input
	let messageInput = '';

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
		invalidateAll();
	}

	function handleSendMessage() {
		if (messageInput.trim() && status === 'connected' || status === 'streaming') {
			conversationStore.sendMessage(messageInput.trim());
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

<div class="mx-auto max-w-4xl p-8 font-sans">
	<header class="mb-8 text-center">
		<h1 class="mb-2 text-4xl font-bold text-primary">{selectedLanguage?.name} Conversation</h1>
		{#if userId}
			<p class="text-lg text-base-content/70">Welcome back, user!</p>
		{:else}
			<p class="text-lg text-base-content/70">Guest mode - your conversation won't be saved</p>
		{/if}
	</header>

	<main>
		{#if status === 'idle' || status === 'error'}
			<div class="card my-8 border border-base-300 bg-base-100 p-8 text-center shadow-lg">
				<button onclick={handleStart} class="btn btn-lg btn-primary">Start Conversation</button>
				{#if error}
					<div class="mt-4 alert alert-error">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 shrink-0 stroke-current"
							fill="none"
							viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							/></svg
						>
						<span>Something went wrong: {error}</span>
						<button onclick={handleClearError} class="btn btn-outline btn-sm">Try Again</button>
					</div>
				{/if}
			</div>
		{:else if status === 'connecting'}
			<LoadingScreen />
		{:else if status === 'connected'}
			<div class="card my-8 border border-base-300 bg-base-100 p-8 text-center shadow-lg">
				<p class="mb-4 text-xl text-success">Connected! Ready to start streaming.</p>
				<div class="space-x-4">
					<button onclick={handleStartStreaming} class="btn btn-lg btn-success"
						>Start Streaming</button
					>
					<button onclick={handleEndConversation} class="btn btn-lg btn-error"
						>End Conversation</button
					>
				</div>
			</div>
		{:else if status === 'streaming'}
			<div class="card my-8 border border-base-300 bg-base-100 p-8 text-center shadow-lg">
				<p class="mb-4 text-xl text-info">Streaming audio...</p>
				<AudioVisualizer audioLevel={audioLevel * 100} />
				<div class="mt-4 space-x-4">
					<button onclick={handleStopStreaming} class="btn btn-lg btn-warning"
						>Stop Streaming</button
					>
					<button onclick={handleEndConversation} class="btn btn-lg btn-error"
						>End Conversation</button
					</div>
				</div>
			</div>
		{/if}

		{#if messages.length > 0}
			<div class="card my-8 border border-base-300 bg-base-100 p-6 shadow-lg">
				<h3 class="mb-4 text-2xl font-semibold text-primary">Conversation</h3>
				<div class="space-y-3">
					{#each messages as message}
						<MessageBubble {message} />
					{/each}
				</div>
			</div>
		{/if}

		{#if status === 'connected' || status === 'streaming'}
			<div class="card my-8 border border-base-300 bg-base-100 p-6 shadow-lg">
				<h3 class="mb-4 text-xl font-semibold text-primary">Send Message</h3>
				<div class="flex space-x-2">
					<input
						type="text"
						bind:value={messageInput}
						on:keypress={handleKeyPress}
						placeholder="Type your message..."
						class="input input-bordered flex-1"
					/>
					<button onclick={handleSendMessage} class="btn btn-primary">Send</button>
				</div>
			</div>
		{/if}

		{#if availableDevices.length > 0}
			<div class="card my-8 border border-base-300 bg-base-100 p-6 shadow-lg">
				<h3 class="mb-4 text-xl font-semibold text-primary">Audio Device</h3>
				<select
					value={selectedDeviceId}
					onchange={(e) => handleSelectDevice((e.target as HTMLSelectElement).value)}
					class="select-bordered select w-full"
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
