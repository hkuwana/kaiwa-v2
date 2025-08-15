<script lang="ts">
	import { onMount } from 'svelte';
	import { createConversationStore } from '$lib/features/conversation/store.svelte';

	// Create the conversation store
	const conversation = createConversationStore();

	// Cleanup on unmount
	onMount(() => {
		return () => {
			conversation.cleanup();
		};
	});

	// Handle recording toggle
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
			<p class="text-lg text-base-content/70">
				Practice languages through natural conversations
			</p>
			
			<!-- Navigation -->
			<div class="mt-4 flex justify-center space-x-4">
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
				on:click={handleRecordingToggle}
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
