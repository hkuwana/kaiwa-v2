# Store Integration Example: Step-by-Step

This shows the key parts of how to update `realtime-openai.store.svelte.ts` to use the services while **keeping messages reactive**.

## 1. Constructor: Initialize Services

```typescript
import { RealtimeConnectionService } from '$lib/services/realtime-connection.service';
import { RealtimeEventCoordinator } from '$lib/services/realtime-event-coordinator.service';
import { RealtimeWordTimingService } from '$lib/services/realtime-word-timing.service';

export class RealtimeOpenAIStore {
  // Reactive state - MUST STAY IN STORE
  messages = $state<Message[]>([]);
  messageWordTimings = $state<Record<string, SpeechTiming[]>>({});
  activeWordByMessage = $state<Record<string, number>>({});

  // Services - instantiated here
  private connection: RealtimeConnectionService;
  private coordinator: RealtimeEventCoordinator;
  private wordTiming: RealtimeWordTimingService;

  constructor() {
    if (browser) {
      const testAudio = document.createElement('audio');
      try {
        const candidate = testAudio as unknown as { setSinkId?: (id: string) => Promise<void> };
        this.outputSelectionSupported = typeof candidate.setSinkId === 'function';
      } catch {
        this.outputSelectionSupported = false;
      } finally {
        testAudio.remove();
      }
    }

    // Initialize services
    this.connection = new RealtimeConnectionService();
    this.coordinator = new RealtimeEventCoordinator();
    this.wordTiming = new RealtimeWordTimingService();
  }
}
```

## 2. Connection Methods: Delegate to Service

```typescript
async connect(sessionData: SessionData, mediaStream: MediaStream) {
  try {
    this.error = null;

    // Create connection
    const connection = await createConnectionWithSession(sessionData);
    this.sessionId = connection.sessionId || '';
    this.sessionStartMs = Date.now();

    // Let connection service handle device setup
    await this.connection.connect(connection, this.sessionId, mediaStream);

    // Sync connection state to store
    this.isConnected = this.connection.isConnected;
    this.availableOutputDevices = this.connection.availableOutputDevices;
    this.selectedOutputDeviceId = this.connection.selectedOutputDeviceId;

    // Subscribe to events
    const unsubscribe = subscribeToSession(this.sessionId, (event: SDKTransportEvent) => {
      this.onServerEvent(event);
    });

    this.subscriptionId = unsubscribe;

  } catch (error) {
    this.setError(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

async disconnect() {
  try {
    // Unsubscribe from events
    if (this.subscriptionId) {
      this.subscriptionId();
      this.subscriptionId = undefined;
    }

    // Let services clean up
    await this.connection.disconnect();
    this.coordinator.clearState();
    this.wordTiming.clearState();

    // Reset store state
    this.messages = [];
    this.messageWordTimings = {};
    this.activeWordByMessage = {};
    this.isConnected = false;
    this.assistantDelta = '';
    this.userDelta = '';

  } catch (error) {
    console.error('Error during disconnect:', error);
  }
}
```

## 3. Audio Device Methods: Delegate to Service

```typescript
async refreshOutputDevices() {
  try {
    await this.connection.refreshOutputDevices();
    this.availableOutputDevices = this.connection.availableOutputDevices;
    this.outputDeviceError = this.connection.outputDeviceError;
  } catch (error) {
    this.outputDeviceError = `Failed to refresh devices: ${String(error)}`;
  }
}

async setOutputDevice(deviceId: string) {
  try {
    await this.connection.setOutputDevice(deviceId);
    this.selectedOutputDeviceId = this.connection.selectedOutputDeviceId;
    this.outputDeviceError = this.connection.outputDeviceError;
  } catch (error) {
    this.outputDeviceError = `Failed to set output device: ${String(error)}`;
  }
}

canSelectOutputDevice() {
  return this.connection.canSelectOutputDevice();
}

getAudioOutputDebugInfo() {
  return this.connection.getAudioOutputDebugInfo();
}

onSessionReady(fn: () => void): () => void {
  return this.connection.onSessionReady(fn);
}
```

## 4. Event Processing: The Critical Part

This is where you maintain reactivity. The key is to update `this.messages` directly.

```typescript
private async onServerEvent(event: SDKTransportEvent) {
  try {
    // 1. Let coordinator queue and process the event
    this.coordinator.queueServerEvent(event);
    await this.coordinator.processQueuedEvents();

    // 2. Process specific event types for message updates
    const processed = this.processServerEventNew(event);

    // 3. Handle based on type
    if (processed.type === 'transcription') {
      await this.handleTranscriptionProcessed(processed.data, event);
    } else if (processed.type === 'message') {
      await this.handleMessageProcessed(processed.data, event);
    }

    // 4. Sync service state to store (CRITICAL!)
    this.updateReactiveStateFromServices();

  } catch (error) {
    console.error('Error processing server event:', error);
  }
}

/**
 * CRITICAL: Sync service state back to store after every operation
 * This is what keeps messages reactive
 */
private updateReactiveStateFromServices() {
  // Sync word timing from service
  this.messageWordTimings = this.wordTiming.messageWordTimings;
  this.activeWordByMessage = this.wordTiming.activeWordByMessage;

  // Sync deltas from coordinator
  this.assistantDelta = this.coordinator.assistantDelta;
  this.userDelta = this.coordinator.userDelta;

  // Sync connection state
  this.isConnected = this.connection.isConnected;
  this.availableOutputDevices = this.connection.availableOutputDevices;
  this.selectedOutputDeviceId = this.connection.selectedOutputDeviceId;
  this.outputDeviceError = this.connection.outputDeviceError;
}
```

