// src/lib/stores/conversation.store.svelte.ts
// Simplified conversation store using functional realtime service
// ! Need to make sure that onboarding update in the beginning of the conversation is handled
// ! Need to make sure that the conversation is properly handled
// ! Need to make sure that the user preferences are properly handled
// ! Need to ensure that when the conversation is ended, the onboarding for userPreferences runs

import { SvelteDate } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { realtimeService } from '$lib/services';
import { audioStore } from '$lib/stores/audio.store.svelte';
import {
	generateOnboardingInstructions,
	generateSessionInstructions
} from '$lib/services/instructions.service';
import * as messageService from '$lib/services/message.service';
import * as sessionManagerService from '$lib/services/session-manager.service';
import * as eventHandlerService from '$lib/services/event-handler.service';
import * as transcriptionStateService from '$lib/services/transcription-state.service';
import * as onboardingManagerService from '$lib/services/onboarding-manager.service';
import type { Message, Language, UserPreferences } from '$lib/server/db/types';
import type { Speaker } from '$lib/types';
import type { Voice } from '$lib/types/openai.realtime.types';
import { DEFAULT_VOICE, isValidVoice } from '$lib/types/openai.realtime.types';
import {
	createConversationTimerStore,
	type ConversationTimerStore
} from './conversation-timer.store.svelte';
import { userPreferencesStore } from './userPreferences.store.svelte';

export const conversationStatus = $state<
	'idle' | 'connecting' | 'connected' | 'streaming' | 'analyzing' | 'analyzed' | 'error'
>('idle');

export class ConversationStore {
	// Reactive state
	status = $state<typeof conversationStatus>('idle');
	messages = $state<Message[]>([]);
	userId = $state<string | null>(null);
	sessionId = $state<string>('');
	language = $state<Language | null>(null);
	voice: Voice = DEFAULT_VOICE;
	error = $state<string | null>(null);
	audioLevel = $state.raw<number>(0);
	availableDevices = $state<MediaDeviceInfo[]>([]);
	selectedDeviceId = $state<string>('default');
	speechDetected = $state<boolean>(false);
	userSpeechStartTime = $state<number | null>(null);
	// Transcription state
	transcriptionMode = $state<boolean>(false);
	currentTranscript = $state<string>('');
	isTranscribing = $state<boolean>(false);

	// Analysis state
	isAnalyzing = $derived(this.status === 'analyzing');
	hasAnalysisResults = $derived(this.status === 'analyzed');
	isGuestUser = $derived(userPreferencesStore.isGuest());

