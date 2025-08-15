// 🧠 Core Kernel - Central orchestration and business logic
export * from './learning';
export * from './assessment';
export * from './scenarios';
export * from './realtimeAdapter';
export * from './adapters';

// 🎯 Core conversation types
export interface Message {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

export interface ConversationState {
	status: 'idle' | 'recording' | 'processing' | 'speaking' | 'error';
	messages: Message[];
	sessionId: string;
	language: string;
	mode: 'traditional' | 'realtime';
	voice: string;
	error?: string;
}

export interface ConversationEffect {
	type: 'startRecording' | 'stopRecording' | 'processAudio' | 'generateResponse' | 'playAudio';
	payload: Record<string, unknown>;
}

export function createConversationKernel(): Record<string, unknown> {
	// Implementation would go here
	return {
		// Placeholder implementation
	};
}

export function createInitialState(): ConversationState {
	return {
		status: 'idle',
		messages: [],
		sessionId: '',
		language: 'en',
		mode: 'traditional',
		voice: 'alloy'
	};
}
