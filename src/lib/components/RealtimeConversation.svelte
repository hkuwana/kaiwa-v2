<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EventBusFactory } from '$lib/shared/events/eventBus';
	import { ModernRealtimeConversationOrchestrator } from '$lib/features/conversation/realtime-conversation-orchestrator';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import ConversationHistory from './ConversationHistory.svelte';

	interface Props {
		language?: string;
		voice?: string;
	}

	let { language = 'en', voice = 'alloy' }: Props = $props();

	// State
	let orchestrator: ModernRealtimeConversationOrchestrator | null = null;
	let audioLevel = 0;

	// Initialize orchestrator
	onMount(() => {
		const eventBus = EventBusFactory.create('memory');
		orchestrator = new ModernRealtimeConversationOrchestrator(eventBus);
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (orchestrator) {
			orchestrator.cleanup();
		}
	});

	// Start conversation
	async function startConversation() {
		if (!orchestrator) return;

		try {
			await orchestrator.startConversation(language, voice);
			console.log('Real-time conversation started');
		} catch (error) {
			console.error('Failed to start conversation:', error);
		}
	}

	// Toggle streaming
	async function toggleStreaming() {
		if (!orchestrator) return;

		const state = orchestrator.getState();
		
		if (state.status === 'connected') {
			try {
				await orchestrator.startStreaming();
			} catch (error) {
				console.error('Failed to start streaming:', error);
			}
		} else if (state.status === 'streaming') {
			try {
				await orchestrator.stopStreaming();
			} catch (error) {
				console.error('Failed to stop streaming:', error);
			}
		}
	}

	// End conversation
	async function endConversation() {
		if (orchestrator) {
			await orchestrator.endConversation();
		}
	}

	// Get current state using reactive statements
	let state = $derived(orchestrator?.getState() || { status: 'idle', messages: [] });
	let canStartConversation = $derived(state.status === 'idle');
	let canStartStreaming = $derived(state.status === 'connected');
	let isStreaming = $derived(state.status === 'streaming');
	let isConnecting = $derived(state.status === 'connecting');
	let hasError = $derived(state.status === 'error');
	let errorMessage = $derived(state.error || '');

	// Simulate audio level for visualization
	$effect(() => {
		if (isStreaming) {
			const interval = setInterval(() => {
				audioLevel = Math.random() * 0.8 + 0.2;
			}, 100);
			
			// Cleanup interval when component unmounts
			onDestroy(() => clearInterval(interval));
		} else {
			audioLevel = 0;
		}
	});
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
	<div class="w-full max-w-4xl space-y-8">
		<!-- Header -->
		<div class="text-center space-y-4">
			<h1 class="text-4xl font-bold text-gray-900">
				🎙️ Real-time Conversation
			</h1>
			<p class="text-lg text-gray-600">
				Practice {language} with AI in real-time
			</p>
		</div>

		<!-- Status Display -->
		<div class="flex justify-center">
			<div class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium {
				state.status === 'idle' ? 'bg-gray-100 text-gray-800' :
				state.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
				state.status === 'connected' ? 'bg-green-100 text-green-800' :
				state.status === 'streaming' ? 'bg-blue-100 text-blue-800' :
				'bg-red-100 text-red-800'
			}">
				{#if state.status === 'idle'}
					<span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
					Ready to start
				{:else if state.status === 'connecting'}
					<span class="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
					Connecting...
				{:else if state.status === 'connected'}
					<span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
					Connected
				{:else if state.status === 'streaming'}
					<span class="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
					Streaming...
				{:else}
					<span class="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
					Error
				{/if}
			</div>
		</div>

		<!-- Error Display -->
		{#if hasError}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">Error</h3>
						<div class="mt-2 text-sm text-red-700">{errorMessage}</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Main Controls -->
		<div class="flex justify-center space-x-4">
			<!-- Start Conversation Button -->
			{#if canStartConversation}
				<button
					onclick={startConversation}
					disabled={isConnecting}
					class="btn btn-primary btn-lg px-8 py-4 text-lg font-semibold {
						isConnecting ? 'loading' : ''
					}"
				>
					{#if isConnecting}
						<span class="loading loading-spinner loading-md"></span>
						Connecting...
					{:else}
						🚀 Start Conversation
					{/if}
				</button>
			{/if}

			<!-- Streaming Controls -->
			{#if canStartStreaming || isStreaming}
				<button
					onclick={toggleStreaming}
					class="btn btn-lg px-8 py-4 text-lg font-semibold {
						isStreaming 
							? 'btn-error hover:btn-error' 
							: 'btn-success hover:btn-success'
					}"
				>
					{#if isStreaming}
						⏹️ Stop Streaming
					{:else}
						🎤 Start Streaming
					{/if}
				</button>

				<button
					onclick={endConversation}
					class="btn btn-outline btn-lg px-6 py-4 text-lg"
				>
					🔚 End Conversation
				</button>
			{/if}
		</div>

		<!-- Audio Visualizer -->
		{#if isStreaming}
			<div class="flex justify-center">
				<div class="w-32 h-32">
					<AudioVisualizer isRecording={isStreaming} {audioLevel} />
				</div>
			</div>
		{/if}

		<!-- Conversation History -->
		{#if state.messages.length > 0}
			<div class="bg-white rounded-lg shadow-lg p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Conversation History</h2>
				<ConversationHistory messages={state.messages} />
			</div>
		{/if}

		<!-- Instructions -->
		{#if state.status === 'idle'}
			<div class="bg-white rounded-lg shadow-lg p-6 text-center">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">How it works</h3>
				<div class="text-gray-600 space-y-2">
					<p>1. Click "Start Conversation" to connect to AI</p>
					<p>2. Click "Start Streaming" to begin speaking</p>
					<p>3. Speak naturally - AI will respond in real-time</p>
					<p>4. Click "Stop Streaming" when you're done</p>
				</div>
			</div>
		{/if}

		<!-- Dev Link -->
		<div class="text-center">
			<a 
				href="/dev" 
				class="text-sm text-blue-600 hover:text-blue-800 underline"
			>
				🧪 Open Dev Testing Panel
			</a>
		</div>
	</div>
</div>
