<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { RealtimeConnectionUpdate } from '$lib/services/realtime.service';
	import { realtimeService } from '$lib/services/realtime.service';

	// Props
	export let sessionId: string = '';

	// Local state
	let connectionStatus = 'disconnected';
	let vadState = {
		isUserSpeaking: false,
		isAISpeaking: false,
		lastVADEvent: new Date()
	};
	let audioState = 'idle';
	let connectionUpdates: RealtimeConnectionUpdate[] = [];
	let isConnected = false;

	// Update connection status
	function updateConnectionStatus() {
		const status = realtimeService.getConnectionStatus();
		connectionStatus = status.peerConnectionState;
		// Check if vadState exists (for backward compatibility)
		if ('vadState' in status) {
			vadState = (status as any).vadState;
		}
		isConnected = realtimeService.isConnected();
	}

	// Handle connection updates from the realtime service
	function handleConnectionUpdate(update: RealtimeConnectionUpdate) {
		console.log('📡 Connection update received:', update);

		// Add to updates list (keep last 10)
		connectionUpdates = [update, ...connectionUpdates.slice(0, 9)];

		// Update local state based on update type
		switch (update.type) {
			case 'connection_status':
				connectionStatus = update.status;
				break;
			case 'vad_state':
				if (update.status === 'user_speaking') {
					vadState.isUserSpeaking = true;
				} else if (update.status === 'user_silent') {
					vadState.isUserSpeaking = false;
				}
				vadState.lastVADEvent = update.timestamp;
				break;
			case 'audio_state':
				audioState = update.status;
				if (update.status === 'ai_speaking') {
					vadState.isAISpeaking = true;
				} else if (update.status === 'ai_silent') {
					vadState.isAISpeaking = false;
				}
				break;
		}

		// Update connection status
		updateConnectionStatus();
	}

	// Start monitoring connection
	function startMonitoring() {
		if (sessionId) {
			// Set up connection update callback if available
			if ('onConnectionUpdateCallback' in realtimeService) {
				(realtimeService as any).onConnectionUpdateCallback = handleConnectionUpdate;
			}

			// Initial status update
			updateConnectionStatus();

			// Set up periodic status updates
			const interval = setInterval(updateConnectionStatus, 1000);

			// Cleanup function
			return () => {
				clearInterval(interval);
			};
		}
	}

	// Lifecycle
	onMount(() => {
		const cleanup = startMonitoring();
		return cleanup;
	});

	onDestroy(() => {
		// Clean up callback if available
		if ('onConnectionUpdateCallback' in realtimeService) {
			(realtimeService as any).onConnectionUpdateCallback = () => {};
		}
	});

	// Format timestamp
	function formatTime(date: Date): string {
		return date.toLocaleTimeString();
	}

	// Get status color
	function getStatusColor(status: string): string {
		switch (status) {
			case 'connected':
				return 'text-green-600';
			case 'connecting':
				return 'text-yellow-600';
			case 'failed':
				return 'text-red-600';
			case 'closed':
				return 'text-gray-600';
			default:
				return 'text-gray-600';
		}
	}

	// Get VAD indicator color
	function getVADColor(isActive: boolean): string {
		return isActive ? 'text-blue-600' : 'text-gray-400';
	}
</script>

<div class="realtime-connection-status rounded-lg bg-white p-4 shadow-md">
	<h3 class="mb-4 text-lg font-semibold text-gray-800">🔌 Realtime Connection Status</h3>

	<!-- Connection Status -->
	<div class="mb-4">
		<div class="mb-2 flex items-center gap-2">
			<span class="font-medium text-gray-700">Connection:</span>
			<span class="rounded px-2 py-1 text-sm font-medium {getStatusColor(connectionStatus)}">
				{connectionStatus}
			</span>
		</div>

		<div class="flex items-center gap-2">
			<span class="font-medium text-gray-700">Session ID:</span>
			<span class="font-mono text-sm text-gray-600">{sessionId || 'Not connected'}</span>
		</div>
	</div>

	<!-- VAD State -->
	<div class="mb-4">
		<h4 class="mb-2 font-medium text-gray-700">🎤 Voice Activity Detection</h4>
		<div class="grid grid-cols-2 gap-4">
			<div class="text-center">
				<div class="mb-1 text-2xl {getVADColor(vadState.isUserSpeaking)}">
					{vadState.isUserSpeaking ? '🎤' : '🔇'}
				</div>
				<div class="text-sm font-medium text-gray-600">User</div>
				<div class="text-xs text-gray-500">
					{vadState.isUserSpeaking ? 'Speaking' : 'Silent'}
				</div>
			</div>

			<div class="text-center">
				<div class="mb-1 text-2xl {getVADColor(vadState.isAISpeaking)}">
					{vadState.isAISpeaking ? '🤖' : '🔇'}
				</div>
				<div class="text-sm font-medium text-gray-600">AI</div>
				<div class="text-xs text-gray-500">
					{vadState.isAISpeaking ? 'Speaking' : 'Silent'}
				</div>
			</div>
		</div>

		<div class="mt-2 text-center text-xs text-gray-500">
			Last VAD event: {formatTime(vadState.lastVADEvent)}
		</div>
	</div>

	<!-- Audio State -->
	<div class="mb-4">
		<h4 class="mb-2 font-medium text-gray-700">🎵 Audio State</h4>
		<div class="rounded bg-gray-100 px-3 py-2 text-sm">
			<span class="font-medium">Current:</span>
			{audioState}
		</div>
	</div>

	<!-- Connection Updates -->
	<div class="mb-4">
		<h4 class="mb-2 font-medium text-gray-700">📡 Recent Updates</h4>
		<div class="max-h-32 space-y-1 overflow-y-auto">
			{#each connectionUpdates as update}
				<div class="rounded border-l-2 border-blue-400 bg-gray-50 p-2 text-xs">
					<div class="flex items-start justify-between">
						<span class="font-medium text-gray-700">{update.type}</span>
						<span class="text-gray-500">{formatTime(update.timestamp)}</span>
					</div>
					<div class="text-gray-600">{update.status}</div>
					{#if update.data}
						<div class="mt-1 text-xs text-gray-500">
							{JSON.stringify(update.data)}
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-gray-500 text-center py-2">No updates yet</div>
			{/each}
		</div>
	</div>

	<!-- Actions -->
	<div class="flex gap-2">
		<button
			class="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
			disabled={!isConnected}
			on:click={() => realtimeService.pauseStreaming()}
		>
			⏸️ Pause
		</button>

		<button
			class="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700 disabled:opacity-50"
			disabled={!isConnected}
			on:click={() => realtimeService.resumeStreaming()}
		>
			▶️ Resume
		</button>

		<button
			class="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-50"
			disabled={!isConnected}
			on:click={() => realtimeService.disconnect()}
		>
			🔌 Disconnect
		</button>
	</div>

	<!-- Debug Info -->
	{#if isConnected}
		<div class="mt-4 rounded bg-gray-50 p-3 text-xs">
			<div class="mb-1 font-medium text-gray-700">Debug Info:</div>
			<pre class="overflow-x-auto text-gray-600">{JSON.stringify(
					realtimeService.getConnectionStatus(),
					null,
					2
				)}</pre>
		</div>
	{/if}
</div>

<style>
	.realtime-connection-status {
		font-family: 'Inter', system-ui, sans-serif;
	}
</style>
