<script lang="ts">
	import type { Message } from '$lib/server/db/types';
	import { SvelteDate } from 'svelte/reactivity';

	// Props - data passed from parent component
	const {
		messages = [],
		realtimeMessages = [],
		events = [],
		connectionStatus = 'idle',
		isCollapsed = false,
		onToggleCollapse
	}: {
		messages: Message[];
		realtimeMessages: Message[];
		events: Array<{ dir: 'server' | 'client'; type: string; payload: any; ts: number }>;
		connectionStatus: string;
		isCollapsed?: boolean;
		onToggleCollapse?: () => void;
	} = $props();

	// Local state
	let showRawMessages = $state(true);
	let showPlaceholders = $state(true);
	let showSequenceIds = $state(true);
	let showEventDetails = $state(false);

	// Debug helpers
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

	function clearEvents() {
		// Emit event to parent to clear events
		const event = new CustomEvent('clearEvents');
		document.dispatchEvent(event);
	}
</script>

<div
	class="rounded-lg border border-gray-300 bg-white shadow-lg {isCollapsed
		? 'h-auto'
		: 'min-h-[500px]'} transition-all duration-300"
>
	<!-- Header -->
	<div class="flex items-center justify-between rounded-t-lg border-b bg-gray-50 p-3">
		<h3 class="text-sm font-semibold">Realtime Debug Panel</h3>
		<div class="flex items-center gap-2">
			<button class="rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300" onclick={clearEvents}>
				Clear Events
			</button>
			<button
				class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
				onclick={onToggleCollapse}
			>
				{isCollapsed ? 'Expand' : 'Collapse'}
			</button>
		</div>
	</div>

	{#if isCollapsed}
		<!-- Collapsed view - just stats -->
		<div class="space-y-2 p-3">
			<div class="grid grid-cols-2 gap-2 text-xs">
				<div class="rounded bg-blue-50 p-2">
					<div class="font-semibold text-blue-900">Status</div>
					<div class="text-blue-700">{connectionStatus}</div>
				</div>
				<div class="rounded bg-green-50 p-2">
					<div class="font-semibold text-green-900">Messages</div>
					<div class="text-green-700">{messages.length}</div>
				</div>
			</div>
			<div class="grid grid-cols-2 gap-2 text-xs">
				<div class="rounded bg-purple-50 p-2">
					<div class="font-semibold text-purple-900">Realtime</div>
					<div class="text-purple-700">{realtimeMessages.length}</div>
				</div>
				<div class="rounded bg-orange-50 p-2">
					<div class="font-semibold text-orange-900">Events</div>
					<div class="text-orange-700">{events.length}</div>
				</div>
			</div>
		</div>
	{:else}
		<!-- Expanded view - full debug interface -->
		<div class="h-full space-y-4 overflow-y-auto p-4">
			<!-- Controls -->
			<div class="rounded bg-gray-100 p-3">
				<h4 class="mb-2 text-sm font-semibold">Display Options</h4>
				<div class="flex flex-wrap gap-3 text-xs">
					<label class="flex items-center gap-1">
						<input type="checkbox" bind:checked={showRawMessages} class="scale-75" />
						Raw Events
					</label>
					<label class="flex items-center gap-1">
						<input type="checkbox" bind:checked={showPlaceholders} class="scale-75" />
						Placeholders
					</label>
					<label class="flex items-center gap-1">
						<input type="checkbox" bind:checked={showSequenceIds} class="scale-75" />
						Sequence IDs
					</label>
					<label class="flex items-center gap-1">
						<input type="checkbox" bind:checked={showEventDetails} class="scale-75" />
						Event Details
					</label>
				</div>
			</div>

			<div class="grid h-full grid-cols-2 gap-4">
				<!-- Conversation Store Messages -->
				<div class="space-y-2">
					<h4 class="text-sm font-semibold">Conversation Store ({messages.length})</h4>
					<div class="max-h-48 space-y-1 overflow-y-auto text-xs">
						{#each messages as msg, i}
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
					<div class="max-h-48 space-y-1 overflow-y-auto text-xs">
						{#each realtimeMessages as msg, i}
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

			<!-- Recent Events -->
			{#if showRawMessages}
				<div class="space-y-2">
					<h4 class="text-sm font-semibold">Recent Events (Last 10)</h4>
					<div class="max-h-32 space-y-1 overflow-y-auto text-xs">
						{#each events.slice(0, 10) as event}
							<div
								class="rounded border p-2 {event.dir === 'server' ? 'bg-blue-50' : 'bg-green-50'}"
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
			{/if}
		</div>
	{/if}
</div>
