# Refactoring Integration Guide: Keeping Messages Reactive

## The Core Problem & Solution

**Problem**: When extracting message handling logic to services, you lose the instant reactive connection with the `messages` array because stores can't import services directly.

**Solution**: Keep `messages` as reactive state in the **store**, not in services. Services provide methods and state, but the store is the single source of truth for the reactive `messages` array.

## Architecture Pattern

```
Store (Reactive State)
  ├── messages: Message[]  ← REACTIVE STATE (here, not in services!)
  ├── messageWordTimings: Record<string, SpeechTiming[]>
  ├── activeWordByMessage: Record<string, number>
  └── Services (Instantiated in constructor)
      ├── RealtimeConnectionService
      │   ├── Methods for connection lifecycle
      │   └── No message state
      │
      ├── RealtimeEventCoordinator
      │   ├── Methods for event processing
      │   ├── Internal state for commits, transcripts, etc.
      │   └── NO message state
      │
      └── RealtimeWordTimingService
          ├── Methods for timing calculation
          ├── Internal state for word timings
          └── Returns data for store to apply
```

## Key Principle: Unidirectional Data Flow

```
1. Event arrives → Service processes
2. Service determines what changed → Returns/emits change
3. Store updates reactive state → UI reactively updates
```

## Integration Steps

### 1. Update Store Constructor

```typescript
export class RealtimeOpenAIStore {
  // Reactive state - STAYS IN STORE
  messages = $state<Message[]>([]);
  messageWordTimings = $state<Record<string, SpeechTiming[]>>({});
  activeWordByMessage = $state<Record<string, number>>({});

  // Services - instantiated in constructor
  private connection: RealtimeConnectionService;
  private coordinator: RealtimeEventCoordinator;
  private wordTiming: RealtimeWordTimingService;

  constructor() {
    this.connection = new RealtimeConnectionService();
    this.coordinator = new RealtimeEventCoordinator();
    this.wordTiming = new RealtimeWordTimingService();
  }
}
```

### 2. Sync Service State to Store State

After event processing, sync service state back to store:

```typescript
// In store's event processing method
private updateReactiveStateFromServices() {
  // Sync word timing state from service
  this.messageWordTimings = this.wordTiming.messageWordTimings;
  this.activeWordByMessage = this.wordTiming.activeWordByMessage;

  // Sync deltas from coordinator
  this.assistantDelta = this.coordinator.assistantDelta;
  this.userDelta = this.coordinator.userDelta;

  // Sync connection state from service
  this.isConnected = this.connection.isConnected;
  this.availableOutputDevices = this.connection.availableOutputDevices;
  this.selectedOutputDeviceId = this.connection.selectedOutputDeviceId;
  this.outputDeviceError = this.connection.outputDeviceError;
}
```

### 3. Message Updates Flow

#### Pattern A: Service Returns Data, Store Applies

```typescript
// WordTimingService
recordAssistantWordDelta(messageId: string, deltaText: string): SpeechTiming[] | null {
  // ... calculate timings ...
  return clonedTimings;  // Return the new timings
}

// Store uses it:
const newTimings = this.wordTiming.recordAssistantWordDelta(messageId, deltaText);
if (newTimings) {
  // Store updates its own reactive messages array
  const idx = this.messages.findIndex(m => m.id === messageId);
  if (idx !== -1) {
    const updated = [...this.messages];
    updated[idx] = { ...updated[idx], speechTimings: newTimings };
    this.messages = updated;  // ← REACTIVE UPDATE HAPPENS HERE
  }
}
```

#### Pattern B: Service Processes, Store Controls

```typescript
// Coordinator queues events
this.coordinator.queueServerEvent(event);
await this.coordinator.processQueuedEvents();

// Then store checks what changed
const currentEvents = this.coordinator.getEvents();
// Apply the changes to this.messages as needed
```

## Example: Processing a Word Delta

### Current (all in store):
```typescript
private recordAssistantWordDelta(messageId: string, deltaText: string) {
  // 100+ lines of logic
  this.messageWordTimings = { ... };
  this.messages = messageService.updateStreamingMessage(this.messages, deltaText);
  // etc.
}
```

### Refactored (split between service and store):

**In WordTimingService**:
```typescript
recordAssistantWordDelta(messageId: string, deltaText: string): SpeechTiming[] | null {
  // Timing calculation logic
  const clonedTimings = buffer.map(entry => ({ ...entry }));
  this.messageWordTimings = { ...this.messageWordTimings, [messageId]: clonedTimings };
  return clonedTimings;
}
```

