# 🎵 Enhanced AudioVisualizer Component

## Overview

The Enhanced AudioVisualizer is a Svelte 5 component that provides:

- **Smooth movement** during recording (up/down sine wave animation)
- **Static display** when not recording
- **Press-to-record** functionality
- **OpenAI realtime integration** ready
- **Real-time audio level visualization**
- **Integration with existing `audio.service.ts`**

## ✨ Key Features

### 🎬 Smooth Animation System

- **During Recording**: Smooth up/down movement using sine wave animation
- **When Idle**: Perfectly static display for clean appearance
- **60fps Animation**: Uses `requestAnimationFrame` for smooth performance
- **Hardware Acceleration**: CSS transforms for optimal performance

### 🎤 Press-to-Record

- **Press & Hold**: Start recording by pressing and holding
- **Release to Stop**: Stop recording by releasing
- **Visual Feedback**: Immediate visual response to user interaction
- **Accessibility**: Full keyboard and screen reader support

### ⌨️ Keyboard Controls

- **Spacebar/Enter**: Press to start recording, release to stop
- **Hands-free Operation**: Perfect for when you can't use mouse/touch
- **Prevents Default**: Stops page scrolling when using spacebar
- **Immediate Response**: No delay like mouse press-and-hold

### 🔌 OpenAI Realtime Ready

- **Audio Capture**: Records high-quality WebM/Opus audio
- **Blob Output**: Provides audio data ready for API transmission
- **Callback System**: Hooks for integration with AI services
- **Error Handling**: Comprehensive error management

### 🔗 Audio Service Integration

- **Uses existing `audio.service.ts`**: Leverages your existing audio infrastructure
- **Device management**: Automatic device selection and management
- **Level monitoring**: Real-time audio level updates at 20fps
- **Stream handling**: Seamless integration with existing audio streams

## 🚀 Quick Start

### Basic Usage

```svelte
<script>
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';

	let audioLevel = 0;
	let isRecording = false;
	let isListening = false;

	function handleRecordStart() {
		console.log('Recording started');
	}

	function handleRecordStop() {
		console.log('Recording stopped');
	}

	function handleRecordComplete(audioData) {
		console.log('Audio recorded:', audioData.size, 'bytes');
		// Send to OpenAI realtime API
	}
</script>

<AudioVisualizer
	{audioLevel}
	{isRecording}
	{isListening}
	onRecordStart={handleRecordStart}
	onRecordStop={handleRecordStop}
	onRecordComplete={handleRecordComplete}
/>
```

### With Device Selection

```svelte
<script>
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import { audioService } from '$lib/services/audio.service';

	let audioLevel = 0;
	let isRecording = false;
	let isListening = false;
	let selectedDeviceId = 'default';

	$effect(() => {
		// Initialize audio service
		audioService.initialize();

		// Set up audio level monitoring
		audioService.onLevelUpdate((level) => {
			audioLevel = level.level;
		});
	});
</script>

<AudioVisualizer
	{audioLevel}
	{isRecording}
	{isListening}
	deviceId={selectedDeviceId}
	onRecordStart={handleRecordStart}
	onRecordStop={handleRecordStop}
	onRecordComplete={handleRecordComplete}
/>
```

## 📋 Props

| Prop               | Type             | Default     | Description                             |
| ------------------ | ---------------- | ----------- | --------------------------------------- |
| `audioLevel`       | `number`         | `0`         | Audio level (0-1) for visualization     |
| `isRecording`      | `boolean`        | `false`     | Whether currently recording             |
| `isListening`      | `boolean`        | `false`     | Whether AI is processing                |
| `onRecordStart`    | `() => void`     | `() => {}`  | Called when recording starts            |
| `onRecordStop`     | `() => void`     | `() => {}`  | Called when recording stops             |
| `onRecordComplete` | `(Blob) => void` | `() => {}`  | Called with audio data when complete    |
| `deviceId`         | `string`         | `undefined` | Specific audio device to use (optional) |

## 🎯 Event Flow

### 1. User Presses and Holds

```
User Action → handlePointerDown → startRecording → onRecordStart
```

### 2. Recording in Progress

```
Recording Active → Audio Level Updates → Smooth Animation → Real-time Visualization
```

### 3. User Releases

```
User Release → handlePointerUp → stopRecording → onRecordStop
```

### 4. Processing Complete

```
Recording Complete → Audio Blob Created → onRecordComplete → OpenAI Integration
```

## 🔧 Audio Service Integration

### Using Existing `audio.service.ts`

