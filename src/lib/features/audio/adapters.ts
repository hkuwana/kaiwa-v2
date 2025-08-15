// 🎤 Audio Feature Adapters
// Modern implementations of audio processing and streaming

import type {
	AudioCapturePort,
	AudioPlaybackPort,
	AudioStreamingPort,
	AudioProcessingPort,
	AudioCaptureSession,
	AudioStream,
	AudioDevice,
	ProcessedAudio
} from './ports';

// 🎤 Browser Audio Capture Adapter
export class BrowserAudioCaptureAdapter implements AudioCapturePort {
	private activeSessions = new Map<string, AudioCaptureSession>();
	private audioDataCallbacks: ((chunk: ArrayBuffer) => void)[] = [];
	private audioContext: AudioContext | null = null;
	private audioWorklet: AudioWorkletNode | null = null;

	async startCapture(deviceId?: string): Promise<AudioCaptureSession> {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: 16000,
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					...(deviceId && { deviceId })
				}
			});

			// Create AudioContext for real-time processing
			this.audioContext = new AudioContext({ sampleRate: 16000 });

			// Load the AudioWorklet
			await this.audioContext.audioWorklet.addModule('/audio-processor.js');

			// Create source from stream
			const source = this.audioContext.createMediaStreamSource(stream);

			// Create AudioWorklet node
			this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-processor');

			// Set up message handling from AudioWorklet
			this.audioWorklet.port.onmessage = (event) => {
				if (event.data.type === 'audio-data') {
					const level = event.data.level;
					// Notify audio level callbacks
					this.audioDataCallbacks.forEach((callback) => callback(level));
				}
			};

			// Connect the audio graph
			source.connect(this.audioWorklet);
			this.audioWorklet.connect(this.audioContext.destination);

			const session: AudioCaptureSession = {
				id: crypto.randomUUID(),
				stream,
				recorder: null as never, // Not needed for AudioWorklet
				chunks: [], // Will store audio levels instead
				isActive: true,
				startTime: Date.now()
			};

			this.activeSessions.set(session.id, session);
			console.log('🎤 Audio capture started with AudioWorklet:', session.id);
			return session;
		} catch (error) {
			console.error('❌ Failed to start audio capture:', error);
			throw new Error(`Failed to start audio capture: ${error}`);
		}
	}

	async startRecording(): Promise<AudioCaptureSession> {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: 16000,
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				}
			});

			// Create AudioContext for real-time processing
			this.audioContext = new AudioContext({ sampleRate: 16000 });

			// Load the AudioWorklet
			await this.audioContext.audioWorklet.addModule('/audio-processor.js');

			// Create source from stream
			const source = this.audioContext.createMediaStreamSource(stream);

			// Create AudioWorklet node
			this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-processor');

			// Set up message handling from AudioWorklet
			this.audioWorklet.port.onmessage = (event) => {
				if (event.data.type === 'audio-data') {
					const level = event.data.level;
					// Store audio level as a "chunk"
					const levelChunk = new Float32Array([level]).buffer;

					// Notify audio data callbacks
					this.audioDataCallbacks.forEach((callback) => callback(levelChunk));
				}
			};

			// Connect the audio graph
			source.connect(this.audioWorklet);
			this.audioWorklet.connect(this.audioContext.destination);

			const session: AudioCaptureSession = {
				id: crypto.randomUUID(),
				stream,
				recorder: null as never, // Not needed for AudioWorklet
				chunks: [], // Will store audio levels
				isActive: true,
				startTime: Date.now()
			};

			this.activeSessions.set(session.id, session);
			console.log('🎤 Audio recording started with AudioWorklet:', session.id);
			return session;
		} catch (error) {
			console.error('❌ Failed to start audio recording:', error);
			throw new Error(`Failed to start audio recording: ${error}`);
		}
	}

	async stopCapture(session: AudioCaptureSession): Promise<void> {
		try {
			session.isActive = false;
			session.stream.getTracks().forEach((track) => track.stop());

			// Clean up AudioWorklet
			if (this.audioWorklet) {
				this.audioWorklet.disconnect();
				this.audioWorklet = null;
			}

			if (this.audioContext) {
				await this.audioContext.close();
				this.audioContext = null;
			}

			this.activeSessions.delete(session.id);
			console.log('🔇 Audio capture stopped:', session.id);
		} catch (error) {
			console.error('❌ Failed to stop audio capture:', error);
		}
	}

	async getDevices(): Promise<AudioDevice[]> {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			return devices
				.filter((device) => device.kind === 'audioinput')
				.map((device) => ({
					id: device.deviceId,
					name: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
					type: 'input' as const,
					enabled: true
				}));
		} catch (error) {
			console.error('❌ Failed to get audio devices:', error);
			return [];
		}
	}

	onAudioData(callback: (chunk: ArrayBuffer) => void): void {
		this.audioDataCallbacks.push(callback);
	}
}

