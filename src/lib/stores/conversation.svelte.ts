// 🎭 Conversation Store (Svelte 5 Runes)
// Single source of truth for conversation state and UI flags

import { EventBusFactory } from '$lib/shared/events/eventBus';
import { audioEvents } from '$lib/features/audio/events';
import { realtimeEvents } from '$lib/features/realtime/events';
import { RealtimeConversationStatus } from '$lib/features/conversation/kernel';
import type { EventBus } from '$lib/shared/events/eventBus';

export interface ConversationState {
	status: RealtimeConversationStatus;
	sessionId: string;
	messages: Array<{
		role: 'user' | 'assistant';
		content: string;
		timestamp: number;
		audioUrl?: string;
	}>;
	startTime: number;
	language: string;
	voice: string;
	error?: string;
	userLevel: number;
	scenario: any | null;
	speaker: any | null;
	audioState: any | null;
}

export class ConversationStore {
	private bus: EventBus;

	// Core state
	state = $state<ConversationState>({
		status: RealtimeConversationStatus.IDLE,
		sessionId: '',
		messages: [],
		startTime: 0,
		language: 'en',
		voice: 'alloy',
		error: undefined,
		userLevel: 220,
		scenario: null,
		speaker: null,
		audioState: null
	});

	constructor() {
		this.bus = EventBusFactory.create('memory');
		this.setupEventSubscriptions();
	}

	// Derived UI flags (getters for reactivity)
	get isRecording() {
		return this.state.status === RealtimeConversationStatus.STREAMING;
	}
	get isConnected() {
		return (
			this.state.status === RealtimeConversationStatus.CONNECTED ||
			this.state.status === RealtimeConversationStatus.STREAMING
		);
	}
	get isConnecting() {
		return this.state.status === RealtimeConversationStatus.CONNECTING;
	}
	get hasError() {
		return this.state.status === RealtimeConversationStatus.ERROR;
	}
	get messageCount() {
		return this.state.messages.length;
	}
	get canStartConversation() {
		return this.state.status === RealtimeConversationStatus.IDLE;
	}
	get canStopStreaming() {
		return this.state.status === RealtimeConversationStatus.STREAMING;
	}

	private setupEventSubscriptions() {
		// Subscribe to audio events
		this.bus.on(audioEvents.chunk, (chunk: ArrayBuffer) => {
			// Audio chunk received - could be used for visualization or processing
			console.log('🎵 Audio chunk received:', chunk.byteLength, 'bytes');
		});

		this.bus.on(audioEvents.recordingStopped, (payload) => {
			console.log('⏹️ Recording stopped:', payload);
		});

		this.bus.on(audioEvents.error, (payload) => {
			console.error('❌ Audio error:', payload);
			this.state = { ...this.state, error: payload.message };
		});

		// Subscribe to realtime events
		this.bus.on(realtimeEvents.connectionStatus, (payload: any) => {
			console.log('🔌 Connection status:', payload.status);
			// Update status based on connection events
			if (payload.status === 'connected') {
				this.state = { ...this.state, status: RealtimeConversationStatus.CONNECTED };
			} else if (payload.status === 'disconnected') {
				this.state = { ...this.state, status: RealtimeConversationStatus.IDLE };
			} else if (payload.status === 'error') {
				this.state = {
					...this.state,
					status: RealtimeConversationStatus.ERROR,
					error: payload.details
				};
			}
		});

		this.bus.on(realtimeEvents.transcriptReceived, (payload: any) => {
			console.log('📝 Transcript received:', payload.transcript);
			// Add user message
			this.state = {
				...this.state,
				messages: [
					...this.state.messages,
					{
						role: 'user',
						content: payload.transcript,
						timestamp: payload.timestamp
					}
				]
			};
		});

		this.bus.on(realtimeEvents.responseReceived, (payload: any) => {
			console.log('🤖 Response received:', payload.response);
			// Add assistant message
			this.state = {
				...this.state,
				messages: [
					...this.state.messages,
					{
						role: 'assistant',
						content: payload.response,
						timestamp: payload.timestamp
					}
				]
			};
		});

		this.bus.on(realtimeEvents.audioResponse, (payload: any) => {
			console.log('🔊 Audio response received:', payload.audioChunk.byteLength, 'bytes');
			// Could trigger audio playback here
		});

		this.bus.on(realtimeEvents.error, (payload: any) => {
			console.error('❌ Realtime error:', payload);
			this.state = { ...this.state, error: payload.message };
		});
	}

	// Actions
	async startConversation(language = 'en', voice = 'alloy') {
		try {
			this.state = {
				...this.state,
				status: RealtimeConversationStatus.CONNECTING,
				language,
				voice,
				startTime: Date.now(),
				error: undefined
			};

			// Emit event to start conversation (will be handled by orchestrator)
			this.bus.emit('conversation.start_requested', { language, voice, timestamp: Date.now() });

			console.log('🚀 Conversation start requested:', { language, voice });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.state = { ...this.state, status: RealtimeConversationStatus.ERROR, error: errorMessage };
			console.error('❌ Failed to start conversation:', error);
		}
	}

	async startStreaming() {
		try {
			this.state = { ...this.state, status: RealtimeConversationStatus.STREAMING };

			// Emit event to start streaming
			this.bus.emit('conversation.streaming_started', { timestamp: Date.now() });

			console.log('🎤 Streaming started');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.state = { ...this.state, status: RealtimeConversationStatus.ERROR, error: errorMessage };
			console.error('❌ Failed to start streaming:', error);
		}
	}

	async stopStreaming() {
		try {
			this.state = { ...this.state, status: RealtimeConversationStatus.CONNECTED };

			// Emit event to stop streaming
			this.bus.emit('conversation.streaming_stopped', { timestamp: Date.now() });

			console.log('⏹️ Streaming stopped');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.state = { ...this.state, status: RealtimeConversationStatus.ERROR, error: errorMessage };
			console.error('❌ Failed to stop streaming:', error);
		}
	}

	async endConversation() {
		try {
			// Emit event to end conversation
			this.bus.emit('conversation.end_requested', { timestamp: Date.now() });

			// Reset to initial state
			this.state = {
				status: RealtimeConversationStatus.IDLE,
				sessionId: '',
				messages: [],
				startTime: 0,
				language: 'en',
				voice: 'alloy',
				error: undefined,
				userLevel: 220,
				scenario: null,
				speaker: null,
				audioState: null
			};

			console.log('🔚 Conversation ended');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.state = { ...this.state, error: errorMessage };
			console.error('❌ Failed to end conversation:', error);
		}
	}

	clearError() {
		this.state = { ...this.state, error: undefined };
	}

	// Getter for the event bus (for external coordination)
	get eventBus() {
		return this.bus;
	}
}
