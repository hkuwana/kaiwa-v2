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
import { scenarioStore } from '$lib/stores/scenario.store.svelte';
import { getInstructions } from '$lib/services/instructions.service';
import * as messageService from '$lib/services/message.service';
import * as sessionManagerService from '$lib/services/session-manager.service';
import * as eventHandlerService from '$lib/services/event-handler.service';
import * as transcriptionStateService from '$lib/services/transcription-state.service';
import * as onboardingManagerService from '$lib/services/onboarding-manager.service';
import type { Message, Language, UserPreferences, UserTier } from '$lib/server/db/types';
import type { Speaker } from '$lib/types';
import type { Voice } from '$lib/types/openai.realtime.types';
import { DEFAULT_VOICE, isValidVoice } from '$lib/types/openai.realtime.types';
import {
	createConversationTimerStore,
	type ConversationTimerStore
} from './conversation-timer.store.svelte';
import { userPreferencesStore } from './userPreferences.store.svelte';
import type { ConversationStatus } from '$lib/services/conversation.service';
import { userManager } from './user.store.svelte';

export class ConversationStore {
	// Reactive state
	status = $state<ConversationStatus>('idle');
	messages = $state<Message[]>([]);
	messagesForAnalysis = $state<Message[]>([]);
	userId = $state<string | null>(null);
	sessionId = $state<string>('');
	language = $state<Language | null>(null);
	voice: Voice = DEFAULT_VOICE;
	speaker = $state<Speaker | undefined>(undefined);
	error = $state<string | null>(null);

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

	// Timer state
	private isGracefullyEnding = $state<boolean>(false);
	private analysisTriggered = $state<boolean>(false);
	private waitingForAudioCompletion = $state<boolean>(false);
	private waitingForAIResponse = $state<boolean>(false);

	// Private connection state
	private realtimeConnection: realtimeService.RealtimeConnection | null = null;
	private audioStream: MediaStream | null = null;
	private timer: ConversationTimerStore = $state(createConversationTimerStore('free'));
	private currentOptions: Partial<UserPreferences> | null = null;

	constructor(userTier: UserTier = 'free') {
		// Only initialize services in browser
		if (!browser) {
			console.log('ConversationStore: SSR mode, skipping service initialization');
			// Create a dummy timer store for SSR

			return;
		}

		// Browser initialization
		this.timer = createConversationTimerStore(userTier);
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
		this.speaker = typeof speaker === 'object' ? speaker : undefined;
		this.transcriptionMode = userPreferencesStore.getTranscriptionMode();
		this.status = 'connecting';
		this.error = null;
		this.clearTranscriptionState();

		// Extract voice from speaker or use user preference
		if (speaker && typeof speaker === 'object') {
			const speakerVoice =
				speaker.openaiVoiceId ||
				userPreferencesStore.getPreference('preferredVoice') ||
				DEFAULT_VOICE;
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
			console.log('🎵 ConversationStore: Starting audio recording...');
			await audioStore.startRecording(audioStore.selectedDeviceId);

			// Get the stream from the audio store
			this.audioStream = audioStore.getCurrentStream();
			console.log(
				'🎵 ConversationStore: After starting recording - stream exists:',
				!!this.audioStream,
				'audioStore.isRecording:',
				audioStore.isRecording
			);
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

	pauseTimer(): void {
		// Pause when user switches tabs, etc.
		this.timer.pause();
	}

	resumeTimer(): void {
		// Resume when user returns
		this.timer.resume();
	}

	resetTimer(): void {
		// Reset timer completely
		this.timer.reset();
	}

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

			messageCount: this.messages.length,
			language: this.language,
			voice: this.voice,
			sessionId: this.sessionId,

			transcriptionMode: this.transcriptionMode,
			isTranscribing: this.isTranscribing,
			connectionStatus: this.getConnectionStatus(),
			hasConnection: !!this.realtimeConnection,
			hasAudioStream: !!this.audioStream,
			timerState: this.timer.state
		};
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
					console.log('🎵 ConversationStore: Session created, sending initial setup...');
					this.sendInitialSetup(); // Combined function
					this.status = 'connected';
					console.log('🎵 ConversationStore: Status changed to "connected"');

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
						this.timer.start(() => {
							console.log('Conversation timer expired!');
							// Handle timer expiration (e.g., end conversation, show modal, etc.)
							this.handleTimerExpiration();
						});
					} else {
						this.timer.start();
					}

