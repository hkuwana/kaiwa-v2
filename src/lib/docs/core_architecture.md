# 🏗️ Kaiwa v2 Architecture

> **Core Principle**: Clean 3-Layer Architecture (Services → Stores → UI) for maintainable, scalable language learning platform.

---

## 🎯 Architecture Overview

Kaiwa v2 adopts a **Clean 3-Layer Architecture** that creates clear separation between business logic, state management, and user interface. This pattern ensures our application remains maintainable, testable, and scalable.

### 🏛️ Architecture Layers

```text
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                            │
│              (Svelte Components + Pages)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Conversation│  │   Settings  │  │   Other Pages       │ │
│  │    Page     │  │    Page     │  │   & Components      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Store Layer                            │
│              (State Management + Orchestration)            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │Conversation │  │   Settings  │  │   Future Stores     │ │
│  │   Store     │  │    Store    │  │   (Auth, Analytics) │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                           │
│              (Pure Business Logic + External APIs)         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Audio    │  │  Realtime   │  │   Analytics         │ │
│  │   Service   │  │   Service   │  │    Service          │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Layer Responsibilities

### **Service Layer (Bottom)**
**Purpose**: Pure business logic and external API integration

**Characteristics**:
- **Zero dependencies** on other services
- **Zero knowledge** of Svelte or UI
- **Pure TypeScript classes** with clear interfaces
- **Testable in isolation** with mocked dependencies

**Examples**:
- `AudioService` - Handles audio device management and processing
- `RealtimeService` - Manages WebRTC connections and OpenAI API
- `AnalyticsService` - Tracks user events and metrics

### **Store Layer (Middle)**
**Purpose**: State management and service orchestration

**Characteristics**:
- **Coordinates between services** to implement features
- **Manages application state** using Svelte 5 runes
- **Handles side effects** and async operations
- **Provides actions** that UI components can call

**Examples**:
- `ConversationStore` - Orchestrates audio and realtime services
- `SettingsStore` - Manages user preferences and settings
- `AuthStore` - Handles authentication state and user data

### **UI Layer (Top)**
**Purpose**: User interface and user interactions

**Characteristics**:
- **Thin and declarative** components
- **Uses `$derived`** for reactive values from stores
- **Calls store actions** instead of services directly
- **Focuses on presentation** and user experience

**Examples**:
- `+page.svelte` - Main conversation interface
- `AudioVisualizer.svelte` - Audio level visualization
- `MessageBubble.svelte` - Individual message display

---

## 🔌 Service Independence

### Core Principle

**Services never import other services.** This prevents circular dependencies and ensures each service can be tested and maintained independently.

### Implementation

```typescript
// ✅ Good: Service with clear, focused responsibility
export class AudioService {
  async getStream(deviceId?: string): Promise<MediaStream> {
    // Pure audio logic - no UI, no other services
    const constraints: MediaStreamConstraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
    
    return await navigator.mediaDevices.getUserMedia(constraints);
  }
}

// ❌ Bad: Service that imports other services
export class AudioService {
  constructor(private realtimeService: RealtimeService) {} // Don't do this!
}
```

### ESLint Enforcement

We use ESLint rules to prevent service-to-service imports:

```javascript
// eslint.config.js
{
  files: ['src/lib/services/**/*.ts'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['$lib/services/**'],
            message: 'Services should not import other services. Use a store to orchestrate them.'
          }
        ]
      }
    ]
  }
}
```

---

## 🎭 Store Orchestration

### How Stores Work

Stores act as the "orchestrators" that coordinate between services to implement features:

```typescript
export class ConversationStore {
  // Inject services (not other stores)
  constructor(
    private audioService: AudioService,
    private realtimeService: RealtimeService
  ) {}

  // Orchestrate the conversation flow
  async startConversation(language?: string, speaker?: Speaker) {
    try {
      // 1. Get audio stream from audio service
      const audioStream = await this.audioService.getStream();
      
      // 2. Get session from realtime service
      const session = await this.realtimeService.connectWithSession(
        sessionData,
        audioStream,
        this.handleMessage,
        this.handleConnectionStateChange
      );
      
      // 3. Update local state
      this.status = 'connected';
      this.startTime = Date.now();
    } catch (error) {
      this.status = 'error';
      this.error = error.message;
    }
  }
}
```

### Store Benefits

- **Single source of truth** for feature state
- **Centralized orchestration** logic
- **Easy testing** with mocked services
- **Clear data flow** from services to UI

---

## 🎨 UI Layer Simplicity

### Component Pattern

UI components are thin and declarative, focusing on presentation:

```svelte
<script lang="ts">
  import { conversationStore } from '$lib/stores/conversation.store.svelte';
  
  // Use $derived for reactive values
  const status = $derived(conversationStore.status);
  const messages = $derived(conversationStore.messages);
  const error = $derived(conversationStore.error);
  
  // Simple event handlers that call store actions
  function handleStart() {
    conversationStore.startConversation();
  }
  
  function handleEnd() {
    conversationStore.endConversation();
  }
