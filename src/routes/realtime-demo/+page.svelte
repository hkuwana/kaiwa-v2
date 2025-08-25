<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import RealtimeConnectionStatus from '$lib/components/RealtimeConnectionStatus.svelte';
	import { realtimeService } from '$lib/services/realtime.service';
	import { audioService } from '$lib/services/audio.service';

	// State
	let isConnected = false;
	let sessionId = '';
	let audioStream: MediaStream | null = null;
	let connectionUpdates: any[] = [];
	let vadState = {
		isUserSpeaking: false,
		isAISpeaking: false
	};

	// Lifecycle
	onMount(async () => {
		// Set up connection update callback - we'll use the callback parameter in connectWithSession
		console.log('📡 Demo page mounted');
	});

	onDestroy(() => {
		// Clean up
		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
		}
		realtimeService.disconnect();
	});

	// Start demo connection
	async function startDemoConnection() {
		try {
			// Get audio stream
			audioStream = await audioService.getStream();

			// For demo purposes, create a mock session
			const mockSession = {
				client_secret: {
					value: 'demo-secret-key',
					expires_at: Date.now() + 300000 // 5 minutes
				},
				session_id: 'demo-session-' + Date.now()
			};

			// Connect with mock session
			await realtimeService.connectWithSession(
				mockSession,
				audioStream,
				(message) => console.log('📨 Message:', message),
				(state) => {
					console.log('🔌 Connection state:', state);
					isConnected = state === 'connected';
				},
				(event) => console.log('📝 Transcription:', event),
				(update: any) => {
					console.log('📡 Update:', update);
					// Update VAD state based on connection updates
					if (update.type === 'vad_state') {
						if (update.status === 'user_speaking') vadState.isUserSpeaking = true;
						else if (update.status === 'user_silent') vadState.isUserSpeaking = false;
					} else if (update.type === 'audio_state') {
						if (update.status === 'ai_speaking') vadState.isAISpeaking = true;
						else if (update.status === 'ai_silent') vadState.isAISpeaking = false;
					}

					// Add to connection updates list
					connectionUpdates = [update, ...connectionUpdates.slice(0, 19)]; // Keep last 20
				},
				{
					model: 'gpt-4o-mini-realtime-preview-2024-12-17',
					voice: 'alloy',
					language: 'en',
					instructions: 'You are a helpful language tutor. Keep responses brief and engaging.',
					turnDetection: {
						type: 'server_vad',
						threshold: 0.5,
						prefix_padding_ms: 300,
						silence_duration_ms: 500
					}
				}
			);

			sessionId = mockSession.session_id;
			console.log('✅ Demo connection started');
		} catch (error) {
			console.error('❌ Failed to start demo connection:', error);
		}
	}

	// Stop demo connection
	function stopDemoConnection() {
		if (audioStream) {
			audioStream.getTracks().forEach((track) => track.stop());
			audioStream = null;
		}
		realtimeService.disconnect();
		isConnected = false;
		sessionId = '';
		console.log('🛑 Demo connection stopped');
	}

	// Send test event
	function sendTestEvent() {
		if ('sendCustomEvent' in realtimeService) {
			(realtimeService as any).sendCustomEvent('test_button_clicked', {
				timestamp: new Date().toISOString(),
				message: 'User clicked test button'
			});
		}
	}

	// Send user activity
	function sendUserActivity() {
		if ('sendUserActivity' in realtimeService) {
			(realtimeService as any).sendUserActivity('button_interaction', {
				button: 'activity_button',
				timestamp: new Date().toISOString()
			});
		}
	}
</script>

