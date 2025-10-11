<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { realtimeOpenAI } from '$lib/stores/realtime-openai.store.svelte';
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { audioService } from '$lib/services/audio.service';
	import * as messageService from '$lib/services/message.service';
	import { DEFAULT_VOICE, type Voice } from '$lib/types/openai.realtime.types';
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import { SvelteDate } from 'svelte/reactivity';

	let stream: MediaStream | null = null;
	let deviceId = $state<string>('default');
	let devices = $state<MediaDeviceInfo[]>([]);
	const isConnected = $derived(realtimeOpenAI.isConnected);
	const error = $derived(realtimeOpenAI.error);

	const aiResponse = $derived(realtimeOpenAI.aiResponse);
	const assistantDelta = $derived(realtimeOpenAI.assistantDelta);
	const userDelta = $derived(realtimeOpenAI.userDelta);
	const realtimeMessages = $derived(realtimeOpenAI.messages);
	const conversationMessages = $derived(conversationStore.messages);
	const events = $derived(realtimeOpenAI.events);
	const wordTimingMap = $derived(realtimeOpenAI.messageWordTimings);
	const activeWordMap = $derived(realtimeOpenAI.activeWordByMessage);

	const voice: Voice = DEFAULT_VOICE;
	let lang = $state<string>('en');

	onMount(async () => {
		await audioService.initialize();
		devices = await audioService.getAvailableDevices();
	});

	onDestroy(() => {
		messageUnsub?.();
		realtimeOpenAI.disconnect().catch(() => {});
		if (stream) stream.getTracks().forEach((t) => t.stop());
	});

	async function connect() {
		try {
			realtimeOpenAI.clearError();
			stream = await audioService.getStream(deviceId);
			const sessionId = crypto.randomUUID();
			const res = await fetch('/api/features/transcribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId, model: 'gpt-realtime', voice })
			});
			if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
			const sessionData = await res.json();
			await realtimeOpenAI.connect(sessionData, stream!, {
				model: 'gpt-realtime',
				voice,
				transcriptionLanguage: lang
			});

			// For testing: manually mirror messages from realtimeOpenAI to conversationStore
			// This simulates what happens in the normal conversation flow
			setupMessageMirroring();
		} catch (e) {
			realtimeOpenAI.setError(e instanceof Error ? e.message : 'Connect failed');
		}
	}

	async function disconnect() {
		messageUnsub?.();
		messageUnsub = null;
		await realtimeOpenAI.disconnect();
	}

	function pttStart() {
		if (!stream) return;
		realtimeOpenAI.pttStart(stream);
	}
	function pttStop() {
		if (!stream) return;
		realtimeOpenAI.pttStop(stream);
	}
	function triggerResponse() {
		realtimeOpenAI.sendResponse();
	}
	function clearAll() {
		messageUnsub?.();
		messageUnsub = null;
		realtimeOpenAI.clearError();
		realtimeOpenAI.clearAiResponse();
		realtimeOpenAI.clearDeltas();
		realtimeOpenAI.clearWordTimingState();
		realtimeOpenAI.clearEvents();
		// Also reset conversation store messages for testing
		conversationStore.reset();
	}

	function applyLanguage() {
		realtimeOpenAI.updateSessionConfig({ transcriptionLanguage: lang });
	}

	let messageUnsub: (() => void) | null = null;

	function setupMessageMirroring() {
		// Clean up any existing subscription
		messageUnsub?.();

		// Mirror messages from realtimeOpenAI to conversationStore
		messageUnsub = realtimeOpenAI.onMessageStream(async (_ev) => {
			// Mirror: copy realtime messages directly (simplified version)
			conversationStore.messages = messageService.sortMessagesBySequence([
				...realtimeOpenAI.messages
			]);
		});
	}
</script>

