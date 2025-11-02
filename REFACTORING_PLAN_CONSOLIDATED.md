# Realtime OpenAI Store Refactoring Plan (Consolidated Approach)

## Current State

- **File**: `src/lib/stores/realtime-openai.store.svelte.ts`
- **Size**: ~1917 lines
- **Problem**: 9 overlapping concerns mixed together, difficult to test and maintain
- **Target**: ~350-400 lines main store + 3 focused services + pure functions

---

## Philosophy: Consolidation Over Service Proliferation

**Why NOT 8 services?**
- Too many files to navigate (context switching)
- Excessive delegation boilerplate in the store
- Hard to coordinate related state across services
- Services become "god services" anyway (e.g., EventProcessor + MessageStreaming are inseparable)

**Why 3 services?**
- Clear boundaries: Connection, Coordination, Timing
- Each service owns its state
- Only methods that need to interact with each other are in the same service
- Services can be tested independently

---

## Architecture: 3-Service Design

### Service 1: RealtimeConnectionService (~150 lines)

**File**: `src/lib/services/realtime-connection.service.ts`

**Responsibility**: Session lifecycle and audio device management

**Methods**:
```typescript
export class RealtimeConnectionService {
  // Public
  connect(sessionData, mediaStream, options?): Promise<SessionConnection>
  disconnect(): void
  refreshOutputDevices(): Promise<void>
  setOutputDevice(deviceId: string): Promise<void>
  canSelectOutputDevice(): boolean
  getAudioOutputDebugInfo(): AudioOutputDebugInfo
  onSessionReady(callback: () => void): () => void

  // Private
  private handleSessionReady(): void
  private applySelectedOutputDevice(): Promise<void>

  // State
  public isConnected: boolean
  public selectedOutputDeviceId: string
  public availableOutputDevices: MediaDeviceInfo[]
  public outputDeviceError: string | null

  private connection: SessionConnection | null
  private sessionId: string
  private sessionReadyListeners: SvelteSet<() => void>
  private outputSelectionSupported: boolean
}
```

---

### Service 2: RealtimeEventCoordinator (~500 lines)

**File**: `src/lib/services/realtime-event-coordinator.service.ts`

**Responsibility**: The coordination hub—event processing, transcript finalization, commit tracking, response creation

This is where the complexity lives because these concerns are tightly coupled:
- Events trigger transcripts
- Transcripts trigger commits
- Commits wait for ACKs
- ACKs + transcripts trigger responses

**Methods**:
```typescript
export class RealtimeEventCoordinator {
  // Public
  updateSessionConfig(config: SessionConfig, connection: SessionConnection): void
  schedulePendingTranscript(itemId: string, role: 'user' | 'assistant', text: string): void
  resolveCommitItem(itemId: string): void
  setTranscriptFilter(filter: TranscriptFilter | null): void

  // Internal delegation (from store)
  async processServerEvent(event: SDKTransportEvent): Promise<void>

  // Private event pipeline
  private queueEvent(event: SDKTransportEvent): void
  private processEventQueue(): Promise<void>
  private processServerEventOrdered(event: SDKTransportEvent): Promise<void>
  private processServerEventNew(event: SDKTransportEvent): ProcessedEvent

  // Private transcript flow
  private finalizeTranscriptMessage(itemId: string, role: 'user' | 'assistant', text: string): void
  private flushPendingTranscript(itemId: string): void

  // Private commit coordination
  private findCommitByItemId(itemId: string): PendingCommitEntry | null
  private getOrAssignCommitForTranscript(itemId: string, role: string): PendingCommitEntry
  private maybeSendResponseForCommit(commit: PendingCommitEntry, reason: string): void
  private trackConversationItem(itemId: string, role: 'user' | 'assistant', text: string): void

  // Private config
  private shouldSendSessionUpdate(newInstructions: string): boolean

  // State: Reactive (delegates to store)
  public messages: Message[]
  public userDelta: string
  public assistantDelta: string

  // State: Internal
  private eventQueue: Array<{event: SDKTransportEvent; timestamp: number}>
  private processingEvents: boolean
  private events: Array<{dir: 'server' | 'client'; type: string; payload: any; ts: number}>
  private debug: boolean

  private finalizedItemIds: SvelteSet<string>
  private pendingFinalTranscripts: Record<string, {role: string; text: string; receivedAt: number; timeoutId: ReturnType<typeof setTimeout>}>
  private historyText: Record<string, string>

  private pendingCommits: PendingCommitEntry[]
  private conversationItems: Array<{itemId: string; role: 'user' | 'assistant'; text: string}>
  private transcriptFilter: TranscriptFilter | null

  private currentInstructions: string | null
  private lastSessionUpdateInstructions: string | null
  private lastSessionUpdateTime: number
  private readonly SESSION_UPDATE_COOLDOWN_MS = 1000
}
```

