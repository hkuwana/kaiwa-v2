<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { RealtimeConversationStatus } from '$lib/types/conversation';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import ConversationHistory from './ConversationHistory.svelte';

	interface Props {
		language?: string;
		voice?: string;
		autoStart?: boolean;
		dev?: boolean;
	}

	let { language = 'en', voice = 'alloy', autoStart = true, dev = false }: Props = $props();

	// 🎭 Use the new conversation store
	let store = conversationStore;
	// Mock event bus for now
	let eventBus = $state({ emit: () => {}, on: () => () => {} });

	// 🎯 State from store (reactive) - use $state for reactive variables
	// let conversationState = $state<ConversationState>();
	let isRecording = $state(false);
	let isConnected = $state(false);
	let isConnecting = $state(false);
	let hasError = $state(false);
	let messageCount = $state(0);
	let canStartConversation = $state(false);
	let canStopStreaming = $state(false);

	// 🎯 Additional state properties for template - use $state for reactive variables
	let status = $state(RealtimeConversationStatus.IDLE);
	let sessionId = $state('');
	let messages = $state<any[]>([]);
	let startTime = $state(0);
	let errorMessage = $state('');
	let isStreaming = $state(false);

	// 🎵 Audio visualization state
	let audioContext: AudioContext | null = $state(null);
	let analyser: AnalyserNode | null = $state(null);
	let microphone: MediaStreamAudioSourceNode | null = $state(null);
	let audioLevel = $state(0);
	let animationFrame: number | null = $state(null);

	// 🧪 Test functions for dev panel
	async function testVAD() {
		console.log('🧪 Testing VAD...');
		if (store) {
			console.log('Current VAD state:', store.isRecording);
		}
	}

	async function testTranscription() {
		console.log('🧪 Testing Transcription...');
		if (store) {
			console.log('Current message count:', store.messageCount);
		}
	}

	async function testAIResponse() {
		console.log('🧪 Testing AI Response...');
		if (store) {
			console.log('Current AI state:', store.isConnected);
		}
	}

	// Test realtime events via bus (PR2 verification)
	function testRealtimeEvents() {
		if (store) {
			console.log('🧪 Testing Realtime Events (PR2)...');

			// Manually emit test events to verify bus is working
			store.eventBus.emit('realtime.connection.status', {
				status: 'connected',
				sessionId: 'test-session',
				timestamp: Date.now(),
				details: 'Test connection event'
			});

			store.eventBus.emit('realtime.transcript.received', {
				transcript: 'Test transcript from user',
				sessionId: 'test-session',
				confidence: 0.95,
				language: 'en',
				timestamp: Date.now()
			});

			store.eventBus.emit('realtime.response.received', {
				response: 'Test response from AI',
				sessionId: 'test-session',
				timestamp: Date.now()
			});

			console.log('✅ Test events emitted - check console for PR2 TEST logs');
		} else {
			console.log('❌ No store available');
		}
	}

	// 🎭 Initialize store and wire up state
	onMount(async () => {
		console.log('🎭 Component mounted, initializing ConversationStore...');
		try {
			// Create store with shared event bus
			store = new ConversationStore();
			console.log('✅ ConversationStore created successfully');

			// Wire up reactive state from store
			$effect(() => {
				if (store) {
					conversationState = store.state;
					isRecording = store.isRecording;
					isConnected = store.isConnected;
					isConnecting = store.isConnecting;
					hasError = store.hasError;
					messageCount = store.messageCount;
					canStartConversation = store.canStartConversation;
					canStopStreaming = store.canStopStreaming;

					// Wire up additional state properties
					status = store.state.status;
					sessionId = store.state.sessionId;
					messages = store.state.messages;
					startTime = store.state.startTime;
					errorMessage = store.state.error || '';
					isStreaming = store.state.status === RealtimeConversationStatus.STREAMING;
				}
			});

			// Auto-start conversation if requested
			if (autoStart) {
				console.log('🚀 Auto-starting conversation...');
				try {
					await store.startConversation(language, voice);
					console.log('✅ Auto-started conversation successfully');
				} catch (error) {
					console.error('❌ Failed to auto-start conversation:', error);
				}
			}
		} catch (error) {
			console.error('❌ Failed to create ConversationStore:', error);
		}

		// Cleanup
		return () => {
			cleanupAudioLevelDetection();
		};
	});

	// 🎤 Real-time audio level detection functions
	async function setupAudioLevelDetection(source?: MediaStream) {
		try {
			// Create audio context
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyser.smoothingTimeConstant = 0.8;

			// Use provided stream or orchestrator's micStream; fallback to getUserMedia only if needed
			const stream =
				source || store?.micStream || (await navigator.mediaDevices.getUserMedia({ audio: true }));
			microphone = audioContext.createMediaStreamSource(stream);
			microphone.connect(analyser);

			// Start analyzing audio levels
			updateAudioLevel();

			console.log('✅ Audio level detection set up successfully');
		} catch (error) {
			console.error('❌ Failed to set up audio level detection:', error);
			// Fallback to simulated levels
			audioLevel = 0;
		}
	}

	// React to orchestrator mic stream availability and streaming state
	$effect(() => {
		if (store && isRecording && store.micStream) {
			if (!audioContext) {
				setupAudioLevelDetection(store.micStream);
			}
		} else {
			// If streaming stopped or no mic stream, ensure cleanup
			if (audioContext) {
				cleanupAudioLevelDetection();
			}
		}
	});

	function updateAudioLevel() {
		if (!analyser) return;

		const dataArray = new Uint8Array(analyser.frequencyBinCount);
		analyser.getByteFrequencyData(dataArray);

		// Calculate RMS (Root Mean Square) for better audio level representation
		let sum = 0;
		for (let i = 0; i < dataArray.length; i++) {
			sum += dataArray[i] * dataArray[i];
		}
		const rms = Math.sqrt(sum / dataArray.length);

		// Convert to 0-1 range and apply some smoothing
		audioLevel = Math.min(1, rms / 128);

		// Continue updating
		animationFrame = requestAnimationFrame(updateAudioLevel);
	}

	function cleanupAudioLevelDetection() {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}

		if (microphone) {
			microphone.disconnect();
			microphone = null;
		}

		if (analyser) {
			analyser.disconnect();
			analyser = null;
		}

		if (audioContext) {
			audioContext.close();
			audioContext = null;
		}

		audioLevel = 0;
		console.log('🧹 Audio level detection cleaned up');
	}

	// Cleanup on destroy
	onDestroy(() => {
		if (store) {
			store.cleanup();
		}
	});

	// Toggle conversation/streaming
	async function toggleConversation() {
		console.log('🎙️ Toggle Conversation button clicked');
		console.log('🎭 Orchestrator exists:', !!store);

		if (!store) {
			console.error('❌ No store available');
			return;
		}

		const currentState = store.getState();
		console.log('📊 Current state:', currentState);

		if (currentState.status === RealtimeConversationStatus.IDLE) {
			console.log('🚀 Starting conversation and streaming...');
			try {
				await store.startConversation(language, voice);
				console.log('✅ Conversation and streaming started successfully');
			} catch (error) {
				console.error('❌ Failed to start conversation:', error);
			}
		} else if (currentState.status === RealtimeConversationStatus.STREAMING) {
			console.log('⏹️ Stopping streaming...');
			try {
				await store.stopStreaming();
				// Stop audio level detection when streaming stops
				cleanupAudioLevelDetection();
				console.log('✅ Streaming stopped successfully');
			} catch (error) {
				console.error('❌ Failed to stop streaming:', error);
			}
		} else {
			console.log('⚠️ Cannot toggle conversation - current status:', currentState.status);
		}
	}

	// End conversation
	async function endConversation() {
		if (store) {
			await store.endConversation();
		}
	}

	let audioInterval: ReturnType<typeof setInterval> | undefined;

	// Log orchestrator state changes for debugging

	// Test realtime events via bus (PR2 verification)
	$effect(() => {
		if (store) {
			// Subscribe to realtime events to verify PR2 is working
			const offConnection = store.eventBus.on('realtime.connection.status', (payload: any) => {
				console.log('🔌 PR2 TEST - Connection status event received:', payload);
			});

			const offTranscript = store.eventBus.on('realtime.transcript.received', (payload: any) => {
				console.log('📝 PR2 TEST - Transcript event received:', payload);
			});

			const offResponse = store.eventBus.on('realtime.response.received', (payload: any) => {
				console.log('🤖 PR2 TEST - Response event received:', payload);
			});

			const offAudioResponse = store.eventBus.on('realtime.audio.response', (payload: any) => {
				console.log('🔊 PR2 TEST - Audio response event received:', payload);
			});

			const offError = store.eventBus.on('realtime.error', (payload: any) => {
				console.log('❌ PR2 TEST - Error event received:', payload);
			});

			return () => {
				offConnection?.();
				offTranscript?.();
				offResponse?.();
				offAudioResponse?.();
				offError?.();
			};
		}
	});

	// Test functions for dev panel
	function testVoiceActivity() {
		console.log('🧪 Testing Voice Activity Detection...');
		if (store) {
			const currentState = store.getState();
			console.log('Current VAD state:', currentState.status);
		}
	}

	function testAudioLevelDetection() {
		console.log('🧪 Testing Audio Level Detection...');
		console.log('Current audio level:', audioLevel);
		console.log('Audio context state:', audioContext?.state);
		console.log('Analyser connected:', !!analyser);
		console.log('Microphone connected:', !!microphone);

		// Test with a simulated audio level
		if (!audioContext) {
			console.log('Setting up test audio context...');
			setupAudioLevelDetection()
				.then(() => {
					console.log('✅ Test audio context set up');
				})
				.catch((error) => {
					console.error('❌ Failed to set up test audio context:', error);
				});
		}
	}

	// Test mic audio by playing back the stream (hear yourself)
	function testMicAudio() {
		if (store?.micStream) {
			// Create audio element to play back the mic stream
			const audioEl = new Audio();
			audioEl.srcObject = store.micStream;
			audioEl.play().catch((error) => {
				console.error('❌ Failed to play mic audio:', error);
			});
			console.log('🎤 Playing back mic stream - you should hear yourself talking');
		} else {
			console.log('❌ No mic stream available - start a conversation first');
		}
	}

	// Test mic stream details
	function testMicStreamDetails() {
		if (store?.micStream) {
			const stream = store.micStream;
			console.log('🎤 Mic Stream Details:', {
				active: stream.active,
				trackCount: stream.getTracks().length,
				audioTracks: stream.getAudioTracks().map((track) => ({
					id: track.id,
					enabled: track.enabled,
					muted: track.muted,
					readyState: track.readyState,
					kind: track.kind
				}))
			});
		} else {
			console.log('❌ No mic stream available - start a conversation first');
		}
	}
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8"
>
	<div class="w-full max-w-4xl space-y-8">
		<!-- Header -->
		<div class="space-y-4 text-center">
			<h1 class="text-4xl font-bold text-gray-900">🎙️ Real-time Conversation</h1>
			<p class="text-lg text-gray-600">
				Practice {language} with AI in real-time
			</p>
		</div>

		<!-- Status Display -->
		<div class="flex justify-center">
			<div
				class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium {status ===
				RealtimeConversationStatus.IDLE
					? 'bg-gray-100 text-gray-800'
					: status === RealtimeConversationStatus.CONNECTING
						? 'bg-yellow-100 text-yellow-800'
						: status === RealtimeConversationStatus.CONNECTED
							? 'bg-green-100 text-green-800'
							: status === RealtimeConversationStatus.STREAMING
								? 'bg-blue-100 text-blue-800'
								: 'bg-red-100 text-red-800'}"
			>
				{#if status === RealtimeConversationStatus.IDLE}
					<span class="mr-2 h-2 w-2 rounded-full bg-gray-400"></span>
					Ready to start
				{:else if status === RealtimeConversationStatus.CONNECTING}
					<span class="mr-2 h-2 w-2 animate-pulse rounded-full bg-yellow-400"></span>
					Connecting...
				{:else if status === RealtimeConversationStatus.CONNECTED}
					<span class="mr-2 h-2 w-2 rounded-full bg-green-400"></span>
					Connected
				{:else if status === RealtimeConversationStatus.STREAMING}
					<span class="mr-2 h-2 w-2 animate-pulse rounded-full bg-blue-400"></span>
					Streaming...
				{:else}
					<span class="mr-2 h-2 w-2 rounded-full bg-red-400"></span>
					Error
				{/if}
			</div>
		</div>

		<!-- Error Display -->
		{#if hasError}
			<div class="rounded-lg border border-red-200 bg-red-50 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">Connection Error</h3>
						<div class="mt-2 text-sm text-red-700">
							{errorMessage}
							{#if errorMessage.includes('WebRTC')}
								<br />
								<button
									class="mt-2 rounded bg-red-100 px-2 py-1 text-xs hover:bg-red-200"
									onclick={() => window.location.reload()}
								>
									🔄 Retry Connection
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if dev}
			<!-- Debug Info -->
			<div class="mb-4 text-center text-sm text-gray-500">
				Debug: Status={status} | canStart={canStartConversation} | isStreaming={isStreaming} | isConnecting={isConnecting}
				{#if store && store.isConnectionHealthy()}
					<br />
					Connection Health: {store.isConnectionHealthy() ? '✅ Healthy' : '❌ Unhealthy'}
				{/if}
			</div>
		{/if}

		<!-- Main Controls -->
		<div class="flex justify-center space-x-4">
			<!-- Auto-starting indicator -->
			{#if autoStart && isConnecting}
				<div class="text-center">
					<div class="loading loading-lg loading-spinner text-primary"></div>
					<p class="mt-2 text-lg font-medium text-primary">🎭 Setting up your conversation...</p>
				</div>
			{/if}

			<!-- Unified Conversation Button -->
			{#if canStartConversation && !(autoStart && isConnecting)}
				<button
					onclick={toggleConversation}
					disabled={isConnecting}
					class="btn px-8 py-4 text-lg font-semibold btn-lg btn-primary {isConnecting
						? 'loading'
						: ''}"
				>
					{#if isConnecting}
						<span class="loading loading-md loading-spinner"></span>
						Starting...
					{:else}
						🚀 Start Conversation & Streaming
					{/if}
				</button>
			{/if}

			<!-- Streaming Controls -->
			{#if isStreaming}
				<button
					onclick={toggleConversation}
					class="btn px-8 py-4 text-lg font-semibold btn-lg btn-error"
				>
					⏹️ Stop Streaming
				</button>

				<button onclick={endConversation} class="btn px-6 py-4 text-lg btn-outline btn-lg">
					🔚 End Conversation
				</button>
			{/if}
		</div>

		<!-- Audio Visualizer -->
		{#if isStreaming}
			<div class="flex justify-center">
				<div class="h-32 w-32">
					<AudioVisualizer isRecording={isStreaming} {audioLevel} />
				</div>
			</div>
		{/if}

		<!-- Conversation History -->
		{#if messages.length > 0}
			<div class="rounded-lg bg-white p-6 shadow-lg">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Conversation History</h2>
				<ConversationHistory {messages} />
			</div>
		{/if}

		<!-- Instructions -->
		{#if status === RealtimeConversationStatus.IDLE}
			<div class="rounded-lg bg-white p-6 text-center shadow-lg">
				<h3 class="mb-2 text-lg font-semibold text-gray-900">
					{#if autoStart}
						🚀 Auto-starting conversation...
					{:else}
						How it works
					{/if}
				</h3>
				<div class="space-y-2 text-gray-600">
					{#if autoStart}
						<p>🎭 Setting up your conversation automatically...</p>
						<p>🎤 You'll be connected to AI in just a moment</p>
						<p>💬 Start speaking when you see the audio visualizer</p>
					{:else}
						<p>1. Click "Start Conversation & Streaming" to connect to AI and begin speaking</p>
						<p>2. Allow microphone access when prompted</p>
						<p>3. Speak naturally - AI will respond in real-time</p>
						<p>4. Click "Stop Streaming" when you're done</p>
					{/if}
				</div>

				{#if dev}
					<div class="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
						<h4 class="mb-2 text-sm font-medium text-yellow-800">🧪 MVP Development Mode</h4>
						<p class="text-xs text-yellow-700">
							This is a development build. If WebRTC fails, the app will show clear errors instead
							of silent failures.
							<br />
							<strong>Expected behavior:</strong> Either it works perfectly, or it fails fast with clear
							error messages.
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Dev Testing Panel -->
		{#if dev}
			<div class="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
				<h3 class="mb-4 text-lg font-semibold text-gray-900">🧪 Dev Testing Panel</h3>

				<!-- Voice Activity Detection Test -->
				<div class="mb-6">
					<h4 class="text-md mb-2 font-medium text-gray-800">🎤 Voice Activity Detection</h4>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div class="rounded border bg-white p-3">
							<span class="font-medium">VAD Status:</span>
							<span class="ml-2 {isStreaming ? 'text-green-600' : 'text-gray-600'}">
								{isStreaming ? '🔴 Active' : '⚪ Inactive'}
							</span>
						</div>
						<div class="rounded border bg-white p-3">
							<span class="font-medium">Audio Level:</span>
							<span class="ml-2 text-blue-600">{Math.round(audioLevel * 100)}%</span>
							<!-- Visual audio level bar -->
							<div class="mt-2 h-2 w-full rounded-full bg-gray-200">
								<div
									class="h-2 rounded-full bg-blue-600 transition-all duration-100 ease-out"
									style="width: {Math.round(audioLevel * 100)}%"
								></div>
							</div>
							<!-- Raw audio data -->
							<div class="mt-1 text-xs text-gray-500">
								Raw: {audioLevel.toFixed(3)} | RMS: {Math.round(audioLevel * 128)}
							</div>
							<!-- Audio context status -->
							<div class="mt-1 text-xs text-gray-500">
								Context: {audioContext?.state || 'None'} | Analyser: {analyser ? '✅' : '❌'} | Mic:
								{microphone ? '✅' : '❌'}
							</div>
						</div>
					</div>
					<!-- Test button -->
					<div class="mt-3">
						<button
							onclick={testAudioLevelDetection}
							class="rounded bg-blue-500 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-600"
						>
							🧪 Test Audio Detection
						</button>
					</div>
				</div>

				<!-- Real-time Transcription Test -->
				<div class="mb-6">
					<h4 class="text-md mb-2 font-medium text-gray-800">📝 Real-time Transcription</h4>
					<div class="rounded border bg-white p-3 text-sm">
						<span class="font-medium">Live Transcript:</span>
						<span class="ml-2 text-gray-700">
							{#if messages.length > 0}
								{messages[messages.length - 1]?.role === 'user'
									? messages[messages.length - 1]?.content
									: 'Waiting for speech...'}
							{:else}
								No speech detected yet
							{/if}
						</span>
					</div>
				</div>

				<!-- AI Response Test -->
				<div class="mb-6">
					<h4 class="text-md mb-2 font-medium text-gray-800">🤖 AI Response Generation</h4>
					<div class="rounded border bg-white p-3 text-sm">
						<span class="font-medium">Last AI Response:</span>
						<span class="ml-2 text-gray-700">
							{#if messages.length > 0}
								{messages[messages.length - 1]?.role === 'assistant'
									? messages[messages.length - 1]?.content
									: 'Waiting for AI...'}
							{:else}
								No AI response yet
							{/if}
						</span>
					</div>
				</div>

				<!-- Connection Health Test -->
				<div class="mb-6">
					<h4 class="text-md mb-2 font-medium text-gray-800">🔌 Connection Health</h4>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div class="rounded border bg-white p-3">
							<span class="font-medium">WebRTC Status:</span>
							<span class="ml-2 {store?.isConnectionHealthy() ? 'text-green-600' : 'text-red-600'}">
								{store?.isConnectionHealthy() ? '✅ Healthy' : '❌ Unhealthy'}
							</span>
						</div>
						<div class="rounded border bg-white p-3">
							<span class="font-medium">Session ID:</span>
							<span class="ml-2 font-mono text-xs text-gray-600">
								{sessionId ? sessionId.substring(0, 8) + '...' : 'None'}
							</span>
						</div>
					</div>
				</div>

				<!-- Audio Processing Test -->
				<div class="mb-6">
					<h4 class="text-md mb-2 font-medium text-gray-800">🎵 Audio Processing</h4>
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div class="rounded border bg-white p-3">
							<span class="font-medium">Chunks Sent:</span>
							<span class="ml-2 text-blue-600">
								{#if store && status === 'streaming'}
									{Math.floor((Date.now() - startTime) / 100)} chunks
								{:else}
									0 chunks
								{/if}
							</span>
						</div>
						<div class="rounded border bg-white p-3">
							<span class="font-medium">Processing Time:</span>
							<span class="ml-2 text-blue-600">
								{#if startTime > 0}
									{Math.round((Date.now() - startTime) / 1000)}s
								{:else}
									0s
								{/if}
							</span>
						</div>
					</div>
				</div>

				<!-- Manual Test Controls -->
				<div class="mb-6">
					<h4 class="text-md mb-2 font-medium text-gray-800">🎮 Manual Test Controls</h4>
					<div class="flex flex-wrap gap-2">
						<button
							class="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
							onclick={() => testVoiceActivity()}
						>
							🎤 Test VAD
						</button>
						<button
							class="rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
							onclick={() => testTranscription()}
						>
							📝 Test Transcription
						</button>
						<button
							class="rounded bg-purple-500 px-3 py-2 text-sm text-white hover:bg-purple-600"
							onclick={() => testAIResponse()}
						>
							🤖 Test AI Response
						</button>
						<button
							class="rounded bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600"
							onclick={() => testAudioLevelDetection()}
						>
							🎵 Test Audio Level
						</button>
						<button
							class="rounded bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600"
							onclick={() => testMicAudio()}
						>
							🎤 Test Mic Audio (Hear Yourself)
						</button>
						<button
							class="rounded bg-pink-500 px-3 py-2 text-sm text-white hover:bg-pink-600"
							onclick={() => testMicStreamDetails()}
						>
							📊 Test Mic Stream Details
						</button>
						<button
							class="rounded bg-teal-500 px-3 py-2 text-sm text-white hover:bg-teal-600"
							onclick={() => testRealtimeEvents()}
						>
							🔌 Test Realtime Events (PR2)
						</button>
					</div>
				</div>

				<!-- Raw State Display -->
				<div class="mb-6">
					<h4 class="text-md mb-2 font-medium text-gray-800">📊 Raw State Data</h4>
					<details class="rounded border bg-white p-3 text-xs">
						<summary class="cursor-pointer font-medium text-gray-700">Click to expand</summary>
						<pre class="mt-2 max-h-32 overflow-auto text-gray-600">{JSON.stringify(
								{ status, sessionId, messages, startTime, language, voice },
								null,
								2
							)}</pre>
					</details>
				</div>
			</div>
		{/if}

		<!-- Dev Link -->
		<div class="text-center">
			<a href="/dev" class="text-sm text-blue-600 underline hover:text-blue-800">
				🧪 Open Dev Testing Panel
			</a>
		</div>
	</div>
</div>
