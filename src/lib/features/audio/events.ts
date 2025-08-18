// 🎵 Audio Feature Events (typed contracts)
// Define event names and payload types for the audio feature

export const audioEvents = {
	chunk: 'audio.chunk',
	playbackStarted: 'audio.playback_started',
	recordingStopped: 'audio.recording_stopped',
	volumeChanged: 'audio.volume_changed',
	error: 'audio.error'
} as const;

export type AudioEventName = (typeof audioEvents)[keyof typeof audioEvents];

// Payload types
export type AudioChunkPayload = ArrayBuffer;

export type PlaybackStartedPayload = {
	audioId?: string;
	timestamp: number; // ms since epoch
};

export type RecordingStoppedPayload = {
	sessionId: string;
	duration: number; // ms
	timestamp: number; // ms since epoch
};

export type VolumeChangedPayload = {
	volume: number; // 0..1
	timestamp: number; // ms since epoch
};

export type AudioErrorPayload = {
	message: string;
	timestamp: number; // ms since epoch
};
