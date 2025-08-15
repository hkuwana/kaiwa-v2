// 🎭 Unified Conversation Orchestrator
// Integrates Audio, Conversation, and Realtime features following "Orchestrator Pattern"

import { audioService } from '$lib/features/audio';
import { realtimeService } from '$lib/features/realtime';
import { createTutorInstructions, type TutorConfig } from './promptInstructions';
import { EventBusFactory } from '$lib/shared/events/eventBus';
import type { AudioState } from '$lib/features/audio/types';
import type { RealtimeSession, RealtimeStream } from '$lib/features/realtime';

// 🏗️ Core Types
export interface ConversationState {
	status: 'idle' | 'connecting' | 'connected' | 'recording' | 'processing' | 'speaking' | 'error';
	sessionId: string;
	language: string;
	voice: string;
	userLevel: number;
	scenario?: any;
	speaker?: any;
	messages: Array<{
		role: 'user' | 'assistant';
		content: string;
		timestamp: number;
		audioUrl?: string;
	}>;
	error: string | null;
	startTime: number | null;
	audioState: AudioState;
}

export interface ConversationConfig {
	language: string;
	voice: string;
	userLevel: number;
	scenario?: any;
	speaker?: any;
	formattedMemory: string;
}

// 🎯 Main Orchestrator Class
export class UnifiedConversationOrchestrator {
	private state: ConversationState;
	private eventBus: ReturnType<typeof EventBusFactory.create>;
	private realtimeSession: RealtimeSession | null = null;
	private realtimeStream: RealtimeStream | null = null;
	private isRecording = false;
	private currentRecorder: MediaRecorder | null = null;

	constructor() {
		this.eventBus = EventBusFactory.create('memory');
		this.state = this.createInitialState();
		this.setupEventHandlers();
	}

	// 🏗️ State Management
	private createInitialState(): ConversationState {
		return {
			status: 'idle',
			sessionId: crypto.randomUUID(),
			language: 'en',
			voice: 'alloy',
			userLevel: 220,
			scenario: null,
			speaker: null,
			messages: [],
			error: null,
			startTime: null,
			audioState: audioService.getState()
		};
	}

	private updateState(updates: Partial<ConversationState>): void {
		this.state = { ...this.state, ...updates };
		this.emitStateChange();
	}

	// 🎭 Conversation Management
	async startConversation(config: ConversationConfig): Promise<void> {
		try {
			this.updateState({
				status: 'connecting',
				language: config.language,
				voice: config.voice,
				userLevel: config.userLevel,
				scenario: config.scenario,
				speaker: config.speaker,
				startTime: Date.now()
			});

			// Create realtime session
			this.realtimeSession = await realtimeService.createSession({
				sessionId: this.state.sessionId,
				model: 'gpt-4o-realtime-preview-2024-10-01',
				voice: config.voice,
				language: config.language
			});

			// Generate tutor instructions
			const instructions = createTutorInstructions({
				language: config.language,
				scenario: config.scenario,
				userLevel: config.userLevel,
				formattedMemory: config.formattedMemory,
				speaker: config.speaker
			});

			// Start realtime streaming
			this.realtimeStream = await realtimeService.startStreaming(this.realtimeSession);

			// Send initial instructions
			await this.sendSystemMessage(instructions);

			this.updateState({ status: 'connected' });
			this.emitEvent('conversation.started', { sessionId: this.state.sessionId });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to start conversation';
			this.updateState({ status: 'error', error: errorMessage });
			this.emitEvent('conversation.error', { error: errorMessage });
			throw new Error(errorMessage);
		}
	}

	async stopConversation(): Promise<void> {
		try {
			// Stop recording if active
			if (this.isRecording) {
				await this.stopRecording();
			}

			// Close realtime session
			if (this.realtimeStream) {
				await realtimeService.stopStreaming(this.realtimeStream);
				this.realtimeStream = null;
			}

			if (this.realtimeSession) {
				await realtimeService.closeSession(this.realtimeSession);
				this.realtimeSession = null;
			}

			this.updateState({
				status: 'idle',
				startTime: null,
				messages: []
			});

			this.emitEvent('conversation.stopped', { sessionId: this.state.sessionId });
		} catch (error) {
			console.error('Error stopping conversation:', error);
		}
	}

	// 🎤 Audio Recording Management
	async startRecording(): Promise<void> {
		if (this.state.status !== 'connected') {
			throw new Error('Conversation must be connected to start recording');
		}

		try {
			this.updateState({ status: 'recording' });
			this.isRecording = true;

			// Start audio recording
			await audioService.startRecording();

			// Start realtime audio streaming
			if (this.realtimeStream) {
				// Set up audio data handling
				this.setupAudioStreaming();
			}

			this.emitEvent('conversation.recording_started', { sessionId: this.state.sessionId });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
			this.updateState({ status: 'error', error: errorMessage });
			throw new Error(errorMessage);
		}
	}

