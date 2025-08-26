<!-- Test WebRTC Connection Only -->
<script lang="ts">
	import { realtimeService } from '$lib/services';
	import { audioService } from '$lib/services/audio.service';

	// Use the exported instances that automatically handle browser/server
	// No need to manually instantiate or check browser environment

	let connected = $state(false);
	let connectionState = $state('disconnected');
	let error = $state<string | null>(null);
	let testMessage = $state('');
	let receivedEvents = $state<any[]>([]);
	let stream = $state<MediaStream | null>(null);

	async function connect() {
		try {
			error = null;
			console.log('🚀 Starting WebRTC connection test...');

			// First get an audio stream
			console.log('🎵 Getting audio stream...');
			stream = await audioService.getStream();
			console.log('✅ Audio stream obtained:', stream.getTracks().length, 'tracks');

			// Connect to realtime service
			console.log('📡 Connecting to RealtimeService...');
			await realtimeService.connect(
				'test-session-url',
				stream,
				(event) => {
					// onMessage callback
					console.log('📨 Message received in test page:', event);
					receivedEvents = [
						...receivedEvents,
						{
							...event,
							timestamp: new Date().toLocaleTimeString()
						}
					];
				},
				(state) => {
					// onConnectionStateChange callback
					console.log('🔌 Connection state changed in test page:', state);
					connectionState = state;
					if (state === 'connected') {
						connected = true;
						console.log('✅ WebRTC connection fully established!');
					} else if (state === 'failed' || state === 'closed') {
						connected = false;
						console.log('❌ WebRTC connection failed or closed');
					}
				}
			);

			console.log('✅ RealtimeService.connect() completed');
		} catch (e) {
			console.error('❌ Connection failed:', e);
			error = e instanceof Error ? e.message : 'Unknown error';
			connected = false;
			connectionState = 'error';
		}
	}

	function disconnect() {
		realtimeService.disconnect();
		audioService.cleanup();
		connected = false;
		connectionState = 'disconnected';
		receivedEvents = [];
		stream = null;
	}

	function sendTest() {
		if (!connected) return;

		const event = {
			type: 'conversation.item.create',
			item: {
				type: 'message',
				role: 'user',
				content: [{ type: 'input_text', text: testMessage || 'Hello!' }]
			}
		};

		realtimeService.sendEvent(event);

		// Add to received events for visibility
		receivedEvents = [
			...receivedEvents,
			{
				...event,
				timestamp: new Date().toLocaleTimeString(),
				sent: true
			}
		];

		testMessage = '';
	}

	function clearEvents() {
		receivedEvents = [];
	}
</script>