<div class="mx-auto max-w-3xl space-y-4 p-6">
	<h1 class="text-2xl font-bold">Realtime SDK Dev Test</h1>

	<div class="flex items-center gap-2">
		<select class="select-bordered select" bind:value={deviceId}>
			<option value="default">Default Mic</option>
			{#each devices as d}
				<option value={d.deviceId}>{d.label || d.deviceId}</option>
			{/each}
		</select>
		<input class="input-bordered input w-32" placeholder="lang (e.g. en)" bind:value={lang} />
		<button class="btn btn-outline" onclick={applyLanguage} disabled={!isConnected}>Set Lang</button
		>
		{#if !isConnected}
			<button class="btn btn-primary" onclick={connect}>Connect</button>
		{:else}
			<button class="btn" onclick={disconnect}>Disconnect</button>
		{/if}
		<button class="btn btn-ghost" onclick={clearAll}>Clear</button>
	</div>

	{#if error}
		<div class="alert alert-error">
			<span>{error}</span>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4">
		<div class="grid grid-cols-2 gap-4">
			<div class="card bg-base-200 p-4">
				<h3 class="mb-2 font-semibold">RealtimeOpenAI Messages ({realtimeMessages.length})</h3>
				{#if realtimeMessages.length === 0}
					<div class="text-sm opacity-60">No messages yet…</div>
				{:else}
					<div class="space-y-3" role="list">
						{#each realtimeMessages as m (m.id)}
							<MessageBubble
								message={m}
								wordTimings={wordTimingMap[m.id] ?? []}
								activeWordIndex={activeWordMap[m.id] ?? -1}
							/>
						{/each}
					</div>
				{/if}
			</div>
			<div class="card bg-base-200 p-4">
				<h3 class="mb-2 font-semibold">
					ConversationStore Messages ({conversationMessages.length})
				</h3>
				{#if conversationMessages.length === 0}
					<div class="text-sm opacity-60">No messages yet…</div>
				{:else}
					<div class="space-y-3" role="list">
						{#each conversationMessages as m (m.id)}
							<MessageBubble
								message={m}
								wordTimings={wordTimingMap[m.id] ?? []}
								activeWordIndex={activeWordMap[m.id] ?? -1}
							/>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		<div class="card bg-base-200 p-4">
			<h3 class="mb-2 font-semibold">User Transcript (streaming)</h3>
			<pre class="text-sm whitespace-pre-wrap">{userDelta}</pre>
		</div>

		<div class="card bg-base-200 p-4">
			<h3 class="mb-2 font-semibold">Assistant (streaming)</h3>
			<pre class="text-sm whitespace-pre-wrap">{assistantDelta}</pre>
		</div>

		<div class="card bg-base-200 p-4">
			<h3 class="mb-2 font-semibold">Assistant (final)</h3>
			<pre class="text-sm whitespace-pre-wrap">{aiResponse}</pre>
		</div>
	</div>

	<div class="flex gap-2">
		<button class="btn" disabled={!isConnected} onclick={pttStart}>PTT Start</button>
		<button class="btn" disabled={!isConnected} onclick={pttStop}>PTT Stop</button>
		<button class="btn btn-secondary" disabled={!isConnected} onclick={triggerResponse}
			>Force Response</button
		>
	</div>

	<div class="mt-6">
		<h3 class="mb-2 font-semibold">Raw Events (latest 100)</h3>
		<div class="max-h-96 overflow-auto rounded border">
			{#each events as e, i (i)}
				<div class="border-b px-3 py-2 text-xs">
					<div class="opacity-70">
						[{new SvelteDate(e.ts).toLocaleTimeString()}] {e.dir.toUpperCase()} • {e.type}
					</div>
					<pre class="whitespace-pre-wrap">{JSON.stringify(e.payload, null, 2)}</pre>
				</div>
			{/each}
			{#if events.length === 0}
				<div class="p-3 text-sm opacity-60">No events yet…</div>
			{/if}
		</div>
	</div>

	<div class="card mt-6 bg-base-200 p-4">
		<h3 class="mb-2 font-semibold">Realtime Word Highlight Flow</h3>
		<pre class="text-xs leading-5 whitespace-pre-wrap">
Audio/Text Events ─▶ realtimeOpenAI.processServerEventOrdered
    │
    ├─ text delta ──▶ recordAssistantWordDelta ──▶ messageWordTimings[state]
    │                                        │
    │                                        └─▶ messages[] (speechTimings)
    │
    ├─ audio delta ─▶ handleAssistantAudioDelta ─┐
    │                                           ├─▶ finalizeAssistantWordTimings
    └─ audio done  ─▶ handleAssistantAudioDone ─┘        │
                                                        └─▶ alignment log (events)

UI Bindings ─▶ MessageBubble ─▶ WordSyncedText ─▶ Active word highlight
		</pre>
	</div>

	<div class="card mt-6 space-y-6 bg-base-200 p-4">
		<div>
			<h3 class="mb-2 font-semibold">Realtime Word Highlight Flow</h3>
			<pre class="bg-base-100 p-3 text-xs leading-5 whitespace-pre-wrap">
Audio/Text Events ─▶ realtimeOpenAI.processServerEventOrdered
    │
    ├─ text delta ──▶ recordAssistantWordDelta ──▶ messageWordTimings[state]
    │                                        │
    │                                        └─▶ messages[] (speechTimings)
    │
    ├─ audio delta ─▶ handleAssistantAudioDelta ─┐
    │                                           ├─▶ finalizeAssistantWordTimings
    └─ audio done  ─▶ handleAssistantAudioDone ─┘        │
                                                        └─▶ alignment log (events)

UI Bindings ─▶ MessageBubble ─▶ WordSyncedText ─▶ Active word highlight
		</pre>
		</div>

		<div>
			<h3 class="mb-2 font-semibold">Next Steps / Plan</h3>
			<ul class="list-disc space-y-1 pl-5 text-sm">
				<li>Create dedicated <code>WordTimingController</code> module to own timing state.</li>
				<li>
					Subscribe to <code>audioElement</code> (<code>playing/timeupdate/ended</code>) and drive
					word highlights from the actual playback clock.
				</li>
				<li>
					Store <code>itemId → messageId</code> mapping so audio deltas resolve to the correct conversation
					entry.
				</li>
				<li>
					Persist <code>speechTimings</code> only when final timings exist (avoid zero-duration rows).
				</li>
				<li>
					Validate behaviour against OpenAI realtime events (<a
						class="link"
						href="https://platform.openai.com/docs/api-reference/realtime"
						target="_blank"
						rel="noreferrer">API docs</a
					>) and SDK internals (<a
						class="link"
						href="https://github.com/openai/openai-realtime-agents"
						target="_blank"
						rel="noreferrer">openai-realtime-agents</a
					>).
				</li>
			</ul>
		</div>
	</div>
</div>

<style>
	.card {
		border-radius: 0.75rem;
	}
</style>
