// 🎤 Audio Feature Ports
// Clean interfaces for audio processing and streaming

export interface AudioCapturePort {
	startCapture(deviceId?: string): Promise<AudioCaptureSession>;
	startRecording(): Promise<AudioCaptureSession>;
	stopCapture(session: AudioCaptureSession): Promise<void>;
	getDevices(): Promise<AudioDevice[]>;
}

export interface AudioPlaybackPort {
	play(audioData: ArrayBuffer): Promise<void>;
	stop(): Promise<void>;
	setVolume(volume: number): void;
}

export interface AudioStreamingPort {
	startStreaming(session: AudioCaptureSession): Promise<AudioStream>;
	stopStreaming(stream: AudioStream): Promise<void>;
	onAudioData(callback: (chunk: ArrayBuffer) => void): void;
}

export interface AudioProcessingPort {
	processChunk(chunk: ArrayBuffer): Promise<ProcessedAudio>;
	mergeChunks(chunks: ArrayBuffer[]): Promise<ArrayBuffer>;
}

// 🎯 Domain Types
export interface AudioCaptureSession {
	id: string;
	stream: MediaStream;
	recorder: MediaRecorder;
	chunks: ArrayBuffer[];
	isActive: boolean;
	startTime: number;
	deviceId?: string;
}

export interface AudioStream {
	id: string;
	session: AudioCaptureSession;
	isActive: boolean;
	onData: (chunk: ArrayBuffer) => void;
}

export interface AudioDevice {
	id: string;
	name: string;
	type: 'input' | 'output';
	enabled: boolean;
}

export interface ProcessedAudio {
	chunk: ArrayBuffer;
	level: number;
	timestamp: number;
	metadata: {
		sampleRate: number;
		channels: number;
		duration: number;
		encoded?: boolean;
		error?: string;
		source?: string;
	};
}