					// Set status to streaming after a brief delay
					setTimeout(() => {
						this.status = 'streaming';
						console.log('🎵 ConversationStore: Status changed to "streaming"');
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
				this.timer.stop();
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
				this.timer.stop();
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

		// Generate complete instructions based on user type

		const combinedInstructions = getInstructions('initial', {
			user: userManager.user,
			language: this.language,
			preferences: userPrefs,
			scenario: scenarioStore.getSelectedScenario(),
			speaker: this.speaker
		});

		const sessionConfig = sessionManagerService.createSessionConfig(
			this.language,
			this.voice,
			combinedInstructions
		);

		console.log('Sending session configuration with complete instructions:', {
			language: this.language.name,
			voice: this.voice,
			model: sessionConfig.model,
			transcription: sessionConfig.input_audio_transcription,
			turnDetection: sessionConfig.turn_detection,
			isFirstTime,
			isGuest: this.isGuestUser,
			instructionType: isFirstTime ? 'complete-onboarding' : 'complete-session'
		});

		// Send the combined configuration
		const configEvent = realtimeService.createSessionUpdate(sessionConfig);
		realtimeService.sendEvent(this.realtimeConnection, configEvent);

		// Request the AI to start with the appropriate instructions
		const responseEvent = realtimeService.createResponse(['text', 'audio']);
		realtimeService.sendEvent(this.realtimeConnection, responseEvent);
	}

	private clearTranscriptionState(): void {
		const newState = transcriptionStateService.clearTranscriptionState();
		this.currentTranscript = newState.currentTranscript;
		this.isTranscribing = newState.isTranscribing;
	}

	private cleanup(): void {
		console.log('🧹 ConversationStore: Cleaning up conversation resources...');
		console.log(
			'🧹 ConversationStore: Before cleanup - audioStore.isRecording:',
			audioStore.isRecording,
			'audioStream exists:',
			!!this.audioStream
		);

		// Close realtime connection
		if (this.realtimeConnection) {
			console.log('🧹 ConversationStore: Closing realtime connection');
			realtimeService.closeConnection(this.realtimeConnection);
			this.realtimeConnection = null;
		}

		// Stop audio stream
		if (this.audioStream) {
			console.log('🧹 ConversationStore: Stopping audio stream');
			realtimeService.stopAudioStream(this.audioStream);
			this.audioStream = null;
		}

		this.timer.cleanup();

		// Note: Don't stop audio recording here - it should continue for UI audio level display
		// The audio store will handle its own cleanup when needed
		console.log(
			'🧹 ConversationStore: After cleanup - audioStore.isRecording:',
			audioStore.isRecording
		);
	}

	// New method: Clean up only audio and realtime while preserving conversation data
	private cleanupAudioAndRealtime(): void {
		console.log('🧹 ConversationStore: Cleaning up audio and realtime only...');
		console.log(
			'🧹 ConversationStore: Before cleanup - audioStore.isRecording:',
			audioStore.isRecording,
			'audioStream exists:',
			!!this.audioStream
		);

		// Close realtime connection
		if (this.realtimeConnection) {
			console.log('🧹 ConversationStore: Closing realtime connection');
			realtimeService.closeConnection(this.realtimeConnection);
			this.realtimeConnection = null;
		}

		// Stop audio stream
		if (this.audioStream) {
			console.log('🧹 ConversationStore: Stopping audio stream');
			realtimeService.stopAudioStream(this.audioStream);
			this.audioStream = null;
		}

		// Pause timer but don't destroy it
		this.timer.pause();

		// Note: Don't stop audio recording here - it should continue for UI audio level display
		// The audio store will handle its own cleanup when needed
		console.log(
			'🧹 ConversationStore: After cleanup - audioStore.isRecording:',
			audioStore.isRecording
		);
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
		this.timer.reset();
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
			this.timer.cleanup();
		} catch (error) {
			console.warn('Error during timer cleanup:', error);
		}
		this.resetState();
		console.log('Force cleanup complete');
	};

	private handleTimerExpiration(): void {
		console.log('Timer expired - initiating graceful shutdown');

		// Set graceful ending state
		this.isGracefullyEnding = true;

		// Check if we need to wait for audio/AI completion
		const needsGracefulWait = this.shouldWaitBeforeEnding();

		if (needsGracefulWait) {
			console.log('Waiting for audio/AI completion before ending conversation');
			this.initiateGracefulShutdown();
		} else {
			// Can end immediately
			this.proceedWithAnalysisAndEnd();
		}
	}

	private shouldWaitBeforeEnding(): boolean {
		// Check if user is currently speaking
		const userIsSpeaking = this.speechDetected || this.isTranscribing;

		// Check if AI is currently responding (has streaming message)
		const aiIsResponding = messageService.hasStreamingMessage(this.messages);

		// Check if audio is actively playing
		const audioIsPlaying =
			(this.realtimeConnection?.audioElement && !this.realtimeConnection.audioElement.paused) ??
			false;

		console.log('Graceful shutdown check:', {
			userIsSpeaking,
			aiIsResponding,
			audioIsPlaying,
			speechDetected: this.speechDetected,
			isTranscribing: this.isTranscribing
		});

		return userIsSpeaking || aiIsResponding || audioIsPlaying;
	}

