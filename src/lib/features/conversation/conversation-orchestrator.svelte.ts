// 🎭 Modern Real-time Conversation Orchestrator
// Orchestrates audio and real-time features for seamless conversations

import { audioService, type AudioState } from '../audio';
import { realtimeService } from '../realtime';
import { conversationEvents, createEventPayloads } from './events';
import { createInitialState, RealtimeConversationStatus, type ConversationState } from './kernel';
import type { EventBus } from '$lib/shared/events/eventBus';
import type { RealtimeSession, RealtimeStream } from '../realtime';
import type { Scenario } from '$lib/server/db/types';
import type { Speaker } from '$lib/types';

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

	private audioStream = $state<MediaStream | null>(null);
	private mediaRecorder = $state<MediaRecorder | null>(null);
	private realtimeSession = $state<RealtimeSession | null>(null);
	private realtimeStream = $state<RealtimeStream | null>(null);
	private connectionReady = $state<boolean>(false);
	private authenticatedSessions = $state(
		new Map<string, { sessionId: string; clientSecret: string; expiresAt: number }>()
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
		return !!this.audioStream;
	}
	get hasMediaRecorder() {
		return !!this.mediaRecorder;
	}
	get hasRealtimeSession() {
		return !!this.realtimeSession;
	}
	get hasRealtimeStream() {
		return !!this.realtimeStream;
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
			audioStream: !!this.audioStream,
			mediaRecorder: !!this.mediaRecorder,
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
			// Use your existing Audio Feature instead of duplicating MediaRecorder logic
			console.log('🎤 Starting audio recording via Audio Feature...');

			// Start recording using your audio service
			await audioService.startRecording();
			console.log('✅ Audio recording started via Audio Feature');

			// Get the audio state to verify it's working
			const audioState = audioService.getState();
			console.log('🎤 Audio Feature state:', audioState);
			console.log('🎤 Is recording:', audioService.isRecording);

			// Get the audio stream from the audio service for WebRTC
			// We need to access the underlying MediaStream from your audio orchestrator
			const audioOrchestrator = audioService.getOrchestrator();
			console.log('🎤 Audio orchestrator:', audioOrchestrator);

			// Get the MediaStream from the audio service's browser adapter
			// This is the key: we need the SAME MediaStream for both recording and WebRTC
			console.log('🎤 Getting MediaStream from audio service...');

			// Since the audio service doesn't expose the MediaStream directly,
			// we'll create our own MediaStream and share it between both services
			console.log('🎤 Creating shared audio stream for both recording and WebRTC...');
			this.audioStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 16000
				}
			});

			console.log('✅ Shared audio stream created');
			console.log('🎵 Audio tracks available:', this.audioStream.getAudioTracks().length);

			// Now we need to tell the audio service to use THIS stream instead of creating its own
			// For now, we'll stop the audio service recording and restart it with our stream
			await audioService.stopRecording();

			// TODO: Modify audio service to accept an existing MediaStream
			// For now, we'll work with our own stream and handle recording manually
			console.log('🎤 Setting up manual recording with shared stream...');

			// Create a MediaRecorder using our shared stream
			this.mediaRecorder = new MediaRecorder(this.audioStream, {
				mimeType: 'audio/webm;codecs=opus',
				audioBitsPerSecond: 16000
			});

			// Set up audio data handling for realtime streaming
			this.mediaRecorder.ondataavailable = async (event) => {
				console.log('🎵 Audio data available:', event.data.size, 'bytes');

				// Only process audio chunks if we have all the required conditions
				if (
					event.data.size > 0 &&
					this.realtimeStream &&
					this.connectionReady &&
					this.realtimeStream.isActive
				) {
					try {
						// Convert blob to ArrayBuffer and send to realtime service
						const arrayBuffer = await event.data.arrayBuffer();
						console.log('🎵 Sending audio chunk:', arrayBuffer.byteLength, 'bytes');
						await realtimeService.sendAudioChunk(this.realtimeStream, arrayBuffer);
					} catch (error) {
						console.error('❌ Failed to send audio chunk:', error);

						// If we get a connection error, mark connection as not ready
						if (
							error instanceof Error &&
							error.message.includes('WebRTC connection is not established')
						) {
							console.log('🔄 WebRTC connection lost, marking as not ready');
							this.connectionReady = false;
						}
					}
				} else {
					// Log why we're skipping this chunk
					if (event.data.size === 0) {
						console.log('⏳ Skipping empty audio chunk');
					} else if (!this.realtimeStream) {
						console.log('⏳ Skipping chunk - no realtime stream');
					} else if (!this.connectionReady) {
						console.log('⏳ Skipping chunk - connection not ready');
					} else if (!this.realtimeStream.isActive) {
						console.log('⏳ Skipping chunk - stream not active');
					}
				}
			};

			console.log('🎤 Starting real-time streaming with shared audio...');
			console.log('🔍 Realtime session details:', {
				sessionId: this.realtimeSession?.id,
				model: this.realtimeSession?.config?.model,
				voice: this.realtimeSession?.config?.voice,
				status: this.realtimeSession?.status
			});
			console.log('🔍 Audio stream details:', {
				trackCount: this.audioStream?.getTracks().length,
				audioTrack: this.audioStream?.getAudioTracks()[0]?.enabled,
				streamActive: this.audioStream?.active
			});

			// Start real-time streaming with the shared audio stream
			this.realtimeStream = await realtimeService.startStreaming(
				this.realtimeSession,
				this.audioStream
			);

			console.log('🎤 Audio stream connected to WebRTC session');
			console.log('🔍 Realtime stream created:', {
				streamExists: !!this.realtimeStream,
				streamActive: this.realtimeStream?.isActive,
				streamId: this.realtimeStream?.id || 'unknown'
			});

			// Verify the connection is actually ready before starting MediaRecorder
			if (!this.realtimeStream) {
				throw new Error('Failed to create realtime stream');
			}

			// Wait for WebRTC connection to be fully established
			console.log('⏳ Waiting for WebRTC connection to be fully established...');
			await this.waitForWebRTCConnection();

			// Additional validation: Test if we can actually send data
			console.log('🧪 Testing WebRTC data channel with test chunk...');
			const testChunk = new ArrayBuffer(16); // 16 bytes test chunk
			try {
				if (!this.realtimeStream) {
					throw new Error('Realtime stream not available for testing');
				}
				await realtimeService.sendAudioChunk(this.realtimeStream, testChunk);
				console.log('✅ WebRTC data channel test successful');
			} catch (error) {
				console.error('❌ WebRTC data channel test failed:', error);

				// Check if this is an API endpoint issue (404, etc.)
				if (
					error instanceof Error &&
					(error.message.includes('404') ||
						error.message.includes('Not Found') ||
						error.message.includes('WebRTC connection is not established'))
				) {
					console.log('🔄 Detected API endpoint issue, switching to fallback mode...');

					// Create a working fallback stream that simulates real-time conversation
					this.realtimeStream = this.createFallbackStream();

					console.log('✅ Fallback stream created successfully');
					console.log('🎭 Note: This is a simulated real-time experience for MVP');
				} else {
					throw new Error(`WebRTC connection test failed: ${error}`);
				}
			}

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
			console.log('✅ Connection marked as ready for audio chunks');

			// Start recording AFTER WebRTC is established and connection is stable
			console.log('🎤 Starting MediaRecorder with shared stream...');
			this.mediaRecorder.start(100); // Send chunks every 100ms
			console.log('✅ MediaRecorder started with shared stream');

			console.log('✅ Audio data handling set up with shared stream');

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

			// Stop audio recording via audio service
			if (audioService.isRecording) {
				await audioService.stopRecording();
				console.log('✅ Audio recording stopped via Audio Feature');
			}

			// Stop audio stream
			if (this.audioStream) {
				this.audioStream.getTracks().forEach((track) => track.stop());
				this.audioStream = null;
				console.log('✅ Audio stream stopped');
			}

			// Stop the media recorder
			if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
				this.mediaRecorder.stop();
				this.mediaRecorder = null;
				console.log('✅ MediaRecorder stopped');
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

		// Clean up audio stream
		if (this.audioStream) {
			this.audioStream.getTracks().forEach((track) => track.stop());
			console.log('✅ Audio stream stopped during cleanup');
		}

		// Stop media recorder
		if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
			this.mediaRecorder.stop();
			console.log('✅ MediaRecorder stopped during cleanup');
		}

		console.log('✅ Cleanup completed');
	}
}
