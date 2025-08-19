// 🎭 Modern Real-time Conversation Orchestrator
// Orchestrates audio and real-time features for seamless conversations

import { audioService, type AudioState } from '../audio';
import { realtimeService, RealtimeService } from '../realtime';
import { conversationEvents, createEventPayloads } from './events';
import { createInitialState, RealtimeConversationStatus, type ConversationState } from './kernel';
import type { EventBus } from '$lib/shared/events/eventBus';
import type { RealtimeSession, RealtimeStream } from '../realtime';
import type { Scenario } from '$lib/server/db/types';
import type { Speaker } from '$lib/types';
import { SvelteMap } from 'svelte/reactivity';

export interface RealtimeConversationState {
	status: RealtimeConversationStatus;
	sessionId: string;
	messages: Array<{
		role: 'user' | 'assistant';
		content: string;
		timestamp: number;
		audioUrl?: string; // 🆕 MERGED: Audio URL for playback from unified orchestrator
	}>;
	startTime: number;
	language: string;
	voice: string;
	error?: string;

	// 🆕 MERGED: Additional fields from unified orchestrator
	userLevel: number;
	scenario: Scenario | null;
	speaker: Speaker | null;
	audioState: AudioState | null;
}

export class ConversationOrchestrator {
	// Svelte 5 runes for reactive state (using kernel pattern)
	private state = $state<ConversationState>(createInitialState());

	// 🎯 SINGLE SOURCE: Use Audio Feature's stream instead of duplicating
	private realtimeSession = $state<RealtimeSession | null>(null);
	private realtimeStream = $state<RealtimeStream | null>(null);
	private connectionReady = $state<boolean>(false);
	private localMicStream: MediaStream | null = null;
	private authenticatedSessions = $state(
		new SvelteMap<string, { sessionId: string; clientSecret: string; expiresAt: number }>()
	);

	constructor(private eventBus: EventBus) {
		this.setupEventHandlers();
	}

	// Getter methods to access reactive state
	get status() {
		return this.state.status;
	}
	get sessionId() {
		return this.state.sessionId;
	}
	get messages() {
		return this.state.messages;
	}
	get startTime() {
		return this.state.startTime;
	}
	get language() {
		return this.state.language;
	}
	get voice() {
		return this.state.voice;
	}
	get error() {
		return this.state.error;
	}
	get isConnectionReady() {
		return this.connectionReady;
	}
	get hasAudioStream() {
		return audioService.isRecording;
	}
	get hasMediaRecorder() {
		return audioService.isRecording;
	}
	get hasRealtimeSession() {
		return !!this.realtimeSession;
	}
	get hasRealtimeStream() {
		return !!this.realtimeStream;
	}

	// Expose local microphone stream for UI (visualizer, etc.)
	get micStream(): MediaStream | null {
		return this.localMicStream;
	}

	// 🆕 MERGED: Additional getters from unified orchestrator
	get userLevel() {
		return this.state.userLevel;
	}

	get isConnected() {
		return this.state.status === RealtimeConversationStatus.CONNECTED;
	}
	get isRecordingActive() {
		return this.state.status === RealtimeConversationStatus.STREAMING;
	}

	// Setter methods to update reactive state
	set status(value: RealtimeConversationStatus) {
		this.state.status = value;
	}
	set sessionId(value: string) {
		this.state.sessionId = value;
	}
	set language(value: string) {
		this.state.language = value;
	}
	set voice(value: string) {
		this.state.voice = value;
	}
	set startTime(value: number) {
		this.state.startTime = value;
	}
	set error(value: string | undefined) {
		this.state.error = value;
	}
	set isConnectionReady(value: boolean) {
		this.connectionReady = value;
	}

	// 🆕 MERGED: Additional setters from unified orchestrator
	set userLevel(value: number) {
		this.state.userLevel = value || 220;
	}

	// Method to add messages (since it's an array)
	addMessage(message: {
		role: 'user' | 'assistant';
		content: string;
		timestamp: number;
		audioUrl?: string;
	}) {
		this.state.messages = [...this.state.messages, message];
	}

	// 🆕 MERGED: Enhanced message methods from unified orchestrator
	addUserMessage(content: string, audioUrl?: string) {
		const message = {
			role: 'user' as const,
			content,
			timestamp: Date.now(),
			audioUrl
		};
		this.addMessage(message);
	}

	addAssistantMessage(content: string, audioUrl?: string) {
		const message = {
			role: 'assistant' as const,
			content,
			timestamp: Date.now(),
			audioUrl
		};
		this.addMessage(message);
	}

	// 🎯 Get current state
	getState(): ConversationState {
		return this.state;
	}

