// 🎭 Unified Top-Level Orchestrator (Svelte 5 Runes)
// Coordinates Conversation + Audio + Realtime features through events

import { EventBusFactory, type EventBus } from './shared/events/eventBus';
import { ConversationOrchestrator } from './features/conversation/conversation-orchestrator.svelte';
import { audioService } from './features/audio';
import { realtimeService } from './features/realtime';

export class UnifiedOrchestrator {
	// 🎯 Svelte 5 runes for reactive state management
	private eventBus = $state<EventBus>(EventBusFactory.create('memory'));

	// 🎯 Feature services (pure, isolated)
	private conversationFeature = $state<ConversationOrchestrator>(
		new ConversationOrchestrator(this.eventBus)
	);
	private audioFeature = $state(audioService);
	private realtimeFeature = $state(realtimeService);

	// 🎯 Unified state (derived from features)
	private unifiedState = $state({
		status: 'idle' as 'idle' | 'connecting' | 'active' | 'error',
		conversationId: '',
		language: 'en',
		voice: 'alloy',
		error: null as string | null,
		isRecording: false,
		isStreaming: false,
		messageCount: 0
	});

	constructor() {
		this.setupFeatureCoordination();
	}

	// 🎯 Setup cross-feature event handling
	private setupFeatureCoordination(): void {
		// 🎤 Audio chunk → Realtime streaming
		this.audioFeature.on('audio.chunk', (chunk: ArrayBuffer) => {
			console.log('🎵 Unified: Audio chunk received, sending to realtime');
			if (this.unifiedState.isStreaming) {
				this.realtimeFeature.sendAudioChunk(chunk).catch((error) => {
					console.error('❌ Unified: Failed to send audio chunk:', error);
					this.unifiedState.error = `Failed to send audio: ${error}`;
				});
			}
		});

		// 📝 Realtime transcript → Conversation
		this.realtimeFeature.on('transcript.received', (transcript: string) => {
			console.log('📝 Unified: Transcript received, adding to conversation');
			this.conversationFeature.addMessage(transcript, 'user');
			this.unifiedState.messageCount++;
		});

		// 🤖 Realtime response → Conversation + Audio playback
		this.realtimeFeature.on('response.received', (response: any) => {
			console.log('🤖 Unified: AI response received, processing');
			this.conversationFeature.addMessage(response.text, 'assistant');
			this.unifiedState.messageCount++;

			// Play audio response if available
			if (response.audio) {
				this.audioFeature.playAudio(response.audio).catch((error) => {
					console.error('❌ Unified: Failed to play audio response:', error);
				});
			}
		});

		// 🔌 Connection status updates
		this.realtimeFeature.on('connection.status', (status: string) => {
			console.log('🔌 Unified: Realtime connection status:', status);
			if (status === 'connected') {
				this.unifiedState.isStreaming = true;
			} else if (status === 'disconnected') {
				this.unifiedState.isStreaming = false;
			}
		});

		// 🎤 Recording status updates
		this.audioFeature.on('recording.status', (status: string) => {
			console.log('🎤 Unified: Audio recording status:', status);
			this.unifiedState.isRecording = status === 'recording';
		});
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