	// Private connection state
	private realtimeConnection: realtimeService.RealtimeConnection | null = null;
	private audioStream: MediaStream | null = null;
	private timerStore: ConversationTimerStore;
	private currentOptions: Partial<UserPreferences> | null = null;

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
		this.initializeUserPreferences();
	}

	private async initializeUserPreferences(): Promise<void> {
		await userPreferencesStore.initialize();

		// Set initial transcription mode based on user preferences
		this.transcriptionMode = userPreferencesStore.getTranscriptionMode();

		// Set voice from preferences
		const preferredVoice = userPreferencesStore.getPreference('preferredVoice');
		if (preferredVoice && isValidVoice(preferredVoice)) {
			this.voice = preferredVoice;
		}
	}

	private initializeServices(): void {
		// Initialize audio service
		audioStore.initialize();
	}

	// === PUBLIC ACTIONS ===

	/**
	 * Start a conversation
	 * @param language - The language to use
	 * @param speaker - The speaker to use
	 * @param options - Optional user preferences to override defaults
	 * @returns void
	 */
	startConversation = async (
		language?: Language,
		speaker?: Speaker | string,
		options?: Partial<UserPreferences>
	) => {
		if (!browser) {
			console.warn('Cannot start conversation on server');
			return;
		}

		if (this.status !== 'idle') {
			console.warn('Conversation already in progress');
			return;
		}

		// Store options for later use and merge with existing preferences if provided
		this.currentOptions = options || null;

		// Update user preferences with provided options
		if (options) {
			await userPreferencesStore.updatePreferences(options);
		}

		// Set up conversation parameters from user preferences
		this.language = language || null;
		this.transcriptionMode = userPreferencesStore.getTranscriptionMode();
		this.status = 'connecting';
		this.error = null;
		this.clearTranscriptionState();

		// Extract voice from speaker or use user preference
		if (speaker && typeof speaker === 'object' && 'openAIId' in speaker) {
			const speakerVoice =
				speaker.openAIId || userPreferencesStore.getPreference('preferredVoice') || DEFAULT_VOICE;
			this.voice = isValidVoice(speakerVoice) ? speakerVoice : DEFAULT_VOICE;
		} else {
			const preferredVoice = userPreferencesStore.getPreference('preferredVoice') || DEFAULT_VOICE;
			this.voice = isValidVoice(preferredVoice) ? preferredVoice : DEFAULT_VOICE;
		}

		// Update user preferences if language changed
		if (language && language.code !== userPreferencesStore.getPreference('targetLanguageId')) {
			await userPreferencesStore.setLanguagePreferences(language.code);
		}

		try {
			// 1. Test audio constraints using the audio store
			const constraintTest = await audioStore.getCore()?.testConstraints();
			if (!constraintTest?.success) {
				console.warn('Audio constraint test failed, proceeding with defaults');
			}

			// 2. Start audio recording using the audio store
			await audioStore.startRecording(audioStore.selectedDeviceId);

			// Get the stream from the audio store
			this.audioStream = audioStore.getCurrentStream();
			if (this.audioStream === null) {
				console.warn('No audio stream available');
				return;
			}

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
				if (this.status === 'streaming' || this.status === 'connected') {
					// Switch device while recording
					await audioStore.switchToDevice(deviceId);

					// Update our stream reference
					this.audioStream = audioStore.getCurrentStream();

					console.log('Audio device switched successfully');
				} else {
					// Just update the selected device for later use
					audioStore.selectedDeviceId = deviceId;
				}
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
		if (!this.realtimeConnection || this.status === 'idle' || !this.language) return;

		const currentConfig = sessionManagerService.createSessionUpdateConfig(
			updates,
			this.language,
			this.voice
		);

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
		return sessionManagerService.fetchSessionFromBackend(crypto.randomUUID(), this.voice);
	}

	private setupRealtimeEventHandlers(): void {
		if (!this.realtimeConnection) return;

		const { dataChannel, peerConnection } = this.realtimeConnection;

		// Set up data channel message handler
		dataChannel.onmessage = (event) => {
			eventHandlerService.handleDataChannelMessage(event, {
				onUserSpeechStarted: () => {
					console.log('🎤 User speech detected');
					this.handleUserSpeechStarted();
				},
				onUserSpeechStopped: () => {
					console.log('🎤 User speech ended');
					this.handleUserSpeechStopped();
				},
				onSessionCreated: () => {
					console.log('Session created, sending initial setup...');
					this.sendInitialSetup(); // Combined function
					this.status = 'connected';

					// Create preferences provider for checking onboarding
					const preferencesProvider = {
						isGuest: () => userPreferencesStore.isGuest(),
						getPreference: <K extends keyof import('$lib/server/db/types').UserPreferences>(
							key: K
						) => userPreferencesStore.getPreference(key),
						updatePreferences: (updates: Partial<import('$lib/server/db/types').UserPreferences>) =>
							userPreferencesStore.updatePreferences(updates)
					};

					// Start timer with onboarding callback if needed
					if (onboardingManagerService.shouldTriggerOnboarding(preferencesProvider)) {
						this.timerStore.start(this.triggerOnboardingAnalysis);
					} else {
						this.timerStore.start();
					}

					// Set status to streaming after a brief delay
					setTimeout(() => {
						this.status = 'streaming';
					}, 500);
				},
				onOtherEvent: (serverEvent) => {
					// Process the event using realtime service
					const processed = realtimeService.processServerEvent(serverEvent);
					this.handleProcessedEvent(processed);
				},
				onError: (error) => {
					this.error = error;
				}
			});
		};

		// Set up data channel error handlers
		eventHandlerService.setupDataChannelErrorHandlers(dataChannel, {
			onError: (error) => {
				this.error = error;
				this.status = 'error';
			},
			onClose: () => {
				this.status = 'idle';
				this.timerStore.stop();
			}
		});

		// Set up peer connection handlers
		eventHandlerService.setupPeerConnectionHandlers(peerConnection, {
			onConnectionStateChange: () => {
				// Handle successful connection states if needed
			},
			onError: (error) => {
				this.status = 'error';
				this.error = error;
				this.timerStore.stop();
			}
		});
	}
	private handleUserSpeechStarted(): void {
		this.speechDetected = true;
		this.userSpeechStartTime = Date.now();
		this.messages = [...this.messages, messageService.createUserPlaceholder(this.sessionId)];
		console.log('Created user speech placeholder');
	}

	private handleUserSpeechStopped(): void {
		this.speechDetected = false;
		this.messages = messageService.updatePlaceholderToTranscribing(this.messages);
		console.log('Updated placeholder to transcribing state');
	}

	private updateUserPlaceholderWithPartial(partialText: string): void {
		this.messages = messageService.updatePlaceholderWithPartial(this.messages, partialText);
	}

	// Enhanced addMessageToState to handle ordering
	private addMessageToState(data: realtimeService.MessageEventData): void {
		// For assistant messages, check if there's a pending user placeholder
		if (data.role === 'assistant') {
			if (messageService.hasPendingUserPlaceholder(this.messages)) {
				// Don't add assistant message yet if user transcription is pending
				console.log('Delaying assistant message due to pending user transcription');
				setTimeout(() => this.addMessageToState(data), 1000); // Retry in 1 second
				return;
			}

			// Check for existing streaming message
			if (messageService.hasStreamingMessage(this.messages)) {
				console.log('Skipping duplicate assistant message, streaming in progress');
				return;
			}
		}

		// Prevent duplicate messages
		if (!messageService.isDuplicateMessage(this.messages, data)) {
			const message = messageService.createMessageFromEventData(data, this.sessionId);
			this.messages = [...this.messages, message];
			console.log(`Added ${data.role} message:`, data.content.substring(0, 50));
		}
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

	private handleTranscriptionUpdate(data: realtimeService.TranscriptionEventData): void {
		console.log('Handling transcription update:', data.type, data.isFinal, data.text);

		// Get current transcription state
		const currentState: transcriptionStateService.TranscriptionState = {
			currentTranscript: this.currentTranscript,
			isTranscribing: this.isTranscribing
		};

		// Process the transcription update using the service
		const processResult = transcriptionStateService.processTranscriptionUpdate(data, currentState);

		// Update local state
		this.currentTranscript = processResult.newState.currentTranscript;
		this.isTranscribing = processResult.newState.isTranscribing;

		// Execute required actions based on service response
		if (processResult.shouldFinalizePlaceholder) {
			this.replaceUserPlaceholderWithFinal(data.text);
			console.log('Final user transcript:', data.text);
		}

		if (processResult.shouldUpdatePlaceholder) {
			this.updateUserPlaceholderWithPartial(data.text);
			console.log('Streaming user transcript:', data.text);
		}

		if (processResult.shouldFinalizeStreaming) {
			this.finalizeStreamingMessage(data.text);
			console.log('Final assistant transcript:', data.text);
		}

		if (processResult.shouldUpdateStreaming) {
			this.updateStreamingMessage(data.text);
			console.log('Streaming assistant transcript:', data.text);
		}
	}

	private replaceUserPlaceholderWithFinal(finalText: string): void {
		this.messages = messageService.replaceUserPlaceholderWithFinal(
			this.messages,
			finalText,
			this.sessionId
		);
		console.log('Replaced placeholder with final transcript:', finalText.substring(0, 50));
	}

	private updateStreamingMessage(deltaText: string): void {
		this.messages = messageService.updateStreamingMessage(this.messages, deltaText);
		console.log('Updated streaming message with:', deltaText);
	}

	private finalizeStreamingMessage(finalText: string): void {
		this.messages = messageService.finalizeStreamingMessage(this.messages, finalText);
		console.log('Finalized streaming message:', finalText.substring(0, 50));

		// Clear any streaming state
		const newState = transcriptionStateService.clearTranscriptionState();
		this.currentTranscript = newState.currentTranscript;
		this.isTranscribing = newState.isTranscribing;
	}

	private sendInitialSetup(): void {
		if (!this.realtimeConnection || !this.language) return;

		// Get user preferences for instructions
		const userPrefs = userPreferencesStore.getPreferences();

		// Determine if this is a first-time user and get appropriate instructions
		const isFirstTime = onboardingManagerService.shouldTriggerOnboarding({
			isGuest: () => userPreferencesStore.isGuest(),
			getPreference: <K extends keyof UserPreferences>(key: K) =>
				userPreferencesStore.getPreference(key),
			updatePreferences: (updates: Partial<UserPreferences>) =>
				userPreferencesStore.updatePreferences(updates)
		});

		// Generate session instructions with appropriate greeting prompt
		const sessionInstructions = generateSessionInstructions(this.language, userPrefs);
		const greetingPrompt = generateOnboardingInstructions(
			this.isGuestUser,
			'en', // source language
			this.language
		);

		// Combine session instructions with greeting prompt
		const combinedInstructions = `${sessionInstructions}\n\nInitial greeting: ${greetingPrompt}`;

		const sessionConfig = sessionManagerService.createSessionConfig(
			this.language,
			this.voice,
			combinedInstructions
		);

		console.log('Sending session configuration with greeting:', {
			language: this.language.name,
			voice: this.voice,
			model: sessionConfig.model,
			transcription: sessionConfig.input_audio_transcription,
			turnDetection: sessionConfig.turn_detection,
			isFirstTime,
			isGuest: this.isGuestUser
		});

		// Send the combined configuration
		const configEvent = realtimeService.createSessionUpdate(sessionConfig);
		realtimeService.sendEvent(this.realtimeConnection, configEvent);

		// Request the AI to start with the greeting
		const responseEvent = realtimeService.createResponse(['text', 'audio']);
		realtimeService.sendEvent(this.realtimeConnection, responseEvent);
	}

	private clearTranscriptionState(): void {
		const newState = transcriptionStateService.clearTranscriptionState();
		this.currentTranscript = newState.currentTranscript;
		this.isTranscribing = newState.isTranscribing;
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
		if (audioStore.isRecording) {
			audioStore.stopRecording();
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
		if (this.status === 'error') this.status = 'idle';
	};

	completeAnalyzedSession = () => {
		this.status = 'idle';
		this.messages = [];
		this.currentTranscript = '';
		this.isTranscribing = false;
		userPreferencesStore.clearAnalysisResults();
	};

	dismissAnalysisResults = () => {
		this.status = 'idle';
		this.messages = [];
		this.currentTranscript = '';
		this.isTranscribing = false;
		userPreferencesStore.clearAnalysisResults();
	};

	reset = () => {
		if (browser) {
			this.cleanup();
		}
		this.resetState();
		this.timerStore.reset();
		this.currentOptions = null;
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
		if (audioStore.hasActiveStream()) {
			audioStore.triggerLevelUpdate();
			console.log('Audio level test triggered');
		} else {
			console.log('No active audio stream to test');
		}
	};

	// Get reactive audio level for components
	get reactiveAudioLevel() {
		return this.audioLevel;
	}

	private triggerOnboardingAnalysis = async (): Promise<void> => {
		if (!this.language) {
			console.warn('Cannot trigger onboarding analysis: missing language');
			return;
		}

		// Start analysis state
		userPreferencesStore.constructAnalysis();

		// Create preferences provider interface
		const preferencesProvider = {
			isGuest: () => userPreferencesStore.isGuest(),
			getPreference: <K extends keyof import('$lib/server/db/types').UserPreferences>(key: K) =>
				userPreferencesStore.getPreference(key),
			updatePreferences: (updates: Partial<import('$lib/server/db/types').UserPreferences>) =>
				userPreferencesStore.updatePreferences(updates)
		};

		const result = await onboardingManagerService.executeOnboardingAnalysis(
			this.language,
			this.messages,
			this.sessionId,
			preferencesProvider
		);

		if (result.success) {
			// Get the analysis results from the updated preferences
			const currentPrefs = userPreferencesStore.getPreferences();
			userPreferencesStore.setAnalysisResults(currentPrefs);
		} else {
			console.error('Onboarding analysis failed:', result.error);
			userPreferencesStore.clearAnalysisResults();
		}
	};
}

// Export singleton instance
export const conversationStore = new ConversationStore();