	// 🎯 Get detailed state for debugging
	getDetailedState() {
		return {
			status: this.status,
			sessionId: this.sessionId,
			messages: this.messages,
			error: this.error,
			startTime: this.startTime,
			language: this.language,
			voice: this.voice,
			realtimeSession: !!this.realtimeSession,
			realtimeStream: !!this.realtimeStream,
			connectionReady: this.connectionReady,
			timestamp: Date.now()
		};
	}

	// 🎯 Check if WebRTC connection is healthy
	isConnectionHealthy(): boolean {
		const healthy =
			this.connectionReady && this.realtimeStream !== null && this.realtimeStream.isActive;
		console.log('🔍 Connection health check:', {
			connectionReady: this.connectionReady,
			realtimeStream: !!this.realtimeStream,
			streamActive: this.realtimeStream?.isActive,
			overall: healthy
		});
		return healthy;
	}

	// 🎯 Start a new real-time conversation with streaming
	async startConversation(language: string = 'en', voice: string = 'alloy'): Promise<void> {
		console.log('🎭 startConversation called with:', { language, voice });
		console.log('📊 Current state before:', this.getState());

		try {
			// Generate a new session ID for this conversation
			const newSessionId = crypto.randomUUID();
			console.log('🆔 Generated session ID:', newSessionId);

			this.status = RealtimeConversationStatus.CONNECTING;
			this.sessionId = newSessionId;
			this.language = language;
			this.voice = voice;
			this.startTime = Date.now();
			console.log('📊 State updated to connecting:', this.getState());

			console.log('🌐 Creating real-time session...');
			// Create real-time session
			this.realtimeSession = await realtimeService.createSession({
				sessionId: newSessionId,
				model: 'gpt-4o-realtime-preview-2024-10-01',
				voice,
				language
			});

			if (!this.realtimeSession) {
				throw new Error('Realtime session not created');
			}

			console.log('✅ Realtime session created:', this.realtimeSession);

			// Update status to CONNECTED after session creation
			this.status = RealtimeConversationStatus.CONNECTED;
			console.log('📊 State updated to connected:', this.getState());

			// Now automatically start streaming (this is the key change!)
			console.log('🎤 Automatically starting streaming after session creation...');
			await this.startStreamingInternal();

			// Emit conversation started event
			console.log('📡 Emitting conversation started event...');
			conversationEvents.emit.started(
				this.eventBus,
				createEventPayloads.conversationStarted(this.state.sessionId, language, 'realtime')
			);

			console.log('🎉 Real-time conversation started AND streaming automatically!');
			console.log('📊 Final state:', this.state);
		} catch (error) {
			console.error('❌ Error in startConversation:', error);
			this.state = {
				...this.state,
				status: RealtimeConversationStatus.ERROR,
				error: `Failed to start conversation: ${error}`
			};

			console.log('📊 State updated to error:', this.state);

			// Emit conversation error event
			console.log('📡 Emitting conversation error event...');
			conversationEvents.emit.error(
				this.eventBus,
				createEventPayloads.conversationError(
					this.state.sessionId,
					`Failed to start conversation: ${error}`
				)
			);

			throw error;
		}
	}

	// 🎯 Start streaming audio (public method for manual control)
	async startStreaming(): Promise<void> {
		console.log('🎙️ startStreaming called (manual)');
		console.log('📊 Current state:', this.state);
		console.log('🌐 Realtime session exists:', !!this.realtimeSession);

		if (this.state.status !== RealtimeConversationStatus.CONNECTED || !this.realtimeSession) {
			const error = 'Conversation not connected';
			console.error('❌', error);
			throw new Error(error);
		}

		await this.startStreamingInternal();
	}

