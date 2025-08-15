<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EventBusFactory } from '$lib/shared/events/eventBus';
	import { audioService } from '$lib/features/audio';
	import { realtimeService } from '$lib/features/realtime';
	import { ModernRealtimeConversationOrchestrator } from '$lib/features/conversation/realtime-conversation-orchestrator';
	import type {
		AudioCaptureSession,
		AudioDevice
	} from '$lib/features/audio/ports';
	import type {
		RealtimeSession,
		RealtimeStream,
		RealtimeEvent
	} from '$lib/features/realtime';
	import type { RealtimeConversationState } from '$lib/features/conversation/realtime-conversation-orchestrator';
	import AudioVisualizer from '../AudioVisualizer.svelte';

	// State
	let activeTab = $state('audio');
	let eventBus = $state<ReturnType<typeof EventBusFactory.create> | null>(null);
	let orchestrator = $state<ModernRealtimeConversationOrchestrator | null>(null);

	// Audio testing state
	let audioSession = $state<AudioCaptureSession | null>(null);
	let audioChunks = $state<ArrayBuffer[]>([]);
	let audioLevel = $state(0);
	let isAudioRecording = $state(false);
	let selectedDevice = $state<string>('');
	let audioDevices = $state<AudioDevice[]>([]);

	// Real-time testing state
	let realtimeSession = $state<RealtimeSession | null>(null);
	let realtimeStream = $state<RealtimeStream | null>(null);
	let isRealtimeConnected = $state(false);
	let realtimeEvents = $state<RealtimeEvent[]>([]);
	let lastError = $state<string | null>(null);
	let errorDetails = $state<any>(null);

	// Conversation testing state
	let conversationState = $state<RealtimeConversationState | null>(null);
	let conversationMessages = $state<Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>>([]);
	let conversationInterval: ReturnType<typeof setInterval> | undefined;

	// Initialize
	onMount(async () => {
		eventBus = EventBusFactory.create('memory');
		orchestrator = new ModernRealtimeConversationOrchestrator(eventBus);
		
		// Load audio devices
		await loadAudioDevices();
		
		// Set up real-time event handlers
		setupRealtimeHandlers();
		
		// Set up conversation event handlers
		setupConversationHandlers();
	});

	// Cleanup
	onDestroy(() => {
		if (orchestrator) {
			orchestrator.cleanup();
		}
		if (conversationInterval) {
			clearInterval(conversationInterval);
		}
	});

	// Audio testing functions
	async function loadAudioDevices() {
		try {
			audioDevices = await audioService.getAudioDevices();
			if (audioDevices.length > 0) {
				selectedDevice = audioDevices[0].id;
			}
		} catch (error) {
			console.error('Failed to load audio devices:', error);
		}
	}

	async function testAudioCapture() {
		try {
			if (isAudioRecording) {
				await stopAudioCapture();
			} else {
				await startAudioCapture();
			}
		} catch (error) {
			console.error('Audio capture test failed:', error);
		}
	}

	async function startAudioCapture() {
		try {
			audioSession = await audioService.startRecording(selectedDevice);
			isAudioRecording = true;
			audioChunks = [];

			// Set up audio data handling through the service layer
			audioService.onAudioData(async (chunk: ArrayBuffer) => {
				audioChunks.push(chunk);
				
				// Process chunk for visualization
				const processed = await audioService.processAudioChunk(chunk);
				audioLevel = processed.level;
			});

			console.log('🎤 Audio capture started with AudioWorklet:', audioSession.id);
		} catch (error) {
			console.error('❌ Failed to start audio capture:', error);
		}
	}

	async function stopAudioCapture() {
		try {
			if (audioSession) {
				await audioService.stopRecording(audioSession);
				audioSession = null;
			}
			isAudioRecording = false;
			audioLevel = 0;

			console.log('🔇 Audio capture stopped. Total chunks:', audioChunks.length);
		} catch (error) {
			console.error('❌ Failed to stop audio capture:', error);
		}
	}

	async function testAudioPlayback() {
		if (audioChunks.length === 0) {
			alert('No audio chunks to play. Record something first!');
			return;
		}

		try {
			const mergedAudio = await audioService.mergeAudioChunks(audioChunks);
			await audioService.playAudio(mergedAudio);
			console.log('Playing merged audio chunks');
		} catch (error) {
			console.error('Audio playback test failed:', error);
		}
	}

	// Real-time testing functions
	function setupRealtimeHandlers() {
		realtimeService.onTranscript((transcript: string) => {
			realtimeEvents.push({
				type: 'transcript',
				payload: { text: transcript },
				timestamp: Date.now(),
				sessionId: realtimeSession?.id || 'unknown'
			});
		});

		realtimeService.onResponse((response: string) => {
			realtimeEvents.push({
				type: 'response',
				payload: { text: response },
				timestamp: Date.now(),
				sessionId: realtimeSession?.id || 'unknown'
			});
		});

		realtimeService.onAudioResponse((audioChunk: ArrayBuffer) => {
			realtimeEvents.push({
				type: 'audio_response',
				payload: { size: audioChunk.byteLength },
				timestamp: Date.now(),
				sessionId: realtimeSession?.id || 'unknown'
			});
		});

		realtimeService.onError((error: string) => {
			lastError = error;
			realtimeEvents.push({
				type: 'error',
				payload: { message: error },
				timestamp: Date.now(),
				sessionId: realtimeSession?.id || 'unknown'
			});
		});

		realtimeService.onConnectionChange((status) => {
			isRealtimeConnected = status === 'connected';
			realtimeEvents.push({
				type: 'connection_change',
				payload: { status },
				timestamp: Date.now(),
				sessionId: realtimeSession?.id || 'unknown'
			});
		});
	}

	async function testRealtimeSession() {
		try {
			lastError = null;
			errorDetails = null;
			
			if (realtimeSession) {
				console.log('🔒 Closing existing realtime session...');
				await realtimeService.closeSession(realtimeSession);
				realtimeSession = null;
				isRealtimeConnected = false;
				console.log('✅ Realtime session closed');
			} else {
				console.log('🔗 Creating new realtime session...');
				realtimeSession = await realtimeService.createSession({
					sessionId: crypto.randomUUID(),
					model: 'gpt-4o-realtime-preview-2024-10-01',
					voice: 'alloy',
					language: 'en'
				});
				isRealtimeConnected = true;
				console.log('✅ Realtime session created');
				console.log('🔍 Session details:', {
					id: realtimeSession.id,
					clientSecret: realtimeSession.clientSecret ? `${realtimeSession.clientSecret.substring(0, 20)}...` : 'undefined',
					expiresAt: realtimeSession.expiresAt,
					status: realtimeSession.status
				});
			}
		} catch (error) {
			console.error('❌ Realtime session test failed:', error);
			lastError = error instanceof Error ? error.message : String(error);
			errorDetails = error;
		}
	}

	async function testRealtimeStreaming() {
		if (!realtimeSession) {
			alert('Create a realtime session first!');
			return;
		}

		try {
			lastError = null;
			errorDetails = null;
			
			if (realtimeStream) {
				console.log('⏹️ Stopping realtime streaming...');
				await realtimeService.stopStreaming(realtimeStream);
				realtimeStream = null;
				console.log('✅ Realtime streaming stopped');
			} else {
				console.log('🌊 Starting realtime streaming...');
				console.log('🔍 Session ID check:', realtimeSession?.id);
				console.log('🔍 Session client secret check:', realtimeSession?.clientSecret ? 'present' : 'missing');
				
				realtimeStream = await realtimeService.startStreaming(realtimeSession);
				console.log('✅ Realtime streaming started');
			}
		} catch (error) {
			console.error('❌ Realtime streaming test failed:', error);
			lastError = error instanceof Error ? error.message : String(error);
			errorDetails = error;
		}
	}

	async function testAudioChunkSending() {
		if (!realtimeStream || !audioChunks.length) {
			alert('Start realtime streaming and record audio first!');
			return;
		}

		try {
			lastError = null;
			errorDetails = null;
			
			const lastChunk = audioChunks[audioChunks.length - 1];
			await realtimeService.sendAudioChunk(realtimeStream, lastChunk);
			console.log('Audio chunk sent to realtime API');
		} catch (error) {
			console.error('Audio chunk sending test failed:', error);
			lastError = error instanceof Error ? error.message : String(error);
			errorDetails = error;
		}
	}

	// Conversation testing functions
	function setupConversationHandlers() {
		if (!orchestrator) return;

		// Monitor conversation state changes
		conversationInterval = setInterval(() => {
			if (orchestrator) {
				conversationState = orchestrator.getState();
				conversationMessages = conversationState.messages;
			}
		}, 100);
	}

	async function testConversationStart() {
		if (!orchestrator) return;

		try {
			lastError = null;
			errorDetails = null;
			
			await orchestrator.startConversation('en', 'alloy');
			console.log('Conversation started');
		} catch (error) {
			console.error('Conversation start test failed:', error);
			lastError = error instanceof Error ? error.message : String(error);
			errorDetails = error;
		}
	}

	async function testConversationStreaming() {
		if (!orchestrator) return;

		try {
			lastError = null;
			errorDetails = null;
			
			if (conversationState?.status === 'streaming') {
				await orchestrator.stopStreaming();
				console.log('Conversation streaming stopped');
			} else {
				await orchestrator.startStreaming();
				console.log('Conversation streaming started');
			}
		} catch (error) {
			console.error('Conversation streaming test failed:', error);
			lastError = error instanceof Error ? error.message : String(error);
			errorDetails = error;
		}
	}

	async function testConversationEnd() {
		if (!orchestrator) return;

		try {
			lastError = null;
			errorDetails = null;
			
			await orchestrator.endConversation();
			console.log('Conversation ended');
		} catch (error) {
			console.error('Conversation end test failed:', error);
			lastError = error instanceof Error ? error.message : String(error);
			errorDetails = error;
		}
	}

	// Utility functions
	function clearEvents() {
		realtimeEvents = [];
		lastError = null;
		errorDetails = null;
	}

	function formatTimestamp(timestamp: number): string {
		return new Date(timestamp).toLocaleTimeString();
	}

	function getEventTypeColor(type: string): string {
		switch (type) {
			case 'transcript': return 'text-blue-400';
			case 'response': return 'text-green-400';
			case 'audio_response': return 'text-purple-400';
			case 'error': return 'text-red-400';
			case 'connection_change': return 'text-yellow-400';
			default: return 'text-gray-400';
		}
	}
