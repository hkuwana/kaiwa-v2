<!-- src/lib/components/ConversationDebugger.svelte -->
<script lang="ts">
	import { dev } from '$app/environment';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { realtimeOpenAI } from '$lib/stores/realtime-openai.store.svelte';
	import { audioStore } from '$lib/stores/audio.store.svelte';

	interface Props {
		show?: boolean;
	}

	const { show = true }: Props = $props();

	// Debug info
	const debugInfo = $derived(conversationStore.getDebugInfo());
	const realtimeMessages = $derived(realtimeOpenAI.messages);
	const connectionInfo = $derived(conversationStore.getConnectionStatus());
	const browserCheck = $derived(typeof window !== 'undefined');
	const realtimeConnectionState = $derived(realtimeOpenAI.isConnected);

	// Show only in development mode
	const shouldShow = $derived(dev && show);

	function refreshDebugInfo() {
		// Force reactivity by accessing store properties
		console.log('Debug refresh:', {
			conversationMessages: conversationStore.messages.length,
			realtimeMessages: realtimeOpenAI.messages.length,
			status: conversationStore.status,
			isConnected: conversationStore.isConnected()
		});
	}
</script>

{#if shouldShow}
	<div class="fixed top-4 right-4 z-50 max-w-sm">
		<div class="card border border-warning bg-warning/10 shadow-xl backdrop-blur-sm">
			<div class="card-body p-4">
				<div class="flex items-center justify-between mb-3">
					<h3 class="card-title text-sm">🐛 Conversation Debugger</h3>
					<button class="btn btn-xs" onclick={refreshDebugInfo}>Refresh</button>
				</div>

				<div class="space-y-3 text-xs">
					<!-- Environment & Connection Status -->
					<div class="rounded bg-base-200 p-2">
						<div class="font-semibold mb-1">Environment</div>
						<div>Browser: <span class="badge badge-sm {browserCheck ? 'badge-success' : 'badge-error'}">{browserCheck ? 'Yes' : 'No'}</span></div>
						<div>Status: <span class="badge badge-sm">{debugInfo.status}</span></div>
						<div>Conv Connected: <span class="badge badge-sm {debugInfo.hasConnection ? 'badge-success' : 'badge-error'}">{debugInfo.hasConnection ? 'Yes' : 'No'}</span></div>
						<div>RT Connected: <span class="badge badge-sm {realtimeConnectionState ? 'badge-success' : 'badge-error'}">{realtimeConnectionState ? 'Yes' : 'No'}</span></div>
						<div>Audio Stream: <span class="badge badge-sm {debugInfo.hasAudioStream ? 'badge-success' : 'badge-error'}">{debugInfo.hasAudioStream ? 'Yes' : 'No'}</span></div>
					</div>

					<!-- Message Counts -->
					<div class="rounded bg-base-200 p-2">
						<div class="font-semibold mb-1">Messages</div>
						<div>Conversation Store: <span class="badge badge-sm">{debugInfo.messageCount}</span></div>
						<div>Realtime Store: <span class="badge badge-sm">{realtimeMessages.length}</span></div>
					</div>

					<!-- Audio State -->
					<div class="rounded bg-base-200 p-2">
						<div class="font-semibold mb-1">Audio</div>
						<div>Recording: <span class="badge badge-sm">{audioStore.isRecording ? 'Yes' : 'No'}</span></div>
						<div>Level: <span class="badge badge-sm">{audioStore.getCurrentLevel().toFixed(2)}</span></div>
					</div>

					<!-- Recent Messages -->
					{#if conversationStore.messages.length > 0}
						<div class="rounded bg-base-200 p-2">
							<div class="font-semibold mb-1">Recent Messages</div>
							<div class="max-h-32 overflow-y-auto space-y-1">
								{#each conversationStore.messages.slice(-3) as message}
									<div class="p-1 rounded bg-base-100 text-xs">
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

					<!-- Message Flow Debug -->
					<div class="rounded bg-base-200 p-2">
						<div class="font-semibold mb-1">Message Flow</div>
						<div class="text-xs space-y-1">
							<div>Last Conv Msg: {conversationStore.messages.length > 0 ? conversationStore.messages[conversationStore.messages.length - 1]?.id?.substring(0, 8) + '...' : 'None'}</div>
							<div>Last RT Msg: {realtimeMessages.length > 0 ? realtimeMessages[realtimeMessages.length - 1]?.id?.substring(0, 8) + '...' : 'None'}</div>
						</div>
					</div>

					<!-- Quick Actions -->
					<div class="rounded bg-base-200 p-2">
						<div class="font-semibold mb-1">Quick Actions</div>
						<div class="space-y-1">
							<button
								class="btn btn-xs w-full"
								onclick={() => console.table(conversationStore.messages)}
							>
								Log Conv Messages
							</button>
							<button
								class="btn btn-xs w-full"
								onclick={() => console.table(realtimeMessages)}
							>
								Log RT Messages
							</button>
							<button
								class="btn btn-xs w-full"
								onclick={() => console.log('Full Debug:', {
									conversationStore: debugInfo,
									realtimeStore: {
										messages: realtimeMessages.length,
										connected: realtimeConnectionState,
										events: realtimeOpenAI.events?.length || 0
									},
									browser: browserCheck,
									connectionInfo
								})}
							>
								Log Full Debug
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}