# 🎵 Audio Feature Architecture

> **Core Principle**: Functional Core, Imperative Shell following your design philosophy

## 🏗️ Architecture Overview

The audio feature follows your **"Functional Core, Imperative Shell"** principle:

- **🎯 Functional Core**: Pure state transitions and side effects as data
- **🔌 Imperative Shell**: Adapters handle messy browser APIs and external services
- **🎭 Orchestrator Pattern**: Central coordination between core and shell

## 📁 File Structure

```text
src/lib/features/audio/
├── core.ts                    # Pure functional core (no side effects)
├── types.ts                   # Type definitions and interfaces
├── orchestrator.svelte.ts     # Main orchestrator (coordinates everything)
├── adapters/                  # Imperative shell implementations
│   ├── browser.adapter.ts     # Browser MediaRecorder API
│   ├── howler.adapter.ts      # Howler.js for audio playback
│   └── openai.adapter.ts      # OpenAI TTS/STT integration
├── index.ts                   # Public API and service factory
├── example.svelte.ts          # Usage examples
└── README.md                  # This file
```

## 🎯 Core Principles

### 1. **Functional Core** (`core.ts`)

```typescript
// Pure state transitions
export const audioCore = {
  initial: (): AudioState => ({ ... }),
  transition: (state, action): AudioState => { ... },
  effects: (state, action): AudioEffect[] => { ... },
  derived: { ... }
};
```

- **No side effects** - pure functions only
- **Side effects as data** - returned as effect objects
- **Immutable state** - always return new state

### 2. **Imperative Shell** (adapters)

```typescript
// Handle messy browser APIs
export class BrowserAudioAdapter implements AudioInputPort {
  async startRecording(): Promise<MediaRecorder> { ... }
}

// Handle audio playback
export class HowlerAudioAdapter implements AudioOutputPort {
  async playFromUrl(url: string): Promise<void> { ... }
}
```

- **Browser compatibility** - Howler handles cross-browser issues
- **External services** - OpenAI API integration
- **Resource management** - cleanup and error handling

### 3. **Orchestrator Pattern** (`orchestrator.svelte.ts`)

```typescript
export class AudioOrchestrator {
	async dispatch(action: AudioAction): Promise<void> {
		// 1. Update state (pure function)
		this.state = audioCore.transition(this.state, action);

		// 2. Execute side effects (imperative shell)
		const effects = audioCore.effects(this.state, action);
		await Promise.all(effects.map((effect) => this.executeEffect(effect)));
	}
}
```

## 🚀 Usage

### Basic Usage

```typescript
import { audioService } from '$lib/features/audio';

// Start recording
await audioService.startRecording();

// Stop recording
await audioService.stopRecording();

// Play text as speech
const audioData = await audioService.textToSpeech('Hello world!');
await audioService.playAudio(audioData);

// Play from URL
await audioService.playFromUrl('/audio/response.mp3');
```

### Advanced Usage with Custom Adapters

```typescript
import { createAudioService } from '$lib/features/audio';
import { CustomInputAdapter } from './custom-adapter';

// Create service with custom input adapter
const customAudioService = createAudioService(
	new CustomInputAdapter(), // Custom recording
	undefined, // Default Howler playback
	undefined // Default OpenAI processing
);
```

### State Management

```typescript
// Get current state
const state = audioService.getState();

// Check derived state
if (audioService.canRecord) {
	await audioService.startRecording();
}

// Handle errors
if (audioService.hasError) {
	console.error(audioService.error);
	await audioService.clearError();
}
```

## 🔌 Adapters

### Browser Audio Adapter

- **Purpose**: Audio recording using MediaRecorder API
- **Features**: Device selection, format detection, audio levels
- **Fallbacks**: Multiple MIME type support

### Howler Audio Adapter

- **Purpose**: Cross-browser audio playback
- **Features**: Multiple formats, volume control, streaming support
- **Benefits**: Consistent behavior across browsers

### OpenAI Audio Adapter

- **Purpose**: AI-powered audio processing
- **Features**: Transcription, text-to-speech, streaming
- **Configuration**: API key management, voice selection

## 🎭 Event System Integration

The audio feature emits events for integration with your event bus:

```typescript
// Event types
'audio.recording_started'; // Recording began
'audio.recording_stopped'; // Recording completed
'audio.playback_started'; // Audio playback began
'audio.playback_completed'; // Audio playback finished
'audio.playback_error'; // Playback error occurred
'audio.volume_changed'; // Volume was adjusted
```

## 🧪 Testing

### Unit Testing

```typescript
import { audioCore } from './core';

describe('Audio Core', () => {
	it('should transition from idle to recording', () => {
		const initialState = audioCore.initial();
		const action = { type: 'START_RECORDING' as const };
		const newState = audioCore.transition(initialState, action);

		expect(newState.status).toBe('recording');
	});
});
```

### Integration Testing

```typescript
import { createAudioService } from './index';
import { MockInputAdapter } from './__mocks__/mock-adapter';

describe('Audio Service', () => {
	it('should start recording with mock adapter', async () => {
		const mockAdapter = new MockInputAdapter();
		const service = createAudioService(mockAdapter);

		await service.startRecording();
		expect(service.isRecording).toBe(true);
	});
});
```

## 🔧 Configuration

### Environment Variables

```bash
# OpenAI API key
VITE_OPENAI_API_KEY=your_api_key_here
```

### Local Storage

```typescript
// Store API key in localStorage
localStorage.setItem('openai_api_key', 'your_key');

// Adapter will automatically use it
const audioService = new AudioService();
```

## 🚨 Error Handling

The architecture handles errors gracefully:

1. **Errors are captured** in the orchestrator
2. **State is updated** with error information
3. **User can clear errors** and continue
4. **Fallbacks** are available for critical operations

```typescript
try {
	await audioService.startRecording();
} catch (error) {
	// Error is automatically captured in state
	if (audioService.hasError) {
		console.error(audioService.error);
		await audioService.clearError();
	}
}
```

## 🔮 Future Enhancements

### Planned Features

- **Real-time streaming** with WebRTC
- **Audio visualization** with Web Audio API
- **Multiple language support** for TTS
- **Audio caching** for better performance
- **Background processing** with Web Workers

### Architecture Benefits

- **Easy to extend** - add new adapters without changing core
- **Easy to test** - mock adapters for unit tests
- **Easy to swap** - change implementations without breaking code
- **Easy to maintain** - clear separation of concerns

## 📚 Related Documentation

- [Design Philosophy](../docs/Design.md) - Core design principles
- [Architecture Overview](../docs/ARCHITECTURE.md) - Hexagonal architecture
- [Feature Architecture](../docs/FEATURE_ARCHITECTURE.md) - 7-day sprint plan

---

**Remember**: The audio feature follows your "Invisible Tutor" principle - complex audio processing is hidden behind a simple, clean API that users never see.