// 🔊 Browser Audio Playback Adapter
export class BrowserAudioPlaybackAdapter implements AudioPlaybackPort {
	private audioContext: AudioContext | null = null;
	private currentSource: AudioBufferSourceNode | null = null;
	private volumeNode: GainNode | null = null;

	async play(audioData: ArrayBuffer): Promise<void> {
		try {
			if (!this.audioContext) {
				this.audioContext = new AudioContext();
				this.volumeNode = this.audioContext.createGain();
				this.volumeNode.connect(this.audioContext.destination);
			}

			const audioBuffer = await this.audioContext.decodeAudioData(audioData);

			if (this.currentSource) {
				this.currentSource.stop();
			}

			this.currentSource = this.audioContext.createBufferSource();
			this.currentSource.buffer = audioBuffer;
			if (this.volumeNode) {
				this.currentSource.connect(this.volumeNode);
			}

			return new Promise<void>((resolve) => {
				if (this.currentSource) {
					this.currentSource.onended = () => resolve();
					// Note: AudioBufferSourceNode doesn't have onerror in modern browsers
					this.currentSource.start();
				}
			});
		} catch (error) {
			throw new Error(`Failed to play audio: ${error}`);
		}
	}

	async stop(): Promise<void> {
		if (this.currentSource) {
			this.currentSource.stop();
			this.currentSource = null;
		}
	}

	setVolume(volume: number): void {
		if (this.volumeNode) {
			this.volumeNode.gain.value = Math.max(0, Math.min(1, volume));
		}
	}
}

// 🌊 Audio Streaming Adapter
export class AudioStreamingAdapter implements AudioStreamingPort {
	private streams = new Map<string, AudioStream>();
	private audioDataCallbacks: ((chunk: ArrayBuffer) => void)[] = [];

	async startStreaming(session: AudioCaptureSession): Promise<AudioStream> {
		const stream: AudioStream = {
			id: crypto.randomUUID(),
			session,
			isActive: true,
			onData: (chunk: ArrayBuffer) => {
				this.audioDataCallbacks.forEach((callback) => callback(chunk));
			}
		};

		// For AudioWorklet, we don't need to set up MediaRecorder
		// The audio data is already being processed by the AudioWorklet
		// and sent through the onAudioData callbacks

		console.log('🌊 Audio streaming started for session:', session.id);

		this.streams.set(stream.id, stream);
		return stream;
	}

	async stopStreaming(stream: AudioStream): Promise<void> {
		stream.isActive = false;
		this.streams.delete(stream.id);
		console.log('⏹️ Audio streaming stopped for stream:', stream.id);
	}

	onAudioData(callback: (chunk: ArrayBuffer) => void): void {
		this.audioDataCallbacks.push(callback);
	}
}

// 🔧 Audio Processing Adapter
export class AudioProcessingAdapter implements AudioProcessingPort {
	async processChunk(chunk: ArrayBuffer): Promise<ProcessedAudio> {
		try {
			// AudioWorklet sends audio levels as Float32Array
			const levelData = new Float32Array(chunk);
			const level = levelData[0] || 0; // Get the audio level

			console.log('🔊 Processing audio level:', {
				level: level.toFixed(3),
				chunkSize: chunk.byteLength
			});

			return {
				chunk,
				level: Math.min(1, level), // Ensure level is 0-1
				timestamp: Date.now(),
				metadata: {
					sampleRate: 16000,
					channels: 1,
					duration: 0.1, // AudioWorklet processes in real-time
					encoded: false, // This is raw audio level data
					source: 'audioworklet'
				}
			};
		} catch (error) {
			console.error('❌ Error processing audio chunk:', error);
			// Return safe fallback
			return {
				chunk,
				level: 0,
				timestamp: Date.now(),
				metadata: {
					sampleRate: 16000,
					channels: 1,
					duration: 0,
					encoded: false,
					error: String(error),
					source: 'audioworklet'
				}
			};
		}
	}

	async mergeChunks(chunks: ArrayBuffer[]): Promise<ArrayBuffer> {
		if (chunks.length === 0) return new ArrayBuffer(0);
		if (chunks.length === 1) return chunks[0];

		try {
			// For audio levels, we'll average them instead of concatenating
			const levels = chunks.map((chunk) => new Float32Array(chunk)[0] || 0);
			const averageLevel = levels.reduce((sum, level) => sum + level, 0) / levels.length;

			// Create a single chunk with the average level
			const mergedChunk = new Float32Array([averageLevel]).buffer;

			console.log('🔗 Merged audio levels:', {
				chunkCount: chunks.length,
				levels: levels.map((l) => l.toFixed(3)),
				averageLevel: averageLevel.toFixed(3)
			});

			return mergedChunk;
		} catch (error) {
			console.error('❌ Error merging audio chunks:', error);
			// Return empty buffer on error
			return new ArrayBuffer(0);
		}
	}
}

// 🎯 Default adapter configuration
export const audioAdapters = {
	capture: new BrowserAudioCaptureAdapter(),
	playback: new BrowserAudioPlaybackAdapter(),
	streaming: new AudioStreamingAdapter(),
	processing: new AudioProcessingAdapter()
};
