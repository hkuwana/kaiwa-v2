// src/lib/stores/conversation.store.svelte.ts
// Simplified conversation store using functional realtime service

import { SvelteDate } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { realtimeService } from '$lib/services';
import { audioService, type AudioLevel } from '$lib/services/audio.service';
import type { Message, Language } from '$lib/server/db/types';
import type { Speaker } from '$lib/types';
import type { ServerEvent, Voice } from '$lib/types/openai.realtime.types';
import {
	createConversationTimerStore,
	type ConversationTimerStore
} from './conversation-timer.store.svelte';

export class ConversationStore {
	// Reactive state
	status = $state<'idle' | 'connecting' | 'connected' | 'streaming' | 'error'>('idle');
	messages = $state<Message[]>([]);
	userId = $state<string | null>(null);
	sessionId = $state<string>('');
	language = $state<Language | null>(null);
	voice: Voice = 'alloy';
	error = $state<string | null>(null);
	audioLevel = $state.raw<number>(0);
	availableDevices = $state<MediaDeviceInfo[]>([]);
	selectedDeviceId = $state<string>('default');

	// Transcription state
	transcriptionMode = $state<boolean>(false);
	currentTranscript = $state<string>('');
	isTranscribing = $state<boolean>(false);

	// Private connection state
	private realtimeConnection: realtimeService.RealtimeConnection | null = null;
	private audioStream: MediaStream | null = null;
	private timerStore: ConversationTimerStore;

	constructor() {
		// Only initialize services in browser
		if (!browser) {
			console.log('ConversationStore: SSR mode, skipping service initialization');
			// Create a dummy timer store for SSR
			this.timerStore = createConversationTimerStore('free');
			return;
		}

		// Browser initialization
		this.timerStore = createConversationTimerStore('free');
		this.initializeServices();
	}

	private initializeServices(): void {
		// Initialize audio service
		audioService.initialize();

		// Set up audio level monitoring
		audioService.onLevelUpdate((level: AudioLevel) => {
			this.audioLevel = level.level;
		});

		// Set up audio stream callbacks
		audioService.onStreamReady((stream: MediaStream) => {
			this.audioStream = stream;
			console.log('Audio stream ready');
		});

		audioService.onStreamError((errorMsg: string) => {
			this.error = errorMsg;
			this.status = 'error';
		});

		// Load available audio devices
		audioService.getAvailableDevices().then((devices) => {
			this.availableDevices = devices;
		});
	}

	// === PUBLIC ACTIONS ===

	startConversation = async (
		language?: Language,
		speaker?: Speaker | string,
		transcriptionOnly: boolean = false
	) => {
		if (!browser) {
			console.warn('Cannot start conversation on server');
			return;
		}

		if (this.status !== 'idle') {
			console.warn('Conversation already in progress');
			return;
		}

		// Set up conversation parameters
		this.language = language || null;
		this.transcriptionMode = transcriptionOnly;
		this.status = 'connecting';
		this.error = null;
		this.clearTranscriptionState();

		// Extract voice from speaker
		if (speaker && typeof speaker === 'object' && 'openAIId' in speaker) {
			this.voice = speaker.openAIId || 'alloy';
		} else {
			this.voice = 'alloy';
		}

		try {
			// 1. Test audio constraints
			const constraintTest = await audioService.testConstraints();
			if (!constraintTest.success) {
				console.warn('Audio constraint test failed, proceeding with defaults');
			}

			// 2. Get audio stream
			this.audioStream = await audioService.getStream(this.selectedDeviceId);

			// 3. Get session from backend
			const sessionData = await this.fetchSessionFromBackend();
			this.sessionId = sessionData.session_id;

			// 4. Create realtime connection
			this.realtimeConnection = await realtimeService.createConnection(
				sessionData,
				this.audioStream
			);

			// 5. Set up event handlers
			this.setupRealtimeEventHandlers();

			console.log('Connection established, waiting for session creation...');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Connection failed';
			this.error = errorMessage;
			this.status = 'error';
			this.cleanup();
			throw error;
		}
	};

