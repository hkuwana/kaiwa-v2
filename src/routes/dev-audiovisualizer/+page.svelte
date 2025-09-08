<!-- Enhanced AudioVisualizer Demo -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import { audioService } from '$lib/services/audio.service';
	import { userPreferencesStore } from '$lib/stores/userPreferences.store.svelte';
	import { realtimeService } from '$lib/services';
	import { DEFAULT_VOICE, type Voice } from '$lib/types/openai.realtime.types';

	// Demo state
	let isRecording = $state(false);
	let isListening = $state(false);
	let audioLevel = $state(0);
	let recordingDuration = $state(0);
	let recordedAudio: Blob | null = $state(null);
	let audioUrl: string | null = $state(null);
	let isPlaying = $state(false);
	let aiResponse = $state<string | null>(null);
	let error = $state<string | null>(null);
	let recordingInterval: number | null = null;

	// Audio service state
	let isAudioServiceInitialized = $state(false);
	let availableDevices = $state<MediaDeviceInfo[]>([]);
	let selectedDeviceId = $state<string>('default');

	// Realtime state
	let isConnected = $state(false);
	let connection: realtimeService.RealtimeConnection | null = null;
	let localStream: MediaStream | null = null;
	const lastVoice: Voice | null = null;

	// Preferences (mode and press behavior)
	let audioMode: 'toggle' | 'push_to_talk' = $state(userPreferencesStore.getAudioMode());
	let pressBehavior: 'tap_toggle' | 'press_hold' = $state(userPreferencesStore.getPressBehavior());

	function refreshPrefs() {
		audioMode = userPreferencesStore.getAudioMode();
		pressBehavior = userPreferencesStore.getPressBehavior();
	}

	onMount(() => {
		console.log('🎵 Enhanced AudioVisualizer Demo Loaded');
		initializeAudioService();
		userPreferencesStore
			.initialize()
			.then(refreshPrefs)
			.catch(() => {});
	});

	// Initialize audio service
	async function initializeAudioService() {
		try {
			await audioService.initialize();
			isAudioServiceInitialized = true;

			// Set up audio service callbacks
			audioService.onLevelUpdate((level) => {
				audioLevel = level.level;
			});

			audioService.onStreamReady((stream) => {
				console.log('✅ Audio stream ready:', stream.id);
			});

			audioService.onStreamError((errorMsg) => {
				console.error('❌ Audio stream error:', errorMsg);
				error = errorMsg;
			});

			// Load available devices
			availableDevices = await audioService.getAvailableDevices();
			console.log('🎵 Available audio devices:', availableDevices.length);
		} catch (err) {
			console.error('❌ Failed to initialize audio service:', err);
			error = err instanceof Error ? err.message : 'Failed to initialize audio service';
		}
	}

	// === Realtime wiring ===
	async function connectRealtime() {
		try {
			error = null;
			// ensure stream
			localStream = await audioService.getStream(selectedDeviceId);

			// fetch session
			const sessionId = crypto.randomUUID();
			const res = await fetch('/api/realtime-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId, model: 'gpt-realtime', voice: lastVoice || undefined })
			});
			if (!res.ok) {
				throw new Error(`Failed to create realtime session: ${res.status}`);
			}
			const sessionData = await res.json();

			// create connection
			connection = await realtimeService.createConnection(sessionData, localStream);
			if (!connection) throw new Error('Realtime connection creation failed');

			// basic handlers
			connection.dataChannel.onopen = () => {
				console.log('🟢 Data channel open');
				// Send typed session.update once channel is ready
				const sessionUpdateEvent = realtimeService.createSessionUpdate({
					model: 'gpt-realtime',
					voice: lastVoice || DEFAULT_VOICE
				});
				realtimeService.sendEvent(connection!, sessionUpdateEvent);
				isConnected = true;
			};

			connection.dataChannel.onmessage = (evt) => {
				try {
					const serverEvent = JSON.parse(evt.data);
					const processed = realtimeService.processServerEvent(serverEvent);
					if (serverEvent.type === 'session.created' || serverEvent.type === 'session.updated') {
						isConnected = true;
					}
					if (processed.type === 'transcription') {
						// simple debug log
						console.log(
							`📝 ${processed.data.type} ${processed.data.isFinal ? 'final' : 'delta'}:`,
							processed.data.text
						);
						if (processed.data.type === 'assistant_transcript' && processed.data.isFinal) {
							// optional: set aiResponse from transcript text
							aiResponse = processed.data.text;
							isListening = false;
						}
					} else if (processed.type === 'message') {
						console.log('🤖 Assistant message:', processed.data.content);
						aiResponse = processed.data.content;
						isListening = false;
					}
				} catch (e) {
					console.warn('Failed to parse server event', e);
				}
			};

			// initial track state based on mode
			if (audioMode === 'push_to_talk' && localStream) {
				realtimeService.pauseAudioInput(localStream);
			} else if (localStream) {
				realtimeService.resumeAudioInput(localStream);
			}
		} catch (e) {
			console.error(e);
			error = e instanceof Error ? e.message : 'Failed to connect to realtime';
			isConnected = false;
		}
	}

	function disconnectRealtime() {
		try {
			if (connection) {
				realtimeService.closeConnection(connection);
				connection = null;
			}
			isConnected = false;
		} catch (e) {
			console.warn('Disconnect failed', e);
		}
	}

	// Push-to-talk controls using buffer clear/commit and track gating
	function pttStart() {
		if (!isConnected || !connection || !localStream) return;
		try {
			realtimeService.sendEvent(connection, realtimeService.createInputAudioBufferClear());
			realtimeService.resumeAudioInput(localStream);
		} catch (e) {
			console.warn('pttStart failed', e);
		}
	}

	function pttStop() {
		if (!isConnected || !connection || !localStream) return;
		try {
			realtimeService.pauseAudioInput(localStream);
			realtimeService.sendEvent(connection, realtimeService.createInputAudioBufferCommit());
		} catch (e) {
			console.warn('pttStop failed', e);
		}
	}

	function sendAIResponse() {
		if (!isConnected || !connection) return;
		realtimeService.sendEvent(connection, realtimeService.createResponse());
		isListening = true;
	}

	// Recording handlers
	function handleRecordStart() {
		console.log('🎤 Starting recording...');
		error = null;
		aiResponse = null;
		isRecording = true;
		recordingDuration = 0;

		// Start recording timer
		recordingInterval = window.setInterval(() => {
			recordingDuration += 0.1;
		}, 100);
		// If connected and in push_to_talk mode, start gating
		if (isConnected && audioMode === 'push_to_talk') {
			pttStart();
		}
	}

	function handleRecordStop() {
		console.log('⏹️ Stopping recording...');
		isRecording = false;

		// Stop recording timer
		if (recordingInterval) {
			clearInterval(recordingInterval);
			recordingInterval = null;
		}

		// If connected and in push_to_talk mode, stop gating and immediately send via Realtime
		if (isConnected && audioMode === 'push_to_talk') {
			pttStop();
		}
	}

	function handleRecordComplete(audioData: Blob) {
		console.log('✅ Recording completed, audio data:', audioData.size, 'bytes');
		recordedAudio = audioData;

		// Create audio URL for playback
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
		}
		audioUrl = URL.createObjectURL(audioData);

		// Only simulate when not connected to realtime
		if (!isConnected) {
			setTimeout(() => {
				isListening = true;
				setTimeout(() => {
					isListening = false;
					aiResponse = 'I heard your recording! (offline simulation)';
				}, 2000);
			}, 1000);
		}
	}

	// Audio playback
	function playRecordedAudio() {
		if (!audioUrl) return;

		const audio = new Audio(audioUrl);
		isPlaying = true;

		audio.onended = () => {
			isPlaying = false;
		};

		audio.onerror = () => {
			console.error('Failed to play audio');
			isPlaying = false;
		};

		audio.play().catch((error) => {
			console.error('Audio playback failed:', error);
			isPlaying = false;
		});
	}

	function stopAudioPlayback() {
		isPlaying = false;
	}

	// Clear error
	function clearError() {
		error = null;
	}

	// Test audio device
	async function testAudioDevice(deviceId: string) {
		try {
			selectedDeviceId = deviceId;
			error = null;

			// Get stream to test device
			const stream = await audioService.getStream(deviceId);
			console.log('✅ Device test successful:', deviceId);

			// Clean up test stream
			stream.getTracks().forEach((track) => track.stop());
		} catch (err) {
			console.error('❌ Device test failed:', err);
			error = `Failed to test device: ${err instanceof Error ? err.message : 'Unknown error'}`;
		}
	}

	// Cleanup
	onDestroy(() => {
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
		}
		if (recordingInterval) {
			clearInterval(recordingInterval);
		}
		audioService.cleanup();
		if (connection) {
			realtimeService.closeConnection(connection);
			connection = null;
			isConnected = false;
		}
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-8">
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-5xl font-bold text-primary">🎵 Enhanced AudioVisualizer Demo</h1>
			<p class="text-xl text-base-content/70">
				Press and hold to record, release to stop. Features smooth animations and OpenAI realtime
				integration.
			</p>
		</div>

		<!-- Error Display -->
		{#if error}
			<div class="mb-6 alert alert-error">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{error}</span>
				<button onclick={clearError} class="btn btn-ghost btn-sm">✕</button>
			</div>
		{/if}

		<!-- Audio Device Selection -->
		{#if availableDevices.length > 0}
			<div class="mb-8 rounded-2xl bg-base-100 p-8 shadow-xl">
				<h3 class="mb-6 text-center text-2xl font-bold">🎤 Audio Device Selection</h3>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each availableDevices as device}
						<div class="card bg-base-200 shadow-md">
							<div class="card-body p-4">
								<h4 class="card-title text-sm">
									{device.label || `Device ${device.deviceId.slice(0, 8)}...`}
								</h4>
								<button
									onclick={() => testAudioDevice(device.deviceId)}
									class="btn btn-sm {selectedDeviceId === device.deviceId
										? 'btn-primary'
										: 'btn-outline'}"
								>
									{selectedDeviceId === device.deviceId ? '✓ Selected' : 'Select'}
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Realtime Controls -->
		<div class="mb-8 rounded-2xl bg-base-100 p-6 shadow-xl">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="flex items-center gap-3">
					<button
						class="btn btn-primary"
						onclick={isConnected ? disconnectRealtime : connectRealtime}
					>
						{isConnected ? 'Disconnect Realtime' : 'Connect Realtime'}
					</button>
					{#if isConnected}
						<span class="badge badge-success">Connected</span>
					{:else}
						<span class="badge">Disconnected</span>
					{/if}
				</div>
				<div class="flex flex-wrap items-center gap-3 text-sm">
					<div>
						Mode: <span class="font-semibold">{audioMode}</span>
						<button
							class="btn ml-2 btn-xs"
							onclick={() =>
								userPreferencesStore
									.setAudioMode(audioMode === 'toggle' ? 'push_to_talk' : 'toggle')
									.then(refreshPrefs)}>Toggle</button
						>
					</div>
					<div>
						Press: <span class="font-semibold">{pressBehavior}</span>
						<button
							class="btn ml-2 btn-xs"
							onclick={() =>
								userPreferencesStore
									.setPressBehavior(pressBehavior === 'press_hold' ? 'tap_toggle' : 'press_hold')
									.then(refreshPrefs)}>Toggle</button
						>
					</div>
				</div>
			</div>
			{#if isConnected && audioMode === 'push_to_talk'}
				<div class="mt-4 text-sm opacity-70">
					{#if pressBehavior === 'tap_toggle'}
						Tap to start, tap again to stop. AI will respond automatically.
					{:else}
						Press and hold to talk; release to let AI respond.
					{/if}
				</div>
			{/if}
		</div>

		<!-- Main Demo Section -->
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
			<!-- AudioVisualizer Demo -->
			<div class="rounded-2xl bg-base-100 p-8 shadow-xl">
				<h3 class="mb-6 text-center text-2xl font-bold">🎤 Press-to-Record Visualizer</h3>

				<div class="mb-6 flex justify-center">
					<AudioVisualizer
						{audioLevel}
						{isRecording}
						{isListening}
						controlMode="external"
						{pressBehavior}
						deviceId={selectedDeviceId}
						onRecordStart={handleRecordStart}
						onRecordStop={handleRecordStop}
						onRecordComplete={handleRecordComplete}
					/>
				</div>

				<!-- Status Display -->
				<div class="space-y-2 text-center">
					<div class="text-sm">
						<span class="font-semibold">Status:</span>
						{#if isRecording}
							<span class="text-error">Recording... ({recordingDuration.toFixed(1)}s)</span>
						{:else if isListening}
							<span class="text-warning">AI Processing...</span>
						{:else}
							<span class="text-base-content/70">Ready to record</span>
						{/if}
					</div>

					<div class="text-sm">
						<span class="font-semibold">Audio Level:</span>
						<span class="text-primary">{(audioLevel * 100).toFixed(1)}%</span>
					</div>

					<div class="text-sm">
						<span class="font-semibold">Device:</span>
						<span class="text-base-content/70">
							{availableDevices.find((d) => d.deviceId === selectedDeviceId)?.label || 'Default'}
						</span>
					</div>
				</div>

				<!-- Instructions -->
				<div class="mt-6 rounded-lg bg-base-200 p-4">
					<h4 class="mb-2 font-semibold">How to use:</h4>
					<ul class="space-y-1 text-sm text-base-content/70">
						<li>• Press and hold the visualizer to start recording</li>
						<li>• Release to stop recording and process with AI</li>
						<li>• Watch the smooth up/down movement during recording</li>
						<li>• Notice the static display when not recording</li>
					</ul>
				</div>
			</div>

			<!-- Recording Results -->
			<div class="rounded-2xl bg-base-100 p-8 shadow-xl">
				<h3 class="mb-6 text-center text-2xl font-bold">📹 Recording Results</h3>

				{#if recordedAudio}
					<div class="space-y-4">
						<!-- Audio Info -->
						<div class="rounded-lg bg-base-200 p-4">
							<h4 class="mb-2 font-semibold">Recording Details:</h4>
							<div class="space-y-1 text-sm">
								<div>
									<span class="font-medium">Size:</span>
									{(recordedAudio.size / 1024).toFixed(1)} KB
								</div>
								<div>
									<span class="font-medium">Duration:</span>
									{recordingDuration.toFixed(1)} seconds
								</div>
								<div><span class="font-medium">Format:</span> WebM (Opus)</div>
							</div>
						</div>

						<!-- Playback Controls -->
						<div class="space-y-2">
							<h4 class="font-semibold">Playback:</h4>
							{#if isPlaying}
								<button onclick={stopAudioPlayback} class="btn w-full btn-sm btn-error">
									⏹️ Stop Playback
								</button>
							{:else}
								<button onclick={playRecordedAudio} class="btn w-full btn-sm btn-primary">
									▶️ Play Recording
								</button>
							{/if}
						</div>

						<!-- AI Response -->
						{#if aiResponse}
							<div class="rounded-lg border border-success/20 bg-success/10 p-4">
								<h4 class="mb-2 font-semibold text-success">AI Response:</h4>
								<p class="text-sm text-base-content/70">{aiResponse}</p>
							</div>
						{/if}

						<!-- OpenAI Integration Info -->
						<div class="rounded-lg border border-info/20 bg-info/10 p-4">
							<h4 class="mb-2 font-semibold text-info">OpenAI Realtime Integration</h4>
							<p class="text-sm text-base-content/70">
								When recording stops, the audio data is automatically sent to OpenAI for:
							</p>
							<ul class="mt-2 space-y-1 text-sm text-base-content/70">
								<li>• Speech-to-text transcription</li>
								<li>• AI response generation</li>
								<li>• Text-to-speech audio output</li>
							</ul>
						</div>
					</div>
				{:else}
					<div class="py-12 text-center text-base-content/50">
						<div class="mb-4 text-4xl">🎤</div>
						<p>No recording yet</p>
						<p class="text-sm">Press and hold the visualizer to start recording</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Service Status -->
		<div class="mt-8 rounded-2xl bg-base-100 p-8 shadow-xl">
			<h3 class="mb-6 text-center text-2xl font-bold">🔧 Service Status</h3>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Audio Service Status -->
				<div class="p-4 text-center">
					<div class="mb-3 text-3xl">
						{isAudioServiceInitialized ? '✅' : '⏳'}
					</div>
					<h4 class="mb-2 font-semibold">Audio Service</h4>
					<p class="text-sm text-base-content/70">
						{isAudioServiceInitialized ? 'Initialized' : 'Initializing...'}
					</p>
				</div>

				<!-- Recording Status -->
				<div class="p-4 text-center">
					<div class="mb-3 text-3xl">
						{#if isRecording}
							🔴
						{:else if isListening}
							🟡
						{:else}
							🟢
						{/if}
					</div>
					<h4 class="mb-2 font-semibold">Recording State</h4>
					<p class="text-sm text-base-content/70">
						{isRecording ? 'Recording' : isListening ? 'Processing' : 'Idle'}
					</p>
				</div>

				<!-- Audio Level -->
				<div class="p-4 text-center">
					<div class="mb-3 text-3xl">📊</div>
					<h4 class="mb-2 font-semibold">Audio Level</h4>
					<p class="text-sm text-base-content/70">
						{(audioLevel * 100).toFixed(1)}%
					</p>
				</div>
			</div>
		</div>

		<!-- Features Showcase -->
		<div class="mt-8 rounded-2xl bg-base-100 p-8 shadow-xl">
			<h3 class="mb-6 text-center text-2xl font-bold">✨ Key Features</h3>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
				<!-- Smooth Movement -->
				<div class="p-4 text-center">
					<div class="mb-3 text-3xl">🔄</div>
					<h4 class="mb-2 font-semibold">Smooth Movement</h4>
					<p class="text-sm text-base-content/70">
						During recording, the visualizer moves smoothly up and down using sine wave animation
					</p>
				</div>

				<!-- Static Display -->
				<div class="p-4 text-center">
					<div class="mb-3 text-3xl">⏸️</div>
					<h4 class="mb-2 font-semibold">Static When Idle</h4>
					<p class="text-sm text-base-content/70">
						When not recording, the visualizer stays perfectly still for a clean appearance
					</p>
				</div>

				<!-- Press to Record -->
				<div class="p-4 text-center">
					<div class="mb-3 text-3xl">👆</div>
					<h4 class="mb-2 font-semibold">Press to Record</h4>
					<p class="text-sm text-base-content/70">
						Intuitive press-and-hold interaction with visual feedback and accessibility support
					</p>
				</div>

				<!-- Keyboard Controls -->
				<div class="p-4 text-center">
					<div class="mb-3 text-3xl">⌨️</div>
					<h4 class="mb-2 font-semibold">Keyboard Controls</h4>
					<p class="text-sm text-base-content/70">
						Use <kbd class="rounded bg-base-200 px-1 py-0.5 text-xs">Spacebar</kbd> or
						<kbd class="rounded bg-base-200 px-1 py-0.5 text-xs">Enter</kbd> for hands-free recording
					</p>
				</div>
			</div>
		</div>

		<!-- Technical Details -->
		<div class="mt-8 rounded-2xl bg-base-100 p-8 shadow-xl">
			<h3 class="mb-6 text-center text-2xl font-bold">🔧 Technical Implementation</h3>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<!-- Animation System -->
				<div>
					<h4 class="mb-3 font-semibold">Animation System</h4>
					<ul class="space-y-2 text-sm text-base-content/70">
						<li>
							• Uses <code class="rounded bg-base-200 px-1">requestAnimationFrame</code> for smooth 60fps
							animation
						</li>
						<li>• Sine wave movement with 2-second period for natural feel</li>
						<li>• Automatic cleanup to prevent memory leaks</li>
						<li>• CSS transforms for hardware acceleration</li>
					</ul>
				</div>

				<!-- Audio Service Integration -->
				<div>
					<h4 class="mb-3 font-semibold">Audio Service Integration</h4>
					<ul class="space-y-2 text-sm text-base-content/70">
						<li>• Uses existing <code class="rounded bg-base-200 px-1">audio.service.ts</code></li>
						<li>• Real-time audio level monitoring at 20fps</li>
						<li>• Device selection and management</li>
						<li>• Seamless integration with existing codebase</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