**In Store**:
```typescript
private recordAssistantWordDelta(messageId: string, deltaText: string) {
  // Delegate to service
  const newTimings = this.wordTiming.recordAssistantWordDelta(messageId, deltaText);

  if (newTimings) {
    // Update reactive messages with new timings
    const idx = this.messages.findIndex(m => m.id === messageId);
    if (idx !== -1) {
      const updated = [...this.messages];
      updated[idx] = { ...updated[idx], speechTimings: newTimings };
      this.messages = updated;  // ← CRITICAL: This triggers Svelte reactivity
    }
  }

  // Sync service state to store state
  this.messageWordTimings = this.wordTiming.messageWordTimings;
  this.activeWordByMessage = this.wordTiming.activeWordByMessage;
}
```

## Critical: Maintaining Reactivity

### ✅ DO THIS
```typescript
// This triggers reactivity because it's a new object assignment
this.messages = [...this.messages, newMessage];
this.messages = { ...this.messages };
this.messageWordTimings = { ...this.messageWordTimings };
```

### ❌ DON'T DO THIS
```typescript
// This doesn't trigger reactivity - it's a mutation of the same object
this.messages[0] = newMessage;  // ✗ Mutation not detected
this.messageWordTimings[messageId] = newData;  // ✗ Mutation not detected

// Also wrong - services shouldn't try to update store state directly
// (they can't import stores anyway)
storeInstance.messages = newMessages;  // ✗ Stores can't be imported in services
```

## Connection Lifecycle

### Connect Phase

```typescript
async connect(sessionData: SessionData, mediaStream: MediaStream) {
  // 1. Connection service handles setup
  const connection = await createConnectionWithSession(sessionData);
  await this.connection.connect(connection, sessionId, mediaStream);

  // 2. Sync connection state to store
  this.isConnected = this.connection.isConnected;

  // 3. Subscribe to events
  this.subscriptionId = subscribeToSession(sessionId, (event: SDKTransportEvent) => {
    this.onServerEvent(event);
  });
}

async disconnect() {
  // 1. Connection service cleanup
  await this.connection.disconnect();

  // 2. Services clear state
  this.coordinator.clearState();
  this.wordTiming.clearState();

  // 3. Store state reset
  this.messages = [];
  this.messageWordTimings = {};
  this.activeWordByMessage = {};
  this.isConnected = false;
}
```

## Event Processing Flow

```typescript
private async onServerEvent(event: SDKTransportEvent) {
  try {
    // 1. Queue event in coordinator
    this.coordinator.queueServerEvent(event);

    // 2. Process events
    await this.coordinator.processQueuedEvents();

    // 3. Handle specific event types (legacy pattern for now)
    await this.processServerEventNew(event);

    // 4. Sync all service state back to store
    this.updateReactiveStateFromServices();

  } catch (error) {
    console.error('Error processing server event:', error);
    this.setError(`Failed to process event: ${error instanceof Error ? error.message : String(error)}`);
  }
}

private updateReactiveStateFromServices() {
  // Sync timing state
  this.messageWordTimings = this.wordTiming.messageWordTimings;
  this.activeWordByMessage = this.wordTiming.activeWordByMessage;

  // Sync deltas
  this.assistantDelta = this.coordinator.assistantDelta;
  this.userDelta = this.coordinator.userDelta;

  // Sync connection state
  this.isConnected = this.connection.isConnected;
  // ... etc
}
```

## Testing the Integration

### Unit Test Example (Service)
```typescript
// wordTiming.service.test.ts
const service = new RealtimeWordTimingService();
const result = service.recordAssistantWordDelta('msg1', 'hello');
expect(result).toBeDefined();
expect(result?.length).toBeGreaterThan(0);
```

### Integration Test Example (Store)
```typescript
// realtime-openai.store.test.ts
const store = new RealtimeOpenAIStore();
store.recordAssistantWordDelta('msg1', 'hello world');
expect(store.messageWordTimings['msg1']).toBeDefined();
expect(store.messages).toBeDefined();
```

## Common Pitfalls & Solutions

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Messages not updating** | Service holds messages state | Services return data; store applies updates |
| **Lose reactivity** | Mutating objects instead of creating new ones | Always reassign: `this.messages = [...this.messages, newMsg]` |
| **Circular imports** | Services import stores | Services only provide data/methods; store creates and uses them |
| **Stale state** | Forget to sync service state | Call `updateReactiveStateFromServices()` after operations |
| **Race conditions** | Multiple event processors | Coordinator handles queueing; store coordinates |

## Summary: Why This Works

1. **Single Source of Truth**: `messages` lives only in the store
2. **Clear Data Flow**: Services compute → Store updates → UI reacts
3. **No Circular Dependencies**: Services don't import stores
4. **Svelte Reactivity Preserved**: Object reassignments trigger updates
5. **Testable Services**: No need to mock store state
6. **Maintainable**: Clear responsibility separation

## Next Steps

1. ✅ Create services (DONE)
2. ⏳ Update store constructor to instantiate services
3. ⏳ Migrate event processing to use services
4. ⏳ Keep `messages` reactive throughout
5. ⏳ Test all functionality
6. ⏳ Remove old implementations
