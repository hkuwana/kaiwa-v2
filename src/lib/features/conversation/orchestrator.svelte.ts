// 🎭 Conversation Feature Orchestrator
// Manages conversation state and emits events - the imperative shell for the conversation feature

import {
	createConversationKernel,
	type ConversationState,
	createInitialState
} from './kernel/index.js';
import { adapters, type AudioAdapter, type AIAdapter, type StorageAdapter } from './adapters.js';
import { conversationEvents, createEventPayloads } from './events.js';
import type { EventBus } from '$lib/shared/events/eventBus.js';

export class ConversationOrchestrator {
	private kernel = createConversationKernel();
	private currentState: ConversationState;
	private currentRecorder: MediaRecorder | null = null;
	private isExecutingEffects = false;

	constructor(
		private eventBus: EventBus,
		private audioAdapter: AudioAdapter = adapters.audio,
		private aiAdapter: AIAdapter = adapters.ai,
		private storageAdapter: StorageAdapter = adapters.storage
	) {
		this.currentState = createInitialState();
		this.setupEventListeners();
	}

	// 🎯 Get current state
	getState(): ConversationState {
		return this.currentState;
	}

	// 🎯 Setup event listeners for cross-feature communication
	private setupEventListeners(): void {
		// Listen to auth events
		conversationEvents.on.userLogin(this.eventBus, this.handleUserLogin.bind(this));
		conversationEvents.on.userLogout(this.eventBus, this.handleUserLogout.bind(this));
		conversationEvents.on.subscriptionUpdated(
			this.eventBus,
			this.handleSubscriptionUpdated.bind(this)
		);
	}

	// 🎯 Handle user login event
	private handleUserLogin(payload: any): void {
		// Update conversation preferences based on user tier
		console.log('User logged in, updating conversation preferences:', payload);
	}

	// 🎯 Handle user logout event
	private handleUserLogout(payload: any): void {
		// Clear user-specific conversation data
		console.log('User logged out, clearing conversation data:', payload);
	}

	// 🎯 Handle subscription update event
	private handleSubscriptionUpdated(payload: any): void {
		// Update conversation limits based on new tier
		console.log('Subscription updated, updating conversation limits:', payload);
	}

	// 🎯 Start a new conversation
	async startConversation(language?: string, voice?: string): Promise<ConversationState> {
		try {
			this.currentState = this.kernel.start(this.currentState, language, voice);

			// Emit conversation started event
			conversationEvents.emit.started(
				this.eventBus,
				createEventPayloads.conversationStarted(
					this.currentState.sessionId,
					this.currentState.language || 'en',
					'traditional'
				)
			);

			// Emit analytics event
			conversationEvents.emit.featureUsed(
				this.eventBus,
				createEventPayloads.featureUsed(
					'conversation',
					'started',
					this.currentState.sessionId,
					undefined,
					{ language: this.currentState.language, voice: this.currentState.voice }
				)
			);

			await this.storageAdapter.save('currentSession', this.currentState.sessionId);
			return this.currentState;
		} catch (error) {
			this.currentState = this.kernel.setError(
				this.currentState,
				`Failed to start conversation: ${error}`
			);

			// Emit error event
			conversationEvents.emit.error(
				this.eventBus,
				createEventPayloads.conversationError(
					this.currentState.sessionId,
					`Failed to start conversation: ${error}`
				)
			);

			return this.currentState;
		}
	}

	// 🎯 Start recording user input
	async startRecording(): Promise<ConversationState> {
		try {
			// Start the kernel recording state
			this.currentState = this.kernel.startRecording(this.currentState);

			// Start actual audio recording
			this.currentRecorder = await this.audioAdapter.startRecording();

			// Emit recording started event
			conversationEvents.emit.recordingStarted(
				this.eventBus,
				createEventPayloads.recordingStarted(this.currentState.sessionId)
			);

			return this.currentState;
		} catch (error) {
			this.currentState = this.kernel.setError(
				this.currentState,
				`Failed to start recording: ${error}`
			);

			// Emit error event
			conversationEvents.emit.errorOccurred(
				this.eventBus,
				createEventPayloads.errorOccurred(
					`Failed to start recording: ${error}`,
					this.currentState.sessionId
				)
			);

			return this.currentState;
		}
	}

