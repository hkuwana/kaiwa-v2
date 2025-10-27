<!-- src/lib/components/DevPanel.svelte -->
<script lang="ts">
	import { dev } from '$app/environment';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { realtimeOpenAI } from '$lib/stores/realtime-openai.store.svelte';
	import { audioStore } from '$lib/stores/audio.store.svelte';
	import type { Message } from '$lib/server/db/types';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		status: string;
		messagesCount: number;
		audioLevel: number;
		isGuestUser: boolean;
		hasAnalysisResults: boolean;
		isAnalyzing: boolean;
		timeInSeconds: number;
		position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
	}

	const {
		status,
		messagesCount,
		audioLevel,
		isGuestUser,
		hasAnalysisResults: _hasAnalysisResults,
		isAnalyzing: _isAnalyzing,
		timeInSeconds,
		position = 'bottom-left'
	}: Props = $props();

	// Only show in dev mode
	const shouldShow = $derived(dev);

	// Position classes
	const positionClasses = $derived(
		{
			'top-right': 'top-4 right-4',
			'top-left': 'top-4 left-4',
			'bottom-right': 'bottom-4 right-4',
			'bottom-left': 'bottom-4 left-4'
		}[position]
	);

	// Enhanced debug info from stores
	const debugInfo = $derived(conversationStore.getDebugInfo());
	const realtimeMessages = $derived(realtimeOpenAI.messages);
	const connectionInfo = $derived(conversationStore.getConnectionStatus());
	const browserCheck = $derived(typeof window !== 'undefined');
	const realtimeConnectionState = $derived(realtimeOpenAI.isConnected);
	const messages = $derived(conversationStore.messages);
	const events = $derived(realtimeOpenAI.events || []);

	// Local state for expanded view
	let isExpanded = $state(false);
	let activeTab = $state<'overview' | 'messages' | 'events' | 'audio' | 'post-run'>('overview');

	// Post-run testing state
	let postRunTesting = $state(false);
	let postRunResponse = $state<any>(null);
	let postRunError = $state<string | null>(null);
	const audioDebugInfo = $derived(conversationStore.getAudioDebugInfo());
	const selectedInputDeviceId = $derived(audioStore.selectedDeviceId);
	const inputDevices = $derived(
		audioStore.availableDevices.filter((device) => device.deviceId && device.deviceId !== 'default')
	);
	const selectedOutputDeviceId = $derived(realtimeOpenAI.selectedOutputDeviceId);
	const outputDevices = $derived(
		realtimeOpenAI.availableOutputDevices.filter(
			(device) => device.deviceId && device.deviceId !== 'default'
		)
	);
	const outputDeviceError = $derived(realtimeOpenAI.outputDeviceError);
	const canSelectOutput = realtimeOpenAI.canSelectOutputDevice();

	// Helper functions for debug functionality
	function refreshDebugInfo() {
		console.log('Debug refresh:', {
			conversationMessages: conversationStore.messages.length,
			realtimeMessages: realtimeOpenAI.messages.length,
			status: conversationStore.status,
			isConnected: conversationStore.isConnected()
		});
	}

	function clearEvents() {
		const event = new CustomEvent('clearEvents');
		document.dispatchEvent(event);
	}

	function logConversationMessages() {
		console.table(conversationStore.messages);
	}

	function logRealtimeMessages() {
		console.table(realtimeMessages);
	}

	function _logFullDebug() {
		console.log('Full Debug:', {
			conversationStore: debugInfo,
			realtimeStore: {
				messages: realtimeMessages.length,
				connected: realtimeConnectionState,
				events: events.length
			},
			browser: browserCheck,
			connectionInfo,
			audioDebugInfo
		});
	}

	function logAudioDebug() {
		console.log('Audio Debug:', audioDebugInfo);
	}

	async function testPostRun() {
		const userMessageCount = messages.filter(
			(msg) => msg.role === 'user' && msg.content?.trim().length > 0
		).length;

		postRunTesting = true;
		postRunError = null;
		postRunResponse = null;

		try {
			const payload = {
				userId: null, // Will be set by server
				messageCount: userMessageCount,
				durationSeconds: Math.floor(timeInSeconds)
			};

			console.log('📨 Testing post-run endpoint with:', payload);

			const response = await fetch(
				`/api/conversations/${conversationStore.sessionId}/post-run`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}
			);

			const data = await response.json();

			if (!response.ok) {
				postRunError = data.error || 'Unknown error';
			}

			postRunResponse = {
				status: response.status,
				statusText: response.statusText,
				body: data,
				timestamp: new SvelteDate().toISOString(),
				payload
			};

			console.log('✅ Post-run test response:', data);
		} catch (error) {
			postRunError = error instanceof Error ? error.message : 'Network error';
			console.error('❌ Post-run test failed:', error);
		} finally {
			postRunTesting = false;
		}
	}

	function getDeviceLabel(device: MediaDeviceInfo | undefined, fallback: string) {
		if (!device) return fallback;
		if (device.label) return device.label;
		if (device.deviceId && device.deviceId !== 'default') {
			return `Device ${device.deviceId.slice(0, 6)}`;
		}
		return fallback;
	}

	async function handleInputDeviceChange(event: Event) {
		const deviceId = (event.currentTarget as HTMLSelectElement).value;
		try {
			await conversationStore.selectDevice(deviceId);
		} catch (error) {
			console.error('Failed to switch input device:', error);
		}
	}

	async function handleRefreshInputDevices() {
		try {
			await audioStore.refreshDevices();
		} catch (error) {
			console.error('Failed to refresh input devices:', error);
		}
	}

	async function handleOutputDeviceChange(event: Event) {
		const deviceId = (event.currentTarget as HTMLSelectElement).value;
		try {
			await realtimeOpenAI.setOutputDevice(deviceId);
		} catch (error) {
			console.error('Failed to switch output device:', error);
		}
	}

	async function handleRefreshOutputDevices() {
		try {
			await realtimeOpenAI.refreshOutputDevices();
		} catch (error) {
			console.error('Failed to refresh output devices:', error);
		}
	}

	function getMessageStatus(msg: Message): string {
		if (msg.id.startsWith('user_placeholder_')) return 'PLACEHOLDER';
		if (msg.id.startsWith('user_transcribing_')) return 'TRANSCRIBING';
		if (msg.id.startsWith('user_partial_')) return 'PARTIAL';
		if (msg.id.startsWith('streaming_')) return 'STREAMING';
		if (msg.id.startsWith('assistant_streaming_')) return 'ASSISTANT_STREAM';
		if (msg.id.startsWith('msg_')) return 'FINAL';
		return 'UNKNOWN';
	}

	function formatTimestamp(timestamp: Date | string | number): string {
		if (!timestamp) return 'No timestamp';
		const date = timestamp instanceof Date ? timestamp : new SvelteDate(timestamp);
		return date.toISOString().split('T')[1].slice(0, -1);
	}