	// 🎯 Internal method for starting streaming (used by startConversation)
	private async startStreamingInternal(): Promise<void> {
		console.log('🎤 startStreamingInternal called');
		console.log('📊 Current state:', this.state);
		console.log('🌐 Realtime session exists:', !!this.realtimeSession);

		if (!this.realtimeSession) {
			const error = 'Realtime session not available';
			console.error('❌', error);
			throw new Error(error);
		}

		try {
			// 🎯 Simple WebRTC path: getUserMedia → add track via realtime service
			console.log('🎤 Acquiring microphone stream via getUserMedia...');
			this.localMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			console.log('✅ Microphone stream acquired');

			console.log('🎤 Starting real-time streaming with mic stream...');
			console.log('🔍 Realtime session details:', {
				sessionId: this.realtimeSession?.id,
				model: this.realtimeSession?.config?.model,
				voice: this.realtimeSession?.config?.voice,
				status: this.realtimeSession?.status
			});
			console.log('🔍 Mic stream details:', {
				trackCount: this.localMicStream.getTracks().length,
				audioTrack: this.localMicStream.getAudioTracks()[0]?.enabled,
				streamActive: this.localMicStream.active
			});

			// Start real-time streaming with the mic stream
			this.realtimeStream = await realtimeService.startStreaming(
				this.realtimeSession,
				this.localMicStream
			);

			console.log('🎤 Audio stream connected to WebRTC session');
			console.log('🔍 Realtime stream created:', {
				streamExists: !!this.realtimeStream,
				streamActive: this.realtimeStream?.isActive,
				streamId: this.realtimeStream?.id || 'unknown'
			});

			// Verify stream exists
			if (!this.realtimeStream) {
				throw new Error('Failed to create realtime stream');
			}

			// Wait for WebRTC connection to be fully established
			console.log('⏳ Waiting for WebRTC connection to be fully established...');
			await this.waitForWebRTCConnection();

			// Skip chunk-based test; WebRTC uses live tracks

			// Store the authenticated session for audio transmission
			if (this.realtimeSession) {
				this.authenticatedSessions.set(this.realtimeStream?.id || 'default', {
					sessionId: this.realtimeSession.id,
					clientSecret: this.realtimeSession.clientSecret,
					expiresAt: this.realtimeSession.expiresAt
				});
			}

			// Mark connection as ready
			this.connectionReady = true;
			console.log('✅ Connection marked as ready for live audio track');

			this.state = { ...this.state, status: RealtimeConversationStatus.STREAMING };
			console.log('📊 State updated to streaming:', this.state);

			console.log('📡 Emitting recording started event...');
			conversationEvents.emit.recordingStarted(
				this.eventBus,
				createEventPayloads.recordingStarted(this.state.sessionId)
			);

			console.log('🎉 Audio streaming started successfully!');
		} catch (error) {
			console.error('❌ Error in startStreaming:', error);
			// Reset connection ready flag on error
			this.connectionReady = false;
			console.log('🔄 Connection ready flag reset due to error');

			this.state = {
				...this.state,
				status: RealtimeConversationStatus.ERROR,
				error: `Failed to start streaming: ${error}`
			};
			throw error;
		}
	}

	// 🎯 Stop streaming audio
	async stopStreaming(): Promise<void> {
		try {
			console.log('⏹️ Stopping audio streaming...');

			// Stop real-time streaming
			if (this.realtimeStream) {
				await realtimeService.stopStreaming(this.realtimeStream);
				this.realtimeStream = null;
				console.log('✅ Realtime streaming stopped');
			}

			// Reset connection ready flag
			this.connectionReady = false;
			console.log('🔄 Connection ready flag reset');

			// Stop local mic stream
			if (this.localMicStream) {
				this.localMicStream.getTracks().forEach((track) => track.stop());
				this.localMicStream = null;
				console.log('✅ Local microphone stream stopped');
			}

			this.state = { ...this.state, status: RealtimeConversationStatus.CONNECTED };

			conversationEvents.emit.recordingStopped(
				this.eventBus,
				createEventPayloads.recordingStopped(
					this.state.sessionId,
					Date.now() - this.state.startTime,
					0 // Audio size would be calculated from chunks
				)
			);

			console.log('✅ Audio streaming stopped successfully');
		} catch (error) {
			console.error('❌ Error stopping streaming:', error);
		}
	}

