# 🚀 Feature Development Guide

> **Core Principle**: Build features using our clean 3-layer architecture (Services → Stores → UI) for maintainable, testable code.

---

## 🏗️ Architecture Overview

Kaiwa uses a **Clean 3-Layer Architecture** that separates concerns clearly:

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                            │
│              (Svelte Components + Pages)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Store Layer                            │
│              (State Management + Orchestration)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                           │
│              (Pure Business Logic + External APIs)         │
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

## 🔧 Implementation Guidelines

### 1. **Start with Services**

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
		// Pure business logic - no UI, no other services
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

	async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices.filter((device) => device.kind === 'audioinput');
	}
}
```

### 2. **Create Stores for Orchestration**

```typescript
export class ConversationStore {
	// Inject services (not other stores)
	constructor(
		private audioService: AudioServicePort,
		private realtimeService: RealtimeServicePort
	) {}

	// Orchestrate services to implement features
	async startConversation(language?: string, speaker?: Speaker) {
		try {
			// 1. Get audio stream from audio service
			const audioStream = await this.audioService.getStream();

			// 2. Connect realtime service
			await this.realtimeService.connect(audioStream);

			// 3. Update state
			this.status = 'connected';
		} catch (error) {
			this.status = 'error';
			this.error = error.message;
		}
	}
}
```

### 3. **Build UI on Top**

```svelte
<script lang="ts">
	import { conversationStore } from '$lib/stores/conversation.store.svelte';

	// Use $derived for reactive values
	const status = $derived(conversationStore.status);
	const error = $derived(conversationStore.error);

	// Simple event handlers that call store actions
	function handleStart() {
		conversationStore.startConversation();
	}
</script>

