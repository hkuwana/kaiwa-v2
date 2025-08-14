# 🚀 Feature Development Guide

> **Core Principle**: Build features in isolation using event-driven communication and comprehensive testing.

---

## 🧠 Functional Programming Foundation

### Why Functional Programming for Kaiwa?

## 🗄️ Data Access Layer

### Repository Pattern

All database operations in Kaiwa go through **repository classes** that implement CRUD principles:

```typescript
// ✅ GOOD: Use repository pattern
import { userRepository } from '$lib/server/repositories';

const user = await userRepository.findUserById(userId);
const newUser = await userRepository.createUser(userData);
```

```typescript
// ❌ BAD: Direct database access
import { db } from '$lib/server/db';
const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
```

### Repository Benefits

- **Consistent data access** across all features
- **Type-safe operations** with proper interfaces  
- **Centralized business logic** for data operations
- **Easy testing** with mock repositories
- **Database agnostic** - can swap implementations

### Available Repositories

- `userRepository` - User management and authentication
- `conversationRepository` - Conversations and messages
- `scenarioRepository` - Learning scenarios and outcomes
- `languageRepository` - Languages and speakers

**Kaiwa's Core Challenge**: Build a real-time conversation app that feels magical but doesn't break under complexity.

**Traditional OOP Approach** (What we moved away from):

```typescript
❌ BAD: The old way
class ConversationManager {
 private audioService: AudioService;
 private aiService: AIService;
 private state: any = {};

 async startRecording() {
  this.state.recording = true;
  this.audioService.start();
  // State mutations everywhere!
  // Hard to test, hard to debug
 }
}
```