</script>

{#if shouldShow}
	<div class="pointer-events-none fixed z-50 {positionClasses} max-w-full sm:max-w-none">
		<div class="pointer-events-auto">
			{#if !isExpanded}
				<!-- Compact view -->
				<div
					class="card border border-warning/30 bg-warning/10 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
				>
					<div class="card-body p-3">
						<div class="mb-2 flex items-center justify-between border-b border-warning/30 pb-2">
							<div class="flex items-center gap-2">
								<span
									class="rounded bg-warning px-2 py-1 text-xs font-bold tracking-wider text-warning-content uppercase"
									>DEV</span
								>
								<span class="text-xs font-semibold text-warning">Debug Info</span>
							</div>
							<button
								class="btn btn-xs btn-warning"
								onclick={() => (isExpanded = true)}
								aria-label="Expand debug panel"
							>
								⚙️
							</button>
						</div>

						<div class="space-y-1 font-mono text-xs">
							<div class="flex items-center justify-between gap-2">
								<span class="font-medium text-base-content/70">Status:</span>
								<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
									>{status}</span
								>
							</div>

							<div class="flex items-center justify-between gap-2">
								<span class="font-medium text-base-content/70">Conv:</span>
								<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
									>{messagesCount}</span
								>
							</div>

							<div class="flex items-center justify-between gap-2">
								<span class="font-medium text-base-content/70">RT:</span>
								<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
									>{realtimeMessages.length}</span
								>
							</div>

							<div class="flex items-center justify-between gap-2">
								<span class="font-medium text-base-content/70">Connected:</span>
								<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
									>{realtimeConnectionState ? '✅' : '❌'}</span
								>
							</div>

							<div class="flex items-center justify-between gap-2">
								<span class="font-medium text-base-content/70">Time:</span>
								<span class="min-w-8 rounded bg-base-300 px-2 py-1 text-center text-base-content"
									>{Math.floor(timeInSeconds / 60)}:{(timeInSeconds % 60)
										.toString()
										.padStart(2, '0')}</span
								>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- Expanded view -->
				<div
					class="card max-h-[80vh] w-96 overflow-hidden border border-warning/30 bg-base-100 shadow-xl"
				>
					<div class="card-body p-0">
						<!-- Header -->
						<div class="flex items-center justify-between border-b bg-warning/10 px-4 py-3">
							<div class="flex items-center gap-2">
								<span
									class="rounded bg-warning px-2 py-1 text-xs font-bold tracking-wider text-warning-content uppercase"
									>DEV</span
								>
								<span class="text-sm font-semibold">Enhanced Debug Panel</span>
							</div>
							<button
								class="btn btn-ghost btn-xs"
								onclick={() => (isExpanded = false)}
								aria-label="Collapse debug panel"
							>
								✕
							</button>
						</div>

						<!-- Tab navigation -->
						<div class="flex border-b flex-wrap">
							<button
								class="flex-1 py-2 text-xs transition-colors {activeTab === 'overview'
									? 'bg-primary text-primary-content'
									: 'hover:bg-base-200'}"
								onclick={() => (activeTab = 'overview')}
							>
								Overview
							</button>
							<button
								class="flex-1 py-2 text-xs transition-colors {activeTab === 'messages'
									? 'bg-primary text-primary-content'
									: 'hover:bg-base-200'}"
								onclick={() => (activeTab = 'messages')}
							>
								Messages
							</button>
							<button
								class="flex-1 py-2 text-xs transition-colors {activeTab === 'audio'
									? 'bg-primary text-primary-content'
									: 'hover:bg-base-200'}"
								onclick={() => (activeTab = 'audio')}
							>
								Audio
							</button>
							<button
								class="flex-1 py-2 text-xs transition-colors {activeTab === 'events'
									? 'bg-primary text-primary-content'
									: 'hover:bg-base-200'}"
								onclick={() => (activeTab = 'events')}
							>
								Events
							</button>
							<button
								class="flex-1 py-2 text-xs transition-colors {activeTab === 'post-run'
									? 'bg-primary text-primary-content'
									: 'hover:bg-base-200'}"
								onclick={() => (activeTab = 'post-run')}
							>
								Post-Run Test
							</button>
						</div>

						<!-- Tab content -->
						<div class="overflow-y-auto p-4" style="max-height: 60vh;">
							{#if activeTab === 'overview'}
								<!-- Overview tab -->
								<div class="space-y-4">
									<!-- Quick stats -->
									<div class="grid grid-cols-2 gap-2 text-xs">
										<div class="rounded bg-base-200 p-2">
											<div class="font-medium">Status</div>
											<div class="badge badge-sm">{status}</div>
										</div>
										<div class="rounded bg-base-200 p-2">
											<div class="font-medium">Conv Messages</div>
											<div class="badge badge-sm badge-primary">{messagesCount}</div>
										</div>
										<div class="rounded bg-base-200 p-2">
											<div class="font-medium">RT Messages</div>
											<div class="badge badge-sm badge-secondary">{realtimeMessages.length}</div>
										</div>
										<div class="rounded bg-base-200 p-2">
											<div class="font-medium">Events</div>
											<div class="badge badge-sm badge-accent">{events.length}</div>
										</div>
									</div>

									<!-- Connection status -->
									<div class="space-y-2">
										<h4 class="text-sm font-medium">Connection Status</h4>
										<div class="grid grid-cols-2 gap-2 text-xs">
											<div class="flex justify-between">
												<span>RT Connected:</span>
												<div
													class="badge badge-xs {realtimeConnectionState
														? 'badge-success'
														: 'badge-error'}"
												>
													{realtimeConnectionState ? 'Yes' : 'No'}
												</div>
											</div>
											<div class="flex justify-between">
												<span>Audio Level:</span>
												<div class="badge badge-xs">{audioLevel.toFixed(2)}</div>
											</div>
											<div class="flex justify-between">
												<span>Guest User:</span>
												<div class="badge badge-xs">{isGuestUser ? 'Yes' : 'No'}</div>
											</div>
											<div class="flex justify-between">
												<span>Recording:</span>
												<div class="badge badge-xs">{audioStore.isRecording ? 'Yes' : 'No'}</div>
											</div>
											<div class="flex justify-between">
												<span>Track Enabled:</span>
												<div class="badge badge-xs">
													{audioDebugInfo.track
														? audioDebugInfo.track.enabled
															? 'Yes'
															: 'No'
														: 'N/A'}
												</div>
											</div>
											<div class="flex justify-between">
												<span>Track Ready:</span>
												<div class="badge badge-xs">
													{audioDebugInfo.track ? audioDebugInfo.track.readyState : 'N/A'}
												</div>
											</div>
										</div>
									</div>

									<!-- Actions -->
									<div class="space-y-1">
										<h4 class="text-sm font-medium">Quick Actions</h4>
										<div class="grid grid-cols-2 gap-1">
											<button class="btn btn-xs" onclick={refreshDebugInfo}>Refresh</button>
											<button class="btn btn-xs" onclick={clearEvents}>Clear Events</button>
											<button class="btn btn-xs" onclick={logConversationMessages}>Log Conv</button>
											<button class="btn btn-xs" onclick={logRealtimeMessages}>Log RT</button>
											<button class="btn btn-xs" onclick={logAudioDebug}>Log Audio</button>
										</div>
									</div>

									<!-- Recent messages -->
									{#if messages.length > 0}
										<div class="space-y-2">
											<h4 class="text-sm font-medium">Recent Messages</h4>
											<div class="space-y-1">
												{#each messages.slice(-3) as message (message.id)}
													<div class="rounded bg-base-200 p-2 text-xs">
														<div class="flex justify-between">
															<span class="font-medium">{message.role}</span>
															<span class="opacity-70">{getMessageStatus(message)}</span>
														</div>
														<div class="truncate">{message.content || '<empty>'}</div>
													</div>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{:else if activeTab === 'messages'}
								<!-- Messages tab -->
								<div class="space-y-2">
									<h4 class="text-sm font-medium">All Messages ({messages.length})</h4>
									<div class="max-h-80 space-y-1 overflow-y-auto">
										{#each messages as message, i (message.id)}
											<div class="rounded bg-base-200 p-2 text-xs">
												<div class="flex items-start justify-between">
													<div>
														<span class="font-medium">{message.role}</span>
														<span class="opacity-50">#{i}</span>
													</div>
													<div class="text-right">
														<div class="badge badge-xs">{getMessageStatus(message)}</div>
														<div class="text-xs opacity-50">
															{formatTimestamp(message.timestamp)}
														</div>
													</div>
												</div>
												<div class="mt-1 text-xs">{message.content || '<empty>'}</div>
												<div class="text-xs opacity-50">ID: {message.id}</div>
											</div>
										{/each}
									</div>
								</div>
							{:else if activeTab === 'audio'}
								<!-- Audio tab -->
								<div class="space-y-3 text-xs">
									<div class="space-y-2">
										<h4 class="text-sm font-medium">Audio Controls</h4>
										<div class="rounded bg-base-200 p-2">
											<div class="flex items-center justify-between">
												<span class="font-medium">Microphone</span>
												<button class="btn btn-xs" onclick={handleRefreshInputDevices}>
													Refresh
												</button>
											</div>
											{#if inputDevices.length > 0}
												<select
													class="select mt-2 w-full select-xs"
													value={selectedInputDeviceId}
													onchange={handleInputDeviceChange}
												>
													<option value="default">System Default</option>
													{#each inputDevices as device (device.deviceId)}
														<option value={device.deviceId}>
															{getDeviceLabel(device, 'Microphone')}
														</option>
													{/each}
												</select>
											{:else}
												<div class="mt-2 text-[11px] opacity-70">
													No microphones detected yet. Click refresh after granting microphone
													access.
												</div>
											{/if}
											<div class="mt-2 text-[11px] opacity-60">
												Active: {getDeviceLabel(
													audioStore.getDevice(selectedInputDeviceId),
													selectedInputDeviceId || 'default'
												)}
											</div>
										</div>
										<div class="rounded bg-base-200 p-2">
											<div class="flex items-center justify-between">
												<span class="font-medium">Playback</span>
												<button
													class="btn btn-xs"
													onclick={handleRefreshOutputDevices}
													disabled={!canSelectOutput}
												>
													Refresh
												</button>
											</div>
											{#if canSelectOutput}
												{#if outputDevices.length > 0}
													<select
														class="select mt-2 w-full select-xs"
														value={selectedOutputDeviceId}
														onchange={handleOutputDeviceChange}
													>
														<option value="default">System Default</option>
														{#each outputDevices as device (device.deviceId)}
															<option value={device.deviceId}>
																{getDeviceLabel(device, 'Speaker')}
															</option>
														{/each}
													</select>
												{:else}
													<div class="mt-2 text-[11px] opacity-70">
														No playback devices enumerated yet. Try refresh or check browser
														permissions.
													</div>
												{/if}
											{:else}
												<div class="mt-2 text-[11px] opacity-70">
													Browser cannot select specific audio output devices. Using system default.
												</div>
											{/if}
											<div class="mt-2 text-[11px] opacity-60">
												Active: {canSelectOutput
													? getDeviceLabel(
															outputDevices.find(
																(device) => device.deviceId === selectedOutputDeviceId
															),
															selectedOutputDeviceId || 'default'
														)
													: 'System default'}
											</div>
											{#if outputDeviceError}
												<div class="mt-1 text-[11px] text-error">{outputDeviceError}</div>
											{/if}
										</div>
									</div>

									<h4 class="text-sm font-medium">Audio Stream Debug</h4>
									<div class="rounded bg-base-200 p-2">
										<div class="font-medium">Stream</div>
										<div>Has Stream: {audioDebugInfo.hasStream ? 'Yes' : 'No'}</div>
										<div>Stream ID: {audioDebugInfo.streamId || 'N/A'}</div>
										<div>Tracks: {audioDebugInfo.trackCount}</div>
										<div>Conversation Device: {audioDebugInfo.selectedDeviceId}</div>
										<div>Playback Supported: {audioDebugInfo.output.supported ? 'Yes' : 'No'}</div>
										<div>
											Output Device:
											{audioDebugInfo.output.selectedDeviceId || 'default'}
										</div>
									</div>
									<div class="rounded bg-base-200 p-2">
										<div class="font-medium">Track</div>
										{#if audioDebugInfo.track}
											<div>ID: {audioDebugInfo.track.id}</div>
											<div>Label: {audioDebugInfo.track.label || 'N/A'}</div>
											<div>Enabled: {audioDebugInfo.track.enabled ? 'Yes' : 'No'}</div>
											<div>Muted: {audioDebugInfo.track.muted ? 'Yes' : 'No'}</div>
											<div>Ready State: {audioDebugInfo.track.readyState}</div>
											{#if audioDebugInfo.track.settings}
												<div class="mt-2 font-medium">Settings</div>
												<pre
													class="bg-base-300/60 p-2 break-all whitespace-pre-wrap">{JSON.stringify(
														audioDebugInfo.track.settings,
														null,
														2
													)}</pre>
											{/if}
											{#if audioDebugInfo.track.constraints}
												<div class="mt-2 font-medium">Constraints</div>
												<pre
													class="bg-base-300/60 p-2 break-all whitespace-pre-wrap">{JSON.stringify(
														audioDebugInfo.track.constraints,
														null,
														2
													)}</pre>
											{/if}
										{:else}
											<div>No active audio track</div>
										{/if}
									</div>
									<div class="rounded bg-base-200 p-2">
										<div class="font-medium">Audio Store</div>
										<div>Initialized: {audioDebugInfo.audioStore.isInitialized ? 'Yes' : 'No'}</div>
										<div>Recording: {audioDebugInfo.audioStore.isRecording ? 'Yes' : 'No'}</div>
										<div>Current Level: {audioDebugInfo.audioStore.currentLevel.toFixed(3)}</div>
										<div>
											Level Timestamp: {audioDebugInfo.audioStore.lastLevelTimestamp || 'N/A'}
										</div>
										<div>Device (Store): {audioDebugInfo.audioStore.selectedDeviceId}</div>
										<div class="mt-2 font-medium">Permission State</div>
										<pre class="bg-base-300/60 p-2 break-all whitespace-pre-wrap">{JSON.stringify(
												audioDebugInfo.audioStore.permissionState,
												null,
												2
											) || 'N/A'}</pre>
									</div>
								</div>
							{:else if activeTab === 'events'}
								<!-- Events tab -->
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<h4 class="text-sm font-medium">Realtime Events ({events.length})</h4>
										<button class="btn btn-xs" onclick={clearEvents}>Clear</button>
									</div>
									<div class="max-h-80 space-y-1 overflow-y-auto">
										{#each events.slice(-20) as event, i (event.ts)}
											<div class="rounded bg-base-200 p-2 text-xs">
												<div class="flex justify-between">
													<span class="font-medium">{event.type}</span>
													<span class="opacity-50">#{i}</span>
												</div>
												{#if event.payload}
													<div class="mt-1 text-xs opacity-70">
														{JSON.stringify(event.payload).substring(0, 100)}...
													</div>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{:else if activeTab === 'post-run'}
								<div class="space-y-3 text-xs">
									<!-- Payload section -->
									<div class="rounded bg-base-200 p-2">
										<div class="flex items-center justify-between">
											<h4 class="text-sm font-medium">Test Payload</h4>
										</div>
										<div class="mt-2 text-[10px] rounded bg-base-300 p-2 overflow-x-auto">
											{#if postRunResponse}
												<pre>{JSON.stringify(postRunResponse.payload, null, 2)}</pre>
											{:else}
												<p class="opacity-50">Payload will appear after test</p>
											{/if}
										</div>
									</div>

									<!-- Processing status -->
									<div class="rounded bg-base-200 p-2">
										<h4 class="text-sm font-medium">Server Processing</h4>
										<div class="mt-2 space-y-1">
											{#if postRunTesting}
												<div class="flex items-center gap-2">
													<span class="loading loading-spinner loading-xs"></span>
													<span>Processing...</span>
												</div>
											{:else if postRunResponse}
												<div class="flex items-center gap-2">
													{#if postRunResponse.body.skipped}
														<span class="badge badge-warning">⏭️ Skipped</span>
														<span>Reason: {postRunResponse.body.reason}</span>
													{:else if postRunResponse.status === 200}
														<span class="badge badge-success">✅ Success</span>
													{:else}
														<span class="badge badge-error">❌ Failed</span>
													{/if}
												</div>
												{#if postRunResponse.body.skipped}
													<div class="mt-2 rounded bg-warning/20 p-2 text-xs">
														<strong>Skipped Reason:</strong> {postRunResponse.body.reason}
													</div>
												{/if}
											{:else}
												<p class="opacity-50">Status will appear after test</p>
											{/if}
										</div>
									</div>

									<!-- Response section -->
									{#if postRunResponse && postRunResponse.body.memory}
										<div class="rounded bg-base-200 p-2">
											<h4 class="text-sm font-medium">Extracted Memory</h4>
											<pre class="mt-2 bg-base-300 p-2 break-all whitespace-pre-wrap text-[10px] overflow-x-auto">{JSON.stringify(postRunResponse.body.memory, null, 2)}</pre>
										</div>
									{/if}

									{#if postRunError}
										<div class="rounded bg-error/20 p-2 text-error text-xs">
											<strong>Error:</strong> {postRunError}
										</div>
									{/if}

									<!-- Action buttons -->
									<div class="flex gap-1">
										<button
											class="btn btn-xs btn-primary flex-1"
											onclick={testPostRun}
											disabled={postRunTesting || messages.length === 0}
										>
											{postRunTesting ? 'Testing...' : 'Test Post-Run'}
										</button>
										<button
											class="btn btn-xs"
											onclick={() => {
												postRunResponse = null;
												postRunError = null;
											}}
											disabled={!postRunResponse && !postRunError}
										>
											Clear
										</button>
										{#if postRunResponse}
											<button
												class="btn btn-xs"
												onclick={() => {
													navigator.clipboard.writeText(JSON.stringify(postRunResponse.body, null, 2));
												}}
											>
												Copy
											</button>
										{/if}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