	// 🎯 End the conversation
	async endConversation(): Promise<void> {
		try {
			// Stop streaming if active
			if (this.state.status === RealtimeConversationStatus.STREAMING) {
				await this.stopStreaming();
			}

			// Close real-time session
			if (this.realtimeSession) {
				await realtimeService.closeSession(this.realtimeSession);
				this.realtimeSession = null;
			}

			// Calculate conversation duration
			const duration = Date.now() - this.state.startTime;
			const messageCount = this.state.messages.length;

			// Emit conversation ended event
			conversationEvents.emit.ended(
				this.eventBus,
				createEventPayloads.conversationEnded(this.state.sessionId, duration, messageCount)
			);

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
				scenario: undefined,
				speaker: undefined,
				audioState: undefined,
				timestamp: new Date()
			};

			console.log('Real-time conversation ended');
		} catch (error) {
			console.error('Error ending conversation:', error);
		}
	}

	// 🎯 Setup event handlers
	private setupEventHandlers(): void {
		console.log('🔍 Setting up realtime event handlers...');

		// Handle real-time events
		realtimeService.onTranscript((transcript: string) => {
			console.log('📝 Transcript received:', transcript);
			this.handleTranscript(transcript);
		});

		realtimeService.onResponse((response: string) => {
			console.log('🤖 AI response received:', response);
			this.handleResponse(response);
		});

		realtimeService.onAudioResponse((audioChunk: ArrayBuffer) => {
			console.log('🔊 Audio response received:', audioChunk.byteLength, 'bytes');
			this.handleAudioResponse(audioChunk);
		});

		realtimeService.onError((error: string) => {
			console.error('❌ Realtime service error:', error);
			this.handleError(error);
		});

		realtimeService.onConnectionChange((status) => {
			console.log('🔌 Connection status change:', status);
			if (status === 'disconnected') {
				console.log('🔌 Connection disconnected, handling error...');
				this.handleError('Connection lost');
			}
		});

		console.log('✅ Realtime event handlers set up');
	}

	// 🎯 Handle incoming transcript
	private handleTranscript(transcript: string): void {
		const message = {
			role: 'user' as const,
			content: transcript,
			timestamp: Date.now()
		};

		this.state = {
			...this.state,
			messages: [...this.state.messages, message]
		};

		conversationEvents.emit.transcriptionCompleted(
			this.eventBus,
			createEventPayloads.transcriptionCompleted(
				this.state.sessionId,
				transcript,
				0.9,
				this.state.language
			)
		);

		console.log('Transcript received:', transcript);
	}

	// 🎯 Handle AI response
	private handleResponse(response: string): void {
		const message = {
			role: 'assistant' as const,
			content: response,
			timestamp: Date.now()
		};

		this.state = {
			...this.state,
			messages: [...this.state.messages, message]
		};

		console.log('AI response received:', response);
	}

	// 🎯 Handle audio response
	private async handleAudioResponse(audioChunk: ArrayBuffer): Promise<void> {
		try {
			await audioService.playAudio(audioChunk);

			conversationEvents.emit.playbackStarted(
				this.eventBus,
				createEventPayloads.playbackStarted(this.state.sessionId, 'realtime-response')
			);
		} catch (error) {
			console.error('Failed to play audio response:', error);
		}
	}

	// 🎯 Handle errors
	private handleError(error: string): void {
		this.state = { ...this.state, status: RealtimeConversationStatus.ERROR, error };

		conversationEvents.emit.errorOccurred(
			this.eventBus,
			createEventPayloads.errorOccurred(error, this.state.sessionId)
		);

		console.error('Real-time conversation error:', error);
	}

	// 🎯 Create a working fallback stream for MVP
	private createFallbackStream(): RealtimeStream {
		console.log('🎭 Creating MVP fallback stream...');

		if (!this.realtimeSession) {
			throw new Error('Cannot create fallback stream without session');
		}

		// Create a mock stream that simulates real-time conversation
		const fallbackStream: RealtimeStream = {
			id: `fallback-${crypto.randomUUID()}`,
			session: this.realtimeSession,
			isActive: true,
			startTime: Date.now(),
			audioChunksSent: 0,
			lastActivity: Date.now()
		};

		console.log('✅ Fallback stream created:', fallbackStream);
		return fallbackStream;
	}

	// 🎯 Wait for WebRTC connection to be fully established
	private async waitForWebRTCConnection(): Promise<void> {
		return new Promise((resolve, reject) => {
			const maxWaitTime = 10000; // 10 seconds max wait
			const checkInterval = 100; // Check every 100ms
			let elapsed = 0;

			console.log('🔍 Starting WebRTC connection health check...');
			console.log('🔍 Initial state:', {
				realtimeStream: !!this.realtimeStream,
				streamActive: this.realtimeStream?.isActive,
				connectionReady: this.connectionReady
			});

			const checkConnection = () => {
				elapsed += checkInterval;

				console.log(`🔍 Connection check ${elapsed}ms:`, {
					realtimeStream: !!this.realtimeStream,
					streamActive: this.realtimeStream?.isActive,
					connectionReady: this.connectionReady,
					elapsed: `${elapsed}ms`
				});

				// Check if the realtime stream is active and ready
				if (this.realtimeStream && this.realtimeStream.isActive) {
					console.log('✅ WebRTC connection confirmed active');
					resolve();
					return;
				}

				// Check if we've exceeded max wait time
				if (elapsed >= maxWaitTime) {
					console.error('❌ WebRTC connection timeout after 10 seconds');
					console.error('🔍 Final state:', {
						realtimeStream: !!this.realtimeStream,
						streamActive: this.realtimeStream?.isActive,
						connectionReady: this.connectionReady
					});
					reject(new Error('WebRTC connection timeout after 10 seconds'));
					return;
				}

				// Continue checking
				setTimeout(checkConnection, checkInterval);
			};

			// Start checking
			checkConnection();
		});
	}

	// 🎯 Cleanup resources
	cleanup(): void {
		console.log('🧹 Cleaning up orchestrator resources...');

		// Stop streaming if active
		if (this.state.status === RealtimeConversationStatus.STREAMING) {
			this.stopStreaming();
		}

		// End conversation
		this.endConversation();

		// Clean up audio resources via audio service
		if (audioService.isRecording) {
			audioService.stopRecording();
			console.log('✅ Audio recording stopped during cleanup');
		}

		console.log('✅ Cleanup completed');
	}

	// Getter for the event bus (for external coordination)
	get bus() {
		return this.eventBus;
	}
}
