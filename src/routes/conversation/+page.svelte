<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { ModernRealtimeConversationOrchestrator } from '$lib/features/conversation/realtime-conversation-orchestrator.svelte';
	import type { RealtimeConversationState } from '$lib/features/conversation/realtime-conversation-orchestrator.svelte';
	import type { PageData } from './$types';

	
	interface Props {
		// Props
		data: PageData;
	}

	let { data }: Props = $props();

	// State
	let orchestrator: ConversationOrchestrator;
	let conversationState: ConversationState = $state();
	let isInitialized = false;

	// Initialize orchestrator
	onMount(async () => {
		try {
			orchestrator = new ConversationOrchestrator(EventBusFactory.create('conversation'));
			
			// Start conversation with configuration
			await orchestrator.startConversation({
				language: data.conversationConfig.language,
				voice: data.conversationConfig.voice,
				userLevel: data.conversationConfig.userLevel,
				scenario: data.conversationConfig.scenario,
				speaker: data.conversationConfig.speaker,
				formattedMemory: data.conversationConfig.formattedMemory
			});

			// Set up state monitoring
			setupStateMonitoring();
			isInitialized = true;

		} catch (error) {
			console.error('Failed to initialize conversation:', error);
		}
	});

	// Cleanup
	onDestroy(() => {
		if (orchestrator) {
			orchestrator.dispose();
		}
	});

	// State monitoring
	function setupStateMonitoring() {
		const interval = setInterval(() => {
			if (orchestrator) {
				conversationState = orchestrator.getState();
			}
		}, 100);

		// Cleanup interval
		onDestroy(() => clearInterval(interval));
	}

	// Conversation controls
	async function startRecording() {
		if (!orchestrator) return;
		
		try {
			await orchestrator.startRecording();
		} catch (error) {
			console.error('Failed to start recording:', error);
		}
	}

	async function stopRecording() {
		if (!orchestrator) return;
		
		try {
			await orchestrator.stopRecording();
		} catch (error) {
			console.error('Failed to stop recording:', error);
		}
	}

	async function endConversation() {
		if (!orchestrator) return;
		
		try {
			await orchestrator.stopConversation();
		} catch (error) {
			console.error('Failed to end conversation:', error);
		}
	}

	// Format timestamp
	function formatTimestamp(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString();
	}

	// Get status color
	function getStatusColor(status: string): string {
		switch (status) {
			case 'connected': return 'text-green-500';
			case 'recording': return 'text-red-500';
			case 'processing': return 'text-yellow-500';
			case 'speaking': return 'text-blue-500';
			case 'error': return 'text-red-600';
			default: return 'text-gray-500';
		}
	}
</script>

<svelte:head>
	<title>Conversation - Kaiwa</title>
	<meta name="description" content="Practice conversation with AI tutor" />
</svelte:head>

<div class="conversation-page min-h-screen bg-gray-50">
	<div class="max-w-4xl mx-auto p-6">
		<!-- Header -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<div class="flex justify-between items-center">
				<div>
					<h1 class="text-2xl font-bold text-gray-900">
						{data.conversationConfig.language.toUpperCase()} Conversation
					</h1>
					<p class="text-gray-600">
						Session: {data.conversationConfig.sessionId}
					</p>
				</div>
				
				<div class="text-right">
					<p class="text-sm text-gray-500">
						{data.isGuest ? 'Guest User' : data.user?.displayName || 'User'}
					</p>
					<p class="text-sm text-gray-500">
						Level: {data.conversationConfig.userLevel}
					</p>
				</div>
			</div>
		</div>

		<!-- Conversation Status -->
		{#if conversationState}
			<div class="bg-white rounded-lg shadow-sm p-4 mb-6">
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class="w-3 h-3 rounded-full {getStatusColor(conversationState.status)}"></div>
						<span class="font-medium capitalize">{conversationState.status}</span>
					</div>
					
					{#if conversationState.startTime}
						<p class="text-sm text-gray-500">
							Duration: {Math.floor((Date.now() - conversationState.startTime) / 1000)}s
						</p>
					{/if}
				</div>

				{#if conversationState.error}
					<div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
						<p class="text-red-700 text-sm">{conversationState.error}</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Conversation Controls -->
		<div class="bg-white rounded-lg shadow-sm p-6 mb-6">
			<div class="flex justify-center space-x-4">
				{#if conversationState?.status === 'connected'}
					<button
						onclick={startRecording}
						class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
					>
						🎤 Start Recording
					</button>
				{:else if conversationState?.status === 'recording'}
					<button
						onclick={stopRecording}
						class="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
					>
						⏹️ Stop Recording
					</button>
				{:else if conversationState?.status === 'processing'}
					<div class="px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
						⏳ Processing...
					</div>
				{:else if conversationState?.status === 'speaking'}
					<div class="px-6 py-3 bg-blue-100 text-blue-800 rounded-lg font-medium">
						🔊 Speaking...
					</div>
				{/if}

				{#if conversationState?.status !== 'idle'}
					<button
						onclick={endConversation}
						class="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
					>
						🔚 End Conversation
					</button>
				{/if}
			</div>
		</div>

		<!-- Messages -->
		{#if conversationState?.messages && conversationState.messages.length > 0}
			<div class="bg-white rounded-lg shadow-sm p-6">
				<h2 class="text-lg font-semibold mb-4">Conversation</h2>
				
				<div class="space-y-4 max-h-96 overflow-y-auto">
					{#each conversationState.messages as message}
						<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
							<div class="max-w-xs lg:max-w-md">
								<div class="p-3 rounded-lg {message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}">
									<p class="text-sm">{message.content}</p>
									<p class="text-xs mt-2 opacity-70">
										{formatTimestamp(message.timestamp)}
									</p>
								</div>
								
								{#if message.audioUrl}
									<div class="mt-2">
										<audio controls class="w-full">
											<source src={message.audioUrl} type="audio/mp3" />
											Your browser does not support the audio element.
										</audio>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="bg-white rounded-lg shadow-sm p-6 text-center">
				<p class="text-gray-500">No messages yet. Start recording to begin the conversation!</p>
			</div>
		{/if}

		<!-- Audio State Display -->
		{#if conversationState?.audioState}
			<div class="bg-white rounded-lg shadow-sm p-4 mt-6">
				<h3 class="text-sm font-medium text-gray-700 mb-2">Audio Status</h3>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p><strong>Status:</strong> {conversationState.audioState.status}</p>
						<p><strong>Volume:</strong> {(conversationState.audioState.volume * 100).toFixed(0)}%</p>
					</div>
					<div>
						<p><strong>Can Record:</strong> {conversationState.audioState.status === 'idle' ? 'Yes' : 'No'}</p>
						<p><strong>Can Play:</strong> {conversationState.audioState.status === 'idle' ? 'Yes' : 'No'}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
