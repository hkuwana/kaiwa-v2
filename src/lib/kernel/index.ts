// 🎯 Kaiwa Conversation Kernel
// The heart of the application - pure functional core

export type ConversationState = {
	status:
		| 'idle'
		| 'recording'
		| 'processing'
		| 'speaking'
		| 'realtime-connected'
		| 'realtime-streaming';
	sessionId: string;
	messages: Message[];
	startTime: number;
	mode: 'traditional' | 'realtime';
	language?: string;
	voice?: string;
	error?: string;
};

export type Message = {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
};

export type Action =
	| {
			type: 'START_CONVERSATION';
			mode?: 'traditional' | 'realtime';
			language?: string;
			voice?: string;
	  }
	| { type: 'START_RECORDING' }
	| { type: 'STOP_RECORDING'; audio: ArrayBuffer }
	| { type: 'RECEIVE_RESPONSE'; transcript: string; response: string }
	| { type: 'CONNECT_REALTIME' }
	| { type: 'REALTIME_CONNECTED' }
	| { type: 'START_REALTIME_STREAM' }
	| { type: 'STOP_REALTIME_STREAM' }
	| { type: 'REALTIME_AUDIO_RECEIVED'; audioData: ArrayBuffer }
	| { type: 'END_CONVERSATION' }
	| { type: 'ERROR'; message: string };

export type Effect =
	| { type: 'TRANSCRIBE'; audio: ArrayBuffer }
	| { type: 'GENERATE_RESPONSE'; transcript: string; history: Message[] }
	| { type: 'SPEAK'; text: string }
	| { type: 'CONNECT_REALTIME'; sessionId: string; language?: string; voice?: string }
	| { type: 'START_AUDIO_STREAM' }
	| { type: 'STOP_AUDIO_STREAM' }
	| { type: 'PLAY_REALTIME_AUDIO'; audioData: ArrayBuffer }
	| { type: 'SAVE_EXCHANGE'; messages: Message[] };

// 🧠 Pure functional core - no side effects
export const conversationCore = {
	initial: (mode: 'traditional' | 'realtime' = 'traditional'): ConversationState => ({
		status: 'idle',
		sessionId: '',
		messages: [],
		startTime: 0,
		mode
	}),

	transition: (state: ConversationState, action: Action): ConversationState => {
		switch (action.type) {
			case 'START_CONVERSATION':
				return {
					...state,
					status: action.mode === 'realtime' ? 'idle' : 'idle',
					sessionId: crypto.randomUUID(),
					startTime: Date.now(),
					messages: [],
					mode: action.mode || 'traditional',
					language: action.language,
					voice: action.voice,
					error: undefined
				};

			case 'START_RECORDING':
				return { ...state, status: 'recording', error: undefined };

			case 'STOP_RECORDING':
				return { ...state, status: 'processing' };

			case 'RECEIVE_RESPONSE':
				return {
					...state,
					status: 'speaking',
					messages: [
						...state.messages,
						{ role: 'user', content: action.transcript, timestamp: Date.now() },
						{ role: 'assistant', content: action.response, timestamp: Date.now() }
					],
					error: undefined
				};

			case 'CONNECT_REALTIME':
				return { ...state, status: 'processing', error: undefined };

			case 'REALTIME_CONNECTED':
				return { ...state, status: 'realtime-connected', error: undefined };

			case 'START_REALTIME_STREAM':
				return { ...state, status: 'realtime-streaming', error: undefined };

			case 'STOP_REALTIME_STREAM':
				return { ...state, status: 'realtime-connected', error: undefined };

			case 'REALTIME_AUDIO_RECEIVED':
				return { ...state, status: 'speaking', error: undefined };

			case 'END_CONVERSATION':
				return conversationCore.initial();

			case 'ERROR':
				return {
					...state,
					status: 'idle',
					error: action.message
				};

			default:
				return state;
		}
	},

	// Side effects as data - pure functions return what should happen
	effects: (state: ConversationState, action: Action): Effect[] => {
		switch (action.type) {
			case 'START_CONVERSATION':
				if (action.mode === 'realtime') {
					return [
						{
							type: 'CONNECT_REALTIME',
							sessionId: state.sessionId,
							language: action.language,
							voice: action.voice
						}
					];
				}
				return [];

			case 'STOP_RECORDING':
				if (state.mode === 'traditional') {
					return [{ type: 'TRANSCRIBE', audio: action.audio }];
				}
				return [];

			case 'RECEIVE_RESPONSE':
				return [
					{ type: 'SPEAK', text: action.response },
					{ type: 'SAVE_EXCHANGE', messages: state.messages }
				];

			case 'REALTIME_CONNECTED':
				return [{ type: 'START_AUDIO_STREAM' }];

			case 'REALTIME_AUDIO_RECEIVED':
				return [{ type: 'PLAY_REALTIME_AUDIO', audioData: action.audioData }];

			case 'END_CONVERSATION':
				if (state.mode === 'realtime') {
					return [{ type: 'STOP_AUDIO_STREAM' }];
				}
				return [];

			default:
				return [];
		}
	},

	// Derived state helpers
	derived: {
		isRecording: (state: ConversationState) => state.status === 'recording',
		canRecord: (state: ConversationState) =>
			state.status === 'idle' || state.status === 'realtime-connected',
		isProcessing: (state: ConversationState) => state.status === 'processing',
		isSpeaking: (state: ConversationState) => state.status === 'speaking',
		isRealtimeConnected: (state: ConversationState) => state.status === 'realtime-connected',
		isRealtimeStreaming: (state: ConversationState) => state.status === 'realtime-streaming',
		messageCount: (state: ConversationState) => Math.floor(state.messages.length / 2),
		hasError: (state: ConversationState) => !!state.error
	}
};

// 🎯 Simple kernel interface for components
export function createConversationKernel() {
	let state = conversationCore.initial();

	return {
		getState: () => state,

		dispatch: (action: Action) => {
			state = conversationCore.transition(state, action);
			return {
				state,
				effects: conversationCore.effects(state, action)
			};
		},

		// Convenience methods
		start: (mode?: 'traditional' | 'realtime', language?: string, voice?: string) => {
			const result = conversationCore.transition(state, {
				type: 'START_CONVERSATION',
				mode,
				language,
				voice
			});
			state = result;
			return result;
		},

		startRecording: () => {
			const result = conversationCore.transition(state, { type: 'START_RECORDING' });
			state = result;
			return result;
		},

		stopRecording: (audio: ArrayBuffer) => {
			const newState = conversationCore.transition(state, { type: 'STOP_RECORDING', audio });
			const effects = conversationCore.effects(state, { type: 'STOP_RECORDING', audio });
			state = newState;
			return { state: newState, effects };
		},

		receiveResponse: (transcript: string, response: string) => {
			const newState = conversationCore.transition(state, {
				type: 'RECEIVE_RESPONSE',
				transcript,
				response
			});
			const effects = conversationCore.effects(state, {
				type: 'RECEIVE_RESPONSE',
				transcript,
				response
			});
			state = newState;
			return { state: newState, effects };
		},

		error: (message: string) => {
			const result = conversationCore.transition(state, { type: 'ERROR', message });
			state = result;
			return result;
		},

		end: () => {
			const result = conversationCore.transition(state, { type: 'END_CONVERSATION' });
			state = result;
			return result;
		}
	};
}