	async stopRecording(): Promise<void> {
		if (!this.isRecording) return;

		try {
			this.isRecording = false;
			this.updateState({ status: 'processing' });

			// Stop audio recording
			await audioService.stopRecording();

			// Process final audio chunk
			if (this.realtimeStream) {
				await this.processFinalAudioChunk();
			}

			this.updateState({ status: 'connected' });
			this.emitEvent('conversation.recording_stopped', { sessionId: this.state.sessionId });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to stop recording';
			this.updateState({ status: 'error', error: errorMessage });
			throw new Error(errorMessage);
		}
	}

	// 🔄 Audio Streaming Setup
	private setupAudioStreaming(): void {
		// This would integrate with the realtime audio streaming
		// For now, we'll simulate the audio data flow
		console.log('Audio streaming setup complete');
	}

	private async processFinalAudioChunk(): Promise<void> {
		// Process the final audio chunk for transcription
		// This would integrate with the realtime API
		console.log('Processing final audio chunk');
	}

	// 💬 Message Management
	private async sendSystemMessage(content: string): Promise<void> {
		const message = {
			role: 'assistant' as const,
			content,
			timestamp: Date.now()
		};

		this.updateState({
			messages: [...this.state.messages, message]
		});

		this.emitEvent('conversation.message_added', { message, sessionId: this.state.sessionId });
	}

	async addUserMessage(content: string, audioUrl?: string): Promise<void> {
		const message = {
			role: 'user' as const,
			content,
			timestamp: Date.now(),
			audioUrl
		};

		this.updateState({
			messages: [...this.state.messages, message]
		});

		this.emitEvent('conversation.message_added', { message, sessionId: this.state.sessionId });
	}

	async addAssistantMessage(content: string, audioUrl?: string): Promise<void> {
		const message = {
			role: 'assistant' as const,
			content,
			timestamp: Date.now(),
			audioUrl
		};

		this.updateState({
			messages: [...this.state.messages, message]
		});

		// Play audio if provided
		if (audioUrl) {
			await this.playAudioResponse(audioUrl);
		}

		this.emitEvent('conversation.message_added', { message, sessionId: this.state.sessionId });
	}

	// 🔊 Audio Playback
	private async playAudioResponse(audioUrl: string): Promise<void> {
		try {
			this.updateState({ status: 'speaking' });
			await audioService.playFromUrl(audioUrl);
			this.updateState({ status: 'connected' });
		} catch (error) {
			console.error('Failed to play audio response:', error);
			this.updateState({ status: 'connected' });
		}
	}

	// 🎯 Public API
	getState(): ConversationState {
		return { ...this.state };
	}

	get isConnected(): boolean {
		return this.state.status === 'connected';
	}

	get isRecordingActive(): boolean {
		return this.isRecording;
	}

	get sessionId(): string {
		return this.state.sessionId;
	}

	// 🧹 Cleanup
	dispose(): void {
		this.stopConversation();
		this.eventBus.dispose();
	}

	// 📡 Event System
	private setupEventHandlers(): void {
		// Monitor audio state changes
		setInterval(() => {
			const audioState = audioService.getState();
			if (audioState !== this.state.audioState) {
				this.updateState({ audioState });
			}
		}, 100);

		// Monitor realtime events
		realtimeService.onTranscript((transcript: string) => {
			this.addUserMessage(transcript);
		});

		realtimeService.onResponse((response: string) => {
			this.addAssistantMessage(response);
		});

		realtimeService.onAudioResponse(async (audioChunk: ArrayBuffer) => {
			// Convert audio chunk to blob URL for playback
			const blob = new Blob([audioChunk], { type: 'audio/mp3' });
			const audioUrl = URL.createObjectURL(blob);

			// Add message with audio
			const lastMessage = this.state.messages[this.state.messages.length - 1];
			if (lastMessage && lastMessage.role === 'assistant') {
				lastMessage.audioUrl = audioUrl;
				this.updateState({ messages: [...this.state.messages] });
			}
		});

		realtimeService.onError((error: string) => {
			this.updateState({ status: 'error', error });
			this.emitEvent('conversation.error', { error });
		});
	}

	private emitEvent<T extends string>(eventName: T, payload: any): void {
		this.eventBus.emit(eventName, payload);
	}

	private emitStateChange(): void {
		this.emitEvent('conversation.state_changed', { state: this.state });
	}
}
