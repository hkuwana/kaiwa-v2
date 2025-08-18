// 🧠 Conversation Kernel - Pure Functional Core
// No state, no side effects, only pure transformations

import type { AudioState } from '$lib/features/audio';
import type { Message, Scenario, Speaker } from '$lib/server/db/types';

// 🎯 Single Conversation Status Enum
export enum RealtimeConversationStatus {
	IDLE = 'idle',
	CONNECTING = 'connecting',
	CONNECTED = 'connected',
	STREAMING = 'streaming',
	ERROR = 'error'
}

// 🎯 Single Conversation State Interface (following schema format)
export interface ConversationState {
	// Core state
	status: RealtimeConversationStatus;
	sessionId: string;
	startTime: number;

	// Configuration
	language: string;
	voice: string;
	userLevel: number;

	// Content
	messages: Message[];
	scenario?: Scenario;
	speaker?: Speaker;
	audioState?: AudioState;

	// Error handling
	error?: string;

	// Metadata (following schema pattern)
	timestamp: Date;
}

// 🎯 Actions that can be performed on the state
export interface ConversationAction {
	type:
		| 'START_CONVERSATION'
		| 'START_RECORDING'
		| 'STOP_RECORDING'
		| 'RECEIVE_RESPONSE'
		| 'START_SPEAKING'
		| 'STOP_SPEAKING'
		| 'SET_ERROR'
		| 'CLEAR_ERROR';
	payload?: {
		audio?: ArrayBuffer;
		transcript?: string;
		response?: string;
		language?: string;
		voice?: string;
		error?: string;
	};
}

// 🎯 Effects that should happen as a result of state changes
export interface ConversationEffect {
	type: 'TRANSCRIBE' | 'GENERATE_RESPONSE' | 'SPEAK' | 'SAVE_EXCHANGE';
	payload: {
		audio?: ArrayBuffer;
		text?: string;
		messages?: Array<{
			id: string;
			role: 'user' | 'assistant';
			content: string;
			timestamp: Date;
			audioUrl?: string;
		}>;
	};
}

// 🧠 Pure Functional Core - No side effects, no state mutation
export const conversationCore = {
	// 🎯 Pure state transitions
	transition: (state: ConversationState, action: ConversationAction): ConversationState => {
		switch (action.type) {
			case 'START_CONVERSATION': {
				return {
					...state,
					status: RealtimeConversationStatus.IDLE,
					sessionId: crypto.randomUUID(),
					startTime: Date.now(),
					messages: [],
					language: action.payload?.language || state.language,
					voice: action.payload?.voice || state.voice,
					userLevel: state.userLevel,
					error: undefined,
					timestamp: new Date()
				};
			}

			case 'START_RECORDING': {
				if (state.status !== RealtimeConversationStatus.IDLE) return state;
				return {
					...state,
					status: RealtimeConversationStatus.STREAMING,
					error: undefined,
					timestamp: new Date()
				};
			}

			case 'STOP_RECORDING': {
				if (state.status !== RealtimeConversationStatus.STREAMING) return state;
				return {
					...state,
					status: RealtimeConversationStatus.CONNECTED,
					error: undefined,
					timestamp: new Date()
				};
			}

			case 'RECEIVE_RESPONSE': {
				if (state.status !== RealtimeConversationStatus.CONNECTED) return state;

				const transcript = action.payload?.transcript || '';
				const response = action.payload?.response || '';

				const newMessages: Message[] = [
					...state.messages,
					{
						id: crypto.randomUUID(),
						conversationId: state.sessionId,
						role: 'user' as const,
						content: transcript,
						timestamp: new Date(),
						audioUrl: null
					},
					{
						id: crypto.randomUUID(),
						conversationId: state.sessionId,
						role: 'assistant' as const,
						content: response,
						timestamp: new Date(),
						audioUrl: null
					}
				];

				return {
					...state,
					status: RealtimeConversationStatus.CONNECTED,
					messages: newMessages,
					error: undefined,
					timestamp: new Date()
				};
			}

			case 'START_SPEAKING': {
				if (state.status !== RealtimeConversationStatus.CONNECTED) return state;
				return {
					...state,
					status: RealtimeConversationStatus.CONNECTED,
					timestamp: new Date()
				};
			}

			case 'STOP_SPEAKING': {
				if (state.status !== RealtimeConversationStatus.CONNECTED) return state;
				return {
					...state,
					status: RealtimeConversationStatus.IDLE,
					timestamp: new Date()
				};
			}

			case 'SET_ERROR': {
				return {
					...state,
					error: action.payload?.error || 'An error occurred',
					status: RealtimeConversationStatus.ERROR,
					timestamp: new Date()
				};
			}

			case 'CLEAR_ERROR': {
				return {
					...state,
					error: undefined,
					status: RealtimeConversationStatus.IDLE,
					timestamp: new Date()
				};
			}

			default:
				return state;
		}
	},

	// 🎯 Pure effect generation
	getEffects: (state: ConversationState, action: ConversationAction): ConversationEffect[] => {
		const effects: ConversationEffect[] = [];

		switch (action.type) {
			case 'START_RECORDING':
				effects.push({
					type: 'TRANSCRIBE',
					payload: {}
				});
				break;

			case 'STOP_RECORDING':
				effects.push({
					type: 'GENERATE_RESPONSE',
					payload: {}
				});
				break;

			case 'RECEIVE_RESPONSE':
				effects.push({
					type: 'SPEAK',
					payload: {}
				});
				break;
		}

		return effects;
	}
};

