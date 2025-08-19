// 🎭 Conversation Types
// Basic types for conversation functionality

export enum RealtimeConversationStatus {
	IDLE = 'idle',
	CONNECTING = 'connecting',
	STREAMING = 'streaming',
	PROCESSING = 'processing',
	ERROR = 'error'
}

export interface ConversationState {
	status: RealtimeConversationStatus;
	sessionId?: string;
	language?: string;
	voice?: string;
	messages: Message[];
	error?: string;
}

export interface Message {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

export interface ConversationAction {
	type: string;
	payload?: any;
}

export interface ConversationEffect {
	type: string;
	payload?: any;
}
