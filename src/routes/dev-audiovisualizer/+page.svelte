<!-- Enhanced AudioVisualizer Demo -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import { audioService } from '$lib/services/audio.service';

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

	onMount(() => {
		console.log('🎵 Enhanced AudioVisualizer Demo Loaded');
		initializeAudioService();
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
	}

	function handleRecordStop() {
		console.log('⏹️ Stopping recording...');
		isRecording = false;

		// Stop recording timer
		if (recordingInterval) {
			clearInterval(recordingInterval);
			recordingInterval = null;
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

		// Simulate AI processing
		setTimeout(() => {
			isListening = true;
			setTimeout(() => {
				isListening = false;
				// Simulate AI response
				aiResponse =
					'I heard your recording! This is where the AI would respond via OpenAI realtime.';
			}, 2000);
		}, 1000);
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

			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
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