// 🎯 Factory function to create initial state
export function createInitialState(): ConversationState {
	return {
		status: RealtimeConversationStatus.IDLE,
		sessionId: '',
		startTime: 0,
		language: 'en',
		voice: 'alloy',
		userLevel: 220,
		messages: [],
		error: undefined,
		timestamp: new Date()
	};
}

// 🎯 Export the kernel instance
export const conversationKernel = conversationCore;

// 🧹 SANITIZATION LAYER: Convert OpenAI realtime output to clean schema
export const realtimeSanitizer = {
	// 🎯 Sanitize OpenAI realtime transcript to your Message format
	sanitizeTranscript: (openaiTranscript: any, conversationId: string): Message => {
		return {
			id: crypto.randomUUID(),
			conversationId,
			role: 'user',
			content: openaiTranscript.text || openaiTranscript.content || '',
			timestamp: new Date(),
			audioUrl: openaiTranscript.audioUrl || null
		};
	},

	// 🎯 Sanitize OpenAI realtime response to your Message format
	sanitizeResponse: (openaiResponse: any, conversationId: string): Message => {
		return {
			id: crypto.randomUUID(),
			conversationId,
			role: 'assistant',
			content: openaiResponse.text || openaiResponse.content || '',
			timestamp: new Date(),
			audioUrl: openaiResponse.audioUrl || null
		};
	},

	// 🎯 Sanitize OpenAI realtime audio chunk to your format
	sanitizeAudioChunk: (openaiAudioChunk: any): ArrayBuffer => {
		// OpenAI might send audio in different formats
		if (openaiAudioChunk instanceof ArrayBuffer) {
			return openaiAudioChunk;
		}

		if (openaiAudioChunk.data) {
			return openaiAudioChunk.data;
		}

		if (openaiAudioChunk.buffer) {
			return openaiAudioChunk.buffer;
		}

		// Fallback: try to convert whatever we got
		try {
			return new ArrayBuffer(0); // Empty buffer as fallback
		} catch {
			throw new Error('Unable to sanitize OpenAI audio chunk');
		}
	},

	// 🎯 Sanitize OpenAI realtime session data to your format
	sanitizeSessionData: (
		openaiSession: any
	): {
		sessionId: string;
		clientSecret: string;
		expiresAt: number;
		model: string;
		voice: string;
		language: string;
	} => {
		return {
			sessionId: openaiSession.id || openaiSession.sessionId || crypto.randomUUID(),
			clientSecret: openaiSession.clientSecret || openaiSession.secret || '',
			expiresAt: openaiSession.expiresAt || openaiSession.expires || Date.now() + 3600000,
			model: openaiSession.model || 'gpt-4o-realtime-preview-2024-10-01',
			voice: openaiSession.voice || 'alloy',
			language: openaiSession.language || 'en'
		};
	},

	// 🎯 Sanitize OpenAI realtime error to your error format
	sanitizeError: (openaiError: any): string => {
		if (typeof openaiError === 'string') {
			return openaiError;
		}

		if (openaiError?.message) {
			return openaiError.message;
		}

		if (openaiError?.error) {
			return openaiError.error;
		}

		if (openaiError?.reason) {
			return openaiError.reason;
		}

		// Fallback error message
		return 'OpenAI realtime error occurred';
	},

	// 🎯 Validate that OpenAI realtime data is in expected format
	validateRealtimeData: (
		data: any,
		type: 'transcript' | 'response' | 'audio' | 'session' | 'error'
	): boolean => {
		switch (type) {
			case 'transcript':
				return !!(data && (data.text || data.content));
			case 'response':
				return !!(data && (data.text || data.content));
			case 'audio':
				return !!(data && (data instanceof ArrayBuffer || data.data || data.buffer));
			case 'session':
				return !!(data && (data.id || data.sessionId));
			case 'error':
				return !!(data && (typeof data === 'string' || data.message || data.error || data.reason));
			default:
				return false;
		}
	}
};