---

### Service 3: RealtimeWordTimingService (~250 lines)

**File**: `src/lib/services/realtime-word-timing.service.ts`

**Responsibility**: Word-level timing computation and audio duration tracking

**Methods**:
```typescript
export class RealtimeWordTimingService {
  // Public
  clearState(): void

  // Internal delegation (from store)
  recordAssistantWordDelta(messageId: string, deltaText: string): void
  finalizeAssistantWordTimings(messageId: string, totalDurationMs?: number | null): void
  handleAssistantAudioDelta(event: SDKTransportEvent): void
  handleAssistantAudioDone(event: SDKTransportEvent): void
  promoteWordTimingKey(oldId: string, newId: string): void

  // Private
  private ensureWordTracking(messageId: string): void
  private extractAudioDurationMs(event: SDKTransportEvent): number | null

  // State
  public messageWordTimings: Record<string, SpeechTiming[]>
  public activeWordByMessage: Record<string, number>

  private wordTimingBuffers: Record<string, SpeechTiming[]>
  private wordCharOffsetByMessage: Record<string, number>
  private currentAssistantMessageId: string | null
  private finalizedWordTimings: SvelteSet<string>
  private assistantAudioTracking: {
    messageId: string | null
    startEpochMs: number | null
    accumulatedMs: number
    totalDurationMs: number | null
  }

  private outputAudioFormat: RealtimeAudioFormatDefinition
  private outputSampleRate: number
  private outputAudioChannels: number
  private readonly DEFAULT_WORD_DURATION_MS = 220
}
```

---

## Pure Functions (Keep in Helpers)

These are stateless utilities that transform data. Keep them as pure functions:

### Existing: `src/lib/services/realtime-audio.helper.service.ts`
- `captureOutputAudioConfig()`
- `estimateDurationFromBase64()`
- `estimateDurationFromByteLength()`

### Existing: `src/lib/services/realtime-transcript.helper.service.ts`
- `normalizeTranscript(text: string): string`
- `estimateWordDuration(text: string): number`

### New: `src/lib/services/realtime-message.helpers.ts` (~50 lines)
```typescript
// Pure data transformations
export function extractMessageText(content: ContentBlock[]): string | null

export function classifyServerEvent(event: SDKTransportEvent):
  'transcription' | 'message' | 'connection_state' | 'ignore'

// Used by RealtimeWordTimingService
export function extractAudioDurationMs(
  event: SDKTransportEvent,
  format: RealtimeAudioFormatDefinition,
  sampleRate: number,
  channels: number
): number | null

// Used by RealtimeEventCoordinator for event logging
export function logEvent(dir: 'server' | 'client', type: string, payload: any): {dir, type, payload, ts}
```

---

## Main Store Structure (~350-400 lines)

**File**: `src/lib/stores/realtime-openai.store.svelte.ts` (refactored)

```typescript
export class RealtimeOpenAIStore {
  // Services
  private connection: RealtimeConnectionService
  private coordinator: RealtimeEventCoordinator
  private wordTiming: RealtimeWordTimingService

  // ===== UI STATE (Reactive) =====
  isConnected: boolean         // from connection service
  error: string | null
  aiResponse: string | null
  assistantDelta: string       // from coordinator
  userDelta: string            // from coordinator
  conversationContext: ConversationContext | null

  // Audio device state (from connection service)
  availableOutputDevices: MediaDeviceInfo[]
  selectedOutputDeviceId: string
  outputDeviceError: string | null

  // Message state (from coordinator + wordTiming service)
  messages: Message[]          // delegated from coordinator
  messageWordTimings: Record<string, SpeechTiming[]>  // from wordTiming
  activeWordByMessage: Record<string, number>  // from wordTiming

  // ===== PUBLIC API =====

  // Connection (delegate to service)
  async connect(sessionData, mediaStream, options?) { }
  async disconnect() { }

  // Audio devices (delegate to service)
  async refreshOutputDevices() { }
  async setOutputDevice(deviceId) { }
  canSelectOutputDevice() { }
  getAudioOutputDebugInfo() { }

  // Configuration (delegate to coordinator)
  async updateSessionConfig(config) { }
  setTranscriptFilter(filter) { }
  setConversationContext(context) { }

  // PTT control (simple logic)
  pttStart(mediaStream) {
    // Clear counter, enable audio tracks
  }
  pttStop(mediaStream) {
    // Dedup check, schedule commit with delay
  }
  setPttStopDelay(delayMs) { }

  // Response (delegate to coordinator)
  sendResponse() { this.coordinator.sendResponse() }
  sendTextMessage(text) { }

  // Events
  onSessionReady(fn) { return this.connection.onSessionReady(fn) }
  onMessageStream(fn) { }

  // UI Helpers
  clearError() { }
  setError(msg) { }
  clearAiResponse() { }
  setAiResponse(text) { }
  clearDeltas() { }
  enableDebug(v) { }
  clearEvents() { }

  // Word timing (delegate to service)
  clearWordTimingState() { return this.wordTiming.clearState() }

  // ===== PRIVATE STATE (Session Lifecycle) =====

  private pttStartCallCounter: number
  private pttStopCallCounter: number
  private lastPttStopTime: number
  private pttStopDelayMs: number
  private pendingPttStopTimeout: ReturnType<typeof setTimeout> | null
  private transcriptPendingTimeouts: SvelteMap<string, ReturnType<typeof setTimeout>>

  // ===== PRIVATE EVENT ROUTING =====

  // Called by coordinator when event arrives
  private onServerEvent(event: SDKTransportEvent) { }

  // Initialize services
  private constructor() { }
}
```