**Functional Approach** (What we're building):

```typescript
✅ GOOD: The new way
// Pure functions - predictable, testable, composable
const conversationCore = {
 transition: (state, action) => newState,  // Pure function
 effects: (state, action) => [...effects]  // Side effects as data
};
```

### Why This Matters for Kaiwa

1. **Real-time Audio**: Audio recording/playback has many edge cases - functional programming makes them predictable
2. **AI Integration**: API calls can fail - functional error handling makes this safe
3. **7-Day Sprint**: We need to move fast without breaking things
4. **Future Growth**: Clean architecture means we can add features without rewriting

### Core Functional Concepts

#### 1. **Pure Functions** - The Foundation

```typescript
// ❌ IMPURE: Hard to test, unpredictable
function formatDuration(ms: number): string {
 console.log('Formatting:', ms); // Side effect!
 return Math.floor(ms / 1000) + 's';
}

// ✅ PURE: Same input always gives same output
function formatDuration(ms: number): string {
 if (ms < 0) return '0s'; // Handle edge cases
 const seconds = Math.floor(ms / 1000);
 return seconds + 's';
}

// Easy to test:
expect(formatDuration(5000)).toBe('5s'); // Always works!
```

**Why this helps Kaiwa**: Audio timestamps, conversation durations, user progress - all need to be calculated reliably.

#### 2. **Result Types** - Safe Error Handling

```typescript
// Instead of try/catch everywhere, we use Result types
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

// Example: Safe audio recording
async function startRecording(): Promise<Result<MediaRecorder, string>> {
 try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  return { success: true, data: recorder };
 } catch (error) {
  return { success: false, error: 'Microphone access denied' };
 }
}

// Usage - no more unexpected crashes!
const recordingResult = await startRecording();
if (recordingResult.success) {
 // Safe to use recorder
 const recorder = recordingResult.data;
} else {
 // Handle error gracefully
 showError(recordingResult.error);
}
```

#### 3. **Orchestrator Pattern** - Centralized Control

```typescript
// Instead of services calling each other, we use an orchestrator
class ConversationOrchestrator {
 private state: ConversationState;
 private adapters: Adapters;

 async dispatch(action: Action) {
  // Update state with pure function
  this.state = conversationCore.transition(this.state, action);

  // Execute side effects
  const effects = conversationCore.effects(this.state, action);
  for (const effect of effects) {
   await this.executeEffect(effect);
  }
 }

 private async executeEffect(effect: Effect) {
  switch (effect.type) {
   case 'START_AUDIO_CAPTURE':
    this.adapters.audio.startRecording();
    break;
   case 'TRANSCRIBE_AUDIO':
    const result = await this.adapters.ai.transcribe(this.state.audioData);
    await this.dispatch({ type: 'TRANSCRIPTION_COMPLETE', result });
    break;
  }
 }
}
```

### Why Orchestrator is Better

| Traditional Classes                | Orchestrator Pattern             |
| ---------------------------------- | -------------------------------- |
| ❌ Hard to test (mock everything)  | ✅ Easy to test (pure functions) |
| ❌ Tight coupling between services | ✅ Loose coupling via events     |
| ❌ State scattered everywhere      | ✅ Single source of truth        |
| ❌ Hard to add features            | ✅ Just add new actions/effects  |

---

## 🎯 Feature Development Workflow

### 1. Feature Planning Phase

- **Define Requirements**: Clear user stories and acceptance criteria
- **Design Events**: Plan event contracts for feature communication
- **Architecture Review**: Ensure feature fits hexagonal architecture
- **Testing Strategy**: Plan unit, integration, and E2E tests

### 2. Development Phase

- **Port Definition**: Create input/output port interfaces
- **Domain Entities**: Build pure business objects
- **Use Cases**: Implement business logic
- **Adapters**: Create external system integrations
- **Event Implementation**: Define and emit events

### 3. Testing Phase

- **Unit Tests**: Test domain logic in isolation
- **Integration Tests**: Test port implementations
- **Feature Tests**: Test complete feature workflows
- **Performance Tests**: Ensure scalability

---

## 🏗️ Feature Structure Template

```text
src/features/{feature-name}/
├── index.ts                 # Feature public API
├── types.ts                 # Feature-specific types
├── events.ts                # Event definitions & schemas
├── ports/
│   ├── input/               # Input port interfaces
│   └── output/              # Output port interfaces
├── domain/
│   ├── entities/            # Domain objects
│   ├── value-objects/       # Immutable values
│   └── use-cases/           # Business logic
├── adapters/
│   ├── input/               # Input adapters (controllers)
│   └── output/              # Output adapters (repositories)
├── components/               # UI components (if applicable)
└── tests/                   # Feature tests
    ├── unit/
    ├── integration/
    └── fixtures/
```

---

## 🔄 Event-Driven Pattern Implementation

### Event Definition

```typescript
// events.ts
export interface FeatureEvents {
 'feature.action.completed': {
  featureId: string;
  result: any;
  timestamp: Date;
 };
 'feature.error.occurred': {
  featureId: string;
  error: string;
  context: Record<string, any>;
 };
}

// Event schemas for validation
export const FEATURE_ACTION_COMPLETED_EVENT: EventSchema<{
 featureId: string;
 result: any;
 timestamp: Date;
}> = {
 name: 'feature.action.completed',
 version: '1.0.0',
 description: 'Feature action successfully completed',
 payload: {
  featureId: 'string',
  result: 'any',
  timestamp: 'Date'
 }
};
```

### Event Emission

```typescript
// use-cases/feature-action.ts
export class FeatureActionUseCase {
 constructor(
  private eventBus: EventBus,
  private repository: FeatureRepository
 ) {}

 async execute(featureId: string, action: string): Promise<Result<void, Error>> {
  try {
   // Execute business logic
   const result = await this.repository.performAction(featureId, action);

   // Emit success event
   this.eventBus.emit('feature.action.completed', {
    featureId,
    result,
    timestamp: new Date()
   });

   return { success: true, data: undefined };
  } catch (error) {
   // Emit error event
   this.eventBus.emit('feature.error.occurred', {
    featureId,
    error: error.message,
    context: { action }
   });

   return { success: false, error: error as Error };
  }
 }
}
```

---

## 🧪 Testing Strategy

### 1. **Unit Tests** - Domain Logic

```typescript
// Test pure business logic in isolation
describe('ConversationCore', () => {
 it('should transition from idle to recording', () => {
  const initialState = { status: 'idle', messages: [] };
  const action = { type: 'START_RECORDING' };

  const newState = conversationCore.transition(initialState, action);

  expect(newState.status).toBe('recording');
  expect(newState.messages).toEqual([]);
 });
});
```

### 2. **Integration Tests** - Port Implementations

```typescript
// Test adapters with real dependencies
describe('AudioAdapter', () => {
 it('should record audio successfully', async () => {
  const adapter = new AudioAdapter();
  const mockStream = createMockAudioStream();

  const result = await adapter.startRecording(mockStream);

  expect(result.success).toBe(true);
  expect(result.data).toBeInstanceOf(MediaRecorder);
 });
});
```

### 3. **Feature Tests** - End-to-End Workflows

```typescript
// Test complete feature workflows
describe('Conversation Feature', () => {
 it('should complete full conversation cycle', async () => {
  const orchestrator = new ConversationOrchestrator();

  // Start conversation
  await orchestrator.dispatch({ type: 'START_CONVERSATION' });
  expect(orchestrator.getState().status).toBe('idle');

  // Start recording
  await orchestrator.dispatch({ type: 'START_RECORDING' });
  expect(orchestrator.getState().status).toBe('recording');

  // Stop recording
  const mockAudio = new ArrayBuffer(1024);
  await orchestrator.dispatch({ type: 'STOP_RECORDING', audio: mockAudio });
  expect(orchestrator.getState().status).toBe('processing');
 });
});
```

---

## 🚀 Performance Considerations

### 1. **Event Batching**

```typescript
// Batch multiple events to reduce overhead
class EventBatcher {
 private events: Event[] = [];
 private batchTimeout: NodeJS.Timeout | null = null;

 emit(event: Event) {
  this.events.push(event);

  if (!this.batchTimeout) {
   this.batchTimeout = setTimeout(() => {
    this.flush();
   }, 100); // Batch events within 100ms
  }
 }

 private flush() {
  this.eventBus.emitBatch(this.events);
  this.events = [];
  this.batchTimeout = null;
 }
}
```

### 2. **Lazy Loading**

```typescript
// Load feature modules only when needed
export class FeatureLoader {
 private loadedFeatures = new Map<string, Feature>();

 async loadFeature(featureId: string): Promise<Feature> {
  if (this.loadedFeatures.has(featureId)) {
   return this.loadedFeatures.get(featureId)!;
  }

  const feature = await import(`./features/${featureId}`);
  this.loadedFeatures.set(featureId, feature);
  return feature;
 }
}
```

---

## 🔒 Security & Validation

### 1. **Input Validation**

```typescript
// Validate all inputs at boundaries
export const validateFeatureAction = (input: unknown): FeatureAction => {
 const schema = z.object({
  featureId: z.string().min(1),
  action: z.string().min(1),
  parameters: z.record(z.unknown()).optional()
 });

 return schema.parse(input);
};
```

### 2. **Event Security**

```typescript
// Sanitize events before processing
export class SecureEventBus extends EventBus {
 emit<T extends keyof EventMap>(event: T, payload: EventMap[T]) {
  // Sanitize payload
  const sanitizedPayload = this.sanitizePayload(payload);

  // Validate event schema
  this.validateEvent(event, sanitizedPayload);

  // Emit sanitized event
  super.emit(event, sanitizedPayload);
 }
}
```

---

_This guide provides the foundation for building robust, maintainable features in Kaiwa. Remember: start simple, test thoroughly, and iterate based on real usage patterns._
