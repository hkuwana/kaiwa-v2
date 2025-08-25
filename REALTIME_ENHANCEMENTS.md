# Realtime Service Enhancements

## Overview

The `RealtimeService` has been enhanced with improved Voice Activity Detection (VAD) management, automatic audio input optimization, and comprehensive realtime connection monitoring.

## Key Features

### 🎤 Smart VAD Management

**Automatic Audio Input Control**
- **User Speaking**: Automatically pauses local audio input when user starts speaking
- **AI Speaking**: Pauses local audio input when AI starts speaking to prevent overlap
- **Smart Resume**: Automatically resumes audio input after speech detection ends
- **Echo Prevention**: Eliminates audio feedback and echo during conversations

**VAD State Tracking**
```typescript
interface VADState {
  isUserSpeaking: boolean;
  isAISpeaking: boolean;
  lastVADEvent: Date;
  isStreamingPaused: boolean;
}
```

### 📡 Realtime Connection Updates

**Connection Status Updates**
- `connection_status`: Connection state changes (connecting, connected, failed, closed)
- `vad_state`: Voice activity detection state changes
- `audio_state`: Audio streaming state changes
- `user_activity`: User interaction events
- `custom_event`: Custom application events

**Update Interface**
```typescript
interface RealtimeConnectionUpdate {
  type: 'connection_status' | 'audio_state' | 'vad_state' | 'user_activity' | 'custom_event';
  status: string;
  data?: unknown;
  timestamp: Date;
}
```

### 🔧 Enhanced Audio Control

**Streaming Management**
- `pauseStreaming()`: Pause audio streaming without disconnecting
- `resumeStreaming()`: Resume audio streaming
- `pauseLocalAudioInput()`: Mute microphone input
- `resumeLocalAudioInput()`: Unmute microphone input

**Audio Track Management**
- Automatic audio track enabling/disabling based on VAD events
- Smooth transitions between user and AI speech
- Configurable delay for audio input resume (500ms default)

## Usage Examples

### Basic Connection with VAD Callbacks

```typescript
import { realtimeService } from '$lib/services/realtime.service';

// Connect with enhanced callbacks
await realtimeService.connectWithSession(
  sessionData,
  audioStream,
  onMessage,
  onConnectionStateChange,
  onTranscription,
  onConnectionUpdate, // New callback for connection updates
  sessionConfig
);

// Handle connection updates
function onConnectionUpdate(update: RealtimeConnectionUpdate) {
  switch (update.type) {
    case 'vad_state':
      if (update.status === 'user_speaking') {
        console.log('User started speaking');
      }
      break;
    case 'audio_state':
      if (update.status === 'ai_speaking') {
        console.log('AI started speaking');
      }
      break;
  }
}
```

### Manual Audio Control

```typescript
// Pause streaming temporarily
realtimeService.pauseStreaming();

// Resume streaming
realtimeService.resumeStreaming();

// Send custom events
realtimeService.sendCustomEvent('user_action', { action: 'button_click' });

// Send user activity
realtimeService.sendUserActivity('page_navigation', { page: 'settings' });
```

### VAD State Monitoring

```typescript
// Get current VAD state
const vadState = realtimeService.getVADState();
console.log('User speaking:', vadState.isUserSpeaking);
console.log('AI speaking:', vadState.isAISpeaking);

// Get comprehensive connection status
const status = realtimeService.getConnectionStatus();
console.log('Connection state:', status.peerConnectionState);
console.log('VAD state:', status.vadState);
```

## Configuration

### VAD Settings

```typescript
const sessionConfig = {
  turnDetection: {
    type: 'server_vad',
    threshold: 0.5,           // Sensitivity threshold (0.0 - 1.0)
    prefix_padding_ms: 300,   // Audio padding before speech
    silence_duration_ms: 500  // Silence duration to end turn
  }
};
```

### Audio Format Settings

```typescript
const sessionConfig = {
  input_audio_format: 'pcm16',    // Input audio format
  output_audio_format: 'pcm16',   // Output audio format
  input_audio_transcription: {
    model: 'whisper-1',
    language: 'en'
  }
};
```

## Benefits

### 🎯 Improved Conversation Quality
- **No Echo**: Automatic audio input management prevents feedback
- **Clear Audio**: Optimized audio input ensures clear user speech
- **Smooth Transitions**: Seamless handoffs between user and AI

### 📊 Better Monitoring
- **Real-time Status**: Live connection and VAD state monitoring
- **Event History**: Track all connection updates and events
- **Debug Information**: Comprehensive connection status details

### 🔧 Enhanced Control
- **Granular Control**: Fine-grained audio input/output management
- **Flexible Streaming**: Pause/resume without disconnecting
- **Custom Events**: Send application-specific events and updates

## Demo Components

### RealtimeConnectionStatus.svelte
A comprehensive status display component showing:
- Connection status
- VAD state indicators
- Audio state
- Recent connection updates
- Control buttons (pause, resume, disconnect)

### Realtime Demo Page
Interactive demo showcasing:
- Live VAD state visualization
- Connection update monitoring
- Audio control testing
- Feature explanations

## Technical Details

### Audio Input Management
- **Automatic Pause**: Triggers on `input_audio_buffer.speech_started`
- **Automatic Resume**: Triggers on `response.audio.done` with 500ms delay
- **Track Control**: Uses `track.enabled` property for clean audio management

### Event Flow
1. **User Speech Detected** → Pause local audio input
2. **User Speech Ends** → Schedule audio input resume (500ms delay)
3. **AI Speech Starts** → Pause local audio input
4. **AI Speech Ends** → Resume local audio input immediately

### Error Handling
- Graceful fallback for missing methods
- Comprehensive cleanup on disconnect
- Timeout management for VAD events
- Connection state validation

## Migration Guide

### Existing Code
```typescript
// Old way
await realtimeService.connectWithSession(
  sessionData,
  stream,
  onMessage,
  onConnectionStateChange,
  onTranscription
);
```

### Enhanced Code
```typescript
// New way with connection updates
await realtimeService.connectWithSession(
  sessionData,
  stream,
  onMessage,
  onConnectionStateChange,
  onTranscription,
  onConnectionUpdate  // New optional parameter
);
```

### New Methods Available
- `getVADState()`: Get current VAD state
- `sendCustomEvent()`: Send custom events
- `sendUserActivity()`: Send user activity updates
- Enhanced `getConnectionStatus()`: Includes VAD state

## Best Practices

1. **Always handle connection updates** for better user experience
2. **Use VAD state** to show speaking indicators in UI
3. **Implement proper cleanup** in component lifecycle
4. **Monitor audio states** for debugging and user feedback
5. **Use custom events** for application-specific functionality

## Troubleshooting

### Common Issues
- **Audio not resuming**: Check VAD timeout settings
- **Connection updates not working**: Verify callback registration
- **VAD state stuck**: Check for proper cleanup on disconnect

### Debug Information
```typescript
// Get detailed status
const status = realtimeService.getConnectionStatus();
console.log('Full status:', status);

// Check VAD state
const vadState = realtimeService.getVADState();
console.log('VAD state:', vadState);
```