</script>

<div class="dev-panel bg-gray-900 text-white p-6 min-h-screen">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold mb-2">🧪 Dev Testing Panel</h1>
			<p class="text-gray-800">Test individual features before integration</p>
		</div>

		<!-- Tab Navigation -->
		<div class="flex space-x-1 mb-6 bg-base-300 p-1 rounded-lg">
			<button
				class="px-4 py-2 rounded-md transition-colors {activeTab === 'audio' ? 'bg-blue-600 text-white' : 'text-gray-800 hover:text-white'}"
				onclick={() => activeTab = 'audio'}
			>
				🎤 Audio
			</button>
			<button
				class="px-4 py-2 rounded-md transition-colors {activeTab === 'realtime' ? 'bg-blue-600 text-white' : 'text-gray-800 hover:text-white'}"
				onclick={() => activeTab = 'realtime'}
			>
				🚀 Real-time
			</button>
			<button
				class="px-4 py-2 rounded-md transition-colors {activeTab === 'conversation' ? 'bg-blue-600 text-white' : 'text-gray-800 hover:text-white'}"
				onclick={() => activeTab = 'conversation'}
			>
				💬 Conversation
			</button>
		</div>

		<!-- Audio Testing Tab -->
		{#if activeTab === 'audio'}
			<div class="space-y-6">
				<h2 class="text-2xl font-semibold">🎤 Audio Feature Testing</h2>
				
				<!-- Device Selection -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">Audio Devices</h3>
					<select
						bind:value={selectedDevice}
						class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
					>
						{#each audioDevices as device}
							<option value={device.id}>{device.name}</option>
						{/each}
					</select>
					<button
						onclick={loadAudioDevices}
						class="mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
					>
						🔄 Refresh Devices
					</button>
				</div>

				<!-- Audio Controls -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">Audio Controls</h3>
					<div class="flex space-x-4">
						<button
							onclick={testAudioCapture}
							class="px-6 py-3 rounded-lg font-medium transition-colors {isAudioRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}"
						>
							{isAudioRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
						</button>
						<button
							onclick={testAudioPlayback}
							disabled={audioChunks.length === 0}
							class="px-6 py-3 rounded-lg font-medium transition-colors {audioChunks.length > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}"
						>
							🔊 Play Recorded Audio
						</button>
					</div>
				</div>

				<!-- Audio Visualization -->
				{#if isAudioRecording}
					<div class="bg-base-300 p-4 rounded-lg">
						<h3 class="text-lg font-medium mb-3">Audio Visualization</h3>
						<div class="flex justify-center">
							<div class="w-32 h-32">
								<AudioVisualizer isRecording={isAudioRecording} audioLevel={audioLevel * 100} />
							</div>
						</div>
						<p class="text-center mt-2">Level: {(audioLevel * 100).toFixed(1)}%</p>
					</div>
				{/if}

				<!-- Audio Stats -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">Audio Statistics</h3>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<p><strong>Chunks Recorded:</strong> {audioChunks.length}</p>
							<p><strong>Total Size:</strong> {(audioChunks.reduce((total, chunk) => total + chunk.byteLength, 0) / 1024).toFixed(2)} KB</p>
						</div>
						<div>
							<p><strong>Session Active:</strong> {audioSession ? 'Yes' : 'No'}</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Real-time Testing Tab -->
		{#if activeTab === 'realtime'}
			<div class="space-y-6">
				<h2 class="text-2xl font-semibold">🚀 Real-time Feature Testing</h2>
				
				<!-- Session Management -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">Session Management</h3>
					<div class="flex space-x-4">
						<button
							onclick={testRealtimeSession}
							class="px-6 py-3 rounded-lg font-medium transition-colors {realtimeSession ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}"
						>
							{realtimeSession ? '❌ Close Session' : '🔗 Create Session'}
						</button>
						<button
							onclick={testRealtimeStreaming}
							disabled={!realtimeSession}
							class="px-6 py-3 rounded-lg font-medium transition-colors {realtimeSession ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}"
						>
							{realtimeStream ? '⏹️ Stop Streaming' : '🌊 Start Streaming'}
						</button>
					</div>
					{#if realtimeSession}
						<div class="mt-3 p-3 bg-gray-700 rounded text-sm">
							<p><strong>Session ID:</strong> {realtimeSession.id}</p>
							<p><strong>Status:</strong> {realtimeSession.status}</p>
							<p><strong>Expires:</strong> {new Date(realtimeSession.expiresAt).toLocaleString()}</p>
						</div>
					{/if}
				</div>

				<!-- Audio Chunk Testing -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">Audio Chunk Testing</h3>
					<button
						onclick={testAudioChunkSending}
						disabled={!realtimeStream || audioChunks.length === 0}
						class="px-6 py-3 rounded-lg font-medium transition-colors {realtimeStream && audioChunks.length > 0 ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 cursor-not-allowed'}"
					>
						📤 Send Audio Chunk to Realtime API
					</button>
					<p class="text-sm text-gray-800 mt-2">
						Requires: Active realtime stream + recorded audio chunks
					</p>
				</div>

				<!-- Connection Status -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">Connection Status</h3>
					<div class="flex items-center space-x-2">
						<div class="w-3 h-3 rounded-full {isRealtimeConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
						<span>{isRealtimeConnected ? 'Connected' : 'Disconnected'}</span>
					</div>
				</div>

				<!-- Error Display -->
				{#if lastError}
					<div class="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
						<h3 class="text-lg font-medium mb-3">🚨 Last Error</h3>
						<div class="space-y-2">
							<p class="font-medium">{lastError}</p>
							{#if errorDetails}
								<details class="text-sm">
									<summary class="cursor-pointer hover:text-red-800">Show Error Details</summary>
									<pre class="mt-2 p-2 bg-red-50 rounded text-xs overflow-x-auto">{JSON.stringify(errorDetails, null, 2)}</pre>
								</details>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Event Log -->
				<div class="bg-base-300 p-4 rounded-lg">
					<div class="flex justify-between items-center mb-3">
						<h3 class="text-lg font-medium">Event Log</h3>
						<button
							onclick={clearEvents}
							class="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
						>
							🗑️ Clear
						</button>
					</div>
					<div class="max-h-64 overflow-y-auto space-y-2">
						{#each realtimeEvents as event}
							<div class="p-2 bg-gray-700 rounded text-sm">
								<div class="flex justify-between items-start">
									<span class="font-medium {getEventTypeColor(event.type)}">
										{event.type.toUpperCase()}
									</span>
									<span class="text-gray-400 text-xs">
										{formatTimestamp(event.timestamp)}
									</span>
								</div>
								{#if event.type === 'error'}
									<div class="mt-1 text-red-300">
										<strong>Error:</strong> {event.payload.message}
									</div>
								{:else if event.type === 'transcript'}
									<div class="mt-1 text-blue-300">
										<strong>Transcript:</strong> {event.payload.text}
									</div>
								{:else if event.type === 'response'}
									<div class="mt-1 text-green-300">
										<strong>Response:</strong> {event.payload.text}
									</div>
								{:else if event.type === 'audio_response'}
									<div class="mt-1 text-purple-300">
										<strong>Audio:</strong> {event.payload.size} bytes
									</div>
								{:else if event.type === 'connection_change'}
									<div class="mt-1 text-yellow-300">
										<strong>Status:</strong> {event.payload.status}
									</div>
								{:else}
									<pre class="text-xs mt-1 text-gray-300">{JSON.stringify(event.payload, null, 2)}</pre>
								{/if}
							</div>
						{/each}
						{#if realtimeEvents.length === 0}
							<p class="text-gray-400 text-center py-4">No events yet</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Conversation Testing Tab -->
		{#if activeTab === 'conversation'}
			<div class="space-y-6">
				<h2 class="text-2xl font-semibold">💬 Conversation Feature Testing</h2>
				
				<!-- Conversation Controls -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">Conversation Controls</h3>
					<div class="flex space-x-4">
						<button
							onclick={testConversationStart}
							disabled={conversationState?.status !== 'idle'}
							class="px-6 py-3 rounded-lg font-medium transition-colors {conversationState?.status === 'idle' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'}"
						>
							🚀 Start Conversation
						</button>
						<button
							onclick={testConversationStreaming}
							disabled={conversationState?.status !== 'connected' && conversationState?.status !== 'streaming'}
							class="px-6 py-3 rounded-lg font-medium transition-colors {conversationState?.status === 'connected' || conversationState?.status === 'streaming' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'}"
						>
							{conversationState?.status === 'streaming' ? '⏹️ Stop Streaming' : '🎤 Start Streaming'}
						</button>
						<button
							onclick={testConversationEnd}
							disabled={!conversationState || conversationState.status === 'idle'}
							class="px-6 py-3 rounded-lg font-medium transition-colors {conversationState && conversationState.status !== 'idle' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed'}"
						>
							🔚 End Conversation
						</button>
					</div>
				</div>

				<!-- Error Display -->
				{#if lastError}
					<div class="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
						<h3 class="text-lg font-medium mb-3">🚨 Last Error</h3>
						<div class="space-y-2">
							<p class="font-medium">{lastError}</p>
							{#if errorDetails}
								<details class="text-sm">
									<summary class="cursor-pointer hover:text-red-800">Show Error Details</summary>
									<pre class="mt-2 p-2 bg-red-50 rounded text-xs overflow-x-auto">{JSON.stringify(errorDetails, null, 2)}</pre>
								</details>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Conversation State -->
				{#if conversationState}
					<div class="bg-base-300 p-4 rounded-lg">
						<h3 class="text-lg font-medium mb-3">Conversation State</h3>
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p><strong>Status:</strong> <span class="font-mono">{conversationState.status}</span></p>
								<p><strong>Session ID:</strong> <span class="font-mono text-xs">{conversationState.sessionId}</span></p>
								<p><strong>Language:</strong> {conversationState.language}</p>
								<p><strong>Voice:</strong> {conversationState.voice}</p>
							</div>
							<div>
								<p><strong>Start Time:</strong> {conversationState.startTime ? new Date(conversationState.startTime).toLocaleString() : 'N/A'}</p>
								<p><strong>Duration:</strong> {conversationState.startTime ? Math.floor((Date.now() - conversationState.startTime) / 1000) : 0}s</p>
								<p><strong>Messages:</strong> {conversationState.messages.length}</p>
								{#if conversationState.error}
									<p><strong>Error:</strong> <span class="text-red-400">{conversationState.error}</span></p>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- Messages -->
				{#if conversationMessages.length > 0}
					<div class="bg-base-300 p-4 rounded-lg">
						<h3 class="text-lg font-medium mb-3">Messages ({conversationMessages.length})</h3>
						<div class="space-y-2 max-h-64 overflow-y-auto">
							{#each conversationMessages as message}
								<div class="p-3 bg-gray-700 rounded">
									<div class="flex justify-between items-start mb-1">
										<span class="font-medium {message.role === 'user' ? 'text-blue-400' : 'text-green-400'}">
											{message.role === 'user' ? '👤 You' : '🤖 AI'}
										</span>
										<span class="text-xs text-gray-800">
											{formatTimestamp(message.timestamp)}
										</span>
									</div>
									<p class="text-sm">{message.content}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