	// 🎯 Stop recording and process
	async stopRecording(): Promise<ConversationState> {
		if (!this.currentRecorder) {
			this.currentState = this.kernel.setError(this.currentState, 'No active recording to stop');
			return this.currentState;
		}

		try {
			// Stop recording and get audio data
			const audioData = await this.audioAdapter.stopRecording(this.currentRecorder);
			this.currentRecorder = null;

			// Calculate recording duration
			const duration = Date.now() - this.currentState.startTime;

			// Emit recording stopped event
			conversationEvents.emit.recordingStopped(
				this.eventBus,
				createEventPayloads.recordingStopped(
					this.currentState.sessionId,
					duration,
					audioData.byteLength
				)
			);

			// Update kernel state and get effects
			this.currentState = this.kernel.stopRecording(this.currentState, audioData);
			const effects = this.kernel.getEffects(this.currentState, {
				type: 'STOP_RECORDING',
				payload: { audio: audioData }
			});

			// Execute effects asynchronously
			this.executeEffects(effects);

			return this.currentState;
		} catch (error) {
			this.currentRecorder = null;
			this.currentState = this.kernel.setError(
				this.currentState,
				`Failed to stop recording: ${error}`
			);

			// Emit error event
			conversationEvents.emit.errorOccurred(
				this.eventBus,
				createEventPayloads.errorOccurred(
					`Failed to stop recording: ${error}`,
					this.currentState.sessionId
				)
			);

			return this.currentState;
		}
	}

	// 🎯 End the current conversation
	async endConversation(): Promise<ConversationState> {
		try {
			// Clean up any active recording
			if (this.currentRecorder) {
				try {
					await this.audioAdapter.stopRecording(this.currentRecorder);
				} catch {
					// Ignore cleanup errors
				}
				this.currentRecorder = null;
			}

			// Calculate conversation duration and message count
			const duration = Date.now() - this.currentState.startTime;
			const messageCount = Math.floor(this.currentState.messages.length / 2);

			// Emit conversation ended event
			conversationEvents.emit.ended(
				this.eventBus,
				createEventPayloads.conversationEnded(this.currentState.sessionId, duration, messageCount)
			);

			// Save final conversation state
			if (this.currentState.messages.length > 0) {
				await this.storageAdapter.save(`conversation_${this.currentState.sessionId}`, {
					sessionId: this.currentState.sessionId,
					messages: this.currentState.messages,
					startTime: this.currentState.startTime,
					endTime: Date.now(),
					duration: duration
				});
			}

			// Reset to initial state
			this.currentState = createInitialState();
			return this.currentState;
		} catch (error) {
			this.currentState = this.kernel.setError(
				this.currentState,
				`Failed to end conversation: ${error}`
			);

			// Emit error event
			conversationEvents.emit.errorOccurred(
				this.eventBus,
				createEventPayloads.errorOccurred(
					`Failed to end conversation: ${error}`,
					this.currentState.sessionId
				)
			);

			return this.currentState;
		}
	}

	// 🎯 Execute side effects asynchronously
	private async executeEffects(effects: any[]): Promise<void> {
		if (this.isExecutingEffects) return;
		this.isExecutingEffects = true;

		try {
			for (const effect of effects) {
				await this.executeEffect(effect);
			}
		} catch (error) {
			this.currentState = this.kernel.setError(
				this.currentState,
				`Effect execution failed: ${error}`
			);

			// Emit error event
			conversationEvents.emit.errorOccurred(
				this.eventBus,
				createEventPayloads.errorOccurred(
					`Effect execution failed: ${error}`,
					this.currentState.sessionId
				)
			);
		} finally {
			this.isExecutingEffects = false;
		}
	}