## 5. Word Timing: Service Returns Data, Store Applies

The service calculates timings, the store updates messages with them.

```typescript
private recordAssistantWordDelta(messageId: string, deltaText: string) {
  // Let service calculate the timings
  const newTimings = this.wordTiming.recordAssistantWordDelta(messageId, deltaText);

  if (newTimings) {
    // CRITICAL: Update the reactive messages array
    // This is what keeps the UI in sync
    const idx = this.messages.findIndex(m => m.id === messageId);
    if (idx !== -1) {
      const updated = [...this.messages];
      updated[idx] = { ...updated[idx], speechTimings: newTimings };
      this.messages = updated;  // ← REACTIVITY HAPPENS HERE
    }
  }

  // Then sync service state
  this.messageWordTimings = this.wordTiming.messageWordTimings;
  this.activeWordByMessage = this.wordTiming.activeWordByMessage;
}

private finalizeAssistantWordTimings(messageId: string, totalDurationMs?: number | null) {
  // Let service finalize the timings
  const finalBuffer = this.wordTiming.finalizeAssistantWordTimings(messageId, totalDurationMs);

  if (finalBuffer) {
    // Update messages with finalized timings
    const idx = this.messages.findIndex(m => m.id === messageId);
    if (idx !== -1) {
      const updated = [...this.messages];
      updated[idx] = { ...updated[idx], speechTimings: finalBuffer };
      this.messages = updated;  // ← REACTIVITY
    }
  }

  // Sync service state
  this.messageWordTimings = this.wordTiming.messageWordTimings;
}
```

## 6. Message Updates: Use messageService Helper

The `messageService` helpers still work - they're pure functions that transform message arrays.

```typescript
private async handleTranscriptionProcessed(data: any, event: SDKTransportEvent) {
  const itemId = (event as any)?.item_id;

  if (data.type === 'user_transcript') {
    // Use messageService helper to update messages
    // This returns a new array, so we can apply reactivity

    if (!data.isFinal) {
      // Create placeholder if needed
      if (!this.messages.some(m => m.id.startsWith('user_input_'))) {
        const placeholder = messageService.createUserPlaceholder(this.sessionId);
        this.messages = [...this.messages, placeholder];
      }

      // Update with partial transcript
      this.userDelta += data.text;
      this.messages = messageService.updatePlaceholderWithPartial(
        this.messages,
        data.text
      );
    } else {
      // Finalize user message
      this.messages = messageService.replaceUserPlaceholderWithFinal(
        this.messages,
        itemId,
        data.text
      );
    }
  }
}

private async handleMessageProcessed(data: any, event: SDKTransportEvent) {
  if (data.type === 'assistant_delta') {
    // Update assistant streaming message
    this.assistantDelta += data.text;

    // Check for existing streaming message
    const hasStreaming = this.messages.some(m => m.role === 'assistant' && m.id.startsWith('streaming_'));

    if (!hasStreaming) {
      // Create streaming placeholder
      const streaming = messageService.createStreamingMessage('', this.sessionId);
      this.messages = [...this.messages, streaming];
    }

    // Update streaming message
    this.messages = messageService.updateStreamingMessage(this.messages, data.text);

    // Record word timing for this delta
    const streamingMsg = this.messages.find(m => m.role === 'assistant' && m.id.startsWith('streaming_'));
    if (streamingMsg) {
      this.recordAssistantWordDelta(streamingMsg.id, data.text);
    }
  }
}
```

## 7. Configuration Methods: Delegate to Coordinator

```typescript
async updateSessionConfig(config: SessionConfig) {
  try {
    this.coordinator.updateSessionConfig(config);
    // ... rest of configuration logic
  } catch (error) {
    this.setError(`Failed to update config: ${String(error)}`);
  }
}

setTranscriptFilter(filter: any) {
  this.coordinator.setTranscriptFilter(filter);
}
```

## 8. Cleanup Methods: Use Service Methods

```typescript
clearWordTimingState() {
  this.wordTiming.clearState();
  this.messageWordTimings = {};
  this.activeWordByMessage = {};
}

clearEvents() {
  const events = this.coordinator.getEvents();
  // Can access events if needed
}
```

## Key Points to Remember

1. **Messages stay in the store**: Always update `this.messages` directly, not in services
2. **Sync after operations**: Call `updateReactiveStateFromServices()` after service operations
3. **Use object spread**: `this.messages = [...this.messages, newMsg]` triggers reactivity
4. **Services are computation**: They compute values, the store applies them
5. **One-way flow**: Events → Services process → Store updates → UI reacts

## Migration Checklist

- [ ] Add service imports to store
- [ ] Initialize services in constructor
- [ ] Update `connect()` to use connection service
- [ ] Update `disconnect()` to clear services
- [ ] Update audio device methods to delegate
- [ ] Update event processing to queue/process in coordinator
- [ ] Add `updateReactiveStateFromServices()` calls
- [ ] Update word delta recording to use service
- [ ] Update word finalization to use service
- [ ] Test messages update in real-time
- [ ] Verify no stale state issues
- [ ] Remove old implementation code