<svelte:head>
	<title>Realtime Service Demo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="mx-auto max-w-4xl px-4">
		<h1 class="mb-8 text-center text-3xl font-bold text-gray-900">🔌 Realtime Service Demo</h1>

		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
			<!-- Left Column: Connection Status -->
			<div>
				<RealtimeConnectionStatus {sessionId} />

				<!-- Demo Controls -->
				<div class="mt-6 rounded-lg bg-white p-4 shadow-md">
					<h3 class="mb-4 text-lg font-semibold text-gray-800">🎮 Demo Controls</h3>

					<div class="space-y-3">
						<button
							class="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
							disabled={isConnected}
							on:click={startDemoConnection}
						>
							🚀 Start Demo Connection
						</button>

						<button
							class="w-full rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
							disabled={!isConnected}
							on:click={stopDemoConnection}
						>
							🛑 Stop Demo Connection
						</button>

						<button
							class="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
							disabled={!isConnected}
							on:click={sendTestEvent}
						>
							📡 Send Test Event
						</button>

						<button
							class="w-full rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
							disabled={!isConnected}
							on:click={sendUserActivity}
						>
							👤 Send User Activity
						</button>
					</div>
				</div>
			</div>

			<!-- Right Column: Live Updates & VAD State -->
			<div>
				<!-- VAD State Display -->
				<div class="mb-6 rounded-lg bg-white p-4 shadow-md">
					<h3 class="mb-4 text-lg font-semibold text-gray-800">🎤 Live VAD State</h3>

					<div class="grid grid-cols-2 gap-6">
						<!-- User Speaking Indicator -->
						<div class="text-center">
							<div
								class="mb-2 text-4xl {vadState.isUserSpeaking ? 'text-blue-600' : 'text-gray-400'}"
							>
								{vadState.isUserSpeaking ? '🎤' : '🔇'}
							</div>
							<div class="text-lg font-semibold text-gray-700">User</div>
							<div class="text-sm text-gray-600">
								{vadState.isUserSpeaking ? 'Speaking' : 'Silent'}
							</div>
							<div class="mt-2">
								<div
									class="mx-auto h-16 w-16 rounded-full border-4 {vadState.isUserSpeaking
										? 'border-blue-500 bg-blue-100'
										: 'border-gray-300 bg-gray-100'}"
								></div>
							</div>
						</div>

						<!-- AI Speaking Indicator -->
						<div class="text-center">
							<div
								class="mb-2 text-4xl {vadState.isAISpeaking ? 'text-green-600' : 'text-gray-400'}"
							>
								{vadState.isAISpeaking ? '🤖' : '🔇'}
							</div>
							<div class="text-lg font-semibold text-gray-700">AI</div>
							<div class="text-sm text-gray-600">
								{vadState.isAISpeaking ? 'Speaking' : 'Silent'}
							</div>
							<div class="mt-2">
								<div
									class="mx-auto h-16 w-16 rounded-full border-4 {vadState.isAISpeaking
										? 'border-green-500 bg-green-100'
										: 'border-gray-300 bg-gray-100'}"
								></div>
							</div>
						</div>
					</div>

					<!-- VAD Status Bar -->
					<div class="mt-6">
						<div class="mb-2 flex items-center justify-between text-sm text-gray-600">
							<span>VAD Status</span>
							<span class="font-medium">
								{vadState.isUserSpeaking
									? 'User Speaking'
									: vadState.isAISpeaking
										? 'AI Speaking'
										: 'Both Silent'}
							</span>
						</div>
						<div class="h-2 w-full rounded-full bg-gray-200">
							<div
								class="h-2 rounded-full transition-all duration-300 {vadState.isUserSpeaking
									? 'bg-blue-500'
									: vadState.isAISpeaking
										? 'bg-green-500'
										: 'bg-gray-400'}"
								style="width: {vadState.isUserSpeaking || vadState.isAISpeaking ? '100%' : '0%'}"
							></div>
						</div>
					</div>
				</div>

				<!-- Live Connection Updates -->
				<div class="rounded-lg bg-white p-4 shadow-md">
					<h3 class="mb-4 text-lg font-semibold text-gray-800">📡 Live Connection Updates</h3>

					<div class="max-h-64 space-y-2 overflow-y-auto">
						{#each connectionUpdates as update, index}
							<div
								class="rounded border-l-4 bg-gray-50 p-3 {update.type === 'connection_status'
									? 'border-blue-500'
									: update.type === 'vad_state'
										? 'border-green-500'
										: update.type === 'audio_state'
											? 'border-purple-500'
											: update.type === 'user_activity'
												? 'border-orange-500'
												: 'border-gray-500'}"
							>
								<div class="mb-1 flex items-start justify-between">
									<span class="rounded bg-white px-2 py-1 text-xs font-medium text-gray-700">
										{update.type}
									</span>
									<span class="text-xs text-gray-500">
										{update.timestamp.toLocaleTimeString()}
									</span>
								</div>
								<div class="mb-1 text-sm font-medium text-gray-800">
									{update.status}
								</div>
								{#if update.data}
									<div class="rounded bg-white p-2 text-xs text-gray-600">
										<pre class="whitespace-pre-wrap">{JSON.stringify(update.data, null, 2)}</pre>
									</div>
								{/if}
							</div>
						{:else}
							<div class="text-gray-500 text-center py-8">
								<div class="text-2xl mb-2">📡</div>
								<div>No connection updates yet</div>
								<div class="text-sm">Start a connection to see live updates</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Feature Explanation -->
		<div class="mt-12 rounded-lg bg-white p-6 shadow-md">
			<h3 class="mb-4 text-xl font-semibold text-gray-800">✨ Enhanced Features</h3>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div>
					<h4 class="mb-2 font-semibold text-gray-700">🎤 Smart VAD Management</h4>
					<ul class="space-y-1 text-sm text-gray-600">
						<li>• Automatically pauses local audio when user starts speaking</li>
						<li>• Prevents echo and ensures clear audio input</li>
						<li>• Resumes audio input after speech detection ends</li>
						<li>• Smooth transitions between user and AI speech</li>
					</ul>
				</div>

				<div>
					<h4 class="mb-2 font-semibold text-gray-700">📡 Realtime Connection Updates</h4>
					<ul class="space-y-1 text-sm text-gray-600">
						<li>• Live connection status monitoring</li>
						<li>• VAD state changes in real-time</li>
						<li>• Audio state tracking</li>
						<li>• User activity updates</li>
					</ul>
				</div>

				<div>
					<h4 class="mb-2 font-semibold text-gray-700">🔧 Enhanced Audio Control</h4>
					<ul class="space-y-1 text-sm text-gray-600">
						<li>• Pause/resume streaming without disconnecting</li>
						<li>• Granular audio track management</li>
						<li>• Automatic audio input optimization</li>
						<li>• Better error handling and recovery</li>
					</ul>
				</div>

				<div>
					<h4 class="mb-2 font-semibold text-gray-700">📊 Comprehensive Monitoring</h4>
					<ul class="space-y-1 text-sm text-gray-600">
						<li>• Detailed connection status</li>
						<li>• VAD state tracking</li>
						<li>• Audio state monitoring</li>
						<li>• Connection update history</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>