	private initiateGracefulShutdown(): void {
		// Set waiting flags based on what we're waiting for
		this.waitingForAudioCompletion =
			(this.realtimeConnection?.audioElement && !this.realtimeConnection.audioElement.paused) ||
			false;
		this.waitingForAIResponse = messageService.hasStreamingMessage(this.messages);

		// Set up listeners for completion events
		this.setupGracefulShutdownListeners();

		// Set a maximum wait time (e.g., 10 seconds)
		setTimeout(() => {
			if (this.isGracefullyEnding) {
				console.log('Graceful shutdown timeout - proceeding with analysis');
				this.proceedWithAnalysisAndEnd();
			}
		}, 10000); // 10 second timeout
	}

	private setupGracefulShutdownListeners(): void {
		// Listen for audio completion
		if (this.realtimeConnection?.audioElement) {
			const audioElement = this.realtimeConnection.audioElement;

			const onAudioEnd = () => {
				console.log('Audio playback completed');
				this.waitingForAudioCompletion = false;
				audioElement.removeEventListener('ended', onAudioEnd);
				audioElement.removeEventListener('pause', onAudioEnd);
				this.checkIfReadyToEnd();
			};

			audioElement.addEventListener('ended', onAudioEnd);
			audioElement.addEventListener('pause', onAudioEnd);
		}

		// The AI response completion will be handled in your existing message handling
		// We'll check for completion in the existing handleProcessedEvent method
	}

	// Modify your existing handleProcessedEvent to check for graceful shutdown
	private handleProcessedEvent(processed: realtimeService.ProcessedEventResult): void {
		switch (processed.type) {
			case 'message':
				this.addMessageToState(processed.data);

				// If we're gracefully ending and this completes the AI response
				if (this.isGracefullyEnding && processed.data.role === 'assistant') {
					this.waitingForAIResponse = false;
					this.checkIfReadyToEnd();
				}
				break;

			case 'transcription':
				this.handleTranscriptionUpdate(processed.data);

				// If we're gracefully ending and user transcription is complete
				if (
					this.isGracefullyEnding &&
					processed.data.type === 'user_transcript' &&
					processed.data.isFinal
				) {
					this.checkIfReadyToEnd();
				}
				break;

			case 'connection_state':
				console.log('Connection state update:', processed.data.state);
				break;

			case 'ignore':
				// Do nothing for ignored events
				break;
		}
	}

	private checkIfReadyToEnd(): void {
		if (!this.isGracefullyEnding) return;

		const stillWaiting =
			this.waitingForAudioCompletion ||
			this.waitingForAIResponse ||
			this.speechDetected ||
			this.isTranscribing ||
			messageService.hasStreamingMessage(this.messages);

		console.log('Checking if ready to end:', {
			stillWaiting,
			waitingForAudioCompletion: this.waitingForAudioCompletion,
			waitingForAIResponse: this.waitingForAIResponse,
			speechDetected: this.speechDetected,
			isTranscribing: this.isTranscribing,
			hasStreamingMessage: messageService.hasStreamingMessage(this.messages)
		});

		if (!stillWaiting) {
			console.log('All conditions met - proceeding with analysis and end');
			this.proceedWithAnalysisAndEnd();
		}
	}

	private async proceedWithAnalysisAndEnd(): Promise<void> {
		if (this.analysisTriggered) {
			console.log('Analysis already triggered, skipping');
			return;
		}

		this.analysisTriggered = true;

		try {
			console.log('Starting conversation analysis...');

			// Trigger analysis if we have messages and language
			if (this.messages.length > 0 && this.language) {
				this.status = 'analyzing';
				await this.triggerOnboardingAnalysis();
				this.status = 'analyzed';

				console.log('Analysis completed successfully');
			} else {
				console.log('Skipping analysis - no messages or language');
				// End conversation normally without analysis
				this.endConversation();
			}
		} catch (error) {
			console.error('Error during analysis:', error);
			// Even if analysis fails, we should still end the conversation
			this.endConversation();
		}
	}

