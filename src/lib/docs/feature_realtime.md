# 🎤 Real-time Audio Feature

> **Feature**: Real-time audio streaming and conversation with OpenAI's GPT-4o Realtime API

---

## 🎯 Overview

The Real-time Audio Feature enables live audio conversations with AI using OpenAI's WebRTC-based realtime API. It provides:

- **Live Audio Streaming**: Real-time audio input/output via WebRTC
- **AI Conversation**: GPT-4o Realtime model for natural conversation flow
- **Session Management**: Ephemeral sessions with secure client secrets
- **Audio Processing**: Integration with the Audio Feature for recording/playback

---

## 🏗️ Architecture

### Core Components

```typescript
// Main orchestrator
ModernRealtimeConversationOrchestrator
├── RealtimeService (session management)
├── AudioService (recording/playback)
└── EventBus (conversation events)
```

### Data Flow

```
User Audio → MediaRecorder → WebRTC → OpenAI API
                ↓
            Audio Feature
                ↓
            Event System
```

---

## 🚀 Getting Started

### 1. Basic Usage

```typescript
import { realtimeService } from '$lib/features/realtime';

// Create a session
const session = await realtimeService.createSession({
  sessionId: 'unique-id',
  model: 'gpt-4o-realtime-preview-2024-10-01',
  voice: 'alloy',
  language: 'en'
});

// Start streaming
const stream = await realtimeService.startStreaming(session, audioStream);

// Send audio chunks
await realtimeService.sendAudioChunk(stream, audioData);

// Stop streaming
await realtimeService.stopStreaming(stream);
```

### 2. With Conversation Orchestrator

```typescript
import { ModernRealtimeConversationOrchestrator } from '$lib/features/conversation';

const orchestrator = new ModernRealtimeConversationOrchestrator();

// Start conversation (automatically handles session creation and streaming)
await orchestrator.startConversation('en', 'alloy');

// Stop conversation
await orchestrator.endConversation();
```

---

## 🔌 API Endpoints

### POST /api/realtime-session

Creates a new realtime session with OpenAI.

**Request:**
```json
{
  "sessionId": "unique-session-identifier",
  "model": "gpt-4o-realtime-preview-2024-10-01",
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

### Recording Setup

```typescript
// Get user media stream
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// Start recording via Audio Feature
await audioService.startRecording();

// The realtime orchestrator automatically handles the shared stream
```

### WebRTC Integration

The feature automatically:
1. Creates RTCPeerConnection
2. Adds audio tracks to the connection
3. Sends offer to OpenAI
4. Establishes bidirectional audio streaming

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

Enable detailed logging by setting the environment variable:
```bash
DEBUG_REALTIME=true
```

---

## 🔒 Security

### Client Secrets

- **Ephemeral**: Each session gets a unique, short-lived client secret
- **Scope**: Limited to the specific session only
- **Expiration**: Automatically expires after the session ends

### Rate Limiting

- **Development**: 100 requests/minute
- **Production**: 3 requests/minute
- **Per IP**: Based on client IP address

---

## 📊 Performance

### Optimization Tips

1. **Audio Quality**: Use appropriate sample rates (16kHz recommended)
2. **Chunk Size**: Send audio in 100ms chunks for optimal latency
3. **Connection Pooling**: Reuse WebRTC connections when possible
4. **Error Handling**: Implement exponential backoff for retries

### Monitoring

Track key metrics:
- Audio chunk processing time
- WebRTC connection stability
- OpenAI API response times
- Session success/failure rates

---

## 🔄 Event System

### Available Events

```typescript
// Listen for conversation events
realtimeService.onTranscript((transcript) => {
  console.log('AI said:', transcript);
});

realtimeService.onResponse((response) => {
  console.log('AI response:', response);
});

realtimeService.onError((error) => {
  console.error('Error:', error);
});
```

### Event Payloads

```typescript
interface ConversationEvent {
  type: 'started' | 'stopped' | 'error';
  sessionId: string;
  timestamp: number;
  payload: any;
}
```

---

## 🧪 Testing

### Unit Tests

```bash
pnpm test:unit -- --grep "realtime"
```

### Integration Tests

```bash
pnpm test:integration -- --grep "realtime"
```

### Manual Testing

1. Start a conversation
2. Speak into microphone
3. Verify AI responds
4. Check audio playback
5. End conversation cleanly

---

## 📚 Related Documentation

- [Core Feature Architecture](./core_feature_architecture.md)
- [Audio Feature](./feature_guide.md#audio-feature)
- [Event System](./event_system.md)
- [API Reference](./api_reference.md)

---

## 🤝 Contributing

When contributing to the realtime feature:

1. **Follow the architecture**: Use ports/adapters pattern
2. **Add tests**: Include unit and integration tests
3. **Update docs**: Keep this documentation current
4. **Error handling**: Implement proper error boundaries
5. **Performance**: Consider WebRTC optimization