	sendMessage = (content: string) => {
		if (!this.realtimeConnection || !browser) return;

		// Add message to local state immediately
		this.addMessageToState({
			role: 'user',
			content,
			timestamp: new SvelteDate()
		});

		// Send to OpenAI
		const messageEvent = realtimeService.createTextMessage(content);
		realtimeService.sendEvent(this.realtimeConnection, messageEvent);

		// Request AI response
		const responseEvent = realtimeService.createResponse(['text', 'audio']);
		realtimeService.sendEvent(this.realtimeConnection, responseEvent);
	};

	pauseStreaming = () => {
		if (this.audioStream) {
			realtimeService.pauseAudioInput(this.audioStream);
		}
	};

	resumeStreaming = () => {
		if (this.audioStream) {
			realtimeService.resumeAudioInput(this.audioStream);
		}
	};

	endConversation = () => {
		if (!browser) return;

		console.log('Ending conversation...');

		// Stop timer
		this.timerStore.stop();

		// Clean up connections
		this.cleanup();

		// Reset state
		this.resetState();

		console.log('Conversation ended');
	};

	selectDevice = async (deviceId: string) => {
		this.selectedDeviceId = deviceId;

		if (this.status === 'streaming' || this.status === 'connected') {
			try {
				// Get new stream with selected device
				const newStream = await audioService.getStream(deviceId);

				// Stop old stream
				if (this.audioStream) {
					realtimeService.stopAudioStream(this.audioStream);
				}

				this.audioStream = newStream;
				console.log('Audio device switched successfully');
			} catch (error) {
				console.error('Failed to switch audio device:', error);
				this.error = 'Failed to switch audio device';
			}
		}
	};

	updateSessionConfig = (
		updates: Partial<{
			instructions: string;
			turnDetection: {
				threshold: number;
				prefix_padding_ms: number;
				silence_duration_ms: number;
			};
		}>
	) => {
		if (!this.realtimeConnection || this.status === 'idle') return;

		const currentConfig = {
			model: 'gpt-4o-mini-realtime-preview-2024-12-17',
			voice: this.voice,
			instructions:
				updates.instructions ||
				`You are a helpful language tutor for ${this.language?.name || 'English'}.`,
			inputAudioTranscription: {
				model: 'whisper-1' as const,
				language: this.language?.code || 'en'
			},
			turnDetection: updates.turnDetection || {
				type: 'server_vad' as const,
				threshold: 0.45,
				prefix_padding_ms: 300,
				silence_duration_ms: 600
			}
		};

		const updateEvent = realtimeService.createSessionUpdate(currentConfig);
		realtimeService.sendEvent(this.realtimeConnection, updateEvent);
	};

	// === GETTERS ===

	isConnected = () => {
		if (!browser) return false;
		const status = realtimeService.getConnectionStatus(this.realtimeConnection);
		return status.isConnected;
	};

	getConnectionStatus = () => {
		if (!browser) {
			return {
				peerConnectionState: 'disconnected',
				dataChannelState: 'closed',
				isStreamingPaused: false,
				hasLocalStream: false
			};
		}

		const status = realtimeService.getConnectionStatus(this.realtimeConnection);
		return {
			peerConnectionState: status.connectionState,
			dataChannelState: status.dataChannelState,
			isStreamingPaused: false, // You'd track this separately if needed
			hasLocalStream: !!this.audioStream
		};
	};

	getDebugInfo = () => {
		return {
			status: this.status,
			audioLevel: this.audioLevel,
			messageCount: this.messages.length,
			language: this.language,
			voice: this.voice,
			sessionId: this.sessionId,
			availableDevices: this.availableDevices.length,
			selectedDeviceId: this.selectedDeviceId,
			transcriptionMode: this.transcriptionMode,
			isTranscribing: this.isTranscribing,
			connectionStatus: this.getConnectionStatus(),
			hasConnection: !!this.realtimeConnection,
			hasAudioStream: !!this.audioStream,
			timerState: this.timerStore.state
		};
	};

