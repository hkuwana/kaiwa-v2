# Kaiwa Implementation Guide (Svelte 5 Runes + Orchestrator Pattern)

Goal: ship fast with a small, predictable core loop, pure orchestrators, and UI runes. Use this as the source of truth while editing.

## Architecture at a glance

- Core kernel (pure): `src/lib/kernel/`
- Features (adapters + pure orchestrators): `src/lib/features/{audio,realtime,conversation}/`
- Event bus: `src/lib/shared/events/`
- UI runes stores and components: `src/lib/stores/`, `src/lib/components/`

## Svelte 5 runes rules

- Use `$state`, `$derived`, `$effect`, `$effect.pre` inside `.svelte` files (components or runes store modules compiled by Svelte). Avoid runes in plain `.ts` services.
- Keep `$derived` pure (no side effects). Use `$derived.by` for multi-line logic.
- Use `$effect` for UI side effects; return cleanup. Prefer `$effect.pre` for pre-DOM work (e.g. autoscroll).
- Do not destructure reactive proxies; access properties directly.
- When passing live state into functions, pass getters/closures.
- Use `$state.snapshot` only if an external API dislikes proxies.

Reference: Svelte 5 abridged docs `https://svelte.dev/llms-small.txt`

## Conversation kernel (pure)

- File: `src/lib/kernel/index.ts` (or `conversation.ts`)
- Responsibilities:
  - `initial(): ConversationState`
  - `transition(state, action): ConversationState`
  - `effects(state, action): Effect[]` (effects as data)
- State machine (minimal): `idle → recording → processing → speaking → idle`.

## Feature orchestrators (pure TS)

- Audio orchestrator: translates audio effects into adapter calls; emits typed events on success/failure.
- Realtime orchestrator: owns session/stream lifecycle; forwards audio chunks to the transport; emits connection/status events.
- Conversation orchestrator: optional thin coordination layer; or the UI store can coordinate directly using bus events.
- Do not use runes here. No polling. Emit events via the shared event bus.

## Event bus contracts (typed)

- Bus location: `src/lib/shared/events/`
- Define feature event names and payloads alongside the feature (e.g., `features/audio/events.ts`).
- UI runes store subscribes to these events and mutates `$state`.

## UI runes store (single source of truth for the page)

- Location: `src/lib/stores/conversation.svelte.ts` (create this)
- Inside the store:
  - `$state` for `ConversationState`
  - `$derived` for UI flags: `isRecording`, `canRecord`, `isConnected`, `messageCount`, etc.
  - `$effect` to subscribe/unsubscribe to event bus topics and update `$state`.
  - `actions` that dispatch to orchestrators (e.g., `startConversation`, `startStreaming`, `stopStreaming`, `endConversation`).

Example shape:

```ts
// src/lib/stores/conversation.svelte.ts
import { conversationCore } from '$lib/kernel';
import { audioService } from '$lib/features/audio';
import { realtimeService } from '$lib/features/realtime';
import { EventBusFactory } from '$lib/shared/events/eventBus';

export function createConversationStore() {
	const bus = EventBusFactory.create('memory');
	let state = $state(conversationCore.initial());

	const isRecording = $derived(state.status === 'recording');
	const isConnected = $derived(state.status === 'connected' || state.status === 'streaming');
	const messageCount = $derived(state.messages.length);

	$effect(() => {
		const offTranscript = bus.on('transcript.received', (t: string) => {
			state = conversationCore.transition(state, { type: 'RECEIVE_TRANSCRIPT', transcript: t });
		});
		return () => {
			offTranscript?.();
		};
	});

	async function startConversation(language = 'en', voice = 'alloy') {
		// Call realtimeService to open session; emit events; mutate state via kernel
	}

	return { state, isRecording, isConnected, messageCount, startConversation };
}
```

Note: Only stores/components use runes; services remain plain TS.

## Concrete changes to make (mapped to repo)

- `src/lib/orchestrator.ts`
  - Remove runes and polling. Either delete in favor of the runes store or convert to pure TS orchestrator.
  - Eliminate undefined members (`aiAdapter`, `kernel`, `currentState`, etc.).

- `src/lib/features/conversation/conversation-orchestrator.svelte.ts`
  - Remove runes from this file; move UI state to the runes store.
  - Do not duplicate audio control; rely on `audioService` as the single audio source. Subscribe to `audioService` events via bus.
  - Guard logs with `if (dev)`.

- `src/lib/features/audio/orchestrator.svelte.ts`
  - Use `Date.now()` or `new Date()` for timestamps (done).
  - Emit events through the shared bus; remove ad-hoc window events.
  - Keep it pure TS (no runes).

- `src/lib/features/audio/index.ts`
  - Clean surface API (done: removed stray character). Avoid re-export churn; expose minimal types, factory, and default instance.

- `src/lib/components/RealtimeConversation.svelte`
  - Consume the runes store. Keep audio visualizer lifecycle in `$effect`/`$effect.pre`.
  - Derive button states with `$derived`. Guard dev logs with `if (dev)`.

## Feature responsibilities (quick map)

- Audio
  - Input: `BrowserAudioAdapter` (MediaRecorder), realtime chunks
  - Output: `Howler` or native `AudioContext`
  - Processing: `OpenAIAudioAdapter` for STT/TTS
  - Events: `audio.chunk`, `audio.playback_started`, `audio.recording_stopped`, `audio.volume_changed`

- Realtime
  - Session create/close; WebRTC stream start/stop
  - Handles `sendAudioChunk`
  - Emits: `connection.status`, `transcript.received`, `response.received`, `error`

- Conversation
  - Kernel-driven state and effects
  - Persists exchanges when effect says `SAVE_EXCHANGE`

## Development checklist

- Kernel
  - [ ] `initial` returns minimal state
  - [ ] All transitions are pure
  - [ ] Effects returned as data only

- Audio
  - [ ] Single source of truth for recording
  - [ ] Emits typed events; no window events
  - [ ] Bitrate/codec validated for your STT

- Realtime
  - [ ] Start/stop are idempotent
  - [ ] Connection health surfaced as events

- UI store
  - [ ] No polling
  - [ ] `$derived` used for flags
  - [ ] Bus subscriptions cleaned up

- Component
  - [ ] Only view logic and tiny UX effects
  - [ ] No business logic

## Testing notes

- Unit-test kernel transitions/effects (`vitest`) — cheap confidence.
- For adapters, fake implementations behind ports for testing.
- In `dev`, keep verbose logs; in `prod`, silence non-errors.

---

This guide reflects Svelte 5 runes usage and the orchestrator pattern recommended in the Svelte docs and your internal architecture docs. Keep runes in stores/components; keep services pure; wire everything by events.