</script>

<!-- Declarative UI based on state -->
{#if status === 'idle'}
  <button on:click={handleStart}>Start Conversation</button>
{:else if status === 'connected'}
  <button on:click={handleEnd}>End Conversation</button>
{/if}
```

### UI Benefits

- **Predictable behavior** based on store state
- **Easy to test** with mocked stores
- **Reusable components** across different pages
- **Clear separation** of concerns

---

## 🧪 Testing Strategy

### Testing Pyramid

```text
        /\
       /  \     E2E Tests (Few)
      /____\     Integration Tests (Some)
     /      \    Unit Tests (Many)
    /________\
```

### Unit Tests (Foundation)

- **Target**: Services and stores
- **Framework**: Vitest
- **Coverage**: 90%+ for core business logic
- **Speed**: &lt; 100ms per test

### Integration Tests (Middle)

- **Target**: Store-service interactions
- **Framework**: Vitest + mocked services
- **Coverage**: Critical user journeys
- **Speed**: &lt; 1s per test

### E2E Tests (Top)

- **Target**: Complete user workflows
- **Framework**: Playwright
- **Coverage**: Core conversion paths
- **Speed**: &lt; 30s per test

---

## 🚀 Performance & Scalability

### Current Architecture Benefits

- **Service Isolation**: Independent scaling of services
- **Store Orchestration**: Centralized state management
- **Clean Interfaces**: Easy to swap implementations

### Future Scaling Considerations

- **Service Workers**: Offload audio processing
- **WebRTC Optimization**: Better connection handling
- **State Persistence**: Local storage + cloud sync
- **Caching**: Service response caching

---

## 📚 Implementation Guidelines

### 1. Start with Services

Always implement services first, with clear interfaces:

```typescript
// Define the service interface
export interface AudioServicePort {
  getStream(deviceId?: string): Promise<MediaStream>;
  getAvailableDevices(): Promise<MediaDeviceInfo[]>;
}

// Implement the service
export class AudioService implements AudioServicePort {
  async getStream(deviceId?: string): Promise<MediaStream> {
    // Implementation
  }
}
```

### 2. Create Stores for Orchestration

```typescript
export class ConversationStore {
  constructor(
    private audioService: AudioServicePort,
    private realtimeService: RealtimeServicePort
  ) {}
  
  // Orchestrate services to implement features
}
```

### 3. Build UI on Top

```svelte
<script>
  import { conversationStore } from '$lib/stores/conversation.store.svelte';
  
  // Use store state and actions
</script>
```

---

## 🔧 Development Workflow

### 1. Feature Development

1. Define service interfaces
2. Implement services with tests
3. Create store for orchestration
4. Build UI components
5. Integrate and test

### 2. Testing Strategy

1. Test services in isolation
2. Test store orchestration
3. Test UI interactions
4. Test complete user journeys

### 3. Deployment

1. Feature flag implementation
2. Gradual rollout
3. Monitoring and alerting
4. Rollback procedures

---

## 📊 Success Metrics

### Code Quality

- **Test Coverage**: > 90% for core business logic
- **Service Independence**: 0 cross-service imports
- **Store Orchestration**: Clear data flow patterns
- **UI Simplicity**: Declarative components

### Performance

- **Response Time**: &lt; 200ms for service calls
- **Audio Processing**: &lt; 2s for transcription
- **State Updates**: &lt; 100ms for UI updates

### Maintainability

- **Service Isolation**: Easy to test and modify
- **Store Patterns**: Consistent orchestration
- **UI Components**: Reusable and simple

---

## 🔄 Evolution Strategy

### Current State

- ✅ 3-layer architecture implemented
- ✅ Services are independent and testable
- ✅ Stores orchestrate services effectively
- ✅ UI is clean and declarative

### Next Steps

- 🔄 Add authentication service and store
- 🔄 Add persistence service and store
- 🔄 Add analytics service and store
- 🔄 Enhance conversation features

### Long-term Vision

- **Multi-language support**
- **Advanced conversation modes**
- **Social features**
- **Mobile applications**

---

_This architecture ensures Kaiwa v2 is maintainable, scalable, and follows modern best practices for complex applications._