	// 🎯 Execute a single effect
	private async executeEffect(effect: any): Promise<void> {
		switch (effect.type) {
			case 'TRANSCRIBE': {
				try {
					if (!effect.payload?.audio) {
						throw new Error('No audio data provided for transcription');
					}

					const transcript = await this.aiAdapter.transcribe(effect.payload.audio);
					const history = this.currentState.messages.map((msg) => ({
						role: msg.role,
						content: msg.content
					}));

					// Emit transcription completed event
					conversationEvents.emit.transcriptionCompleted(
						this.eventBus,
						createEventPayloads.transcriptionCompleted(
							this.currentState.sessionId,
							transcript,
							0.9, // Confidence placeholder
							this.currentState.language || 'en'
						)
					);

					// Generate AI response
					const response = await this.aiAdapter.complete(transcript, history);

					// Update kernel with response
					this.currentState = this.kernel.receiveResponse(this.currentState, transcript, response);
					const newEffects = this.kernel.getEffects(this.currentState, {
						type: 'RECEIVE_RESPONSE',
						payload: { transcript, response }
					});

					// Execute any new effects
					if (newEffects.length > 0) {
						this.executeEffects(newEffects);
					}
				} catch (error) {
					this.currentState = this.kernel.setError(
						this.currentState,
						`Transcription failed: ${error}`
					);

					// Emit error event
					conversationEvents.emit.errorOccurred(
						this.eventBus,
						createEventPayloads.errorOccurred(
							`Transcription failed: ${error}`,
							this.currentState.sessionId
						)
					);
				}
				break;
			}

			case 'SPEAK': {
				try {
					if (!effect.payload?.text) {
						throw new Error('No text provided for speech synthesis');
					}

					// Generate and play audio response
					const audioData = await this.aiAdapter.textToSpeech(effect.payload.text);

					if (audioData.byteLength > 0) {
						await this.audioAdapter.play(audioData);
					} else {
						// Fallback: use browser speech synthesis
						const utterance = new SpeechSynthesisUtterance(effect.payload.text);
						speechSynthesis.speak(utterance);
					}

					// Emit playback started event
					conversationEvents.emit.playbackStarted(
						this.eventBus,
						createEventPayloads.playbackStarted(this.currentState.sessionId, 'tts-response')
					);

					// Transition back to idle state after speaking
					setTimeout(() => {
						if (this.currentState.status === 'speaking') {
							this.currentState = this.kernel.stopSpeaking(this.currentState);
						}
					}, 100);
				} catch (error) {
					console.warn('TTS failed, using fallback:', error);
					// Fallback to browser speech
					const utterance = new SpeechSynthesisUtterance(effect.payload?.text || '');
					speechSynthesis.speak(utterance);
				}
				break;
			}

			case 'SAVE_EXCHANGE': {
				try {
					if (!effect.payload?.messages) {
						console.warn('No messages provided for saving');
						return;
					}

					await this.storageAdapter.save(`conversation_${this.currentState.sessionId}`, {
						sessionId: this.currentState.sessionId,
						messages: effect.payload.messages,
						lastUpdated: Date.now()
					});
				} catch (error) {
					console.warn('Failed to save conversation:', error);
					// Non-critical error, don't update kernel state
				}
				break;
			}

			default:
				console.warn('Unknown effect type:', effect);
		}
	}

	// 🎯 Get conversation history
	async getConversationHistory(sessionId?: string): Promise<unknown> {
		try {
			const id = sessionId || this.currentState.sessionId;
			return await this.storageAdapter.load(`conversation_${id}`);
		} catch (error) {
			console.warn('Failed to load conversation history:', error);
			return null;
		}
	}

	// 🎯 Cleanup resources
	cleanup(): void {
		if (this.currentRecorder) {
			try {
				this.currentRecorder.stream.getTracks().forEach((track) => track.stop());
			} catch {
				// Ignore cleanup errors
			}
			this.currentRecorder = null;
		}
	}
}