	// Modify your existing triggerOnboardingAnalysis method to be more robust
	public async triggerOnboardingAnalysis(messagesToAnalyze?: Message[]): Promise<void> {
		if (!this.language) {
			console.warn('Cannot trigger onboarding analysis: missing language');
			return;
		}

		// Use provided messages or fall back to current messages
		const messages = messagesToAnalyze || this.messages;

		// Filter out placeholder/incomplete messages for analysis
		const completeMessages = messages.filter(
			(message) =>
				message.content &&
				message.content.trim().length > 0 &&
				!message.content.includes('[Speaking...]') &&
				!message.content.includes('[Transcribing...]')
		);

		if (completeMessages.length === 0) {
			console.log('No complete messages for analysis');
			return;
		}

		console.log(`Analyzing ${completeMessages.length} complete messages`);

		// Start analysis state
		userPreferencesStore.constructAnalysis();

		// Create preferences provider interface
		const preferencesProvider = {
			isGuest: () => userPreferencesStore.isGuest(),
			getPreference: <K extends keyof UserPreferences>(key: K) =>
				userPreferencesStore.getPreference(key),
			updatePreferences: (updates: Partial<UserPreferences>) =>
				userPreferencesStore.updatePreferences(updates)
		};

		const result = await onboardingManagerService.executeOnboardingAnalysis(
			this.language,
			completeMessages, // Use filtered messages
			this.sessionId,
			preferencesProvider
		);

		if (result.success) {
			// Get the analysis results from the updated preferences
			const currentPrefs = userPreferencesStore.getPreferences();
			userPreferencesStore.setAnalysisResults(currentPrefs);
			console.log('Analysis results saved to user preferences');
		} else {
			console.error('Onboarding analysis failed:', result.error);
			userPreferencesStore.clearAnalysisResults();
			throw new Error(`Analysis failed: ${result.error}`);
		}
	}

	get timerState(): ConversationTimerStore['state'] {
		return this.timer.state;
	}

	get analysisMessages(): Message[] {
		return this.messagesForAnalysis;
	}

	// Modify your existing endConversation method to handle graceful shutdown
	endConversation = () => {
		if (!browser) return;

		console.log('Ending conversation...', {
			isGracefullyEnding: this.isGracefullyEnding,
			analysisTriggered: this.analysisTriggered,
			status: this.status,
			stack: new Error().stack
		});

		// If we're not already gracefully ending, set the flag
		if (!this.isGracefullyEnding) {
			this.isGracefullyEnding = true;
		}

		// Stop timer
		this.timer.stop();

		// Clean up connections but preserve messages for analysis
		this.cleanup();

		// Trigger analysis if we have messages and haven't already analyzed
		if (this.messages.length > 0 && this.language && !this.analysisTriggered) {
			console.log('Manually ending conversation - triggering analysis');
			console.log('Messages count:', this.messages.length);
			console.log('Language:', this.language);
			console.log('Analysis triggered:', this.analysisTriggered);

			// Store messages for analysis display before clearing them
			this.messagesForAnalysis = [...this.messages];

			this.status = 'analyzing';
			this.analysisTriggered = true;

			// Store messages for analysis before they might get cleared
			const messagesForAnalysis = [...this.messages];

			this.triggerOnboardingAnalysis(messagesForAnalysis)
				.then(() => {
					this.status = 'analyzed';
					console.log('Analysis completed after manual end');
				})
				.catch((error) => {
					console.error('Error during analysis after manual end:', error);
					this.status = 'idle';
				});
		} else {
			console.log('No analysis needed - resetting state');
			console.log('Messages count:', this.messages.length);
			console.log('Language:', this.language);
			console.log('Analysis triggered:', this.analysisTriggered);
			// Reset state if no analysis needed
			this.resetState();
		}

		console.log('Conversation ended');
	};

	// Add getter for graceful ending state for UI
	get gracefullyEnding(): boolean {
		return this.isGracefullyEnding;
	}

	// Add method to force end if needed
	forceEndConversation = () => {
		console.log('Force ending conversation...');
		this.isGracefullyEnding = false;
		this.analysisTriggered = false;
		this.waitingForAudioCompletion = false;
		this.waitingForAIResponse = false;
		this.endConversation();
	};

	// Add method to start new conversation from reviewable state
	startNewConversationFromReview = () => {
		if (!browser) return;

		console.log('Starting new conversation from review state...');

		// Clear messages and reset state
		this.resetState();

		// Start fresh conversation
		if (this.language) {
			this.startConversation(this.language);
		}
	};

	// Add method to completely destroy conversation (for page changes, etc.)
	destroyConversation = () => {
		if (!browser) return;

		console.log('Destroying conversation completely...');

		// Stop timer completely
		this.timer.stop();

		// Clean up all resources
		this.cleanup();

		// Reset all state
		this.resetState();

		console.log('Conversation completely destroyed');
	};

	// Modify resetState to include new flags
	private resetState(): void {
		this.status = 'idle';
		this.messages = [];
		this.messagesForAnalysis = [];
		this.userId = null;
		this.sessionId = '';
		this.speaker = undefined;
		this.error = null;
		this.isGracefullyEnding = false;
		this.analysisTriggered = false;
		this.waitingForAudioCompletion = false;
		this.waitingForAIResponse = false;
		this.clearTranscriptionState();
	}
}

// Export singleton instance
export const conversationStore = new ConversationStore();
