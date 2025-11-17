<!-- src/lib/components/UnifiedDebugPanel.svelte -->
<script lang="ts">
	import { dev } from '$app/environment';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { realtimeOpenAI } from '$lib/stores/realtime-openai.store.svelte';
	import { audioStore } from '$lib/stores/audio.store.svelte';
	import type { Message } from '$lib/server/db/types';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		show?: boolean;
		isCollapsed?: boolean;
		onToggleCollapse?: () => void;
	}

	const { show = true, isCollapsed = false, onToggleCollapse }: Props = $props();

	// Debug info from ConversationDebugger
	const debugInfo = $derived(conversationStore.getDebugInfo());
	const realtimeMessages = $derived(realtimeOpenAI.messages);
	const connectionInfo = $derived(conversationStore.getConnectionStatus());
	const browserCheck = $derived(typeof window !== 'undefined');
	const realtimeConnectionState = $derived(realtimeOpenAI.isConnected);

	// Debug info from RealtimeDebugPanel
	const messages = $derived(conversationStore.messages);
	const events = $derived(realtimeOpenAI.events || []);

	// Show only in development mode
	const shouldShow = $derived(dev && show);

	// Local state for tabs and display options
	let activeTab = $state<'overview' | 'messages' | 'events'>('overview');
	let showPlaceholders = $state(true);
	let showSequenceIds = $state(true);
	let showEventDetails = $state(false);

	// Helper functions from RealtimeDebugPanel
	function getMessageStatus(msg: Message): string {
		if (msg.id.startsWith('user_placeholder_')) return 'PLACEHOLDER';
		if (msg.id.startsWith('user_transcribing_')) return 'TRANSCRIBING';
		if (msg.id.startsWith('user_partial_')) return 'PARTIAL';
		if (msg.id.startsWith('streaming_')) return 'STREAMING';
		if (msg.id.startsWith('assistant_streaming_')) return 'ASSISTANT_STREAM';
		if (msg.id.startsWith('msg_')) return 'FINAL';
		return 'UNKNOWN';
	}

	function formatTimestamp(timestamp: Date | string | number | null | undefined): string {
		if (!timestamp) return 'No timestamp';
		const date = timestamp instanceof Date ? timestamp : new SvelteDate(timestamp);
		return date.toISOString().split('T')[1].slice(0, -1);
	}

	function getMessageColor(msg: Message): string {
		const status = getMessageStatus(msg);
		switch (status) {
			case 'PLACEHOLDER':
				return 'text-yellow-600 bg-yellow-50';
			case 'TRANSCRIBING':
				return 'text-orange-600 bg-orange-50';
			case 'PARTIAL':
				return 'text-blue-600 bg-blue-50';
			case 'STREAMING':
				return 'text-purple-600 bg-purple-50';
			case 'ASSISTANT_STREAM':
				return 'text-purple-600 bg-purple-50';
			case 'FINAL':
				return 'text-green-600 bg-green-50';
			default:
				return 'text-gray-600 bg-gray-50';
		}
	}

	function isDuplicateByContent(msg: Message, allMessages: Message[]): boolean {
		const sameDuplicates = allMessages.filter(
			(m) =>
				m.role === msg.role &&
				m.content === msg.content &&
				m.content.trim().length > 0 &&
				m.id !== msg.id
		);
		return sameDuplicates.length > 0;
	}

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
			connectionInfo
		});
	}
</script>

