// 🚀 Real-time Feature Events (typed contracts)
// Define event names and payload types for the realtime feature

export const realtimeEvents = {
	connectionStatus: 'realtime.connection.status',
	transcriptReceived: 'realtime.transcript.received',
	responseReceived: 'realtime.response.received',
	audioResponse: 'realtime.audio.response',
	error: 'realtime.error'
} as const;

export type RealtimeEventName = (typeof realtimeEvents)[keyof typeof realtimeEvents];

// Payload types
export type ConnectionStatusPayload = {
	status: 'connecting' | 'connected' | 'disconnected' | 'error';
	sessionId: string;
	timestamp: number; // ms since epoch
	details?: string;
};

export type TranscriptReceivedPayload = {
	transcript: string;
	sessionId: string;
	confidence?: number;
	language?: string;
	timestamp: number; // ms since epoch
};

export type ResponseReceivedPayload = {
	response: string;
	sessionId: string;
	timestamp: number; // ms since epoch
};

export type AudioResponsePayload = {
	audioChunk: ArrayBuffer;
	sessionId: string;
	timestamp: number; // ms since epoch
};

export type RealtimeErrorPayload = {
	message: string;
	sessionId?: string;
	timestamp: number; // ms since epoch
	details?: any;
};
