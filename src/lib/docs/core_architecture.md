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
- `AnalysisService` - Coordinates analysis API calls and data transformation

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
- `AnalysisStore` - Orchestrates analysis services and manages assessment state

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

## 💡 Analysis Feature: Complete Architecture Example

The **Analysis Feature** demonstrates the complete 3-layer architecture in practice, showing how language analysis and assessment are implemented following our core principles.

### 🏗️ Analysis Feature Structure

```text
src/lib/features/analysis/
├── services/
│   ├── analysis.service.ts              # Clean API communication layer
│   ├── analysis-pipeline.service.ts     # Backend processing orchestration
│   └── module-registry.ts               # Module definitions (simplified)
├── stores/
│   └── analysis.store.svelte.ts         # State management using Svelte 5 runes
├── components/
│   ├── QuickAnalysis.svelte             # Analysis results display
│   └── ConfidenceTracker.svelte         # Level progression tracking
└── types/
    └── analysis-module.types.ts         # Type definitions
```

### 🎯 Layer Implementation

#### **Service Layer** - Pure Business Logic

```typescript
// analysis.service.ts - Clean API communication
export class AnalysisService {
	async runAnalysis(
		conversationId: string,
		languageCode: string,
		messages: AnalysisMessage[]
	): Promise<AnalysisRunResult> {
		// Pure API communication - no UI knowledge
		const response = await fetch(`${this.baseUrl}/run`, {
			/* ... */
		});
		return this.transformResponse(response);
	}

	async assessLevel(
		messages: AnalysisMessage[],
		languageCode: string
	): Promise<LevelAssessmentResult> {
		// CEFR assessment via backend API
		const response = await fetch(`${this.baseUrl}/assess-level`, {
			/* ... */
		});
		return this.transformResponse(response);
	}
}
```

#### **Store Layer** - State Management & Orchestration

```typescript
// analysis.store.svelte.ts - Coordinates analysis services
export class AnalysisStore {
	private _state = $state<AnalysisState>({
		currentRun: null,
		isRunning: false,
		error: null,
		lastAssessment: null,
		availableModules: []
	});

	async runAnalysis(conversationId: string, languageCode: string, messages: AnalysisMessage[]) {
		this._state.isRunning = true;
		try {
			// Orchestrate service call and manage state
			const result = await analysisService.runAnalysis(conversationId, languageCode, messages);
			this._state.currentRun = result;
		} catch (error) {
			this._state.error = error.message;
		} finally {
			this._state.isRunning = false;
		}
	}
}
```

#### **UI Layer** - Reactive Components

```svelte
<!-- QuickAnalysis.svelte - Thin, declarative UI -->
<script lang="ts">
	import { analysisStore } from '../stores/analysis.store.svelte';

	// Reactive state using $derived
	const currentRun = $derived(analysisStore.currentRun);
	const isRunning = $derived(analysisStore.isRunning);
	const error = $derived(analysisStore.error);

	// Simple action handlers
	function handleAnalyze() {
		analysisStore.runAnalysis(conversationId, languageCode, messages);
	}
</script>

{#if isRunning}
	<p>Analyzing conversation...</p>
{:else if currentRun}
	<div class="results">
		{#each currentRun.results as result}
			<div class="module-result">
				<h3>{result.moduleId}</h3>
				<p>{result.summary}</p>
			</div>
		{/each}
	</div>
{/if}
```

### 🎯 Architecture Benefits Demonstrated

- **Service Independence**: Analysis service has zero dependencies on UI or other services
- **Store Orchestration**: Analysis store coordinates multiple services (assessment, modules, state)
- **UI Simplicity**: Components are purely reactive and declarative
- **Backend Processing**: Heavy analysis work happens on the server, frontend just coordinates
- **Type Safety**: Comprehensive TypeScript interfaces across all layers

### 🔄 Data Flow Example

```text
User clicks "Analyze" → UI calls store.runAnalysis() → Store calls service.runAnalysis()
→ Service makes API call → Backend processes → Response flows back through layers
→ UI updates reactively via $derived
```

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
			audio: deviceId
				? { deviceId: { exact: deviceId } }
				: {
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
	<button onclick={handleStart}>Start Conversation</button>
{:else if status === 'connected'}
	<button onclick={handleEnd}>End Conversation</button>
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

## 🔧 Implementation Guidelines

### **Service Layer Rules**

```typescript
// ✅ Good: Pure service with clear interface
export class AudioService {
	async getStream(): Promise<MediaStream> {
		// Pure business logic
	}
}

// ❌ Bad: Service that knows about UI
export class AudioService {
	async getStream(): Promise<MediaStream> {
		// Don't do this
		this.updateUI();
		this.showNotification();
	}
}
```

### **Store Layer Rules**

```typescript
// ✅ Good: Store orchestrates services
export class ConversationStore {
	async startConversation() {
		// 1. Get audio stream from audio service
		const stream = await this.audioService.getStream();

		// 2. Get session from realtime service
		const session = await this.realtimeService.connect(stream);

		// 3. Update state
		this.status = 'connected';
	}
}
```

### **UI Layer Rules**

```typescript
// ✅ Good: UI uses store, not services
<script>
  import { conversationStore } from '$lib/stores/conversation.store.svelte';

  const status = $derived(conversationStore.status);

  function handleStart() {
    conversationStore.startConversation();
  }
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

### Next Steps: Feature-Based Migration

**Phase 1: Prepare Feature Structure (Week 1)**

- 🔄 Create `src/lib/features/` directory structure
- 🔄 Verify shared components in `$lib/` are properly organized

**Phase 2: Extract Features (Week 2-3)**

- 🔄 Extract `realtime-conversation` feature (core functionality)
- ✅ Extract `analysis` feature (post-conversation analysis) - **COMPLETED**
- 🔄 Extract `onboarding` feature (user onboarding flow)
- 🔄 Extract `cultural-dna` feature (viral sharing)

**Phase 3: Feature Bridges (Week 4)**

- 🔄 Implement FeatureBridge utility for cross-feature communication
- 🔄 Set up permission utilities for tier-based access
- 🔄 Test feature independence and isolation

**Phase 4: API Reorganization (Week 5-6)**

- 🔄 Restructure API routes to resource-oriented approach
- 🔄 Implement repository pattern for data access
- 🔄 Migrate existing endpoints to new structure

### Architecture Evolution: Implicit Sharing + Features

The current 3-layer architecture will evolve to support feature-based development:

```text
src/lib/
├── stores/           # SHARED by default (Cross-cutting concerns)
├── services/         # SHARED by default (Business logic)
├── utils/            # SHARED by default (Helper functions)
├── components/       # SHARED by default (Reusable UI)
└── features/         # Feature-specific implementations
    ├── realtime-conversation/
    │   ├── components/    # Feature-specific UI
    │   ├── services/      # Feature business logic
    │   └── stores/        # Feature state management
    ├── analysis/
    ├── cultural-dna/
    └── onboarding/
```

**Key Principles:**

- **Implicit Sharing**: Top-level `$lib/` is shared by default
- **Feature Isolation**: Features never import from each other
- **Cross-feature Communication**: Via FeatureBridge utility only
- **Gradual Migration**: Features can be extracted incrementally

### Long-term Vision

- **Feature Independence**: Each feature can be developed and tested in isolation
- **Scalable Team Development**: Multiple developers can work on different features
- **Clean API Structure**: Resource-oriented endpoints with repository pattern
- **Advanced Features**: Analysis pipeline, viral sharing, personalized learning

---

_This architecture ensures Kaiwa v2 remains maintainable and scalable while supporting feature-based development and team collaboration._