{#if shouldShow}
	<div
		class="fixed right-0 bottom-0 left-0 z-40 rounded-t-lg border border-gray-300 bg-white shadow-xl {isCollapsed
			? 'h-16'
			: 'h-96'} transition-all duration-300"
	>
		<!-- Header -->
		<div class="flex items-center justify-between rounded-t-lg border-b bg-gray-50 px-4 py-3">
			<div class="flex items-center gap-4">
				<h3 class="text-sm font-semibold">🐛 Debug Panel</h3>

				{#if !isCollapsed}
					<!-- Tab navigation -->
					<div class="flex gap-1">
						<button
							class="rounded px-3 py-1 text-xs transition-colors {activeTab === 'overview'
								? 'bg-blue-600 text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
							onclick={() => (activeTab = 'overview')}
						>
							Overview
						</button>
						<button
							class="rounded px-3 py-1 text-xs transition-colors {activeTab === 'messages'
								? 'bg-blue-600 text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
							onclick={() => (activeTab = 'messages')}
						>
							Messages
						</button>
						<button
							class="rounded px-3 py-1 text-xs transition-colors {activeTab === 'events'
								? 'bg-blue-600 text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
							onclick={() => (activeTab = 'events')}
						>
							Events
						</button>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				{#if !isCollapsed}
					<!-- Quick stats in header -->
					<div class="flex gap-3 text-xs">
						<span class="rounded bg-blue-100 px-2 py-1">
							Status: <span class="font-semibold">{debugInfo.status}</span>
						</span>
						<span class="rounded bg-green-100 px-2 py-1">
							Conv: <span class="font-semibold">{debugInfo.messageCount}</span>
						</span>
						<span class="rounded bg-purple-100 px-2 py-1">
							RT: <span class="font-semibold">{realtimeMessages.length}</span>
						</span>
						<span class="rounded bg-orange-100 px-2 py-1">
							Events: <span class="font-semibold">{events.length}</span>
						</span>
					</div>
				{/if}

				<button
					class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
					onclick={onToggleCollapse}
				>
					{isCollapsed ? 'Expand' : 'Collapse'}
				</button>
			</div>
		</div>

		{#if isCollapsed}
			<!-- Collapsed view - just stats -->
			<div class="flex items-center gap-4 px-4 py-2 text-xs">
				<div class="flex gap-3">
					<span class="rounded bg-blue-50 px-2 py-1">
						<span class="font-semibold text-blue-900">Status:</span>
						<span class="text-blue-700">{debugInfo.status}</span>
					</span>
					<span class="rounded bg-green-50 px-2 py-1">
						<span class="font-semibold text-green-900">Conv:</span>
						<span class="text-green-700">{debugInfo.messageCount}</span>
					</span>
					<span class="rounded bg-purple-50 px-2 py-1">
						<span class="font-semibold text-purple-900">RT:</span>
						<span class="text-purple-700">{realtimeMessages.length}</span>
					</span>
					<span class="rounded bg-orange-50 px-2 py-1">
						<span class="font-semibold text-orange-900">Events:</span>
						<span class="text-orange-700">{events.length}</span>
					</span>
					<span class="rounded {realtimeConnectionState ? 'bg-green-50' : 'bg-red-50'} px-2 py-1">
						<span
							class="font-semibold {realtimeConnectionState ? 'text-green-900' : 'text-red-900'}"
							>RT Connected:</span
						>
						<span class={realtimeConnectionState ? 'text-green-700' : 'text-red-700'}
							>{realtimeConnectionState ? 'Yes' : 'No'}</span
						>
					</span>
				</div>
			</div>
		{:else}
			<!-- Expanded view - tabbed interface -->
			<div class="h-full overflow-hidden">
				{#if activeTab === 'overview'}
					<!-- Overview tab - original ConversationDebugger content -->
					<div class="h-full overflow-y-auto p-4">
						<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
							<!-- Environment & Connection Status -->
							<div class="rounded bg-base-200 p-3">
								<div class="mb-2 font-semibold">Environment & Connection</div>
								<div class="space-y-1 text-xs">
									<div>
										Browser: <span
											class="badge badge-sm {browserCheck ? 'badge-success' : 'badge-error'}"
											>{browserCheck ? 'Yes' : 'No'}</span
										>
									</div>
									<div>Status: <span class="badge badge-sm">{debugInfo.status}</span></div>
									<div>
										Conv Connected: <span
											class="badge badge-sm {debugInfo.hasConnection
												? 'badge-success'
												: 'badge-error'}">{debugInfo.hasConnection ? 'Yes' : 'No'}</span
										>
									</div>
									<div>
										RT Connected: <span
											class="badge badge-sm {realtimeConnectionState
												? 'badge-success'
												: 'badge-error'}">{realtimeConnectionState ? 'Yes' : 'No'}</span
										>
									</div>
									<div>
										Audio Stream: <span
											class="badge badge-sm {debugInfo.hasAudioStream
												? 'badge-success'
												: 'badge-error'}">{debugInfo.hasAudioStream ? 'Yes' : 'No'}</span
										>
									</div>
									<div>
										Audio Recording: <span class="badge badge-sm"
											>{audioStore.isRecording ? 'Yes' : 'No'}</span
										>
									</div>
									<div>
										Audio Level: <span class="badge badge-sm"
											>{audioStore.getCurrentLevel().toFixed(2)}</span
										>
									</div>
								</div>
							</div>

							<!-- Message Counts & Flow -->
							<div class="rounded bg-base-200 p-3">
								<div class="mb-2 font-semibold">Messages & Flow</div>
								<div class="space-y-1 text-xs">
									<div>
										Conversation Store: <span class="badge badge-sm">{debugInfo.messageCount}</span>
									</div>
									<div>
										Realtime Store: <span class="badge badge-sm">{realtimeMessages.length}</span>
									</div>
									<div>
										Last Conv Msg: {debugInfo.messageCount > 0
											? conversationStore.messages[
													conversationStore.messages.length - 1
												]?.id?.substring(0, 8) + '...'
											: 'None'}
									</div>
									<div>
										Last RT Msg: {realtimeMessages.length > 0
											? realtimeMessages[realtimeMessages.length - 1]?.id?.substring(0, 8) + '...'
											: 'None'}
									</div>
								</div>
							</div>

							<!-- Quick Actions -->
							<div class="rounded bg-base-200 p-3">
								<div class="mb-2 font-semibold">Quick Actions</div>
								<div class="space-y-1">
									<button class="btn w-full btn-xs" onclick={refreshDebugInfo}>
										Refresh Debug Info
									</button>
									<button class="btn w-full btn-xs" onclick={logConversationMessages}>
										Log Conv Messages
									</button>
									<button class="btn w-full btn-xs" onclick={logRealtimeMessages}>
										Log RT Messages
									</button>
									<button class="btn w-full btn-xs" onclick={logFullDebug}> Log Full Debug </button>
									<button class="btn w-full btn-xs" onclick={clearEvents}> Clear Events </button>
								</div>
							</div>
						</div>

						<!-- Recent Messages -->
						{#if conversationStore.messages.length > 0}
							<div class="mt-4 rounded bg-base-200 p-3">
								<div class="mb-2 font-semibold">Recent Messages (Last 3)</div>
								<div class="space-y-1">
									{#each conversationStore.messages.slice(-3) as message (message.id)}
										<div class="rounded bg-base-100 p-2 text-xs">
											<div class="flex justify-between">
												<span class="font-medium">{message.role}</span>
												<span class="opacity-70">{message.id.substring(0, 8)}...</span>
											</div>
											<div class="truncate">{message.content || '<empty>'}</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{:else if activeTab === 'messages'}
					<!-- Messages tab - side-by-side message comparison -->
					<div class="h-full overflow-y-auto p-4">
						<!-- Display Options -->
						<div class="mb-4 rounded bg-gray-100 p-3">
							<h4 class="mb-2 text-sm font-semibold">Display Options</h4>
							<div class="flex flex-wrap gap-3 text-xs">
								<label class="flex items-center gap-1">
									<input type="checkbox" bind:checked={showPlaceholders} class="scale-75" />
									Placeholders
								</label>
								<label class="flex items-center gap-1">
									<input type="checkbox" bind:checked={showSequenceIds} class="scale-75" />
									Sequence IDs
								</label>
							</div>
						</div>

						<div class="grid h-full grid-cols-2 gap-4">
							<!-- Conversation Store Messages -->
							<div class="space-y-2">
								<h4 class="text-sm font-semibold">Conversation Store ({messages.length})</h4>
								<div class="max-h-64 space-y-1 overflow-y-auto text-xs">
									{#each messages as msg, i (msg.id || i)}
										{@const status = getMessageStatus(msg)}
										{@const isDup = isDuplicateByContent(msg, messages)}
										{#if showPlaceholders || (!status.includes('PLACEHOLDER') && !status.includes('TRANSCRIBING'))}
											<div
												class="rounded border p-2 {getMessageColor(msg)} {isDup
													? 'border-2 border-red-500'
													: ''}"
											>
												<div class="mb-1 flex items-center justify-between">
													<div class="flex items-center gap-1">
														<span
															class="rounded px-1 py-0.5 text-xs font-semibold uppercase {msg.role ===
															'user'
																? 'bg-blue-100'
																: 'bg-green-100'}"
														>
															{msg.role.charAt(0)}
														</span>
														<span class="rounded bg-gray-200 px-1 py-0.5 text-xs">
															{status.substring(0, 4)}
														</span>
														{#if isDup}
															<span class="rounded bg-red-200 px-1 py-0.5 text-xs text-red-800">
																DUP
															</span>
														{/if}
													</div>
													<span class="text-xs text-gray-500">#{i}</span>
												</div>

												{#if showSequenceIds}
													<div class="mb-1 text-xs text-gray-500">
														ID: {msg.id.substring(0, 20)}...
													</div>
													<div class="mb-1 text-xs text-gray-500">
														Seq: {msg.sequenceId || 'none'} | {formatTimestamp(msg.timestamp)}
													</div>
												{/if}

												<div class="text-xs">
													{msg.content || '<empty>'}
												</div>
											</div>
										{/if}
									{/each}
								</div>
							</div>

							<!-- Realtime Store Messages -->
							<div class="space-y-2">
								<h4 class="text-sm font-semibold">Realtime Store ({realtimeMessages.length})</h4>
								<div class="max-h-64 space-y-1 overflow-y-auto text-xs">
									{#each realtimeMessages as msg, i (msg.id || i)}
										{@const status = getMessageStatus(msg)}
										{@const isDup = isDuplicateByContent(msg, realtimeMessages)}
										{#if showPlaceholders || (!status.includes('PLACEHOLDER') && !status.includes('TRANSCRIBING'))}
											<div
												class="rounded border p-2 {getMessageColor(msg)} {isDup
													? 'border-2 border-red-500'
													: ''}"
											>
												<div class="mb-1 flex items-center justify-between">
													<div class="flex items-center gap-1">
														<span
															class="rounded px-1 py-0.5 text-xs font-semibold uppercase {msg.role ===
															'user'
																? 'bg-blue-100'
																: 'bg-green-100'}"
														>
															{msg.role.charAt(0)}
														</span>
														<span class="rounded bg-gray-200 px-1 py-0.5 text-xs">
															{status.substring(0, 4)}
														</span>
														{#if isDup}
															<span class="rounded bg-red-200 px-1 py-0.5 text-xs text-red-800">
																DUP
															</span>
														{/if}
													</div>
													<span class="text-xs text-gray-500">#{i}</span>
												</div>

												{#if showSequenceIds}
													<div class="mb-1 text-xs text-gray-500">
														ID: {msg.id.substring(0, 20)}...
													</div>
													<div class="mb-1 text-xs text-gray-500">
														Seq: {msg.sequenceId || 'none'} | {formatTimestamp(msg.timestamp)}
													</div>
												{/if}

												<div class="text-xs">
													{msg.content || '<empty>'}
												</div>
											</div>
										{/if}
									{/each}
								</div>
							</div>
						</div>
					</div>
				{:else if activeTab === 'events'}
					<!-- Events tab - recent events list -->
					<div class="h-full overflow-y-auto p-4">
						<div class="mb-4 rounded bg-gray-100 p-3">
							<h4 class="mb-2 text-sm font-semibold">Display Options</h4>
							<div class="flex flex-wrap gap-3 text-xs">
								<label class="flex items-center gap-1">
									<input type="checkbox" bind:checked={showEventDetails} class="scale-75" />
									Event Details
								</label>
								<button class="btn btn-xs" onclick={clearEvents}> Clear Events </button>
							</div>
						</div>

						<div class="space-y-2">
							<h4 class="text-sm font-semibold">Recent Events (Last 20)</h4>
							<div class="max-h-72 space-y-1 overflow-y-auto text-xs">
								{#each events.slice(0, 20) as event (event.timestamp + event.type)}
									<div
										class="rounded border p-2 {event.dir === 'server'
											? 'bg-blue-50'
											: 'bg-green-50'}"
									>
										<div class="flex items-center justify-between">
											<span
												class="font-mono font-semibold {event.dir === 'server'
													? 'text-blue-700'
													: 'text-green-700'}"
											>
												{event.dir.toUpperCase()}: {event.type}
											</span>
											<span class="text-gray-500">
												{new SvelteDate(event.ts).toLocaleTimeString()}
											</span>
										</div>
										{#if showEventDetails}
											<pre class="mt-1 text-xs whitespace-pre-wrap text-gray-600">{JSON.stringify(
													event.payload,
													null,
													2
												).substring(0, 200)}...</pre>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
