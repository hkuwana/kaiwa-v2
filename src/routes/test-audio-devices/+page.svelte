<!-- Test Audio Devices -->
<script lang="ts">
	import { audioService } from '$lib/services/audio.service';

	// Use the exported instance that automatically handles browser/server
	// No need to manually instantiate or check browser environment

	let devices = $state<MediaDeviceInfo[]>([]);
	let selectedDevice = $state<string>('default');
	let stream = $state<MediaStream | null>(null);
	let isRecording = $state(false);
	let error = $state<string | null>(null);
	let audioLevel = $state(0);
	let events = $state<Array<{type: string; data: any; timestamp: string}>>([]);
	let eventCount = $state(0);
	let isTesting = $state(false);

	// Initialize audio service
	$effect(() => {
		audioService.initialize();
	});

	// Set up audio service callbacks
	$effect(() => {
		audioService.onLevelUpdate((level) => {
			audioLevel = level.level;
			events = [
				...events,
				{
					type: 'audio.level.update',
					data: { level: level.level.toFixed(3) },
					timestamp: new Date().toLocaleTimeString()
				}
			];
			eventCount++;
		});

		audioService.onStreamReady((stream) => {
			events = [
				...events,
				{
					type: 'audio.stream.ready',
					data: { streamId: stream.id },
					timestamp: new Date().toLocaleTimeString()
				}
			];
			eventCount++;
		});

		audioService.onStreamError((errorMsg) => {
			events = [
				...events,
				{
					type: 'audio.stream.error',
					data: { error: errorMsg },
					timestamp: new Date().toLocaleTimeString()
				}
			];
			eventCount++;
		});
	});

	async function loadDevices() {
		devices = await audioService.getAvailableDevices();
	}

	async function testDevice(deviceId: string) {
		try {
			stream = await audioService.getStream(deviceId);
			isTesting = true;
		} catch (error) {
			console.error('Failed to test device:', error);
			alert(`Failed to test device: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	function stopTest() {
		if (stream) {
			audioService.cleanup();
			stream = null;
			isTesting = false;
			audioLevel = 0;
		}
	}

	function clearEvents() {
		events = [];
		eventCount = 0;
	}

	// Load devices on mount
	$effect(() => {
		loadDevices();
	});
</script>

<div class="container mx-auto p-6 max-w-4xl">
	<h1 class="text-3xl font-bold mb-6">🎵 Audio Device Testing</h1>

	<!-- Device Selection -->
	<div class="devices-section mb-8">
		<h2 class="text-xl font-semibold mb-4">Available Devices</h2>
		<button onclick={loadDevices} class="btn btn-outline mb-4">
			🔄 Refresh Devices
		</button>

		<div class="device-list grid gap-4">
			{#each devices as device}
				<div class="device-card card bg-base-100 shadow-md">
					<div class="card-body">
						<h3 class="card-title text-lg">
							<span class="device-label">
								{device.label || `Device ${device.deviceId.slice(0, 8)}...`}
							</span>
						</h3>
						<button 
							onclick={() => testDevice(device.deviceId)} 
							disabled={isTesting}
							class="btn btn-primary"
						>
							{isTesting && stream ? 'Testing...' : 'Test Device'}
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Audio Level Display -->
	{#if stream}
		<div class="audio-section mb-8">
			<h2 class="text-xl font-semibold mb-4">🎤 Audio Level</h2>
			<div class="audio-level-display">
				<div class="level-bar bg-base-300 rounded-full h-8 overflow-hidden">
					<div 
						class="level-fill bg-primary transition-all duration-100 h-full"
						style="width: {audioLevel * 100}%"
					></div>
				</div>
				<div class="level-text text-center mt-2">
					Level: {(audioLevel * 100).toFixed(1)}%
				</div>
			</div>

			<div class="mt-4">
				<button onclick={stopTest} class="btn btn-error">⏹️ Stop Test</button>
			</div>
		</div>
	{/if}

	<!-- Events Log -->
	<div class="events-section">
		<h2 class="text-xl font-semibold mb-4">📡 Real-time Events ({eventCount})</h2>
		<button onclick={clearEvents} class="btn btn-outline mb-4">🗑️ Clear Events</button>

		<div class="events-list max-h-96 overflow-y-auto">
			{#each events as event, index}
				<div class="event-item bg-base-200 p-3 rounded mb-2">
					<div class="event-header flex justify-between items-center mb-2">
						<span class="event-type font-mono text-sm bg-primary text-primary-content px-2 py-1 rounded">
							{event.type}
						</span>
						<span class="event-time text-sm opacity-70">{event.timestamp}</span>
					</div>
					<div class="event-data">
						<pre class="text-xs overflow-x-auto">{JSON.stringify(event.data, null, 2)}</pre>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.device-card {
		transition: all 0.2s ease;
	}

	.device-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}

	.level-bar {
		position: relative;
		background: linear-gradient(90deg, #e5e7eb 0%, #d1d5db 100%);
	}

	.level-fill {
		background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
		transition: width 0.1s ease;
	}

	.events-list {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.event-item {
		border-left: 4px solid #3b82f6;
	}

	.event-type {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.event-data pre {
		background: #f3f4f6;
		padding: 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid #e5e7eb;
	}
</style>
