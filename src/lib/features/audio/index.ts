// 🎤 Audio Feature Public API
// Clean interface for other features to use audio capabilities

export * from './ports';
export * from './adapters';

import { audioAdapters } from './adapters';
import type { AudioCaptureSession, AudioStream } from './ports';

// 🎯 Main audio service
export class AudioService {
	constructor(
		private capture = audioAdapters.capture,
		private playback = audioAdapters.playback,
		private streaming = audioAdapters.streaming,
		private processing = audioAdapters.processing
	) {}

	// High-level audio operations
	async startRecording(deviceId?: string) {
		return this.capture.startCapture(deviceId);
	}

	async stopRecording(session: AudioCaptureSession) {
		return this.capture.stopCapture(session);
	}

	async playAudio(audioData: ArrayBuffer) {
		return this.playback.play(audioData);
	}

	async startStreaming(session: AudioCaptureSession) {
		return this.streaming.startStreaming(session);
	}

	async stopStreaming(stream: AudioStream) {
		return this.streaming.stopStreaming(stream);
	}

	async processAudioChunk(chunk: ArrayBuffer) {
		return this.processing.processChunk(chunk);
	}

	async mergeAudioChunks(chunks: ArrayBuffer[]) {
		return this.processing.mergeChunks(chunks);
	}

	// Device management
	async getAudioDevices() {
		return this.capture.getDevices();
	}

	// Volume control
	setVolume(volume: number) {
		this.playback.setVolume(volume);
	}

	// Event handling
	onAudioData(callback: (chunk: ArrayBuffer) => void) {
		// AudioWorklet sends data through the capture adapter, not streaming
		this.capture.onAudioData(callback);
	}
}

// 🎯 Default audio service instance
export const audioService = new AudioService();
