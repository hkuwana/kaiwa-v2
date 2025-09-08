# 🎤 Real-time Audio Feature

> **Feature**: Real-time audio streaming and conversation with OpenAI's GPT-4o Realtime API using clean 3-layer architecture

---

## 🎯 Overview

The Real-time Audio Feature enables live audio conversations with AI using OpenAI's WebRTC-based realtime API. It's implemented using our clean 3-layer architecture:

- **Service Layer**: `RealtimeService` handles WebRTC connections and OpenAI API
- **Store Layer**: `ConversationStore` orchestrates the conversation flow
- **UI Layer**: Conversation page provides the user interface

---

## 🏗️ Architecture

### Current Implementation

```typescript
// Service Layer: Pure business logic
RealtimeService
├── WebRTC connection management
├── OpenAI API integration
├── Audio stream handling
└── Event processing

// Store Layer: Orchestration and state
ConversationStore
├── Coordinates AudioService + RealtimeService
├── Manages conversation state
├── Handles user interactions
└── Provides actions for UI

// UI Layer: User interface
ConversationPage
├── Displays conversation status
├── Shows messages and audio levels
├── Provides start/stop controls
└── Handles user input
```

### Data Flow

```
User clicks "Start" → UI calls store action → Store orchestrates services → State updates → UI re-renders
```

---

## 🚀 Getting Started

### 1. Basic Usage (Current Implementation)

The feature is already integrated into the conversation flow:

```typescript
// In ConversationStore
async startConversation(language?: string, speaker?: Speaker) {
  try {
    // 1. Get audio stream from AudioService
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

    // 3. Connect RealtimeService
    await this.realtimeService.connectWithSession(
      sessionData,
      audioStream,
      this.handleMessage,
      this.handleConnectionStateChange
    );
  } catch (error) {
    this.status = 'error';
    this.error = error.message;
  }
}
```

### 2. UI Integration

The conversation page automatically uses the realtime feature:

```svelte
<!-- src/routes/conversation/+page.svelte -->
<script lang="ts">
	import { conversationStore } from '$lib/stores/conversation.store.svelte';

	const status = $derived(conversationStore.status);
	const messages = $derived(conversationStore.messages);

	function handleStart() {
		conversationStore.startConversation();
	}
</script>

{#if status === 'idle'}
	<button on:click={handleStart}>Start Conversation</button>
{:else if status === 'connected'}
	<p>Connected! Ready to start streaming.</p>
{/if}
```

---

## 🔌 API Endpoints

### POST /api/realtime-session

Creates a new realtime session with OpenAI.

**Request:**

```json
{
	"sessionId": "unique-session-identifier",
	"model": "gpt-4o-mini-realtime-preview-2024-12-17",
	"voice": "alloy",
	"language": "en"
}
```

**Response:**

```json
{
	"session_id": "openai-session-id",
	"client_secret": {
		"value": "ephemeral-token",
		"expires_at": "2024-01-20T10:30:00.000Z"
	}
}
```

---

## 🎵 Audio Integration

### Current Audio Service Integration

The `AudioService` provides the audio stream that feeds into the realtime feature:

```typescript
// AudioService handles all audio concerns
export class AudioService {
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

	async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices.filter((device) => device.kind === 'audioinput');
	}
}
```

### WebRTC Integration

The `RealtimeService` automatically handles:

1. **RTCPeerConnection** setup
2. **Audio track** addition from the provided stream
3. **SDP offer** creation and sending to OpenAI
4. **Bidirectional audio** streaming establishment

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Invalid session: missing session ID"

**Cause**: The API response doesn't contain the expected `session_id` field.

**Solution**:

- Check that the `/api/realtime-session` endpoint is working
- Verify OpenAI API key is configured
- Check browser console for detailed error logs

**Debug Steps**:

```typescript
// Add logging to see the raw response
console.log('Raw session data:', sessionData);

// Check if session_id exists
if (!sessionData.session_id) {
	console.error('Missing session_id:', sessionData);
}
```

#### 2. "Failed to start streaming"

**Cause**: WebRTC connection failed or OpenAI API error.

**Solution**:

- Check network connectivity
- Verify OpenAI API quota/limits
- Ensure audio permissions are granted

#### 3. Audio not recording

**Cause**: MediaRecorder not properly initialized or permissions denied.

**Solution**:

- Check browser console for MediaRecorder errors
- Verify microphone permissions
- Test with a simple audio recording first

### Debug Mode

The store includes comprehensive logging for debugging:

```typescript
// In ConversationStore constructor
$effect(() => {
	console.log('CONVERSATION STORE STATE:', {
		status: this.status,
		messageCount: this.messages.length,
		error: this.error,
		sessionId: this.sessionId,
		audioLevel: this.audioLevel
	});
});
```

---

## 🔒 Security

### Client Secrets

- **Ephemeral**: Each session gets a unique, short-lived client secret
- **Scope**: Limited to the specific session only
- **Expiration**: Automatically handled by the RealtimeService

### WebRTC Security

- **STUN servers**: Uses Google's public STUN servers
- **No TURN servers**: Currently only supports direct connections
- **Audio only**: No video data transmitted

---

## 🧪 Testing

### Service Testing

```typescript
// Test RealtimeService in isolation
describe('RealtimeService', () => {
	it('should connect with valid session data', async () => {
		const service = new RealtimeService();
		const mockStream = new MediaStream();

		await service.connectWithSession(
			mockSessionData,
			mockStream,
			mockMessageHandler,
			mockStateHandler
		);

		expect(service.isConnected()).toBe(true);
	});
});
```

### Store Testing

```typescript
// Test conversation orchestration
describe('ConversationStore', () => {
	it('should start conversation successfully', async () => {
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

---

## 🚀 Current Status

### ✅ Implemented

- **WebRTC Connection**: Full WebRTC peer connection setup
- **OpenAI Integration**: GPT-4o Realtime API integration
- **Audio Streaming**: Real-time bidirectional audio
- **Session Management**: Ephemeral session handling
- **Error Handling**: Comprehensive error states and recovery
- **State Management**: Full conversation state tracking

### 🔄 In Progress

- **Reconnection Logic**: Automatic reconnection on connection loss
- **Audio Quality**: Enhanced audio processing and noise reduction
- **Performance**: WebRTC connection optimization

### 📋 Future Enhancements

- **Multiple Voices**: Support for different AI voices
- **Language Switching**: Dynamic language switching during conversation
- **Advanced Audio**: Audio effects and processing
- **Mobile Optimization**: Better mobile WebRTC handling

---

## 💡 Key Insights

1. **Service Independence**: RealtimeService has zero dependencies on other services
2. **Store Orchestration**: ConversationStore coordinates between AudioService and RealtimeService
3. **UI Simplicity**: Conversation page is declarative and focused on presentation
4. **Error Handling**: Comprehensive error states with user-friendly messages
5. **Testing**: Each layer can be tested independently

---

_This feature demonstrates the power of our 3-layer architecture: clean separation of concerns, easy testing, and maintainable code._
