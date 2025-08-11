// 🎭 Conversation Orchestrator (Svelte 5 Runes)
// Coordinates between the kernel and adapters - the imperative shell

import { createConversationKernel, type Effect, type ConversationState } from './kernel/index.js';
import {
	adapters,
	type AudioAdapter,
	type AIAdapter,
	type StorageAdapter
} from './kernel/adapters.js';
import {
	realtimeAdapter as realtimeAdapterInstance,
	type RealtimeAdapter
} from './kernel/realtimeAdapter.js';

class ConversationOrchestrator {
	private kernel = createConversationKernel();
	private currentRecorder: MediaRecorder | null = null;
	private isExecutingEffects = false;

	constructor(
		private audioAdapter: AudioAdapter = adapters.audio,
		private aiAdapter: AIAdapter = adapters.ai,
		private storageAdapter: StorageAdapter = adapters.storage,
		private realtimeAdapter: RealtimeAdapter = realtimeAdapterInstance
	) {
		// Set up realtime event handlers
		this.realtimeAdapter.onMessage((message) => {
			if (message.type === 'response.audio.delta' && message.data instanceof ArrayBuffer) {
				// Handle streaming audio response
				this.kernel.dispatch({ type: 'REALTIME_AUDIO_RECEIVED', audioData: message.data });
			}
		});

		this.realtimeAdapter.onError((error) => {
			this.kernel.error(`Realtime error: ${error.message}`);
		});
	}

	// Get current state
	getState(): ConversationState {
		return this.kernel.getState();
	}

	// Start a new conversation
	async startConversation(
		mode?: 'traditional' | 'realtime',
		language?: string,
		voice?: string
	): Promise<ConversationState> {
		try {
			const state = this.kernel.start(mode, language, voice);
			await this.storageAdapter.save('currentSession', state.sessionId);
			return state;
		} catch (error) {
			return this.kernel.error(`Failed to start conversation: ${error}`);
		}
	}

	// Start recording user input
	async startRecording(): Promise<ConversationState> {
		try {
			// Start the kernel recording state
			const state = this.kernel.startRecording();

			// Start actual audio recording
			this.currentRecorder = await this.audioAdapter.startRecording();

			return state;
		} catch (error) {
			return this.kernel.error(`Failed to start recording: ${error}`);
		}
	}

	// Stop recording and process
	async stopRecording(): Promise<ConversationState> {
		if (!this.currentRecorder) {
			return this.kernel.error('No active recording to stop');
		}

		try {
			// Stop recording and get audio data
			const audioData = await this.audioAdapter.stopRecording(this.currentRecorder);
			this.currentRecorder = null;

			// Update kernel state and get effects
			const { state, effects } = this.kernel.stopRecording(audioData);

			// Execute effects asynchronously
			this.executeEffects(effects);

			return state;
		} catch (error) {
			this.currentRecorder = null;
			return this.kernel.error(`Failed to stop recording: ${error}`);
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
			const currentState = this.kernel.getState();
			if (currentState.messages.length > 0) {
				await this.storageAdapter.save(`conversation_${currentState.sessionId}`, {
					sessionId: currentState.sessionId,
					messages: currentState.messages,
					startTime: currentState.startTime,
					endTime: Date.now(),
					duration: Date.now() - currentState.startTime
				});
			}

			return this.kernel.end();
		} catch (error) {
			return this.kernel.error(`Failed to end conversation: ${error}`);
		}
	}

	// Execute side effects asynchronously
	private async executeEffects(effects: Effect[]): Promise<void> {
		if (this.isExecutingEffects) return;
		this.isExecutingEffects = true;

		try {
			for (const effect of effects) {
				await this.executeEffect(effect);
			}
		} catch (error) {
			this.kernel.error(`Effect execution failed: ${error}`);
		} finally {
			this.isExecutingEffects = false;
		}
	}

	// Execute a single effect
	private async executeEffect(effect: Effect): Promise<void> {
		switch (effect.type) {
			case 'TRANSCRIBE': {
				try {
					const transcript = await this.aiAdapter.transcribe(effect.audio);
					const history = this.kernel.getState().messages.map((msg) => ({
						role: msg.role,
						content: msg.content
					}));

					// Generate AI response
					const response = await this.aiAdapter.complete(transcript, history);

					// Update kernel with response
					const { effects } = this.kernel.receiveResponse(transcript, response);

					// Execute any new effects
					if (effects.length > 0) {
						this.executeEffects(effects);
					}
				} catch (error) {
					this.kernel.error(`Transcription failed: ${error}`);
				}
				break;
			}

			case 'SPEAK': {
				try {
					// Generate and play audio response
					const audioData = await this.aiAdapter.textToSpeech(effect.text);

					if (audioData.byteLength > 0) {
						await this.audioAdapter.play(audioData);
					} else {
						// Fallback: use browser speech synthesis
						const utterance = new SpeechSynthesisUtterance(effect.text);
						speechSynthesis.speak(utterance);
					}

					// Transition back to idle state after speaking
					setTimeout(() => {
						const currentState = this.kernel.getState();
						if (currentState.status === 'speaking') {
							this.kernel.dispatch({ type: 'START_CONVERSATION' }); // Reset to idle
						}
					}, 100);
				} catch (error) {
					console.warn('TTS failed, using fallback:', error);
					// Fallback to browser speech
					const utterance = new SpeechSynthesisUtterance(effect.text);
					speechSynthesis.speak(utterance);
				}
				break;
			}

			case 'CONNECT_REALTIME': {
				try {
					const currentState = this.kernel.getState();
					const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
					const openAIVoice = validVoices.includes(effect.voice as (typeof validVoices)[number])
						? (effect.voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer')
						: 'alloy';
					await this.realtimeAdapter.connect({
						sessionId: effect.sessionId,
						language: effect.language || currentState.language,
						voice: openAIVoice,
						instructions:
							'You are a helpful language tutor. Keep responses conversational and encouraging.'
					});

					// Update kernel state to reflect connection
					this.kernel.dispatch({ type: 'REALTIME_CONNECTED' });
				} catch (error) {
					this.kernel.error(`Realtime connection failed: ${error}`);
				}
				break;
			}

			case 'START_AUDIO_STREAM': {
				try {
					await this.realtimeAdapter.startAudioStream();
					this.kernel.dispatch({ type: 'START_REALTIME_STREAM' });
				} catch (error) {
					this.kernel.error(`Failed to start audio stream: ${error}`);
				}
				break;
			}

			case 'STOP_AUDIO_STREAM': {
				try {
					await this.realtimeAdapter.stopAudioStream();
					this.kernel.dispatch({ type: 'STOP_REALTIME_STREAM' });
				} catch (error) {
					console.warn('Failed to stop audio stream:', error);
				}
				break;
			}

			case 'PLAY_REALTIME_AUDIO': {
				try {
					await this.audioAdapter.play(effect.audioData);
				} catch (error) {
					console.warn('Failed to play realtime audio:', error);
				}
				break;
			}

			case 'SAVE_EXCHANGE': {
				try {
					const currentState = this.kernel.getState();
					await this.storageAdapter.save(`conversation_${currentState.sessionId}`, {
						sessionId: currentState.sessionId,
						messages: effect.messages,
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
			const id = sessionId || this.kernel.getState().sessionId;
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
		async startConversation(mode?: 'traditional' | 'realtime', language?: string, voice?: string) {
			const newState = await conversationOrchestrator.startConversation(mode, language, voice);
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
