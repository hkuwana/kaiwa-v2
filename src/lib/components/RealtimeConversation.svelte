<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EventBusFactory } from '$lib/shared/events/eventBus';
	import { ConversationOrchestrator } from '$lib/features/conversation/conversation-orchestrator.svelte';
	import { RealtimeConversationStatus } from '$lib/features/conversation/kernel';
	import AudioVisualizer from './AudioVisualizer.svelte';
	import ConversationHistory from './ConversationHistory.svelte';
	import { dev } from '$app/environment';

	let {   autoStart = false } = $props();

		 
	// This follows the "Invisible Tutor" philosophy - seamless experience
 

	// State variables
		let orchestrator = $state<ConversationOrchestrator | null>(null);
	let audioLevel = $state(0);
	let audioContext: AudioContext | null = $state(null);
	let analyser: AnalyserNode | null = $state(null);
	let microphone: MediaStreamAudioSourceNode | null = $state(null);
	let animationFrame: number | null = $state(null);

	// Initialize with sessionStorage preferences on mount
	onMount(async () => {
		// Check for stored preferences
		const storedLanguage = sessionStorage.getItem('kaiwa_language');
		const storedVoice = sessionStorage.getItem('kaiwa_voice');
		
		if (storedLanguage) {
			language = storedLanguage;
		}
		if (storedVoice) {
			voice = storedVoice;
		}
		
		console.log('🎭 Component mounted, initializing orchestrator...');
		try {
			const eventBus = EventBusFactory.create('memory');
			console.log('📡 Event bus created');
			
			orchestrator = new ConversationOrchestrator(eventBus);
			console.log('✅ Orchestrator created successfully');
			console.log('🎭 Orchestrator instance:', orchestrator);
			
			// Auto-start conversation if requested (aligns with "Invisible Tutor" philosophy)
			if (autoStart) {
				console.log('🚀 Auto-starting conversation...');
				try {
					// Small delay to ensure everything is initialized
					await new Promise(resolve => setTimeout(resolve, 100));
					await orchestrator.startConversation(language, voice);
					console.log('✅ Auto-started conversation successfully');
				} catch (error) {
					console.error('❌ Failed to auto-start conversation:', error);
				}
			}
		} catch (error) {
			console.error('❌ Failed to create orchestrator:', error);
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
			audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
			analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			analyser.smoothingTimeConstant = 0.8;
			
			// Use provided stream or orchestrator's micStream; fallback to getUserMedia only if needed
			const stream = source || orchestrator?.micStream || (await navigator.mediaDevices.getUserMedia({ audio: true }));
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
		if (orchestrator && isStreaming && orchestrator.micStream) {
			if (!audioContext) {
				setupAudioLevelDetection(orchestrator.micStream);
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

	// Use Svelte 5 runes with orchestrator functions (functional approach)
		let canStartConversation = $derived(orchestrator?.status === RealtimeConversationStatus.IDLE);
	let isStreaming = $derived(orchestrator?.status === RealtimeConversationStatus.STREAMING);
	let isConnecting = $derived(orchestrator?.status === RealtimeConversationStatus.CONNECTING);
	let hasError = $derived(orchestrator?.status === RealtimeConversationStatus.ERROR);
	let errorMessage = $derived(orchestrator?.error || '');
	
	// Reactive state from orchestrator
	let status = $derived(orchestrator?.status || RealtimeConversationStatus.IDLE);
	let sessionId = $derived(orchestrator?.sessionId || '');
	let messages = $derived(orchestrator?.messages || []);
	let startTime = $derived(orchestrator?.startTime || 0);
	let language = $derived(orchestrator?.language || 'en');
	let voice = $derived(orchestrator?.voice || 'alloy');

	// Simulate audio level for visualization



	// Cleanup on destroy
	onDestroy(() => {
		if (orchestrator) {
			orchestrator.cleanup();
		}
	});



	// Toggle conversation/streaming
	async function toggleConversation() {
		console.log('🎙️ Toggle Conversation button clicked');
		console.log('🎭 Orchestrator exists:', !!orchestrator);
		
		if (!orchestrator) {
			console.error('❌ No orchestrator available');
			return;
		}

		const currentState = orchestrator.getState();
		console.log('📊 Current state:', currentState);
		
		if (currentState.status === RealtimeConversationStatus.IDLE) {
			console.log('🚀 Starting conversation and streaming...');
			try {
				await orchestrator.startConversation(language, voice);
				console.log('✅ Conversation and streaming started successfully');
			} catch (error) {
				console.error('❌ Failed to start conversation:', error);
			}
		} else if (currentState.status === RealtimeConversationStatus.STREAMING) {
			console.log('⏹️ Stopping streaming...');
			try {
				await orchestrator.stopStreaming();
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
		if (orchestrator) {
			await orchestrator.endConversation();
		}
	}


	let audioInterval: ReturnType<typeof setInterval> | undefined;
	
	// Log orchestrator state changes for debugging
	$effect(() => {
		if (orchestrator) {
			console.log('🔄 Orchestrator state changed:', {
				status: orchestrator.status,
				sessionId: orchestrator.sessionId,
				messages: orchestrator.messages.length
			});
		}
	});

	// Test functions for dev panel
	function testVoiceActivity() {
		console.log('🧪 Testing Voice Activity Detection...');
		if (orchestrator) {
			const currentState = orchestrator.getState();
			console.log('Current VAD state:', currentState.status);
		}
	}

	function testTranscription() {
		console.log('🧪 Testing Transcription...');
		if (orchestrator) {
			const currentState = orchestrator.getState();
			console.log('Current messages:', currentState.messages);
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
			setupAudioLevelDetection().then(() => {
				console.log('✅ Test audio context set up');
			}).catch(error => {
				console.error('❌ Failed to set up test audio context:', error);
			});
		}
	}

	function testAIResponse() {
		console.log('🧪 Testing AI Response...');
		if (orchestrator) {
			const currentState = orchestrator.getState();
			console.log('Current AI state:', currentState.status);
		}
	}

	// Test mic audio by playing back the stream (hear yourself)
	function testMicAudio() {
		if (orchestrator?.micStream) {
			// Create audio element to play back the mic stream
			const audioEl = new Audio();
			audioEl.srcObject = orchestrator.micStream;
			audioEl.play().catch(error => {
				console.error('❌ Failed to play mic audio:', error);
			});
			console.log('🎤 Playing back mic stream - you should hear yourself talking');
		} else {
			console.log('❌ No mic stream available - start a conversation first');
		}
	}

	// Test mic stream details
	function testMicStreamDetails() {
		if (orchestrator?.micStream) {
			const stream = orchestrator.micStream;
			console.log('🎤 Mic Stream Details:', {
				active: stream.active,
				trackCount: stream.getTracks().length,
				audioTracks: stream.getAudioTracks().map(track => ({
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
				status === RealtimeConversationStatus.IDLE ? 'bg-gray-100 text-gray-800' :
				status === RealtimeConversationStatus.CONNECTING ? 'bg-yellow-100 text-yellow-800' :
				status === RealtimeConversationStatus.CONNECTED ? 'bg-green-100 text-green-800' :
				status === RealtimeConversationStatus.STREAMING ? 'bg-blue-100 text-blue-800' :
				'bg-red-100 text-red-800'
			}">
				{#if status === RealtimeConversationStatus.IDLE}
					<span class="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
					Ready to start
				{:else if status === RealtimeConversationStatus.CONNECTING}
					<span class="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
					Connecting...
				{:else if status === RealtimeConversationStatus.CONNECTED}
					<span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
					Connected
				{:else if status === RealtimeConversationStatus.STREAMING}
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
						<h3 class="text-sm font-medium text-red-800">Connection Error</h3>
						<div class="mt-2 text-sm text-red-700">
							{errorMessage}
							{#if errorMessage.includes('WebRTC')}
								<br />
								<button 
									class="mt-2 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
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
		<div class="text-center text-sm text-gray-500 mb-4">
			Debug: Status={status} | canStart={canStartConversation} | isStreaming={isStreaming} | isConnecting={isConnecting}
			{#if orchestrator}
				<br />
				Connection Health: {orchestrator.isConnectionHealthy() ? '✅ Healthy' : '❌ Unhealthy'}
			{/if}
		</div>
		{/if}

		<!-- Main Controls -->
		<div class="flex justify-center space-x-4">
			<!-- Auto-starting indicator -->
			{#if autoStart && isConnecting}
				<div class="text-center">
					<div class="loading loading-spinner loading-lg text-primary"></div>
					<p class="text-lg font-medium text-primary mt-2">🎭 Setting up your conversation...</p>
				</div>
			{/if}
			
			<!-- Unified Conversation Button -->
			{#if canStartConversation && !(autoStart && isConnecting)}
				<button
					onclick={toggleConversation}
					disabled={isConnecting}
					class="btn btn-primary btn-lg px-8 py-4 text-lg font-semibold {
						isConnecting ? 'loading' : ''
					}"
				>
					{#if isConnecting}
						<span class="loading loading-spinner loading-md"></span>
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
					class="btn btn-error btn-lg px-8 py-4 text-lg font-semibold"
				>
					⏹️ Stop Streaming
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
		{#if messages.length > 0}
			<div class="bg-white rounded-lg shadow-lg p-6">
				<h2 class="text-xl font-semibold text-gray-900 mb-4">Conversation History</h2>
				<ConversationHistory messages={messages} />
			</div>
		{/if}

		<!-- Instructions -->
		{#if status === RealtimeConversationStatus.IDLE}
			<div class="bg-white rounded-lg shadow-lg p-6 text-center">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">
					{#if autoStart}
						🚀 Auto-starting conversation...
					{:else}
						How it works
					{/if}
				</h3>
				<div class="text-gray-600 space-y-2">
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
				<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
					<h4 class="text-sm font-medium text-yellow-800 mb-2">🧪 MVP Development Mode</h4>
					<p class="text-xs text-yellow-700">
						This is a development build. If WebRTC fails, the app will show clear errors instead of silent failures.
						<br />
						<strong>Expected behavior:</strong> Either it works perfectly, or it fails fast with clear error messages.
					</p>
				</div>
				{/if}
			</div>
		{/if}

		<!-- Dev Testing Panel -->
		{#if dev}
		<div class="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">🧪 Dev Testing Panel</h3>
			
			<!-- Voice Activity Detection Test -->
			<div class="mb-6">
				<h4 class="text-md font-medium text-gray-800 mb-2">🎤 Voice Activity Detection</h4>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div class="bg-white p-3 rounded border">
						<span class="font-medium">VAD Status:</span>
						<span class="ml-2 {isStreaming ? 'text-green-600' : 'text-gray-600'}">
							{isStreaming ? '🔴 Active' : '⚪ Inactive'}
						</span>
					</div>
					<div class="bg-white p-3 rounded border">
						<span class="font-medium">Audio Level:</span>
						<span class="ml-2 text-blue-600">{Math.round(audioLevel * 100)}%</span>
						<!-- Visual audio level bar -->
						<div class="mt-2 w-full bg-gray-200 rounded-full h-2">
							<div 
								class="bg-blue-600 h-2 rounded-full transition-all duration-100 ease-out"
								style="width: {Math.round(audioLevel * 100)}%"
							></div>
						</div>
						<!-- Raw audio data -->
						<div class="mt-1 text-xs text-gray-500">
							Raw: {audioLevel.toFixed(3)} | RMS: {Math.round(audioLevel * 128)}
						</div>
						<!-- Audio context status -->
						<div class="mt-1 text-xs text-gray-500">
							Context: {audioContext?.state || 'None'} | 
							Analyser: {analyser ? '✅' : '❌'} | 
							Mic: {microphone ? '✅' : '❌'}
						</div>
					</div>
				</div>
				<!-- Test button -->
				<div class="mt-3">
					<button
						onclick={testAudioLevelDetection}
						class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
					>
						🧪 Test Audio Detection
					</button>
				</div>
			</div>

			<!-- Real-time Transcription Test -->
			<div class="mb-6">
				<h4 class="text-md font-medium text-gray-800 mb-2">📝 Real-time Transcription</h4>
				<div class="bg-white p-3 rounded border text-sm">
					<span class="font-medium">Live Transcript:</span>
					<span class="ml-2 text-gray-700">
						{#if messages.length > 0}
							{messages[messages.length - 1]?.role === 'user' ? messages[messages.length - 1]?.content : 'Waiting for speech...'}
						{:else}
							No speech detected yet
						{/if}
					</span>
				</div>
			</div>

			<!-- AI Response Test -->
			<div class="mb-6">
				<h4 class="text-md font-medium text-gray-800 mb-2">🤖 AI Response Generation</h4>
				<div class="bg-white p-3 rounded border text-sm">
					<span class="font-medium">Last AI Response:</span>
					<span class="ml-2 text-gray-700">
						{#if messages.length > 0}
							{messages[messages.length - 1]?.role === 'assistant' ? messages[messages.length - 1]?.content : 'Waiting for AI...'}
						{:else}
							No AI response yet
						{/if}
					</span>
				</div>
			</div>

			<!-- Connection Health Test -->
			<div class="mb-6">
				<h4 class="text-md font-medium text-gray-800 mb-2">🔌 Connection Health</h4>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div class="bg-white p-3 rounded border">
						<span class="font-medium">WebRTC Status:</span>
						<span class="ml-2 {orchestrator?.isConnectionHealthy() ? 'text-green-600' : 'text-red-600'}">
							{orchestrator?.isConnectionHealthy() ? '✅ Healthy' : '❌ Unhealthy'}
						</span>
					</div>
					<div class="bg-white p-3 rounded border">
						<span class="font-medium">Session ID:</span>
						<span class="ml-2 text-gray-600 font-mono text-xs">
							{sessionId ? sessionId.substring(0, 8) + '...' : 'None'}
						</span>
					</div>
				</div>
			</div>

			<!-- Audio Processing Test -->
			<div class="mb-6">
				<h4 class="text-md font-medium text-gray-800 mb-2">🎵 Audio Processing</h4>
				<div class="grid grid-cols-2 gap-4 text-sm">
					<div class="bg-white p-3 rounded border">
						<span class="font-medium">Chunks Sent:</span>
						<span class="ml-2 text-blue-600">
							{#if orchestrator && status === 'streaming'}
								{Math.floor((Date.now() - startTime) / 100)} chunks
							{:else}
								0 chunks
							{/if}
						</span>
					</div>
					<div class="bg-white p-3 rounded border">
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
				<h4 class="text-md font-medium text-gray-800 mb-2">🎮 Manual Test Controls</h4>
				<div class="flex gap-2 flex-wrap">
					<button 
						class="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
						onclick={() => testVoiceActivity()}
					>
						🎤 Test VAD
					</button>
					<button 
						class="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600"
						onclick={() => testTranscription()}
					>
						📝 Test Transcription
					</button>
					<button 
						class="px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
						onclick={() => testAIResponse()}
					>
						🤖 Test AI Response
					</button>
					<button 
						class="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
						onclick={() => testAudioLevelDetection()}
					>
						🎵 Test Audio Level
					</button>
					<button 
						class="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
						onclick={() => testMicAudio()}
					>
						🎤 Test Mic Audio (Hear Yourself)
					</button>
					<button 
						class="px-3 py-2 bg-pink-500 text-white rounded text-sm hover:bg-pink-600"
						onclick={() => testMicStreamDetails()}
					>
						📊 Test Mic Stream Details
					</button>
				</div>
			</div>

			<!-- Raw State Display -->
			<div class="mb-6">
				<h4 class="text-md font-medium text-gray-800 mb-2">📊 Raw State Data</h4>
				<details class="bg-white p-3 rounded border text-xs">
					<summary class="cursor-pointer font-medium text-gray-700">Click to expand</summary>
					<pre class="mt-2 text-gray-600 overflow-auto max-h-32">{JSON.stringify({ status, sessionId, messages, startTime, language, voice }, null, 2)}</pre>
				</details>
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