The component automatically integrates with your existing audio service:

```typescript
import { audioService } from '$lib/services/audio.service';

// Initialize audio service
await audioService.initialize();

// Set up audio level monitoring
audioService.onLevelUpdate((level) => {
	// The AudioVisualizer will automatically use this level
	console.log('Audio level:', level.level);
});

// Get available devices
const devices = await audioService.getAvailableDevices();
console.log('Available devices:', devices);
```

### Device Management

```typescript
// Test a specific device
const stream = await audioService.getStream('device-id-123');

// Use the device in AudioVisualizer
<AudioVisualizer deviceId="device-id-123" />
```

### OpenAI Realtime Integration

The component is designed to work seamlessly with OpenAI's realtime API:

```typescript
async function sendToOpenAI(audioBlob: Blob) {
	// Convert to OpenAI format if needed
	const formData = new FormData();
	formData.append('audio', audioBlob);

	// Send to OpenAI
	const response = await fetch('/api/openai/realtime', {
		method: 'POST',
		body: formData
	});

	// Handle response
	const result = await response.json();
	// Process AI response...
}
```

## 🎨 Customization

### Animation Timing

The sine wave animation uses a 2-second period by default. You can modify this in the component:

```typescript
// In startRecordingAnimation()
const elapsed = Date.now() - recordingStartTime;
// Change 0.003 to adjust speed (higher = faster)
verticalOffset = Math.sin(elapsed * 0.003) * 8;
```

### Visual Styling

The component uses Tailwind CSS classes that can be customized:

```svelte
<!-- Custom colors -->
<div class="absolute h-full w-full rounded-full bg-custom-color">
```

### Size and Scale

The component is responsive and can be scaled using CSS transforms:

```svelte
<div class="scale-75">
	<!-- 75% size -->
	<AudioVisualizer />
</div>
```

## 🧪 Testing

### Demo Page

Visit `/dev-audiovisualizer` to see the component in action with:

- Real-time recording
- Audio playback
- Device selection
- Service integration
- Error handling

### Unit Testing

```typescript
import { render } from '@testing-library/svelte';
import AudioVisualizer from './AudioVisualizer.svelte';

describe('AudioVisualizer', () => {
	it('should render correctly', () => {
		const { getByRole } = render(AudioVisualizer);
		expect(getByRole('button')).toBeInTheDocument();
	});

	it('should handle recording start', async () => {
		const mockOnRecordStart = jest.fn();
		const { getByRole } = render(AudioVisualizer, {
			props: { onRecordStart: mockOnRecordStart }
		});

		// Test recording functionality
		// ... implementation details
	});
});
```

## 🚨 Error Handling

The component handles various error scenarios:

- **Microphone Access Denied**: Shows error message and disables recording
- **Recording Failures**: Graceful fallback with user feedback
- **Audio Processing Errors**: Continues operation with error logging
- **Service Errors**: Comprehensive error callback system
- **Device Errors**: Automatic fallback to default device

## ♿ Accessibility

- **Keyboard Navigation**: Space/Enter keys for recording control
- **Screen Reader Support**: ARIA labels and descriptions
- **Visual Indicators**: Clear status and state information
- **Focus Management**: Proper focus handling during interactions

## 🔮 Future Enhancements

- **Multiple Animation Patterns**: Choose from different movement styles
- **Custom Audio Processing**: Real-time effects and filters
- **Advanced VAD**: Voice activity detection integration
- **Multi-language Support**: Internationalization for UI text
- **Performance Metrics**: Recording quality and performance analytics

## 📚 Related Components

- **AudioVisualizer**: Core visualization component
- **audio.service.ts**: Existing audio service for device management

## 🤝 Contributing

When contributing to the AudioVisualizer:

1. **Maintain Performance**: Keep animations smooth at 60fps
2. **Test Accessibility**: Ensure keyboard and screen reader compatibility
3. **Follow Patterns**: Use existing callback and state management patterns
4. **Document Changes**: Update this README for new features
5. **Test Integration**: Verify compatibility with existing `audio.service.ts`

## 🔄 Migration from Custom Service

If you were using the custom `audiovisualizer.service.ts`:

1. **Remove custom service**: Delete `audiovisualizer.service.ts`
2. **Update imports**: Use `audioService` from `audio.service.ts`
3. **Update callbacks**: Use the simplified callback system
4. **Test integration**: Verify audio level monitoring works correctly

---

For more information, see the demo at `/dev-audiovisualizer` or check the existing audio service in `audio.service.ts`.
