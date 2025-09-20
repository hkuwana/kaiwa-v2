# 🏗️ Kaiwa MVP Architecture (Current Implementation)

> **Purpose**: Clean 3-layer architecture (Services → Stores → UI) for maintainable, scalable language learning platform.

[![Architecture](https://img.shields.io/badge/Architecture-3%20Layer-green?style=for-the-badge)]()
[![Focus](https://img.shields.io/badge/Focus-Services%20%2B%20Stores%20%2B%20UI-purple?style=for-the-badge)]()
[![Status](https://img.shields.io/badge/Status-Production%20Ready-red?style=for-the-badge)]()

---

## 🎯 Current Architecture Overview

Kaiwa MVP uses a **Clean 3-Layer Architecture** that separates concerns clearly and enables independent development and testing of each layer.

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

## 🎭 The Service Layer (Foundation)

### Core Principle

**Services are pure, independent, and focused on a single responsibility.** They have zero knowledge of other services, Svelte, or UI components.

### AudioService

Handles all audio-related functionality:

```typescript
// src/lib/services/audio.service.ts
export class AudioService {
	// Get audio stream from user's microphone
	async getStream(deviceId?: string): Promise<MediaStream> {
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

	// Get available audio devices
	async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices.filter((device) => device.kind === 'audioinput');
	}

	// Monitor audio levels
	onLevelUpdate(callback: (level: AudioLevel) => void): void {
		// Implementation for audio level monitoring
	}

	// Clean up resources
	cleanup(): void {
		// Stop tracks, close contexts, etc.
	}
}
```

### RealtimeService

Manages WebRTC connections and OpenAI API integration:

```typescript
// src/lib/services/realtime.service.ts
export class RealtimeService {
	// Connect to OpenAI's realtime API
	async connectWithSession(
		sessionData: RealtimeSession,
		stream: MediaStream,
		onMessage: (message: Message) => void,
		onConnectionStateChange: (state: RTCPeerConnectionState) => void
	): Promise<void> {
		// 1. Set up WebRTC peer connection
		// 2. Add audio tracks from stream
		// 3. Create data channel for events
		// 4. Connect to OpenAI API
		// 5. Handle real-time communication
	}

	// Send events to OpenAI
	sendEvent(event: Record<string, unknown>): void {
		if (this.dataChannel?.readyState === 'open') {
			this.dataChannel.send(JSON.stringify(event));
		}
	}

	// Check connection status
	isConnected(): boolean {
		return this.pc?.connectionState === 'connected' && this.dataChannel?.readyState === 'open';
	}

	// Clean up connection
	disconnect(): void {
		// Close WebRTC connection, data channel, etc.
	}
}
```

### AnalyticsService

Tracks user events and metrics:

```typescript
// src/lib/services/analytics.service.ts
export class AnalyticsService {
	// Initialize analytics
	async init(): Promise<void> {
		// Set up PostHog or other analytics provider
	}

	// Track user events
	track(eventName: string, properties?: Record<string, unknown>): void {
		// Send event to analytics provider
	}

	// Identify user
	identify(userId: string, properties?: Record<string, unknown>): void {
		// Set user properties in analytics
	}
}
```

---

## 🎪 The Store Layer (Orchestration)

### Core Principle

**Stores coordinate between services to implement features.** They manage application state and handle side effects using Svelte 5 runes.

### ConversationStore

Orchestrates the conversation experience:

```typescript
// src/lib/stores/conversation.store.svelte.ts
export class ConversationStore {
	// Inject services (not other stores)
	constructor(
		private realtimeService: RealtimeService,
		private audioService: AudioService
	) {
		// Initialize audio service
		this.audioService.initialize();
		this.audioService.getAvailableDevices().then((devices) => {
			this.availableDevices = devices;
		});
	}

	// Reactive state using Svelte 5 runes
	status = $state<'idle' | 'connecting' | 'connected' | 'streaming' | 'error'>('idle');
	messages = $state<Message[]>([]);
	error = $state<string | null>(null);
	audioLevel = $state<number>(0);

	// Main action: Start a conversation
	startConversation = async (language?: string, speaker?: Speaker) => {
		if (this.status !== 'idle') return;

		this.status = 'connecting';
		this.error = null;

		try {
			// 1. Get audio stream from audio service
			const audioStream = await this.audioService.getStream(this.selectedDeviceId);

			// 2. Get session from backend
			const response = await fetch('/api/realtime-session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: crypto.randomUUID(),
					model: 'gpt-4o-mini-realtime-preview-2024-12-17',
					voice: this.voice
				})
			});

			const sessionData = await response.json();

			// 3. Connect realtime service
			await this.realtimeService.connectWithSession(
				sessionData,
				audioStream,
				this.handleMessage,
				this.handleConnectionStateChange
			);
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Unknown error';
			this.status = 'error';
		}
	};

	// Handle incoming messages
	private handleMessage = (newMessage: { role: string; content: string }) => {
		const message: Message = {
			role: newMessage.role === 'assistant' ? 'assistant' : 'user',
			content: newMessage.content,
			timestamp: new Date(),
			id: '',
			conversationId: '',
			audioUrl: null,
			// Language learning fields
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			grammarAnalysis: null,
			vocabularyAnalysis: null,
			pronunciationScore: null,
			audioDuration: null,
			difficultyLevel: null,
			learningTags: null
		};
		this.messages = [...this.messages, message];
	};

	// Handle connection state changes
	private handleConnectionStateChange = (connectionState: RTCPeerConnectionState) => {
		if (connectionState === 'connected') {
			this.status = 'connected';
			this.startTime = Date.now();
		} else if (connectionState === 'failed' || connectionState === 'closed') {
			this.status = 'idle';
			this.error = 'Connection lost';
		}
	};

	// End conversation
	endConversation = () => {
		this.realtimeService.disconnect();
		this.audioService.cleanup();

		// Reset state
		this.status = 'idle';
		this.messages = [];
		this.error = null;
	};
}
```

### SettingsStore

Manages user preferences:

```typescript
// src/lib/stores/settings.store.svelte.ts
export class SettingsStore {
	// User's selected language
	selectedLanguage = $state<Language | null>(null);

	// User's selected AI voice
	selectedSpeaker = $state('alloy');

	constructor() {
		// Initialize with default language
		const defaultLanguage = allLanguages.find((lang) => lang.code === 'ja');
		if (defaultLanguage) {
			this.selectedLanguage = defaultLanguage;
		}
	}

	// Update selected language
	setLanguage = (languageCode: string) => {
		const language = allLanguages.find((lang) => lang.code === languageCode);
		if (language) {
			this.selectedLanguage = language;
		}
	};

	// Update selected speaker
	setSpeaker = (speakerId: string) => {
		this.selectedSpeaker = speakerId;
	};
}
```

---

## 🎨 The UI Layer (Presentation)

### Core Principle

**UI components are thin and declarative.** They use `$derived` for reactive values and call store actions instead of services directly.

### Conversation Page

Main conversation interface:

```svelte
<!-- src/routes/conversation/+page.svelte -->
<script lang="ts">
	import { conversationStore } from '$lib/stores/conversation.store.svelte';
	import { settingsStore } from '$lib/stores/settings.store.svelte';

	// Get reactive values from stores
	const status = $derived(conversationStore.status);
	const messages = $derived(conversationStore.messages);
	const error = $derived(conversationStore.error);
	const audioLevel = $derived(conversationStore.audioLevel);

	// Get settings
	const selectedLanguage = $derived(settingsStore.selectedLanguage);
	const selectedSpeaker = $derived(settingsStore.selectedSpeaker);

	// Simple event handlers
	function handleStart() {
		conversationStore.startConversation(selectedLanguage?.code, selectedSpeaker);
	}

	function handleEnd() {
		conversationStore.endConversation();
	}
</script>

<div class="mx-auto max-w-4xl p-8 font-sans">
	<header class="mb-8 text-center">
		<h1 class="mb-2 text-4xl font-bold text-primary">
			{selectedLanguage?.name} Conversation
		</h1>
	</header>

	<main>
		<!-- Status-based UI rendering -->
		{#if status === 'idle' || status === 'error'}
			<div class="card my-8 border border-base-300 bg-base-100 p-8 text-center shadow-lg">
				<button onclick={handleStart} class="btn btn-lg btn-primary"> Start Conversation </button>
				{#if error}
					<div class="mt-4 alert alert-error">
						<span>Something went wrong: {error}</span>
					</div>
				{/if}
			</div>
		{:else if status === 'connecting'}
			<LoadingScreen />
		{:else if status === 'connected'}
			<div class="card my-8 border border-base-300 bg-base-100 p-8 text-center shadow-lg">
				<p class="mb-4 text-xl text-success">Connected! Ready to start streaming.</p>
				<button onclick={handleEnd} class="btn btn-lg btn-error"> End Conversation </button>
			</div>
		{/if}

		<!-- Messages display -->
		{#if messages.length > 0}
			<div class="card my-8 border border-base-300 bg-base-100 p-6 shadow-lg">
				<h3 class="mb-4 text-2xl font-semibold text-primary">Conversation</h3>
				<div class="space-y-3">
					{#each messages as message}
						<MessageBubble {message} />
					{/each}
				</div>
			</div>
		{/if}
	</main>
</div>
```

---

## 🔄 Data Flow

### 1. User Interaction Flow

```text
User clicks "Start" → UI calls store action → Store orchestrates services → State updates → UI re-renders
```

### 2. Service Communication Flow

```text
Service A → Store → Service B (NEVER Service A → Service B directly)
```

### 3. State Update Flow

```text
Service event → Store callback → State update → UI re-render
```

---

## 🧪 Testing Strategy

### Service Testing

```typescript
// Test services in isolation
describe('AudioService', () => {
	it('should get audio stream', async () => {
		const service = new AudioService();
		const stream = await service.getStream();
		expect(stream).toBeInstanceOf(MediaStream);
	});
});
```

### Store Testing

```typescript
// Test store orchestration
describe('ConversationStore', () => {
	it('should start conversation', async () => {
		const mockAudioService = createMockAudioService();
		const mockRealtimeService = createMockRealtimeService();

		const store = new ConversationStore(mockRealtimeService, mockAudioService);

		await store.startConversation();

		expect(store.status).toBe('connected');
		expect(mockAudioService.getStream).toHaveBeenCalled();
		expect(mockRealtimeService.connectWithSession).toHaveBeenCalled();
	});
});
```

### UI Testing

```typescript
// Test UI interactions
test('should start conversation when button clicked', async ({ page }) => {
	await page.goto('/conversation');
	await page.click('button:has-text("Start Conversation")');

	await expect(page.locator('text=Connected!')).toBeVisible();
});
```

---

## 🚀 Current Status & Next Steps

### ✅ Completed

- **Service Layer**: Audio, Realtime, and Analytics services implemented
- **Store Layer**: Conversation and Settings stores working
- **UI Layer**: Main conversation interface complete
- **Architecture**: Clean 3-layer pattern established
- **Testing**: Comprehensive test coverage for services and stores

### 🔄 In Progress

- **Authentication**: User login/logout functionality
- **Persistence**: Conversation history and user data
- **Analytics**: User behavior tracking and insights

### 📋 Next Steps

1. **Authentication Service & Store**
   - Google OAuth integration
   - User session management
   - Protected routes

2. **Persistence Service & Store**
   - Database integration
   - Conversation history
   - User progress tracking

3. **Enhanced Features**
   - Multiple language support
   - Advanced conversation modes
   - Progress analytics

---

## 💡 Key Insights

1. **Services should be pure and focused**
2. **Stores should handle complexity and orchestration**
3. **UI should be declarative and simple**
4. **Test each layer independently**
5. **Keep the core working before adding features**

---

_This architecture provides a solid foundation for building a scalable, maintainable language learning platform while keeping the core conversation experience working reliably._
