// 🎭 Conversation Orchestrator (Svelte 5 Runes)
// Coordinates between the kernel and adapters - the imperative shell

import {
	createConversationKernel,
	type ConversationState,
	type ConversationEffect,
	createInitialState
} from './features/conversation/kernel/index';
import {
	adapters,
	type AudioAdapter,
	type AIAdapter,
	type StorageAdapter
} from './features/conversation/adapters';

class ConversationOrchestrator {
	private kernel = createConversationKernel();
	private currentState: ConversationState;
	private currentRecorder: MediaRecorder | null = null;
	private isExecutingEffects = false;

	constructor(
		private audioAdapter: AudioAdapter = adapters.audio,
		private aiAdapter: AIAdapter = adapters.ai,
		private storageAdapter: StorageAdapter = adapters.storage
	) {
		this.currentState = createInitialState();
	}

	// Get current state
	getState(): ConversationState {
		return this.currentState;
	}

	// Start a new conversation
	async startConversation(language?: string, voice?: string): Promise<ConversationState> {
		try {
			this.currentState = this.kernel.start(this.currentState, language, voice);
			await this.storageAdapter.save('currentSession', this.currentState.sessionId);
			return this.currentState;
		} catch (error) {
			this.currentState = this.kernel.setError(
				this.currentState,
				`Failed to start conversation: ${error}`
			);
			return this.currentState;
		}
	}

	// Start recording user input
	async startRecording(): Promise<ConversationState> {
		try {
			// Start the kernel recording state
			this.currentState = this.kernel.startRecording(this.currentState);

			// Start actual audio recording
			this.currentRecorder = await this.audioAdapter.startRecording();

			return this.currentState;
		} catch (error) {
			this.currentState = this.kernel.setError(
				this.currentState,
				`Failed to start recording: ${error}`
			);
			return this.currentState;
		}
	}

	// Stop recording and process
	async stopRecording(): Promise<ConversationState> {
		if (!this.currentRecorder) {
			this.currentState = this.kernel.setError(this.currentState, 'No active recording to stop');
			return this.currentState;
		}

		try {
			// Stop recording and get audio data
			const audioData = await this.audioAdapter.stopRecording(this.currentRecorder);
			this.currentRecorder = null;

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
			return this.currentState;
		}
	}

	// End the current conversation
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

			// Save final conversation state
			if (this.currentState.messages.length > 0) {
				await this.storageAdapter.save(`conversation_${this.currentState.sessionId}`, {
					sessionId: this.currentState.sessionId,
					messages: this.currentState.messages,
					startTime: this.currentState.startTime,
					endTime: Date.now(),
					duration: Date.now() - this.currentState.startTime
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
			return this.currentState;
		}
	}

	// Execute side effects asynchronously
	private async executeEffects(effects: ConversationEffect[]): Promise<void> {
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
		} finally {
			this.isExecutingEffects = false;
		}
	}

	// Execute a single effect
	private async executeEffect(effect: ConversationEffect): Promise<void> {
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

	// Get conversation history
	async getConversationHistory(sessionId?: string): Promise<unknown> {
		try {
			const id = sessionId || this.currentState.sessionId;
			return await this.storageAdapter.load(`conversation_${id}`);
		} catch (error) {
			console.warn('Failed to load conversation history:', error);
			return null;
		}
	}

	// Cleanup resources
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

// 🎯 Global orchestrator instance (singleton for simplicity in MVP)
const conversationOrchestrator = new ConversationOrchestrator();

// 🎯 Reactive store using Svelte 5 runes
export function createConversationStore() {
	// Use $state for reactive state management
	let state = $state(conversationOrchestrator.getState());

	// Polling function to keep state in sync
	const pollForUpdates = () => {
		const newState = conversationOrchestrator.getState();
		if (JSON.stringify(newState) !== JSON.stringify(state)) {
			state = newState;
		}
	};

	// Set up periodic polling (we'll improve this later with proper event system)
	const interval = setInterval(pollForUpdates, 100);

	// Cleanup function
	const cleanup = () => {
		clearInterval(interval);
		conversationOrchestrator.cleanup();
	};

	// Cleanup on page unload
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeunload', cleanup);
	}

	return {
		// Reactive state
		get state() {
			return state;
		},

		// Derived state
		get isRecording() {
			return state.status === 'recording';
		},
		get isProcessing() {
			return state.status === 'processing';
		},
		get isSpeaking() {
			return state.status === 'speaking';
		},
		get canRecord() {
			return state.status === 'idle';
		},
		get hasError() {
			return !!state.error;
		},
		get messageCount() {
			return Math.floor(state.messages.length / 2);
		},

		// Actions
		async startConversation(language?: string, voice?: string) {
			const newState = await conversationOrchestrator.startConversation(language, voice);
			state = newState;
			return newState;
		},

		async startRecording() {
			const newState = await conversationOrchestrator.startRecording();
			state = newState;
		},

		async stopRecording() {
			const newState = await conversationOrchestrator.stopRecording();
			state = newState;
			// State will be updated automatically by polling
		},

		async endConversation() {
			const newState = await conversationOrchestrator.endConversation();
			state = newState;
		},

		async toggleRecording() {
			if (state.status === 'idle') {
				if (!state.sessionId) {
					await this.startConversation();
				}
				await this.startRecording();
			} else if (state.status === 'recording') {
				await this.stopRecording();
			}
		},

		// Utility
		cleanup
	};
}
