<!-- Test Audio Devices -->
<script lang="ts">
	import { audioService } from '$lib/services/audio.service';
	import { SvelteDate } from 'svelte/reactivity';

	// Use the exported instance that automatically handles browser/server
	// No need to manually instantiate or check browser environment

	let devices = $state<MediaDeviceInfo[]>([]);
	let stream = $state<MediaStream | null>(null);
	let audioLevel = $state(0);
	let events = $state<Array<{ type: string; data: Record<string, unknown>; timestamp: string }>>(
		[]
	);
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
					timestamp: new SvelteDate().toLocaleTimeString()
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
					timestamp: new SvelteDate().toLocaleTimeString()
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
					timestamp: new SvelteDate().toLocaleTimeString()
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

<div class="container mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-3xl font-bold">🎵 Audio Device Testing</h1>

	<!-- Device Selection -->
	<div class="devices-section mb-8">
		<h2 class="mb-4 text-xl font-semibold">Available Devices</h2>
		<button onclick={loadDevices} class="btn mb-4 btn-outline"> 🔄 Refresh Devices </button>

		<div class="device-list grid gap-4">
			{#each devices as device (device.groupId)}
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
			<h2 class="mb-4 text-xl font-semibold">🎤 Audio Level</h2>
			<div class="audio-level-display">
				<div class="level-bar h-8 overflow-hidden rounded-full bg-base-300">
					<div
						class="level-fill h-full bg-primary transition-all duration-100"
						style="width: {audioLevel * 100}%"
					></div>
				</div>
				<div class="level-text mt-2 text-center">
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
		<h2 class="mb-4 text-xl font-semibold">📡 Real-time Events ({eventCount})</h2>
		<button onclick={clearEvents} class="btn mb-4 btn-outline">🗑️ Clear Events</button>

		<div class="events-list max-h-96 overflow-y-auto">
			{#each events as event (event)}
				<div class="event-item mb-2 rounded bg-base-200 p-3">
					<div class="event-header mb-2 flex items-center justify-between">
						<span
							class="event-type rounded bg-primary px-2 py-1 font-mono text-sm text-primary-content"
						>
							{event.type}
						</span>
						<span class="event-time text-sm opacity-70">{event.timestamp}</span>
					</div>
					<div class="event-data">
						<pre class="overflow-x-auto text-xs">{JSON.stringify(event.data, null, 2)}</pre>
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
