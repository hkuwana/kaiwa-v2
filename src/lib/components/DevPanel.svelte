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
		hasAnalysisResults,
		isAnalyzing,
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
	let activeTab = $state<'overview' | 'messages' | 'events' | 'audio'>('overview');
	const audioDebugInfo = $derived(conversationStore.getAudioDebugInfo());

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

	function logFullDebug() {
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

	function getMessageStatus(msg: Message): string {
		if (msg.id.startsWith('user_placeholder_')) return 'PLACEHOLDER';
		if (msg.id.startsWith('user_transcribing_')) return 'TRANSCRIBING';
		if (msg.id.startsWith('user_partial_')) return 'PARTIAL';
		if (msg.id.startsWith('streaming_')) return 'STREAMING';
		if (msg.id.startsWith('assistant_streaming_')) return 'ASSISTANT_STREAM';
		if (msg.id.startsWith('msg_')) return 'FINAL';
		return 'UNKNOWN';
	}

	function formatTimestamp(timestamp: Date | any): string {
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
						<div class="flex border-b">
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
												{audioDebugInfo.track ? (audioDebugInfo.track.enabled ? 'Yes' : 'No') : 'N/A'}
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
												{#each messages.slice(-3) as message}
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
										{#each messages as message, i}
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
								<div class="space-y-2 text-xs">
									<h4 class="text-sm font-medium">Audio Stream Debug</h4>
									<div class="rounded bg-base-200 p-2">
										<div class="font-medium">Stream</div>
										<div>Has Stream: {audioDebugInfo.hasStream ? 'Yes' : 'No'}</div>
										<div>Stream ID: {audioDebugInfo.streamId || 'N/A'}</div>
										<div>Tracks: {audioDebugInfo.trackCount}</div>
										<div>Conversation Device: {audioDebugInfo.selectedDeviceId}</div>
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
												<pre class="whitespace-pre-wrap break-all bg-base-300/60 p-2">{JSON.stringify(audioDebugInfo.track.settings, null, 2)}</pre>
											{/if}
											{#if audioDebugInfo.track.constraints}
												<div class="mt-2 font-medium">Constraints</div>
												<pre class="whitespace-pre-wrap break-all bg-base-300/60 p-2">{JSON.stringify(audioDebugInfo.track.constraints, null, 2)}</pre>
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
										<div>Level Timestamp: {audioDebugInfo.audioStore.lastLevelTimestamp || 'N/A'}</div>
										<div>Device (Store): {audioDebugInfo.audioStore.selectedDeviceId}</div>
										<div class="mt-2 font-medium">Permission State</div>
										<pre class="whitespace-pre-wrap break-all bg-base-300/60 p-2">{JSON.stringify(audioDebugInfo.audioStore.permissionState, null, 2) || 'N/A'}</pre>
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
										{#each events.slice(-20) as event, i}
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
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
