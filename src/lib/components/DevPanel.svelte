<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EventBusFactory } from '$lib/shared/events/eventBus';
	import { AudioService } from '$lib/services/audio.service';
	import { realtimeService } from '$lib/features/realtime';
	// import { ConversationOrchestrator } from '$lib/features/conversation/conversation-orchestrator.svelte';
	import { errorMonitor } from '$lib/shared/events/errorMonitor';
	import type { AudioState } from '$lib/features/audio/types';
	import type { RealtimeSession, RealtimeStream, RealtimeEvent } from '$lib/features/realtime';
	// import type { RealtimeConversationState } from '$lib/features/conversation/realtime-conversation-orchestrator.svelte';
	import type { ErrorEntry } from '$lib/shared/events/errorMonitor';
	import AudioVisualizer from './AudioVisualizer.svelte';

	// State
	let activeTab = $state('audio');
	let eventBus = $state<ReturnType<typeof EventBusFactory.create> | null>(null);
	// let orchestrator = $state<ModernRealtimeConversationOrchestrator | null>(null);

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

	// Error monitoring system
	let errorLog = $state<ErrorEntry[]>([]);
	let showErrorDetails = $state(false);
	let errorFilter = $state<'all' | 'unresolved' | 'critical'>('unresolved');

	// Conversation testing state
	let conversationState = $state<RealtimeConversationState | null>(null);
	let conversationMessages = $state<
		Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>
	>([]);
	let conversationInterval: ReturnType<typeof setInterval> | undefined;

	// Test results
	let testResults = $state<{
		audio: {
			passed: number;
			failed: number;
			tests: Array<{ name: string; passed: boolean; error?: string }>;
		};
		conversation: {
			passed: number;
			failed: number;
			tests: Array<{ name: string; passed: boolean; error?: string }>;
		};
		ai: {
			passed: number;
			failed: number;
			tests: Array<{ name: string; passed: boolean; error?: string }>;
		};
		integration: {
			passed: number;
			failed: number;
			tests: Array<{ name: string; passed: boolean; error?: string }>;
		};
	}>({
		audio: { passed: 0, failed: 0, tests: [] },
		conversation: { passed: 0, failed: 0, tests: [] },
		ai: { passed: 0, failed: 0, tests: [] },
		integration: { passed: 0, failed: 0, tests: [] }
	});

	// Initialize
	onMount(async () => {
		eventBus = EventBusFactory.create('memory');
		// orchestrator = new ModernRealtimeConversationOrchestrator(eventBus);

		// Load audio devices
		await loadAudioDevices();

		// Set up real-time event handlers
		setupRealtimeHandlers();

		// Set up conversation event handlers
		setupConversationHandlers();

		// Set up audio state monitoring
		setupAudioStateMonitoring();

		// Set up error monitoring and initialize the global monitor
		setupErrorMonitoring();
		errorMonitor.initialize();
	});

	// Cleanup
	onDestroy(() => {
		// if (orchestrator) {
		// 	orchestrator.cleanup();
		// }
		if (conversationInterval) {
			clearInterval(conversationInterval);
		}
	});

	// Audio testing functions (using new architecture)
	let audioServiceInstance: AudioService;

	async function loadAudioDevices() {
		try {
			audioServiceInstance = new AudioService();
			await audioServiceInstance.initialize();
			audioDevices = await audioServiceInstance.getAvailableDevices();
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

	// Error monitoring system
	function setupErrorMonitoring() {
		// Subscribe to global error monitor
		const unsubscribe = errorMonitor.onError((error) => {
			errorLog = [error, ...errorLog];
		});

		// Cleanup on destroy
		onDestroy(() => {
			unsubscribe();
		});
	}

	// Error utility functions using global service
	function resolveError(errorId: string) {
		errorMonitor.resolveError(errorId);
		// Update local state
		errorLog = errorLog.map((error) =>
			error.id === errorId ? { ...error, resolved: true } : error
		);
	}

	function clearResolvedErrors() {
		errorMonitor.clearResolvedErrors();
		// Update local state
		errorLog = errorLog.filter((error) => !error.resolved);
	}

	function getFilteredErrors() {
		return errorMonitor.getErrors(errorFilter);
	}

	function getSeverityColor(severity: string) {
		switch (severity) {
			case 'critical':
				return 'badge-error';
			case 'high':
				return 'badge-warning';
			case 'medium':
				return 'badge-warning';
			case 'low':
				return 'badge-info';
			default:
				return 'badge-neutral';
		}
	}

	async function testAudioRecording() {
		const testName = 'Audio Recording';
		try {
			await audioService.startRecording(selectedDevice);
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Record for 2 seconds
			await audioService.stopRecording();

			addTestResult('audio', testName, true);
			console.log('✅ Audio recording test passed');
		} catch (error) {
			addTestResult(
				'audio',
				testName,
				false,
				error instanceof Error ? error.message : 'Unknown error'
			);
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
			addTestResult(
				'audio',
				testName,
				false,
				error instanceof Error ? error.message : 'Unknown error'
			);
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
			addTestResult(
				'ai',
				testName,
				false,
				error instanceof Error ? error.message : 'Unknown error'
			);
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
			addTestResult(
				'ai',
				testName,
				false,
				error instanceof Error ? error.message : 'Unknown error'
			);
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
			addTestResult(
				'audio',
				testName,
				false,
				error instanceof Error ? error.message : 'Unknown error'
			);
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
			addTestResult(
				'ai',
				testName,
				false,
				error instanceof Error ? error.message : 'Unknown error'
			);
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
			addTestResult(
				'conversation',
				testName,
				false,
				error instanceof Error ? error.message : 'Unknown error'
			);
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

	function addTestResult(
		category: keyof typeof testResults,
		testName: string,
		passed: boolean,
		error?: string
	) {
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
			case 'transcript':
				return 'text-blue-400';
			case 'response':
				return 'text-green-400';
			case 'audio_response':
				return 'text-purple-400';
			case 'error':
				return 'text-red-400';
			case 'connection_change':
				return 'text-yellow-400';
			default:
				return 'text-gray-400';
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

<div class="min-h-screen bg-base-100 text-base-content">
	<div class="mx-auto max-w-7xl p-6">
		<!-- Header -->
		<div class="mb-8">
			<div class="mb-2 flex items-center justify-between">
				<h1 class="text-3xl font-bold text-primary">🧪 Dev Testing Panel</h1>

				<!-- Error Status Badge -->
				{#if errorMonitor.getErrorCount('unresolved') > 0}
					<div class="flex items-center space-x-2">
						<span class="text-sm text-base-content/70">Active Issues:</span>
						<button onclick={() => (activeTab = 'errors')} class="btn btn-sm btn-error">
							🚨 {errorMonitor.getErrorCount('unresolved')} Unresolved
						</button>
					</div>
				{/if}
			</div>
			<p class="text-base-content/70">Test each feature layer in isolation before integration</p>

			<!-- Test Suite Runner -->
			<div class="mt-4">
				<button onclick={runAllTests} class="btn btn-lg btn-success"> 🚀 Run All Tests </button>
			</div>
		</div>

		<!-- Test Results Summary -->
		<div class="mb-6 grid grid-cols-4 gap-4">
			<div class="card bg-base-200 shadow-sm">
				<div class="card-body p-4 text-center">
					<h3 class="text-lg font-medium text-base-content">🎤 Audio</h3>
					<p class="text-2xl font-bold text-success">{testResults.audio.passed}</p>
					<p class="text-sm text-error">{testResults.audio.failed} failed</p>
				</div>
			</div>
			<div class="card bg-base-200 shadow-sm">
				<div class="card-body p-4 text-center">
					<h3 class="text-lg font-medium text-base-content">💬 Conversation</h3>
					<p class="text-2xl font-bold text-success">{testResults.conversation.passed}</p>
					<p class="text-sm text-error">{testResults.conversation.failed} failed</p>
				</div>
			</div>
			<div class="card bg-base-200 shadow-sm">
				<div class="card-body p-4 text-center">
					<h3 class="text-lg font-medium text-base-content">🤖 AI</h3>
					<p class="text-2xl font-bold text-success">{testResults.ai.passed}</p>
					<p class="text-sm text-error">{testResults.ai.failed} failed</p>
				</div>
			</div>
			<div class="card bg-base-200 shadow-sm">
				<div class="card-body p-4 text-center">
					<h3 class="text-lg font-medium text-base-content">🔗 Integration</h3>
					<p class="text-2xl font-bold text-success">{testResults.integration.passed}</p>
					<p class="text-sm text-error">{testResults.integration.failed} failed</p>
				</div>
			</div>
		</div>

		<!-- Tab Navigation -->
		<div class="tabs-boxed mb-6 tabs bg-base-200">
			<button
				class="tab {activeTab === 'audio' ? 'tab-active' : ''}"
				onclick={() => (activeTab = 'audio')}
			>
				🎤 Audio
			</button>
			<button
				class="tab {activeTab === 'realtime' ? 'tab-active' : ''}"
				onclick={() => (activeTab = 'realtime')}
			>
				🚀 Real-time
			</button>
			<button
				class="tab {activeTab === 'conversation' ? 'tab-active' : ''}"
				onclick={() => (activeTab = 'conversation')}
			>
				💬 Conversation
			</button>
			<button
				class="tab {activeTab === 'tests' ? 'tab-active' : ''}"
				onclick={() => (activeTab = 'tests')}
			>
				🧪 Test Results
			</button>
			<button
				class="tab {activeTab === 'errors' ? 'tab-active' : ''}"
				onclick={() => (activeTab = 'errors')}
			>
				🚨 Error Monitor
				{#if getFilteredErrors().length > 0}
					<span class="ml-2 badge badge-sm badge-error">
						{getFilteredErrors().length}
					</span>
				{/if}
			</button>
		</div>

		<!-- Audio Testing Tab -->
		{#if activeTab === 'audio'}
			<div class="space-y-6">
				<h2 class="text-2xl font-semibold">🎤 Audio Feature Testing</h2>

				<!-- Device Selection -->
				<div class="rounded-lg bg-base-300 p-4">
					<h3 class="mb-3 text-lg font-medium">Audio Devices</h3>
					<select
						bind:value={selectedDevice}
						class="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white"
					>
						{#each audioDevices as device}
							<option value={device.deviceId}>{device.label || `Device ${device.deviceId}`}</option>
						{/each}
					</select>
					<button
						onclick={loadAudioDevices}
						class="mt-2 rounded bg-gray-600 px-4 py-2 transition-colors hover:bg-gray-500"
					>
						🔄 Refresh Devices
					</button>
				</div>

				<!-- Audio Controls -->
				<div class="rounded-lg bg-base-300 p-4">
					<h3 class="mb-3 text-lg font-medium">Audio Controls</h3>
					<div class="grid grid-cols-2 gap-4">
						<button
							onclick={testAudioRecording}
							class="rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
						>
							🎤 Test Recording
						</button>
						<button
							onclick={testAudioPlayback}
							class="rounded-lg bg-green-600 px-6 py-3 font-medium transition-colors hover:bg-green-700"
						>
							🔊 Test Playback
						</button>
						<button
							onclick={testVolumeControl}
							class="rounded-lg bg-purple-600 px-6 py-3 font-medium transition-colors hover:bg-purple-700"
						>
							🔊 Test Volume Control
						</button>
					</div>
				</div>

				<!-- Audio State Display -->
				{#if audioState}
					<div class="rounded-lg bg-base-300 p-4">
						<h3 class="mb-3 text-lg font-medium">Audio State</h3>
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p><strong>Status:</strong> <span class="font-mono">{audioState.status}</span></p>
								<p><strong>Volume:</strong> {(audioState.volume * 100).toFixed(0)}%</p>
								<p><strong>Can Record:</strong> {audioState.status === 'idle' ? 'Yes' : 'No'}</p>
								<p><strong>Can Play:</strong> {audioState.status === 'idle' ? 'Yes' : 'No'}</p>
							</div>
							<div>
								<p><strong>Current Audio:</strong> {audioState.currentAudio || 'None'}</p>
								<p>
									<strong>Recording Session:</strong>
									{audioState.recordingSession ? 'Active' : 'None'}
								</p>
								{#if audioState.error}
									<p>
										<strong>Error:</strong> <span class="text-red-400">{audioState.error}</span>
									</p>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- AI Audio Testing -->
				<div class="rounded-lg bg-base-300 p-4">
					<h3 class="mb-3 text-lg font-medium">AI Audio Testing</h3>
					<div class="space-y-4">
						<div>
							<label for="test-text" class="mb-2 block text-sm font-medium"
								>Test Text for TTS:</label
							>
							<input
								id="test-text"
								bind:value={testText}
								class="w-full rounded border border-gray-600 bg-gray-700 p-2 text-white"
								placeholder="Enter text to convert to speech"
							/>
						</div>
						<div class="flex space-x-4">
							<button
								onclick={testTextToSpeech}
								class="rounded-lg bg-green-600 px-6 py-3 font-medium transition-colors hover:bg-green-700"
							>
								🗣️ Test Text-to-Speech
							</button>
							<button
								onclick={testTranscription}
								class="rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
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
				<div class="rounded-lg bg-base-300 p-4">
					<h3 class="mb-3 text-lg font-medium">Session Management</h3>
					<div class="flex space-x-4">
						<button
							onclick={testRealtimeSession}
							class="rounded-lg px-6 py-3 font-medium transition-colors {realtimeSession
								? 'bg-red-600 hover:bg-red-700'
								: 'bg-blue-600 hover:bg-blue-700'}"
						>
							{realtimeSession ? '❌ Close Session' : '🔗 Create Session'}
						</button>
					</div>
					{#if realtimeSession}
						<div class="mt-3 rounded bg-gray-700 p-3 text-sm">
							<p><strong>Session ID:</strong> {realtimeSession.id}</p>
							<p><strong>Status:</strong> {realtimeSession.status}</p>
							<p>
								<strong>Expires:</strong>
								{new Date(realtimeSession.expiresAt).toLocaleString()}
							</p>
						</div>
					{/if}
				</div>

				<!-- Connection Status -->
				<div class="rounded-lg bg-base-300 p-4">
					<h3 class="mb-3 text-lg font-medium">Connection Status</h3>
					<div class="flex items-center space-x-2">
						<div
							class="h-3 w-3 rounded-full {isRealtimeConnected ? 'bg-green-500' : 'bg-red-500'}"
						></div>
						<span>{isRealtimeConnected ? 'Connected' : 'Disconnected'}</span>
					</div>
				</div>

				<!-- Error Display -->
				{#if lastError}
					<div class="rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">
						<h3 class="mb-3 text-lg font-medium">🚨 Last Error</h3>
						<div class="space-y-2">
							<p class="font-medium">{lastError}</p>
							{#if errorDetails}
								<details class="text-sm">
									<summary class="cursor-pointer hover:text-red-800">Show Error Details</summary>
									<pre class="mt-2 overflow-x-auto rounded bg-red-50 p-2 text-xs">{JSON.stringify(
											errorDetails,
											null,
											2
										)}</pre>
								</details>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Event Log -->
				<div class="rounded-lg bg-base-300 p-4">
					<div class="mb-3 flex items-center justify-between">
						<h3 class="text-lg font-medium">Event Log</h3>
						<button
							onclick={clearEvents}
							class="rounded bg-gray-600 px-3 py-1 text-sm transition-colors hover:bg-gray-500"
						>
							🗑️ Clear
						</button>
					</div>
					<div class="max-h-64 space-y-2 overflow-y-auto">
						{#each realtimeEvents as event}
							<div class="rounded bg-gray-700 p-2 text-sm">
								<div class="flex items-start justify-between">
									<span class="font-medium {getEventTypeColor(event.type)}">
										{event.type.toUpperCase()}
									</span>
									<span class="text-xs text-gray-400">
										{formatTimestamp(event.timestamp)}
									</span>
								</div>
								{#if event.type === 'error'}
									<div class="mt-1 text-red-300">
										<strong>Error:</strong>
										{event.payload.message}
									</div>
								{:else if event.type === 'transcript'}
									<div class="mt-1 text-blue-300">
										<strong>Transcript:</strong>
										{event.payload.text}
									</div>
								{:else if event.type === 'response'}
									<div class="mt-1 text-green-300">
										<strong>Response:</strong>
										{event.payload.text}
									</div>
								{:else if event.type === 'audio_response'}
									<div class="mt-1 text-purple-300">
										<strong>Audio:</strong>
										{event.payload.size} bytes
									</div>
								{:else if event.type === 'connection_change'}
									<div class="mt-1 text-yellow-300">
										<strong>Status:</strong>
										{event.payload.status}
									</div>
								{:else}
									<pre class="mt-1 text-xs text-gray-300">{JSON.stringify(
											event.payload,
											null,
											2
										)}</pre>
								{/if}
							</div>
						{/each}
						{#if realtimeEvents.length === 0}
							<p class="py-4 text-center text-gray-400">No events yet</p>
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
				<div class="rounded-lg bg-base-300 p-4">
					<h3 class="mb-3 text-lg font-medium">Conversation Controls</h3>
					<div class="flex space-x-4">
						<button
							onclick={testConversationStart}
							disabled={conversationState?.status !== 'idle'}
							class="rounded-lg px-6 py-3 font-medium transition-colors {conversationState?.status ===
							'idle'
								? 'bg-blue-600 hover:bg-blue-700'
								: 'cursor-not-allowed bg-gray-600'}"
						>
							🚀 Start Conversation
						</button>
					</div>
				</div>

				<!-- Error Display -->
				{#if lastError}
					<div class="rounded-lg border border-red-400 bg-red-100 p-4 text-red-700">
						<h3 class="mb-3 text-lg font-medium">🚨 Last Error</h3>
						<div class="space-y-2">
							<p class="font-medium">{lastError}</p>
							{#if errorDetails}
								<details class="text-sm">
									<summary class="cursor-pointer hover:text-red-800">Show Error Details</summary>
									<pre class="mt-2 overflow-x-auto rounded bg-red-50 p-2 text-xs">{JSON.stringify(
											errorDetails,
											null,
											2
										)}</pre>
								</details>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Conversation State -->
				{#if conversationState}
					<div class="rounded-lg bg-base-300 p-4">
						<h3 class="mb-3 text-lg font-medium">Conversation State</h3>
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<p>
									<strong>Status:</strong> <span class="font-mono">{conversationState.status}</span>
								</p>
								<p>
									<strong>Session ID:</strong>
									<span class="font-mono text-xs">{conversationState.sessionId}</span>
								</p>
								<p><strong>Language:</strong> {conversationState.language}</p>
								<p><strong>Voice:</strong> {conversationState.voice}</p>
							</div>
							<div>
								<p>
									<strong>Start Time:</strong>
									{conversationState.startTime
										? new Date(conversationState.startTime).toLocaleString()
										: 'N/A'}
								</p>
								<p>
									<strong>Duration:</strong>
									{conversationState.startTime
										? Math.floor((Date.now() - conversationState.startTime) / 1000)
										: 0}s
								</p>
								<p><strong>Messages:</strong> {conversationState.messages.length}</p>
								{#if conversationState.error}
									<p>
										<strong>Error:</strong>
										<span class="text-red-400">{conversationState.error}</span>
									</p>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- Messages -->
				{#if conversationMessages.length > 0}
					<div class="rounded-lg bg-base-300 p-4">
						<h3 class="mb-3 text-lg font-medium">Messages ({conversationMessages.length})</h3>
						<div class="max-h-64 space-y-2 overflow-y-auto">
							{#each conversationMessages as message}
								<div class="rounded bg-gray-700 p-3">
									<div class="mb-1 flex items-start justify-between">
										<span
											class="font-medium {message.role === 'user'
												? 'text-blue-400'
												: 'text-green-400'}"
										>
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
				<div class="rounded-lg bg-base-300 p-4">
					<h3 class="mb-3 text-lg font-medium">
						🎤 Audio Tests ({testResults.audio.passed + testResults.audio.failed})
					</h3>
					<div class="space-y-2">
						{#each testResults.audio.tests as test}
							<div
								class="flex items-center justify-between p-2 {test.passed
									? 'bg-green-900'
									: 'bg-red-900'} rounded"
							>
								<span>{test.name}</span>
								<span class={test.passed ? 'text-green-400' : 'text-red-400'}>
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
				<div class="rounded-lg bg-base-300 p-4">
					<h3 class="mb-3 text-lg font-medium">
						🤖 AI Tests ({testResults.ai.passed + testResults.ai.failed})
					</h3>
					<div class="space-y-2">
						{#each testResults.ai.tests as test}
							<div
								class="flex items-center justify-between p-2 {test.passed
									? 'bg-green-900'
									: 'bg-red-900'} rounded"
							>
								<span>{test.name}</span>
								<span class={test.passed ? 'text-green-400' : 'text-red-400'}>
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
				<div class="rounded-lg bg-base-300 p-4">
					<h3 class="mb-3 text-lg font-medium">
						💬 Conversation Tests ({testResults.conversation.passed +
							testResults.conversation.failed})
					</h3>
					<div class="space-y-2">
						{#each testResults.conversation.tests as test}
							<div
								class="flex items-center justify-between p-2 {test.passed
									? 'bg-green-900'
									: 'bg-red-900'} rounded"
							>
								<span>{test.name}</span>
								<span class={test.passed ? 'text-green-400' : 'text-red-400'}>
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
				<div class="rounded-lg bg-base-300 p-4">
					<h3 class="mb-3 text-lg font-medium">
						🔗 Integration Tests ({testResults.integration.passed + testResults.integration.failed})
					</h3>
					<div class="space-y-2">
						{#each testResults.integration.tests as test}
							<div
								class="flex items-center justify-between p-2 {test.passed
									? 'bg-green-900'
									: 'bg-red-900'} rounded"
							>
								<span>{test.name}</span>
								<span class={test.passed ? 'text-green-400' : 'text-red-400'}>
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

		<!-- Error Monitoring Tab -->
		{#if activeTab === 'errors'}
			<div class="space-y-6">
				<h2 class="text-2xl font-semibold text-base-content">🚨 Error Monitoring</h2>

				<!-- Error Filter -->
				<div class="card bg-base-200 shadow-sm">
					<div class="card-body">
						<h3 class="mb-3 text-lg font-medium">Filter Errors</h3>
						<div class="flex space-x-2">
							<button
								onclick={() => (errorFilter = 'all')}
								class="btn btn-sm {errorFilter === 'all' ? 'btn-primary' : 'btn-ghost'}"
							>
								All
							</button>
							<button
								onclick={() => (errorFilter = 'unresolved')}
								class="btn btn-sm {errorFilter === 'unresolved' ? 'btn-primary' : 'btn-ghost'}"
							>
								Unresolved
							</button>
							<button
								onclick={() => (errorFilter = 'critical')}
								class="btn btn-sm {errorFilter === 'critical' ? 'btn-error' : 'btn-ghost'}"
							>
								Critical
							</button>
						</div>
					</div>
				</div>

				<!-- Error Summary -->
				<div class="card bg-base-200 shadow-sm">
					<div class="card-body">
						<h3 class="mb-3 text-lg font-medium">Error Summary</h3>
						{#if true}
							{@const summary = errorMonitor.getErrorSummary()}
							<div class="stats stats-horizontal shadow">
								<div class="stat">
									<div class="stat-title">Total</div>
									<div class="stat-value text-primary">{summary.total}</div>
								</div>
								<div class="stat">
									<div class="stat-title">Unresolved</div>
									<div class="stat-value text-warning">{summary.unresolved}</div>
								</div>
								<div class="stat">
									<div class="stat-title">Critical</div>
									<div class="stat-value text-error">{summary.critical}</div>
								</div>
								<div class="stat">
									<div class="stat-title">Resolved</div>
									<div class="stat-value text-success">{summary.total - summary.unresolved}</div>
								</div>
							</div>

							<!-- Feature breakdown -->
							<div class="mt-4">
								<h4 class="mb-2 text-sm font-medium text-base-content/70">By Feature</h4>
								<div class="flex flex-wrap gap-2">
									{#each Object.entries(summary.byFeature) as [feature, count]}
										<span class="badge badge-outline badge-sm">
											{feature}: {count}
										</span>
									{/each}
								</div>
							</div>

							<!-- Actions -->
							<div class="mt-4 flex space-x-2">
								<button onclick={clearResolvedErrors} class="btn btn-ghost btn-sm">
									Clear Resolved
								</button>
								<button onclick={() => (errorLog = [])} class="btn btn-sm btn-error">
									Clear All
								</button>
							</div>
						{/if}
					</div>
				</div>

				<!-- Error List -->
				<div class="card bg-base-200 shadow-sm">
					<div class="card-body">
						<h3 class="mb-3 text-lg font-medium">Error Log ({getFilteredErrors().length})</h3>
						<div class="max-h-96 space-y-2 overflow-y-auto">
							{#each getFilteredErrors() as error}
								<div
									class="card border-l-4 bg-base-100 border-l-{error.severity === 'critical'
										? 'error'
										: error.severity === 'high'
											? 'warning'
											: error.severity === 'medium'
												? 'warning'
												: 'info'} shadow-sm"
								>
									<div class="card-body p-4">
										<div class="mb-2 flex items-start justify-between">
											<div class="flex items-center space-x-2">
												<span
													class="badge badge-sm {error.severity === 'critical'
														? 'badge-error'
														: error.severity === 'high'
															? 'badge-warning'
															: error.severity === 'medium'
																? 'badge-warning'
																: 'badge-info'}"
												>
													{error.severity.toUpperCase()}
												</span>
												<span class="badge badge-outline badge-sm">
													{error.feature}
												</span>
											</div>
											<div class="flex items-center space-x-2">
												<span class="text-xs text-base-content/60">
													{formatTimestamp(error.timestamp)}
												</span>
												<button
													onclick={() => resolveError(error.id)}
													class="btn btn-xs btn-success"
													title="Mark as resolved"
												>
													✓
												</button>
											</div>
										</div>

										<h4 class="mb-1 font-medium text-base-content">{error.userMessage}</h4>
										<p class="mb-2 text-sm text-base-content/70">
											{error.technicalDetails.message}
										</p>

										<!-- Context info -->
										{#if error.context}
											<div class="mb-2 rounded bg-base-200 p-2 text-xs text-base-content/60">
												<span class="font-medium">URL:</span>
												{error.context.url}<br />
												<span class="font-medium">User:</span>
												{error.context.userId || 'Anonymous'}
											</div>
										{/if}

										<!-- Technical details -->
										<details class="text-xs text-base-content/60">
											<summary class="cursor-pointer font-medium hover:text-base-content">
												🔧 Technical Details
											</summary>
											<div class="mt-2 space-y-1">
												<pre
													class="overflow-x-auto rounded bg-base-300 p-2 text-xs">{JSON.stringify(
														error.technicalDetails,
														null,
														2
													)}</pre>

												{#if error.context}
													<div class="mt-2 rounded bg-base-300 p-2">
														<strong>Context:</strong><br />
														<strong>User Agent:</strong>
														{error.context.userAgent}<br />
														<strong>Timestamp:</strong>
														{new Date(error.timestamp).toISOString()}
													</div>
												{/if}
											</div>
										</details>
									</div>
								</div>
							{/each}
							{#if getFilteredErrors().length === 0}
								<p class="py-4 text-center text-base-content/60">
									✨ No errors to display. Everything is working smoothly!
								</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
