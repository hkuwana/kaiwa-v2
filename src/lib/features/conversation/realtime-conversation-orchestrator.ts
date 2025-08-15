// 🎭 Modern Real-time Conversation Orchestrator
// Orchestrates audio and real-time features for seamless conversations

import { audioService } from '../audio';
import { realtimeService } from '../realtime';
import { conversationEvents, createEventPayloads } from './events';
import type { EventBus } from '$lib/shared/events/eventBus';
import type { AudioCaptureSession, AudioStream } from '../audio';
import type { RealtimeSession, RealtimeStream } from '../realtime';

export interface RealtimeConversationState {
	status: 'idle' | 'connecting' | 'connected' | 'streaming' | 'error';
	sessionId: string;
	messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
	startTime: number;
	language: string;
	voice: string;
	error?: string;
}

export class ModernRealtimeConversationOrchestrator {
	private state: RealtimeConversationState;
	private audioSession: AudioCaptureSession | null = null;
	private audioStream: AudioStream | null = null;
	private realtimeSession: RealtimeSession | null = null;
	private realtimeStream: RealtimeStream | null = null;

	constructor(private eventBus: EventBus) {
		this.state = this.createInitialState();
		this.setupEventHandlers();
	}

	// 🎯 Get current state
	getState(): RealtimeConversationState {
		return this.state;
	}

	// 🎯 Start a new real-time conversation
	async startConversation(language: string = 'en', voice: string = 'alloy'): Promise<void> {
		try {
			this.state = {
				...this.state,
				status: 'connecting',
				language,
				voice,
				startTime: Date.now()
			};

			// Create real-time session
			this.realtimeSession = await realtimeService.createSession({
				sessionId: this.state.sessionId,
				model: 'gpt-4o-realtime-preview-2024-10-01',
				voice,
				language
			});

			if (!this.realtimeSession) {
				throw new Error('Realtime session not created');
			}

			this.state = {
				...this.state,
				status: 'connected',
				sessionId: this.realtimeSession.id
			};

			// Emit conversation started event
			conversationEvents.emit.started(
				this.eventBus,
				createEventPayloads.conversationStarted(this.state.sessionId, language, 'realtime')
			);

			console.log('Real-time conversation started:', this.realtimeSession);
		} catch (error) {
			this.state = {
				...this.state,
				status: 'error',
				error: `Failed to start conversation: ${error}`
			};

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

	// 🎯 Start streaming audio
	async startStreaming(): Promise<void> {
		if (this.state.status !== 'connected' || !this.realtimeSession) {
			throw new Error('Conversation not connected');
		}

		try {
			// Start audio capture
			this.audioSession = await audioService.startRecording();

			// Start audio streaming
			this.audioStream = await audioService.startStreaming(this.audioSession);

			// Start real-time streaming
			this.realtimeStream = await realtimeService.startStreaming(this.realtimeSession);

			// Set up audio data handling
			audioService.onAudioData(async (chunk: ArrayBuffer) => {
				try {
					// Process audio chunk
					const processedChunk = await audioService.processAudioChunk(chunk);

					// Send to real-time API
					if (this.realtimeStream) {
						await realtimeService.sendAudioChunk(this.realtimeStream, processedChunk.chunk);
					}

					// Update audio level for visualization
					// This would be handled by the UI component
				} catch (error) {
					console.error('Failed to process audio chunk:', error);
				}
			});

			this.state = { ...this.state, status: 'streaming' };

			conversationEvents.emit.recordingStarted(
				this.eventBus,
				createEventPayloads.recordingStarted(this.state.sessionId)
			);

			console.log('Audio streaming started');
		} catch (error) {
			this.state = { ...this.state, status: 'error', error: `Failed to start streaming: ${error}` };
			throw error;
		}
	}

	// 🎯 Stop streaming audio
	async stopStreaming(): Promise<void> {
		try {
			// Stop audio streaming
			if (this.audioStream) {
				await audioService.stopStreaming(this.audioStream);
				this.audioStream = null;
			}

			// Stop real-time streaming
			if (this.realtimeStream) {
				await realtimeService.stopStreaming(this.realtimeStream);
				this.realtimeStream = null;
			}

			// Stop audio capture
			if (this.audioSession) {
				await audioService.stopRecording(this.audioSession);
				this.audioSession = null;
			}

			this.state = { ...this.state, status: 'connected' };

			conversationEvents.emit.recordingStopped(
				this.eventBus,
				createEventPayloads.recordingStopped(
					this.state.sessionId,
					Date.now() - this.state.startTime,
					0 // Audio size would be calculated from chunks
				)
			);

			console.log('Audio streaming stopped');
		} catch (error) {
			console.error('Error stopping streaming:', error);
		}
	}

	// 🎯 End the conversation
	async endConversation(): Promise<void> {
		try {
			// Stop streaming if active
			if (this.state.status === 'streaming') {
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
			this.state = this.createInitialState();

			console.log('Real-time conversation ended');
		} catch (error) {
			console.error('Error ending conversation:', error);
		}
	}

	// 🎯 Setup event handlers
	private setupEventHandlers(): void {
		// Handle real-time events
		realtimeService.onTranscript((transcript: string) => {
			this.handleTranscript(transcript);
		});

		realtimeService.onResponse((response: string) => {
			this.handleResponse(response);
		});

		realtimeService.onAudioResponse((audioChunk: ArrayBuffer) => {
			this.handleAudioResponse(audioChunk);
		});

		realtimeService.onError((error: string) => {
			this.handleError(error);
		});

		realtimeService.onConnectionChange((status) => {
			if (status === 'disconnected') {
				this.handleError('Connection lost');
			}
		});
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
		this.state = { ...this.state, status: 'error', error };

		conversationEvents.emit.errorOccurred(
			this.eventBus,
			createEventPayloads.errorOccurred(error, this.state.sessionId)
		);

		console.error('Real-time conversation error:', error);
	}

	// 🎯 Create initial state
	private createInitialState(): RealtimeConversationState {
		return {
			status: 'idle',
			sessionId: crypto.randomUUID(),
			messages: [],
			startTime: 0,
			language: 'en',
			voice: 'alloy'
		};
	}

	// 🎯 Cleanup resources
	cleanup(): void {
		this.endConversation();
	}
}
