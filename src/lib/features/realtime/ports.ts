// 🚀 Real-time Feature Ports
// Clean interfaces for real-time API integration

export interface RealtimeSessionPort {
	createSession(config: RealtimeSessionConfig): Promise<RealtimeSession>;
	closeSession(session: RealtimeSession): Promise<void>;
	validateSession(session: RealtimeSession): Promise<boolean>;
}

export interface RealtimeStreamingPort {
	startStreaming(session: RealtimeSession): Promise<RealtimeStream>;
	stopStreaming(stream: RealtimeStream): Promise<void>;
	sendAudioChunk(stream: RealtimeStream, chunk: ArrayBuffer): Promise<void>;
}

export interface RealtimeEventHandlerPort {
	onTranscript(callback: (transcript: string) => void): void;
	onResponse(callback: (response: string) => void): void;
	onAudioResponse(callback: (audioChunk: ArrayBuffer) => void): void;
	onError(callback: (error: string) => void): void;
	onConnectionChange(callback: (status: 'connected' | 'disconnected') => void): void;

	// Emit methods for internal use
	emitTranscript(transcript: string): void;
	emitResponse(response: string): void;
	emitAudioResponse(audioChunk: ArrayBuffer): void;
	emitError(error: string): void;
	emitConnectionChange(status: 'connected' | 'disconnected'): void;
}

// 🎯 Domain Types
export interface RealtimeSessionConfig {
	sessionId: string;
	model: string;
	voice: string;
	language: string;
	instructions?: string;
	temperature?: number;
}

export interface RealtimeSession {
	id: string;
	clientSecret: string;
	expiresAt: number;
	config: RealtimeSessionConfig;
	status: 'connecting' | 'connected' | 'disconnected' | 'error';
	createdAt: number;
}

export interface RealtimeStream {
	id: string;
	session: RealtimeSession;
	isActive: boolean;
	startTime: number;
	audioChunksSent: number;
	lastActivity: number;
}

export interface RealtimeEvent {
	type: 'transcript' | 'response' | 'audio_response' | 'error' | 'connection_change';
	payload: any;
	timestamp: number;
	sessionId: string;
}
