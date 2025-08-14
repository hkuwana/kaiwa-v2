// 🧠 Conversation Kernel - Pure Functional Core
// No state, no side effects, only pure transformations

import type { Message } from '$lib/server/db/schema';

// 🎯 Pure Types - No state, only data structures
export interface ConversationState {
	status: 'idle' | 'recording' | 'processing' | 'speaking';
	sessionId: string;
	messages: Message[];
	startTime: number;
	language?: string;
	voice?: string;
	error?: string;
}

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

export interface ConversationEffect {
	type: 'TRANSCRIBE' | 'GENERATE_RESPONSE' | 'SPEAK' | 'SAVE_EXCHANGE';
	payload: {
		audio?: ArrayBuffer;
		text?: string;
		messages?: Message[];
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
					status: 'idle',
					sessionId: crypto.randomUUID(),
					startTime: Date.now(),
					messages: [],
					language: action.payload?.language || state.language,
					voice: action.payload?.voice || state.voice,
					error: undefined
				};
			}

			case 'START_RECORDING': {
				if (state.status !== 'idle') return state;
				return {
					...state,
					status: 'recording',
					error: undefined
				};
			}

			case 'STOP_RECORDING': {
				if (state.status !== 'recording') return state;
				return {
					...state,
					status: 'processing',
					error: undefined
				};
			}

			case 'RECEIVE_RESPONSE': {
				if (state.status !== 'processing') return state;

				const transcript = action.payload?.transcript || '';
				const response = action.payload?.response || '';

				const newMessages: Message[] = [
					...state.messages,
					{
						id: crypto.randomUUID(),
						conversationId: state.sessionId,
						role: 'user',
						content: transcript,
						timestamp: new Date(),
						audioId: null
					},
					{
						id: crypto.randomUUID(),
						conversationId: state.sessionId,
						role: 'assistant',
						content: response,
						timestamp: new Date(),
						audioId: null
					}
				];

				return {
					...state,
					status: 'speaking',
					messages: newMessages,
					error: undefined
				};
			}

			case 'START_SPEAKING': {
				if (state.status !== 'speaking') return state;
				return {
					...state,
					status: 'speaking'
				};
			}

			case 'STOP_SPEAKING': {
				if (state.status !== 'speaking') return state;
				return {
					...state,
					status: 'idle'
				};
			}

			case 'SET_ERROR': {
				return {
					...state,
					error: action.payload?.error || 'An error occurred',
					status: 'idle'
				};
			}

			case 'CLEAR_ERROR': {
				return {
					...state,
					error: undefined
				};
			}

			default:
				return state;
		}
	},

	// 🎯 Pure effect generation
	effects: (state: ConversationState, action: ConversationAction): ConversationEffect[] => {
		const effects: ConversationEffect[] = [];

		switch (action.type) {
			case 'STOP_RECORDING': {
				if (action.payload?.audio) {
					effects.push({
						type: 'TRANSCRIBE',
						payload: { audio: action.payload.audio }
					});
				}
				break;
			}

			case 'RECEIVE_RESPONSE': {
				if (action.payload?.response) {
					effects.push({
						type: 'SPEAK',
						payload: { text: action.payload.response }
					});
				}

				if (state.messages.length > 0) {
					effects.push({
						type: 'SAVE_EXCHANGE',
						payload: { messages: state.messages }
					});
				}
				break;
			}
		}

		return effects;
	},

	// 🎯 Pure derived values
	derived: {
		isIdle: (state: ConversationState): boolean => state.status === 'idle',
		isRecording: (state: ConversationState): boolean => state.status === 'recording',
		isProcessing: (state: ConversationState): boolean => state.status === 'processing',
		isSpeaking: (state: ConversationState): boolean => state.status === 'speaking',
		canRecord: (state: ConversationState): boolean => state.status === 'idle',
		hasError: (state: ConversationState): boolean => !!state.error,
		messageCount: (state: ConversationState): number => Math.floor(state.messages.length / 2),
		duration: (state: ConversationState): number => Date.now() - state.startTime
	}
};

// 🎯 Pure kernel factory - returns stateless functions
export function createConversationKernel(): {
	start: (state: ConversationState, language?: string, voice?: string) => ConversationState;
	startRecording: (state: ConversationState) => ConversationState;
	stopRecording: (state: ConversationState, audio: ArrayBuffer) => ConversationState;
	receiveResponse: (
		state: ConversationState,
		transcript: string,
		response: string
	) => ConversationState;
	startSpeaking: (state: ConversationState) => ConversationState;
	stopSpeaking: (state: ConversationState) => ConversationState;
	setError: (state: ConversationState, error: string) => ConversationState;
	clearError: (state: ConversationState) => ConversationState;
	getEffects: (state: ConversationState, action: ConversationAction) => ConversationEffect[];
	getDerived: (state: ConversationState) => {
		isIdle: boolean;
		isRecording: boolean;
		isProcessing: boolean;
		isSpeaking: boolean;
		canRecord: boolean;
		hasError: boolean;
		messageCount: number;
		duration: number;
	};
} {
	return {
		// 🎯 Pure conversation operations
		start: (state: ConversationState, language?: string, voice?: string): ConversationState => {
			return conversationCore.transition(state, {
				type: 'START_CONVERSATION',
				payload: { language, voice }
			});
		},

		startRecording: (state: ConversationState): ConversationState => {
			return conversationCore.transition(state, { type: 'START_RECORDING' });
		},

		stopRecording: (state: ConversationState, audio: ArrayBuffer): ConversationState => {
			return conversationCore.transition(state, {
				type: 'STOP_RECORDING',
				payload: { audio }
			});
		},

		receiveResponse: (
			state: ConversationState,
			transcript: string,
			response: string
		): ConversationState => {
			return conversationCore.transition(state, {
				type: 'RECEIVE_RESPONSE',
				payload: { transcript, response }
			});
		},

		startSpeaking: (state: ConversationState): ConversationState => {
			return conversationCore.transition(state, { type: 'START_SPEAKING' });
		},

		stopSpeaking: (state: ConversationState): ConversationState => {
			return conversationCore.transition(state, { type: 'STOP_SPEAKING' });
		},

		setError: (state: ConversationState, error: string): ConversationState => {
			return conversationCore.transition(state, {
				type: 'SET_ERROR',
				payload: { error }
			});
		},

		clearError: (state: ConversationState): ConversationState => {
			return conversationCore.transition(state, { type: 'CLEAR_ERROR' });
		},

		// 🎯 Pure effect generation
		getEffects: (state: ConversationState, action: ConversationAction): ConversationEffect[] => {
			return conversationCore.effects(state, action);
		},

		// 🎯 Pure derived values
		getDerived: (state: ConversationState) => ({
			isIdle: conversationCore.derived.isIdle(state),
			isRecording: conversationCore.derived.isRecording(state),
			isProcessing: conversationCore.derived.isProcessing(state),
			isSpeaking: conversationCore.derived.isSpeaking(state),
			canRecord: conversationCore.derived.canRecord(state),
			hasError: conversationCore.derived.hasError(state),
			messageCount: conversationCore.derived.messageCount(state),
			duration: conversationCore.derived.duration(state)
		})
	};
}

// 🎯 Export the pure kernel
export const conversationKernel = createConversationKernel();

// 🎯 Initial state factory
export function createInitialState(): ConversationState {
	return {
		status: 'idle',
		sessionId: '',
		messages: [],
		startTime: Date.now(),
		language: 'en',
		voice: 'alloy'
	};
}