	// === TIMER METHODS ===

	configureTimerForUserTier = (tier: 'free' | 'plus' | 'premium') => {
		this.timerStore.configureForUserTier(tier);
	};

	getTimeRemaining = () => {
		return this.timerStore.getTimeRemaining();
	};

	extendConversation = () => {
		return this.timerStore.extendDefault();
	};

	// === PRIVATE METHODS ===

	private async fetchSessionFromBackend() {
		const response = await fetch('/api/realtime-session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sessionId: crypto.randomUUID(),
				model: 'gpt-4o-mini-realtime-preview-2024-12-17',
				voice: this.voice
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			let errorMessage = `Session creation failed: ${response.status}`;

			// Extract OpenAI error if available
			if (errorData.details?.response) {
				try {
					const openAIError = JSON.parse(errorData.details.response);
					if (openAIError.error?.message) {
						errorMessage = `OpenAI Error: ${openAIError.error.message}`;
					}
				} catch {
					errorMessage = `OpenAI Error: ${errorData.details.response}`;
				}
			} else if (errorData.error) {
				errorMessage = errorData.error;
			}

			throw new Error(errorMessage);
		}

		return response.json();
	}

	private setupRealtimeEventHandlers(): void {
		if (!this.realtimeConnection) return;

		const { dataChannel, peerConnection } = this.realtimeConnection;

		// Data channel event handlers
		dataChannel.onopen = () => {
			console.log('Data channel opened, waiting for session creation...');
		};

		dataChannel.onmessage = (event) => {
			try {
				const serverEvent: ServerEvent = JSON.parse(event.data);

				// Handle session creation specifically
				if (serverEvent.type === 'session.created') {
					console.log('Session created, sending configuration...');
					this.sendInitialConfiguration();
					this.status = 'connected';
					this.timerStore.start();
				}

				// Process the event
				const processed = realtimeService.processServerEvent(serverEvent);
				this.handleProcessedEvent(processed);
			} catch (error) {
				console.error('Failed to process server event:', error);
				this.error = 'Failed to process server message';
			}
		};

		dataChannel.onerror = (error) => {
			console.error('Data channel error:', error);
			this.error = 'Data channel error';
			this.status = 'error';
		};

		dataChannel.onclose = () => {
			console.log('Data channel closed');
			this.status = 'idle';
			this.timerStore.stop();
		};

		// Peer connection state monitoring
		peerConnection.onconnectionstatechange = () => {
			const state = peerConnection.connectionState;
			console.log('WebRTC connection state:', state);

			if (state === 'failed' || state === 'closed') {
				this.status = 'error';
				this.error = `Connection ${state}`;
				this.timerStore.stop();
			}
		};
	}

	private handleProcessedEvent(processed: realtimeService.ProcessedEventResult): void {
		switch (processed.type) {
			case 'message':
				this.addMessageToState(processed.data);
				break;

			case 'transcription':
				this.handleTranscriptionUpdate(processed.data);
				break;

			case 'connection_state':
				console.log('Connection state update:', processed.data.state);
				break;

			case 'ignore':
				// Do nothing for ignored events
				break;
		}
	}

	private addMessageToState(data: realtimeService.MessageEventData): void {
		// Prevent duplicate messages
		const messageExists = this.messages.some(
			(msg) =>
				msg.role === data.role &&
				msg.content === data.content &&
				Math.abs(msg.timestamp.getTime() - data.timestamp.getTime()) < 1000
		);

		if (!messageExists) {
			const message: Message = {
				role: data.role,
				content: data.content,
				timestamp: new SvelteDate(),
				id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				conversationId: this.sessionId,
				audioUrl: null
			};

			this.messages = [...this.messages, message];
			console.log(`Added ${data.role} message:`, data.content.substring(0, 50));
		}
	}

