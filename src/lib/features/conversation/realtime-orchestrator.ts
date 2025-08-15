// 🎭 Real-time Conversation Orchestrator
// Manages real-time streaming conversations with OpenAI's real-time API

import { adapters, type RealtimeAudioAdapter } from './adapters';
import { conversationEvents, createEventPayloads } from './events';
import type { EventBus } from '$lib/shared/events/eventBus';

export interface RealtimeConversationState {
	status: 'idle' | 'connecting' | 'connected' | 'streaming' | 'error';
	sessionId: string;
	messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
	startTime: number;
	language: string;
	voice: string;
	error?: string;
}

export class RealtimeConversationOrchestrator {
	private state: RealtimeConversationState;
	private realtimeAudio: RealtimeAudioAdapter;
	private audioContext: AudioContext | null = null;
	private mediaRecorder: MediaRecorder | null = null;
	private audioChunks: ArrayBuffer[] = [];
	private isStreaming = false;

	constructor(
		private eventBus: EventBus,
		realtimeAudio: RealtimeAudioAdapter = adapters.realtimeAudio
	) {
		this.realtimeAudio = realtimeAudio;
		this.state = this.createInitialState();
		this.setupRealtimeCallbacks();
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
			const session = await this.realtimeAudio.startRealtimeSession(
				this.state.sessionId,
				language,
				voice
			);

			this.state = {
				...this.state,
				status: 'connected',
				sessionId: session.sessionId
			};

			// Emit conversation started event
			conversationEvents.emit.started(
				this.eventBus,
				createEventPayloads.conversationStarted(this.state.sessionId, language, 'realtime')
			);

			console.log('Real-time conversation started:', session);
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
		if (this.state.status !== 'connected') {
			throw new Error('Conversation not connected');
		}

		try {
			// Initialize audio context
			this.audioContext = new AudioContext();

			// Get microphone stream
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					sampleRate: 16000
				}
			});

			// Create media recorder
			this.mediaRecorder = new MediaRecorder(stream, {
				mimeType: 'audio/webm;codecs=opus'
			});

			// Set up audio handling
			this.setupAudioHandling();

			// Start recording
			this.mediaRecorder.start(100); // 100ms chunks for real-time streaming
			this.isStreaming = true;

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
		if (!this.isStreaming || !this.mediaRecorder) {
			return;
		}

		try {
			this.isStreaming = false;
			this.mediaRecorder.stop();

			// Clean up stream
			this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
			this.mediaRecorder = null;

			this.state = { ...this.state, status: 'connected' };

			conversationEvents.emit.recordingStopped(
				this.eventBus,
				createEventPayloads.recordingStopped(
					this.state.sessionId,
					Date.now() - this.state.startTime,
					this.audioChunks.reduce((total, chunk) => total + chunk.byteLength, 0)
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
			if (this.isStreaming) {
				await this.stopStreaming();
			}

			// Stop real-time session
			await this.realtimeAudio.stopRealtimeSession();

			// Clean up audio context
			if (this.audioContext) {
				await this.audioContext.close();
				this.audioContext = null;
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
			this.audioChunks = [];

			console.log('Real-time conversation ended');
		} catch (error) {
			console.error('Error ending conversation:', error);
		}
	}

	// 🎯 Setup real-time callbacks
	private setupRealtimeCallbacks(): void {
		this.realtimeAudio.onTranscript((transcript: string) => {
			this.handleTranscript(transcript);
		});

		this.realtimeAudio.onResponse((response: string) => {
			this.handleResponse(response);
		});

		this.realtimeAudio.onAudioResponse((audioChunk: ArrayBuffer) => {
			this.handleAudioResponse(audioChunk);
		});

		this.realtimeAudio.onError((error: string) => {
			this.handleError(error);
		});
	}

	// 🎯 Setup audio handling
	private setupAudioHandling(): void {
		if (!this.mediaRecorder) return;

		this.mediaRecorder.ondataavailable = async (event) => {
			if (event.data.size > 0) {
				const arrayBuffer = await event.data.arrayBuffer();
				this.audioChunks.push(arrayBuffer);

				// Stream audio chunk to real-time API
				try {
					await this.realtimeAudio.streamAudio(arrayBuffer);
				} catch (error) {
					console.error('Failed to stream audio chunk:', error);
				}
			}
		};
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
				0.9, // Confidence placeholder
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
			// Play the audio response
			if (this.audioContext) {
				const audioBuffer = await this.audioContext.decodeAudioData(audioChunk);
				const source = this.audioContext.createBufferSource();
				source.buffer = audioBuffer;
				source.connect(this.audioContext.destination);
				source.start();

				conversationEvents.emit.playbackStarted(
					this.eventBus,
					createEventPayloads.playbackStarted(this.state.sessionId, 'realtime-response')
				);
			}
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
