<script lang="ts">
	import { onMount } from 'svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { realtimeOpenAI } from '$lib/stores/realtime-openai.store.svelte';
	import RealtimeDebugPanel from '$lib/components/RealtimeDebugPanel.svelte';
	import type { Language } from '$lib/server/db/types';
	import { languages } from '$lib/data/languages';

	// Debug states
	let connected = $state(false);
	let debugCollapsed = $state(false);

	// Raw data for debugging
	const messages = $derived(conversationStore.messages);
	const realtimeMessages = $derived(realtimeOpenAI.messages);
	const events = $derived(realtimeOpenAI.events);

	// Mock language for testing
	const testLanguage: Language = languages[0];

	function startDebugConversation() {
		conversationStore.startConversation(testLanguage);
		connected = true;
	}

	function endDebugConversation() {
		conversationStore.endConversation();
		connected = false;
	}

	function clearDebugData() {
		realtimeOpenAI.clearEvents();
	}

	function toggleDebugPanel() {
		debugCollapsed = !debugCollapsed;
	}

	onMount(() => {
		console.log('Debug page mounted');

		// Listen for clear events from the debug panel
		const handleClearEvents = () => {
			clearDebugData();
		};

		document.addEventListener('clearEvents', handleClearEvents);

		return () => {
			document.removeEventListener('clearEvents', handleClearEvents);
		};
	});
</script>

<section class="mx-auto max-w-7xl space-y-6 p-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Realtime Debug Console</h1>
		<div class="flex gap-2">
			{#if !connected}
				<button
					class="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
					onclick={startDebugConversation}
				>
					Start Debug Session
				</button>
			{:else}
				<button
					class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
					onclick={endDebugConversation}
				>
					End Session
				</button>
			{/if}
		</div>
	</div>

	<!-- Status Card -->
	<div class="rounded-lg bg-gray-50 p-6">
		<h2 class="mb-4 text-lg font-semibold">Session Status</h2>
		<div class="grid grid-cols-4 gap-4">
			<div class="rounded bg-blue-50 p-4">
				<h3 class="font-semibold text-blue-900">Connection</h3>
				<p class="text-sm text-blue-700">{conversationStore.status}</p>
			</div>
			<div class="rounded bg-green-50 p-4">
				<h3 class="font-semibold text-green-900">Store Messages</h3>
				<p class="text-sm text-green-700">{messages.length}</p>
			</div>
			<div class="rounded bg-purple-50 p-4">
				<h3 class="font-semibold text-purple-900">Realtime Messages</h3>
				<p class="text-sm text-purple-700">{realtimeMessages.length}</p>
			</div>
			<div class="rounded bg-orange-50 p-4">
				<h3 class="font-semibold text-orange-900">Events</h3>
				<p class="text-sm text-orange-700">{events.length}</p>
			</div>
		</div>
	</div>

	<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
		<h3 class="mb-2 font-semibold text-blue-900">💡 Usage Tips</h3>
		<ul class="space-y-1 text-sm text-blue-800">
			<li>• Start a debug session and speak to see realtime message processing</li>
			<li>
				• Look for messages highlighted in <span class="rounded bg-red-200 px-1">red borders</span> -
				these are duplicates
			</li>
			<li>• The debug panel below can be collapsed/expanded and embedded in other pages</li>
			<li>• Check sequence IDs and timestamps to understand message ordering</li>
		</ul>
	</div>
</section>

<!-- Debug Panel Component -->
<RealtimeDebugPanel
	{messages}
	{realtimeMessages}
	{events}
	connectionStatus={conversationStore.status}
	isCollapsed={debugCollapsed}
	onToggleCollapse={toggleDebugPanel}
/>