<!-- Declarative UI based on state -->
{#if status === 'idle'}
	<button onclick={handleStart}>Start Conversation</button>
{:else if status === 'connected'}
	<p>Connected! Ready to start.</p>
{:else if status === 'error'}
	<p>Error: {error}</p>
{/if}
```

---

## 📁 File Structure

### **Service Files**

```
src/lib/services/
├── audio.service.ts          # Audio device management
├── realtime.service.ts       # WebRTC and OpenAI integration
├── analytics.service.ts      # User tracking and metrics
├── auth.service.ts           # Authentication (future)
├── persistence.service.ts    # Data persistence (future)
└── index.ts                 # Service exports
```

### **Store Files**

```
src/lib/stores/
├── conversation.store.svelte.ts  # Conversation orchestration
├── settings.store.svelte.ts     # User preferences
├── auth.store.svelte.ts         # Authentication state (future)
├── analytics.store.svelte.ts    # Analytics state (future)
└── index.ts                     # Store exports
```

### **UI Files**

```
src/routes/
├── conversation/
│   ├── +page.svelte         # Main conversation interface
│   └── +page.server.ts      # Server-side data loading
├── settings/
│   ├── +page.svelte         # Settings interface
│   └── +page.server.ts      # Settings data loading
└── +layout.svelte            # Root layout
```

---

## 🧪 Testing Strategy

### **Service Testing**

```typescript
// Test services in isolation
describe('AudioService', () => {
	it('should get audio stream', async () => {
		const service = new AudioService();
		const stream = await service.getStream();
		expect(stream).toBeInstanceOf(MediaStream);
	});

	it('should get available devices', async () => {
		const service = new AudioService();
		const devices = await service.getAvailableDevices();
		expect(Array.isArray(devices)).toBe(true);
	});
});
```

### **Store Testing**

```typescript
// Test store orchestration
describe('ConversationStore', () => {
	it('should start conversation successfully', async () => {
		const mockAudioService = createMockAudioService();
		const mockRealtimeService = createMockRealtimeService();

		const store = new ConversationStore(mockRealtimeService, mockAudioService);

		await store.startConversation();

		expect(store.status).toBe('connected');
		expect(mockAudioService.getStream).toHaveBeenCalled();
		expect(mockRealtimeService.connect).toHaveBeenCalled();
	});

	it('should handle errors gracefully', async () => {
		const mockAudioService = createMockAudioService();
		const mockRealtimeService = createMockRealtimeService();

		// Make audio service throw an error
		mockAudioService.getStream.mockRejectedValue(new Error('Permission denied'));

		const store = new ConversationStore(mockRealtimeService, mockAudioService);

		await store.startConversation();

		expect(store.status).toBe('error');
		expect(store.error).toBe('Permission denied');
	});
});
```

### **UI Testing**

```typescript
// Test UI interactions
test('should start conversation when button clicked', async ({ page }) => {
	await page.goto('/conversation');
	await page.click('button:has-text("Start Conversation")');

	await expect(page.locator('text=Connected!')).toBeVisible();
});

test('should show error message when conversation fails', async ({ page }) => {
	// Mock the API to return an error
	await page.route('/api/features/transcribe', (route) =>
		route.fulfill({ status: 500, body: 'Server error' })
	);

	await page.goto('/conversation');
	await page.click('button:has-text("Start Conversation")');

	await expect(page.locator('text=Error:')).toBeVisible();
});
```

---

## 🚫 What NOT to Do

### **❌ Service-to-Service Imports**

```typescript
// ❌ NEVER: Service importing another service
export class AudioService {
	constructor(private realtimeService: RealtimeService) {} // Don't do this!

	async getStream() {
		// This creates tight coupling and makes testing impossible
		await this.realtimeService.someMethod();
	}
}
```

### **❌ UI Calling Services Directly**

```svelte
<!-- ❌ NEVER: UI calling services directly -->
<script>
	import { audioService } from '$lib/services/audio.service';

	async function handleStart() {
		// Don't do this! Use stores instead
		const stream = await audioService.getStream();
	}
</script>
```

### **❌ Complex Event Buses**

```typescript
// ❌ AVOID: Complex event systems
export class EventBus {
	emit(event: string, data: any) {
		// This adds unnecessary complexity
		// Use stores for coordination instead
	}
}
```

---

## ✅ What TO Do Instead

### **✅ Use Stores for Orchestration**

```typescript
// ✅ GOOD: Store coordinates services
export class ConversationStore {
	constructor(
		private audioService: AudioService,
		private realtimeService: RealtimeService
	) {}

	async startConversation() {
		const stream = await this.audioService.getStream();
		await this.realtimeService.connect(stream);
		this.status = 'connected';
	}
}
```

### **✅ Keep Services Pure**

```typescript
// ✅ GOOD: Service with single responsibility
export class AudioService {
	async getStream(deviceId?: string): Promise<MediaStream> {
		// Pure audio logic - no UI, no other services
		const constraints = this.buildConstraints(deviceId);
		return await navigator.mediaDevices.getUserMedia(constraints);
	}

	private buildConstraints(deviceId?: string): MediaStreamConstraints {
		return {
			audio: deviceId
				? { deviceId: { exact: deviceId } }
				: {
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true
					}
		};
	}
}
```

### **✅ Use Reactive State in Stores**

```typescript
// ✅ GOOD: Reactive state with Svelte 5 runes
export class ConversationStore {
	status = $state<'idle' | 'connecting' | 'connected' | 'error'>('idle');
	messages = $state<Message[]>([]);
	error = $state<string | null>(null);

	// State automatically triggers UI updates
}
```

---

## 🔄 Adding New Features

### **Step 1: Define the Service**

```typescript
// src/lib/services/new-feature.service.ts
export interface NewFeatureServicePort {
	doSomething(input: string): Promise<string>;
}

export class NewFeatureService implements NewFeatureServicePort {
	async doSomething(input: string): Promise<string> {
		// Pure business logic
		return `Processed: ${input}`;
	}
}
```

### **Step 2: Create the Store**

```typescript
// src/lib/stores/new-feature.store.svelte.ts
export class NewFeatureStore {
	constructor(private newFeatureService: NewFeatureServicePort) {}

	result = $state<string>('');

	async processInput(input: string) {
		try {
			this.result = await this.newFeatureService.doSomething(input);
		} catch (error) {
			console.error('Failed to process input:', error);
		}
	}
}
```

### **Step 3: Build the UI**

```svelte
<!-- src/routes/new-feature/+page.svelte -->
<script lang="ts">
	import { newFeatureStore } from '$lib/stores/new-feature.store.svelte';

	const result = $derived(newFeatureStore.result);

	function handleSubmit(event: Event) {
		const form = event.target as HTMLFormElement;
		const input = new FormData(form).get('input') as string;
		newFeatureStore.processInput(input);
	}
</script>

<form on:submit|preventDefault={handleSubmit}>
	<input name="input" placeholder="Enter text..." />
	<button type="submit">Process</button>
</form>

{#if result}
	<p>Result: {result}</p>
{/if}
```

---

## 📊 Success Metrics

### **Code Quality**

- **Zero circular dependencies** between services
- **Services are pure and testable**
- **Stores handle all orchestration**
- **UI is declarative and simple**

### **Developer Experience**

- **Clear patterns to follow**
- **Easy to add new features**
- **Fast test execution**
- **Intuitive file organization**

### **User Experience**

- **Features work reliably**
- **Performance is consistent**
- **Errors are handled gracefully**
- **UI is responsive and intuitive**

---

## 💡 Key Insights

1. **Start with services** - they're the foundation
2. **Use stores for orchestration** - they coordinate complexity
3. **Keep UI simple** - focus on presentation
4. **Test each layer independently** - ensures reliability
5. **Follow the patterns** - consistency breeds maintainability

---

_This guide ensures all new features follow our proven 3-layer architecture, making Kaiwa maintainable and scalable._