	private handleTranscriptionUpdate(data: realtimeService.TranscriptionEventData): void {
		if (data.isFinal) {
			// Final transcript - clear current and stop transcribing indicator
			this.currentTranscript = '';
			this.isTranscribing = false;
			console.log(`Final ${data.type}:`, data.text);

			// For assistant transcripts, the message will be added via conversation.item.created
			// For user transcripts, add to messages if not already present
			if (data.type === 'user_transcript') {
				this.addMessageToState({
					role: 'user',
					content: data.text,
					timestamp: data.timestamp
				});
			}
		} else {
			// Streaming transcript - update current transcript
			this.currentTranscript = data.text;
			this.isTranscribing = true;
			console.log(`Streaming ${data.type}:`, data.text);
		}
	}

	private sendInitialConfiguration(): void {
		if (!this.realtimeConnection || !this.language) return;

		const languageName = this.language.name;
		const languageCode = this.language.code;

		const sessionConfig = {
			model: 'gpt-4o-mini-realtime-preview-2024-12-17',
			voice: this.voice,
			instructions: `You are a helpful language tutor for ${languageName}. Help the user practice and improve their language skills through natural conversation. Be patient, encouraging, and provide gentle corrections when needed. IMPORTANT: You must respond in ${languageName} only. Do not respond in any other language unless specifically asked to translate or explain something.`,
			turnDetection: {
				type: 'server_vad' as const,
				threshold: 0.45,
				prefix_padding_ms: 300,
				silence_duration_ms: 600
			},
			inputAudioTranscription: {
				model: 'whisper-1' as const,
				language: languageCode
			}
		};

		console.log('Sending session configuration:', {
			language: languageName,
			voice: this.voice,
			model: sessionConfig.model
		});

		const configEvent = realtimeService.createSessionUpdate(sessionConfig);
		realtimeService.sendEvent(this.realtimeConnection, configEvent);
	}

	private clearTranscriptionState(): void {
		this.currentTranscript = '';
		this.isTranscribing = false;
	}

	private cleanup(): void {
		console.log('Cleaning up conversation resources...');

		// Close realtime connection
		if (this.realtimeConnection) {
			realtimeService.closeConnection(this.realtimeConnection);
			this.realtimeConnection = null;
		}

		// Stop audio stream
		if (this.audioStream) {
			realtimeService.stopAudioStream(this.audioStream);
			this.audioStream = null;
		}

		// Clean up audio service
		if (browser) {
			audioService.cleanup();
		}
	}

	private resetState(): void {
		this.status = 'idle';
		this.messages = [];
		this.userId = null;
		this.sessionId = '';
		this.error = null;
		this.audioLevel = 0;
		this.clearTranscriptionState();
	}

	// === UTILITY METHODS ===

	clearError = () => {
		this.error = null;
		if (this.status === 'error') {
			this.status = 'idle';
		}
	};

	reset = () => {
		if (browser) {
			this.cleanup();
		}
		this.resetState();
		this.timerStore.reset();
		console.log('Conversation store reset');
	};

	forceCleanup = () => {
		console.log('Force cleaning up conversation store...');

		try {
			this.cleanup();
		} catch (error) {
			console.warn('Error during cleanup:', error);
		}

		try {
			this.timerStore.cleanup();
		} catch (error) {
			console.warn('Error during timer cleanup:', error);
		}

		this.resetState();
		console.log('Force cleanup complete');
	};

	// Test audio functionality
	testAudioLevel = () => {
		if (browser && audioService.hasActiveStream()) {
			audioService.triggerLevelUpdate();
			console.log('Audio level test triggered');
		} else {
			console.log('No active audio stream to test');
		}
	};

	// Get reactive audio level for components
	get reactiveAudioLevel() {
		return this.audioLevel;
	}
}

// Export singleton instance
export const conversationStore = new ConversationStore();
