<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EventBusFactory } from '$lib/shared/events/eventBus';
	import { audioService, createAudioService } from '$lib/features/audio';
	import { realtimeService } from '$lib/features/realtime';
	import { ModernRealtimeConversationOrchestrator } from '$lib/features/conversation/realtime-conversation-orchestrator';
	import type { AudioState } from '$lib/features/audio/types';
	import type { RealtimeSession, RealtimeStream, RealtimeEvent } from '$lib/features/realtime';
	import type { RealtimeConversationState } from '$lib/features/conversation/realtime-conversation-orchestrator';
	import AudioVisualizer from '../AudioVisualizer.svelte';

	// State
	let activeTab = $state('audio');
	let eventBus = $state<ReturnType<typeof EventBusFactory.create> | null>(null);
	let orchestrator = $state<ModernRealtimeConversationOrchestrator | null>(null);

	// Audio testing state (using new architecture)
	let audioState = $state<AudioState | null>(null);
	let audioDevices = $state<MediaDeviceInfo[]>([]);
	let selectedDevice = $state<string>('');
	let testText = $state('Hello, this is a test message for text-to-speech!');
	let testAudioUrl = $state('');

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

	// Test results
	let testResults = $state<{
		audio: { passed: number; failed: number; tests: Array<{ name: string; passed: boolean; error?: string }> };
		conversation: { passed: number; failed: number; tests: Array<{ name: string; passed: boolean; error?: string }> };
		ai: { passed: number; failed: number; tests: Array<{ name: string; passed: boolean; error?: string }> };
		integration: { passed: number; failed: number; tests: Array<{ name: string; passed: boolean; error?: string }> };
	}>({
		audio: { passed: 0, failed: 0, tests: [] },
		conversation: { passed: 0, failed: 0, tests: [] },
		ai: { passed: 0, failed: 0, tests: [] },
		integration: { passed: 0, failed: 0, tests: [] }
	});

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

		// Set up audio state monitoring
		setupAudioStateMonitoring();
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

	// Audio testing functions (using new architecture)
	async function loadAudioDevices() {
		try {
			audioDevices = await audioService.getAudioDevices();
			if (audioDevices.length > 0) {
				selectedDevice = audioDevices[0].deviceId;
			}
		} catch (error) {
			console.error('Failed to load audio devices:', error);
		}
	}

	function setupAudioStateMonitoring() {
		// Monitor audio state changes
		setInterval(() => {
			audioState = audioService.getState();
		}, 100);
	}

	async function testAudioRecording() {
		const testName = 'Audio Recording';
		try {
			await audioService.startRecording(selectedDevice);
			await new Promise(resolve => setTimeout(resolve, 2000)); // Record for 2 seconds
			await audioService.stopRecording();
			
			addTestResult('audio', testName, true);
			console.log('✅ Audio recording test passed');
		} catch (error) {
			addTestResult('audio', testName, false, error instanceof Error ? error.message : 'Unknown error');
			console.error('❌ Audio recording test failed:', error);
		}
	}

	async function testAudioPlayback() {
		const testName = 'Audio Playback';
		try {
			// Create a simple test audio (sine wave)
			const audioContext = new AudioContext();
			const oscillator = audioContext.createOscillator();
			const destination = audioContext.createMediaStreamDestination();
			
			oscillator.connect(destination);
			oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
			oscillator.start();
			oscillator.stop(audioContext.currentTime + 1);
			
			// Convert to ArrayBuffer
			const stream = destination.stream;
			const mediaRecorder = new MediaRecorder(stream);
			const chunks: Blob[] = [];
			
			mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
			mediaRecorder.onstop = async () => {
				const blob = new Blob(chunks, { type: 'audio/wav' });
				const arrayBuffer = await blob.arrayBuffer();
				
				await audioService.playAudio(arrayBuffer);
				addTestResult('audio', testName, true);
				console.log('✅ Audio playback test passed');
			};
			
			mediaRecorder.start();
			setTimeout(() => mediaRecorder.stop(), 1000);
		} catch (error) {
			addTestResult('audio', testName, false, error instanceof Error ? error.message : 'Unknown error');
			console.error('❌ Audio playback test failed:', error);
		}
	}

	async function testTextToSpeech() {
		const testName = 'Text-to-Speech';
		try {
			const audioData = await audioService.textToSpeech(testText);
			await audioService.playAudio(audioData);
			
			addTestResult('ai', testName, true);
			console.log('✅ Text-to-speech test passed');
		} catch (error) {
			addTestResult('ai', testName, false, error instanceof Error ? error.message : 'Unknown error');
			console.error('❌ Text-to-speech test failed:', error);
		}
	}

	async function testTranscription() {
		const testName = 'Audio Transcription';
		try {
			// Create a simple test audio
			const audioContext = new AudioContext();
			const oscillator = audioContext.createOscillator();
			const destination = audioContext.createMediaStreamDestination();
			
			oscillator.connect(destination);
			oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
			oscillator.start();
			oscillator.stop(audioContext.currentTime + 2);
			
			const stream = destination.stream;
			const mediaRecorder = new MediaRecorder(stream);
			const chunks: Blob[] = [];
			
			mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
			mediaRecorder.onstop = async () => {
				const blob = new Blob(chunks, { type: 'audio/webm' });
				const arrayBuffer = await blob.arrayBuffer();
				
				const transcript = await audioService.transcribe(arrayBuffer);
				console.log('Transcript:', transcript);
				
				addTestResult('ai', testName, true);
				console.log('✅ Audio transcription test passed');
			};
			
			mediaRecorder.start();
			setTimeout(() => mediaRecorder.stop(), 2000);
		} catch (error) {
			addTestResult('ai', testName, false, error instanceof Error ? error.message : 'Unknown error');
			console.error('❌ Audio transcription test failed:', error);
		}
	}

	async function testVolumeControl() {
		const testName = 'Volume Control';
		try {
			const originalVolume = audioService.volume;
			
			await audioService.setVolume(0.5);
			expect(audioService.volume).toBe(0.5);
			
			await audioService.setVolume(0.8);
			expect(audioService.volume).toBe(0.8);
			
			await audioService.setVolume(originalVolume);
			
			addTestResult('audio', testName, true);
			console.log('✅ Volume control test passed');
		} catch (error) {
			addTestResult('audio', testName, false, error instanceof Error ? error.message : 'Unknown error');
			console.error('❌ Volume control test failed:', error);
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
		const testName = 'Realtime Session Creation';
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
				
				addTestResult('ai', testName, true);
			}
		} catch (error) {
			console.error('❌ Realtime session test failed:', error);
			lastError = error instanceof Error ? error.message : String(error);
			errorDetails = error;
			addTestResult('ai', testName, false, error instanceof Error ? error.message : 'Unknown error');
		}
	}

	// Conversation testing functions
	function setupConversationHandlers() {
		if (!orchestrator) return;

		conversationInterval = setInterval(() => {
			if (orchestrator) {
				conversationState = orchestrator.getState();
				conversationMessages = conversationState.messages;
			}
		}, 100);
	}

	async function testConversationStart() {
		const testName = 'Conversation Start';
		if (!orchestrator) return;

		try {
			lastError = null;
			errorDetails = null;
			
			await orchestrator.startConversation('en', 'alloy');
			console.log('Conversation started');
			
			addTestResult('conversation', testName, true);
		} catch (error) {
			console.error('Conversation start test failed:', error);
			lastError = error instanceof Error ? error.message : String(error);
			addTestResult('conversation', testName, false, error instanceof Error ? error.message : 'Unknown error');
		}
	}

	// Test orchestration
	async function runAllTests() {
		console.log('🧪 Starting comprehensive test suite...');
		
		// Reset test results
		testResults = {
			audio: { passed: 0, failed: 0, tests: [] },
			conversation: { passed: 0, failed: 0, tests: [] },
			ai: { passed: 0, failed: 0, tests: [] },
			integration: { passed: 0, failed: 0, tests: [] }
		};

		// Test audio features
		await testAudioRecording();
		await testAudioPlayback();
		await testVolumeControl();

		// Test AI features
		await testTextToSpeech();
		await testTranscription();
		await testRealtimeSession();

		// Test conversation features
		await testConversationStart();

		console.log('🧪 Test suite completed!', testResults);
	}

	function addTestResult(category: keyof typeof testResults, testName: string, passed: boolean, error?: string) {
		const result = { name: testName, passed, error };
		testResults[category].tests.push(result);
		
		if (passed) {
			testResults[category].passed++;
		} else {
			testResults[category].failed++;
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

	function expect(actual: any) {
		return {
			toBe: (expected: any) => {
				if (actual !== expected) {
					throw new Error(`Expected ${actual} to be ${expected}`);
				}
			}
		};
	}
</script>

<div class="dev-panel bg-gray-900 text-white p-6 min-h-screen">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold mb-2">🧪 Dev Testing Panel</h1>
			<p class="text-gray-300">Test each feature layer in isolation before integration</p>
			
			<!-- Test Suite Runner -->
			<div class="mt-4">
				<button
					onclick={runAllTests}
					class="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
				>
					🚀 Run All Tests
				</button>
			</div>
		</div>

		<!-- Test Results Summary -->
		<div class="mb-6 grid grid-cols-4 gap-4">
			<div class="bg-base-300 p-4 rounded-lg text-center">
				<h3 class="text-lg font-medium">🎤 Audio</h3>
				<p class="text-2xl font-bold text-green-400">{testResults.audio.passed}</p>
				<p class="text-sm text-red-400">{testResults.audio.failed} failed</p>
			</div>
			<div class="bg-base-300 p-4 rounded-lg text-center">
				<h3 class="text-lg font-medium">💬 Conversation</h3>
				<p class="text-2xl font-bold text-green-400">{testResults.conversation.passed}</p>
				<p class="text-sm text-red-400">{testResults.conversation.failed} failed</p>
			</div>
			<div class="bg-base-300 p-4 rounded-lg text-center">
				<h3 class="text-lg font-medium">🤖 AI</h3>
				<p class="text-2xl font-bold text-green-400">{testResults.ai.passed}</p>
				<p class="text-sm text-red-400">{testResults.ai.failed} failed</p>
			</div>
			<div class="bg-base-300 p-4 rounded-lg text-center">
				<h3 class="text-lg font-medium">🔗 Integration</h3>
				<p class="text-2xl font-bold text-green-400">{testResults.integration.passed}</p>
				<p class="text-sm text-red-400">{testResults.integration.failed} failed</p>
			</div>
		</div>

		<!-- Tab Navigation -->
		<div class="flex space-x-1 mb-6 bg-base-300 p-1 rounded-lg">
			<button
				class="px-4 py-2 rounded-md transition-colors {activeTab === 'audio' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}"
				onclick={() => activeTab = 'audio'}
			>
				🎤 Audio
			</button>
			<button
				class="px-4 py-2 rounded-md transition-colors {activeTab === 'realtime' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}"
				onclick={() => activeTab = 'realtime'}
			>
				🚀 Real-time
			</button>
			<button
				class="px-4 py-2 rounded-md transition-colors {activeTab === 'conversation' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}"
				onclick={() => activeTab = 'conversation'}
			>
				💬 Conversation
			</button>
			<button
				class="px-4 py-2 rounded-md transition-colors {activeTab === 'tests' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'}"
				onclick={() => activeTab = 'tests'}
			>
				🧪 Test Results
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
							<option value={device.deviceId}>{device.label || `Device ${device.deviceId}`}</option>
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
					<div class="grid grid-cols-2 gap-4">
						<button
							onclick={testAudioRecording}
							class="px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700"
						>
							🎤 Test Recording
						</button>
						<button
							onclick={testAudioPlayback}
							class="px-6 py-3 rounded-lg font-medium transition-colors bg-green-600 hover:bg-green-700"
						>
							🔊 Test Playback
						</button>
						<button
							onclick={testVolumeControl}
							class="px-6 py-3 rounded-lg font-medium transition-colors bg-purple-600 hover:bg-purple-700"
						>
							🔊 Test Volume Control
						</button>
					</div>
				</div>

				<!-- Audio State Display -->
				{#if audioState}
					<div class="bg-base-300 p-4 rounded-lg">
						<h3 class="text-lg font-medium mb-3">Audio State</h3>
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p><strong>Status:</strong> <span class="font-mono">{audioState.status}</span></p>
								<p><strong>Volume:</strong> {(audioState.volume * 100).toFixed(0)}%</p>
								<p><strong>Can Record:</strong> {audioState.status === 'idle' ? 'Yes' : 'No'}</p>
								<p><strong>Can Play:</strong> {audioState.status === 'idle' ? 'Yes' : 'No'}</p>
							</div>
							<div>
								<p><strong>Current Audio:</strong> {audioState.currentAudio || 'None'}</p>
								<p><strong>Recording Session:</strong> {audioState.recordingSession ? 'Active' : 'None'}</p>
								{#if audioState.error}
									<p><strong>Error:</strong> <span class="text-red-400">{audioState.error}</span></p>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- AI Audio Testing -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">AI Audio Testing</h3>
					<div class="space-y-4">
						<div>
							<label for="test-text" class="block text-sm font-medium mb-2">Test Text for TTS:</label>
							<input
								id="test-text"
								bind:value={testText}
								class="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
								placeholder="Enter text to convert to speech"
							/>
						</div>
						<div class="flex space-x-4">
							<button
								onclick={testTextToSpeech}
								class="px-6 py-3 rounded-lg font-medium transition-colors bg-green-600 hover:bg-green-700"
							>
								🗣️ Test Text-to-Speech
							</button>
							<button
								onclick={testTranscription}
								class="px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700"
							>
								📝 Test Transcription
							</button>
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
					</div>
					{#if realtimeSession}
						<div class="mt-3 p-3 bg-gray-700 rounded text-sm">
							<p><strong>Session ID:</strong> {realtimeSession.id}</p>
							<p><strong>Status:</strong> {realtimeSession.status}</p>
							<p><strong>Expires:</strong> {new Date(realtimeSession.expiresAt).toLocaleString()}</p>
						</div>
					{/if}
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
										<span class="text-xs text-gray-400">
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

		<!-- Test Results Tab -->
		{#if activeTab === 'tests'}
			<div class="space-y-6">
				<h2 class="text-2xl font-semibold">🧪 Test Results</h2>
				
				<!-- Audio Tests -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">🎤 Audio Tests ({testResults.audio.passed + testResults.audio.failed})</h3>
					<div class="space-y-2">
						{#each testResults.audio.tests as test}
							<div class="flex justify-between items-center p-2 {test.passed ? 'bg-green-900' : 'bg-red-900'} rounded">
								<span>{test.name}</span>
								<span class="{test.passed ? 'text-green-400' : 'text-red-400'}">
									{test.passed ? '✅ PASS' : '❌ FAIL'}
								</span>
							</div>
							{#if !test.passed && test.error}
								<div class="ml-4 text-sm text-red-400">{test.error}</div>
							{/if}
						{/each}
					</div>
				</div>

				<!-- AI Tests -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">🤖 AI Tests ({testResults.ai.passed + testResults.ai.failed})</h3>
					<div class="space-y-2">
						{#each testResults.ai.tests as test}
							<div class="flex justify-between items-center p-2 {test.passed ? 'bg-green-900' : 'bg-red-900'} rounded">
								<span>{test.name}</span>
								<span class="{test.passed ? 'text-green-400' : 'text-red-400'}">
									{test.passed ? '✅ PASS' : '❌ FAIL'}
								</span>
							</div>
							{#if !test.passed && test.error}
								<div class="ml-4 text-sm text-red-400">{test.error}</div>
							{/if}
						{/each}
					</div>
				</div>

				<!-- Conversation Tests -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">💬 Conversation Tests ({testResults.conversation.passed + testResults.conversation.failed})</h3>
					<div class="space-y-2">
						{#each testResults.conversation.tests as test}
							<div class="flex justify-between items-center p-2 {test.passed ? 'bg-green-900' : 'bg-red-900'} rounded">
								<span>{test.name}</span>
								<span class="{test.passed ? 'text-green-400' : 'text-red-400'}">
									{test.passed ? '✅ PASS' : '❌ FAIL'}
								</span>
							</div>
							{#if !test.passed && test.error}
								<div class="ml-4 text-sm text-red-400">{test.error}</div>
							{/if}
						{/each}
					</div>
				</div>

				<!-- Integration Tests -->
				<div class="bg-base-300 p-4 rounded-lg">
					<h3 class="text-lg font-medium mb-3">🔗 Integration Tests ({testResults.integration.passed + testResults.integration.failed})</h3>
					<div class="space-y-2">
						{#each testResults.integration.tests as test}
							<div class="flex justify-between items-center p-2 {test.passed ? 'bg-green-900' : 'bg-red-900'} rounded">
								<span>{test.name}</span>
								<span class="{test.passed ? 'text-green-400' : 'text-red-400'}">
									{test.passed ? '✅ PASS' : '❌ FAIL'}
								</span>
							</div>
							{#if !test.passed && test.error}
								<div class="ml-4 text-sm text-red-400">{test.error}</div>
							{/if}
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
