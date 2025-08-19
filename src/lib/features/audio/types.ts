// 🎵 Audio Feature Types
// Type definitions for the audio feature core

// 🎯 Core State
export interface AudioState {
	status: 'idle' | 'recording' | 'processing' | 'playing' | 'error';
	currentAudio: string | null;
	volume: number;
	recordingSession: RecordingSession | null;
	error: string | null;
}

// 🎯 Recording Session
export interface RecordingSession {
	id: string;
	startTime: number;
	endTime?: number;
	chunks: ArrayBuffer[];
	deviceId?: string;
}

// 🎯 Actions (Commands)
export type AudioAction =
	| { type: 'START_RECORDING'; deviceId?: string }
	| { type: 'STOP_RECORDING' }
	| { type: 'RECORDING_COMPLETE' }
	| { type: 'START_PLAYBACK'; audioId: string }
	| { type: 'STOP_PLAYBACK' }
	| { type: 'SET_VOLUME'; volume: number }
	| { type: 'AUDIO_ERROR'; error: string }
	| { type: 'CLEAR_ERROR' };

// 🎯 Effects (Side Effects as Data)
export type AudioEffect =
	| { type: 'INITIALIZE_RECORDING'; deviceId?: string }
	| { type: 'PROCESS_RECORDING'; session: RecordingSession | null }
	| { type: 'PLAY_AUDIO'; audioId: string; volume: number }
	| { type: 'STOP_AUDIO' }
	| { type: 'UPDATE_VOLUME'; volume: number };

// 🎯 Events (for event system integration)
export interface AudioEvents {
	'audio.recording_started': {
		sessionId: string;
		deviceId?: string;
		timestamp: Date;
	};
	'audio.recording_stopped': {
		sessionId: string;
		duration: number;
		timestamp: Date;
	};
	'audio.playback_started': {
		audioId: string;
		timestamp: Date;
	};
	'audio.playback_completed': {
		audioId: string;
		timestamp: Date;
	};
	'audio.playback_error': {
		audioId: string;
		error: string;
		timestamp: Date;
	};
	'audio.volume_changed': {
		volume: number;
		timestamp: Date;
	};
}

// 🎯 Event Payload Types
export type AudioEventPayload<T extends keyof AudioEvents> = AudioEvents[T];

// 🎯 Port Interfaces (following your hexagonal architecture)
export interface AudioInputPort {
	startRealtimeRecording: (
		deviceId?: string,
		onChunk?: (chunk: ArrayBuffer) => void
	) => Promise<MediaRecorder>;
	startRecording(deviceId?: string): Promise<MediaRecorder>;
	stopRecording(recorder: MediaRecorder): Promise<ArrayBuffer>;
	getDevices(): Promise<MediaDeviceInfo[]>;
}

export interface AudioOutputPort {
	play(audioData: ArrayBuffer): Promise<void>;
	playFromUrl(url: string): Promise<void>;
	stop(): void;
	setVolume(volume: number): void;
}

export interface AudioProcessingPort {
	transcribe(audio: ArrayBuffer): Promise<string>;
	textToSpeech(text: string): Promise<ArrayBuffer>;
}