---

## Line Count Comparison

| Component | Original | Consolidated | Notes |
|-----------|----------|--------------|-------|
| Main Store | 1917 | 350-400 | Delegates to services, orchestrates |
| RealtimeConnectionService | — | 150 | New (extracted connection logic) |
| RealtimeEventCoordinator | — | 500 | New (extracted event + transcript + commit logic) |
| RealtimeWordTimingService | — | 250 | New (extracted word timing + audio logic) |
| Pure Functions | — | 50 | New helper module for pure transformations |
| Existing Helpers | ~100 | ~100 | No change (already pure functions) |
| **TOTAL** | **1917** | **~1400** | **~500 lines saved, much better organized** |

---

## Why This Works Better

1. **Clear Ownership**
   - Connection service owns device state
   - Coordinator owns message/commit coordination
   - Word timing owns speech timings
   - Store owns UI state and orchestration

2. **Tight Coupling Where It Matters**
   - Event processing, transcripts, and commits are tightly coupled → same service
   - Word timing is independent → own service
   - Connection is independent → own service

3. **No Service Proliferation**
   - 3 services instead of 8
   - Less file navigation
   - Less mental overhead

4. **Stateless Pure Functions**
   - Help functions remain pure (testable, composable)
   - No hidden state management
   - Easy to understand and reuse

5. **Better Testing**
   - Each service can be tested in isolation
   - Pure functions can be unit tested
   - Store integration tests are minimal

---

## Migration Strategy

### Phase 1: Extract Services (Low Risk)
1. Create `RealtimeConnectionService` with extracted methods
2. Create `RealtimeEventCoordinator` with event pipeline + transcript + commit logic
3. Create `RealtimeWordTimingService` with timing logic
4. Create `realtime-message.helpers.ts` with pure functions
5. Keep original methods in store (backward compatible)

### Phase 2: Refactor Store (Medium Risk)
1. Replace internal implementations with service delegations
2. Update reactive state getters to return from services
3. Test public API still works
4. Ensure event routing works correctly

### Phase 3: Cleanup (Low Risk)
1. Remove duplicate code from store
2. Verify all tests pass
3. Remove old implementation methods
4. Add JSDoc comments

---

## Benefits

1. **Maintainability**: Each service owns one concern
2. **Testability**: Services can be tested independently
3. **Debuggability**: Bugs live in specific services
4. **Reusability**: Services can be used in other contexts
5. **Performance**: No overhead (same runtime cost)
6. **Developer Experience**: Clear file organization, easy to find code
7. **Type Safety**: Clear interfaces for each service

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Coordinator becomes too large | Medium | Split if > 600 lines, but aim for 500 |
| State sync issues | Low | Services own their state, clear getters |
| Event routing breaks | Low | Comprehensive integration tests |
| Performance regression | Very Low | No additional operations, same algorithms |

---

## File Organization After Refactoring

```
src/lib/services/
  realtime-connection.service.ts          (150 lines)
  realtime-event-coordinator.service.ts   (500 lines)
  realtime-word-timing.service.ts         (250 lines)
  realtime-message.helpers.ts             (50 lines)
  realtime-audio.helper.service.ts        (unchanged)
  realtime-transcript.helper.service.ts   (unchanged)
  realtime-agents.service.ts              (unchanged)

src/lib/stores/
  realtime-openai.store.svelte.ts         (350-400 lines, refactored)

src/lib/types/
  realtime-services.types.ts              (types for services)
```

---

## Success Criteria

- ✅ Main store reduced to ~350-400 lines
- ✅ Each service has single responsibility
- ✅ All tests pass
- ✅ Public API remains unchanged
- ✅ No performance regression
- ✅ Code is easier to understand and modify