<div class="container mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-3xl font-bold">📡 WebRTC Connection Test</h1>
	<p class="mb-8 text-lg">Test WebRTC connection independently from business logic</p>

	<div class="connection-section mb-8">
		<h2 class="mb-4 text-xl font-semibold">🔌 Connection Status</h2>
		<div class="status-grid mb-6 grid grid-cols-2 gap-4">
			<div class="status-item card bg-base-100 shadow-md">
				<div class="card-body">
					<span class="label font-semibold">Connected:</span>
					<span class="value {connected ? 'text-success' : 'text-error'}">
						{connected ? '✅ Yes' : '❌ No'}
					</span>
				</div>
			</div>
			<div class="status-item card bg-base-100 shadow-md">
				<div class="card-body">
					<span class="label font-semibold">State:</span>
					<span
						class="value {connectionState === 'connected'
							? 'text-success'
							: connectionState === 'connecting'
								? 'text-warning'
								: connectionState === 'failed'
									? 'text-error'
									: 'text-base-content'}"
					>
						{connectionState}
					</span>
				</div>
			</div>
		</div>

		<!-- Additional Status Info -->
		<div class="status-details mb-4">
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
				<div class="stat">
					<div class="stat-title text-xs">Audio Tracks</div>
					<div class="stat-value text-sm">{stream ? stream.getTracks().length : 0}</div>
				</div>
				<div class="stat">
					<div class="stat-title text-xs">Events</div>
					<div class="stat-value text-sm">{receivedEvents.length}</div>
				</div>
				<div class="stat">
					<div class="stat-title text-xs">Error</div>
					<div class="stat-value text-sm {error ? 'text-error' : 'text-success'}">
						{error || 'None'}
					</div>
				</div>
				<div class="stat">
					<div class="stat-title text-xs">Stream ID</div>
					<div class="stat-value font-mono text-xs">
						{stream ? stream.id.slice(0, 8) + '...' : 'None'}
					</div>
				</div>
			</div>
		</div>

		<div class="connection-actions">
			{#if !connected}
				<button onclick={connect} class="btn btn-primary">🔌 Connect</button>
			{:else}
				<button onclick={disconnect} class="btn btn-error">🔌 Disconnect</button>
			{/if}
		</div>

		<!-- Connection Progress -->
		{#if connectionState === 'connecting'}
			<div class="mt-4">
				<div class="alert alert-info">
					<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
						></path>
					</svg>
					<div>
						<h4 class="font-bold">Connection in Progress</h4>
						<p class="text-sm">
							WebRTC connection is being established. Check the console for detailed progress.
						</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#if error}
		<div class="error-section mb-8">
			<h2 class="mb-4 text-xl font-semibold text-error">❌ Error</h2>
			<div class="alert alert-error">
				<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
					></path>
				</svg>
				<div>
					<p class="text-sm">{error}</p>
				</div>
			</div>
		</div>
	{/if}

	{#if connected}
		<div class="message-section mb-8">
			<h2 class="mb-4 text-xl font-semibold">📤 Send Test Message</h2>
			<div class="flex gap-4">
				<input
					type="text"
					bind:value={testMessage}
					placeholder="Type your message here..."
					class="input-bordered input flex-1"
				/>
				<button onclick={sendTest} class="btn btn-primary">📤 Send Test</button>
			</div>
		</div>
	{/if}

	<div class="events-section">
		<div class="events-header mb-4 flex items-center justify-between">
			<h3 class="text-xl font-semibold">📨 Events Log</h3>
			<button onclick={clearEvents} class="btn btn-outline">🗑️ Clear</button>
		</div>

		<div class="events-list max-h-96 overflow-y-auto">
			{#each receivedEvents as event, index}
				<div class="event-item mb-2 rounded bg-base-200 p-3">
					<div class="event-header mb-2 flex items-center justify-between">
						<span
							class="event-type rounded bg-primary px-2 py-1 font-mono text-sm text-primary-content"
						>
							{event.type || 'message'}
						</span>
						<span class="event-time text-sm opacity-70">{event.timestamp}</span>
					</div>
					<div class="event-data">
						<pre class="overflow-x-auto text-xs">{JSON.stringify(event, null, 2)}</pre>
					</div>
				</div>
			{/each}

			{#if receivedEvents.length === 0}
				<div class="py-8 text-center text-base-content/50">
					<p>No events yet. Connect to see WebRTC events here.</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Debug Info -->
	<div class="debug-section mt-8">
		<div class="card bg-base-200 shadow-md">
			<div class="card-body">
				<h3 class="mb-4 card-title text-lg">🐛 Debug Information</h3>
				<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
					<div>
						<p>
							<strong>Connection State:</strong> <span class="font-mono">{connectionState}</span>
						</p>
						<p><strong>Connected:</strong> <span class="font-mono">{connected}</span></p>
						<p>
							<strong>Has Stream:</strong> <span class="font-mono">{stream ? 'Yes' : 'No'}</span>
						</p>
						<p><strong>Error:</strong> <span class="font-mono">{error || 'None'}</span></p>
					</div>
					<div>
						<p>
							<strong>Audio Tracks:</strong>
							<span class="font-mono">{stream ? stream.getTracks().length : 0}</span>
						</p>
						<p>
							<strong>Stream ID:</strong>
							<span class="font-mono">{stream ? stream.id : 'None'}</span>
						</p>
						<p>
							<strong>Events Count:</strong> <span class="font-mono">{receivedEvents.length}</span>
						</p>
						<p>
							<strong>Test Message:</strong> <span class="font-mono">{testMessage || 'None'}</span>
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.status-item {
		transition: all 0.2s ease;
	}

	.status-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
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
