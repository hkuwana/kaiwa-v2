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
	generateCustomInstructions,
	generateInitialGreeting
} from '$lib/services/instructions.service';
import type { Message, Language, UserPreferences } from '$lib/server/db/types';
import type { Speaker } from '$lib/types';
import type { ServerEvent, SessionConfig, Voice } from '$lib/types/openai.realtime.types';
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
		if (!this.realtimeConnection || this.status === 'idle') return;

		const currentConfig = {
			model: 'gpt-4o-mini-realtime-preview-2024-12-17',
			voice: this.voice,
			instructions:
				updates.instructions ||
				`You are a helpful language tutor for ${this.language?.name || 'English'}.`,
			inputAudioTranscription: {
				model: 'whisper-1' as const,
				language: this.language?.code || 'en'
			},
			turnDetection: updates.turnDetection || {
				type: 'server_vad' as const,
				threshold: 0.45,
				prefix_padding_ms: 300,
				silence_duration_ms: 600
			}
		};

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
		const response = await fetch('/api/realtime-session', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sessionId: crypto.randomUUID(),
				model: 'gpt-4o-mini-realtime-preview-2024-12-17',
				voice: this.voice
			})
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			let errorMessage = `Session creation failed: ${response.status}`;

			// Extract OpenAI error if available
			if (errorData.details?.response) {
				try {
					const openAIError = JSON.parse(errorData.details.response);
					if (openAIError.error?.message) {
						errorMessage = `OpenAI Error: ${openAIError.error.message}`;
					}
				} catch {
					errorMessage = `OpenAI Error: ${errorData.details.response}`;
				}
			} else if (errorData.error) {
				errorMessage = errorData.error;
			}

			throw new Error(errorMessage);
		}

		return response.json();
	}

	private setupRealtimeEventHandlers(): void {
		if (!this.realtimeConnection) return;

		const { dataChannel, peerConnection } = this.realtimeConnection;

		dataChannel.onmessage = (event) => {
			try {
				const serverEvent: ServerEvent = JSON.parse(event.data);

				// Handle speech detection events
				if (serverEvent.type === 'input_audio_buffer.speech_started') {
					console.log('🎤 User speech detected');
					this.handleUserSpeechStarted();
				} else if (serverEvent.type === 'input_audio_buffer.speech_stopped') {
					console.log('🎤 User speech ended');
					this.handleUserSpeechStopped();
				}

				// Handle session creation
				if (serverEvent.type === 'session.created') {
					console.log('Session created, sending configuration...');
					this.sendInitialConfiguration();
					this.status = 'connected';

					// Start timer with onboarding callback if user is guest or has no previous conversations
					const shouldTriggerOnboarding =
						userPreferencesStore.isGuest() ||
						userPreferencesStore.getPreference('totalConversations') === 0;

					if (shouldTriggerOnboarding) {
						this.timerStore.start(this.triggerOnboardingAnalysis);
					} else {
						this.timerStore.start();
					}

					// Auto-start streaming and send initial greeting
					setTimeout(() => {
						this.status = 'streaming';
						this.sendInitialGreeting(false); // isFirstTime is no longer passed
					}, 500);
					return;
				}

				// Process the event
				const processed = realtimeService.processServerEvent(serverEvent);
				this.handleProcessedEvent(processed);
			} catch (error) {
				console.error('Failed to process server event:', error);
				this.error = 'Failed to process server message';
			}
		};

		dataChannel.onerror = (error) => {
			console.error('Data channel error:', error);
			this.error = 'Data channel error';
			this.status = 'error';
		};

		dataChannel.onclose = () => {
			console.log('Data channel closed');
			this.status = 'idle';
			this.timerStore.stop();
		};

		// Peer connection state monitoring
		peerConnection.onconnectionstatechange = () => {
			const state = peerConnection.connectionState;
			console.log('WebRTC connection state:', state);

			if (state === 'failed' || state === 'closed') {
				this.status = 'error';
				this.error = `Connection ${state}`;
				this.timerStore.stop();
			}
		};
	}
	private handleUserSpeechStarted(): void {
		this.speechDetected = true;
		this.userSpeechStartTime = Date.now();

		// Create a placeholder message immediately
		this.createUserTranscriptionPlaceholder();
	}

	// Handle when user stops speaking
	private handleUserSpeechStopped(): void {
		this.speechDetected = false;

		// Update placeholder to show transcribing state
		this.updateUserPlaceholderToTranscribing();
	}

	// Create placeholder message when speech is detected
	private createUserTranscriptionPlaceholder(): void {
		const placeholderMessage: Message = {
			role: 'user',
			content: '', // Empty content initially
			timestamp: new SvelteDate(),
			id: `user_placeholder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
			conversationId: this.sessionId,
			audioUrl: null
		};

		this.messages = [...this.messages, placeholderMessage];
		console.log('Created user speech placeholder');
	}

	// Update placeholder to show transcribing state
	private updateUserPlaceholderToTranscribing(): void {
		const placeholderIndex = this.messages.findIndex(
			(msg) => msg.role === 'user' && msg.id.startsWith('user_placeholder_')
		);

		if (placeholderIndex !== -1) {
			const updatedMessages = [...this.messages];
			updatedMessages[placeholderIndex] = {
				...updatedMessages[placeholderIndex],
				id: `user_transcribing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
			};
			this.messages = updatedMessages;
			console.log('Updated placeholder to transcribing state');
		}
	}

	private updateUserPlaceholderWithPartial(partialText: string): void {
		const placeholderIndex = this.messages.findIndex(
			(msg) =>
				msg.role === 'user' &&
				(msg.id.startsWith('user_placeholder_') ||
					msg.id.startsWith('user_transcribing_') ||
					msg.id.startsWith('user_partial_'))
		);

		if (placeholderIndex !== -1) {
			const updatedMessages = [...this.messages];
			updatedMessages[placeholderIndex] = {
				...updatedMessages[placeholderIndex],
				content: partialText,
				id: `user_partial_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
			};
			this.messages = updatedMessages;
		}
	}

	// Enhanced addMessageToState to handle ordering
	private addMessageToState(data: realtimeService.MessageEventData): void {
		// For assistant messages, check if there's a pending user placeholder
		if (data.role === 'assistant') {
			const hasPendingUserPlaceholder = this.messages.some(
				(msg) =>
					msg.role === 'user' &&
					(msg.id.startsWith('user_placeholder_') ||
						msg.id.startsWith('user_transcribing_') ||
						msg.id.startsWith('user_partial_'))
			);

			if (hasPendingUserPlaceholder) {
				// Don't add assistant message yet if user transcription is pending
				console.log('Delaying assistant message due to pending user transcription');
				setTimeout(() => this.addMessageToState(data), 1000); // Retry in 1 second
				return;
			}

			// Check for existing streaming message
			const hasStreamingMessage = this.messages.some(
				(msg) => msg.role === 'assistant' && msg.id.startsWith('streaming_')
			);

			if (hasStreamingMessage) {
				console.log('Skipping duplicate assistant message, streaming in progress');
				return;
			}
		}

		// Prevent duplicate messages
		const messageExists = this.messages.some(
			(msg) =>
				msg.role === data.role &&
				msg.content === data.content &&
				Math.abs(msg.timestamp.getTime() - data.timestamp.getTime()) < 2000
		);

		if (!messageExists) {
			const message: Message = {
				role: data.role,
				content: data.content,
				timestamp: new SvelteDate(),
				id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
				conversationId: this.sessionId,
				audioUrl: null
			};

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

		if (data.type === 'user_transcript') {
			if (data.isFinal) {
				// Replace placeholder/transcribing message with final transcript
				this.replaceUserPlaceholderWithFinal(data.text, data.timestamp);
				this.currentTranscript = '';
				this.isTranscribing = false;
				console.log('Final user transcript:', data.text);
			} else {
				// Update live transcription display
				this.currentTranscript = data.text;
				this.isTranscribing = true;
				console.log('Streaming user transcript:', data.text);

				// Optionally update placeholder with partial transcript
				this.updateUserPlaceholderWithPartial(data.text);
			}
		} else if (data.type === 'assistant_transcript') {
			if (data.isFinal) {
				console.log('Final assistant transcript:', data.text);
				this.finalizeStreamingMessage(data.text);
			} else {
				console.log('Streaming assistant transcript:', data.text);
				this.updateStreamingMessage(data.text);
			}
		}
	}

	private replaceUserPlaceholderWithFinal(finalText: string, timestamp: Date): void {
		// Find the most recent placeholder or transcribing message
		const placeholderIndex = this.messages.findIndex(
			(msg) =>
				msg.role === 'user' &&
				(msg.id.startsWith('user_placeholder_') ||
					msg.id.startsWith('user_transcribing_') ||
					msg.id.startsWith('user_partial_'))
		);

		if (placeholderIndex !== -1) {
			// Replace with final message
			const updatedMessages = [...this.messages];
			updatedMessages[placeholderIndex] = {
				...updatedMessages[placeholderIndex],
				content: finalText,
				id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
				timestamp: new SvelteDate()
			};
			this.messages = updatedMessages;
			console.log('Replaced placeholder with final transcript:', finalText.substring(0, 50));
		} else {
			// No placeholder found, add message normally
			this.addMessageToState({
				role: 'user',
				content: finalText,
				timestamp: timestamp
			});
		}
	}

	private updateStreamingMessage(deltaText: string): void {
		// Find existing streaming message
		const streamingMessageIndex = this.messages.findIndex(
			(msg) => msg.role === 'assistant' && msg.id.startsWith('streaming_')
		);

		if (streamingMessageIndex === -1) {
			// Create new streaming message
			const streamingMessage: Message = {
				role: 'assistant',
				content: deltaText,
				timestamp: new SvelteDate(),
				id: `streaming_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
				conversationId: this.sessionId,
				audioUrl: null
			};
			this.messages = [...this.messages, streamingMessage];
			console.log('Created streaming message with:', deltaText);
		} else {
			// Accumulate text in existing streaming message
			const updatedMessages = [...this.messages];
			updatedMessages[streamingMessageIndex] = {
				...updatedMessages[streamingMessageIndex],
				content: updatedMessages[streamingMessageIndex].content + deltaText
			};
			this.messages = updatedMessages;
		}
	}

	private finalizeStreamingMessage(finalText: string): void {
		const streamingMessageIndex = this.messages.findIndex(
			(msg) => msg.role === 'assistant' && msg.id.startsWith('streaming_')
		);

		if (streamingMessageIndex !== -1) {
			// Replace streaming message with final message
			const updatedMessages = [...this.messages];
			updatedMessages[streamingMessageIndex] = {
				...updatedMessages[streamingMessageIndex],
				content: finalText,
				id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
				timestamp: new SvelteDate()
			};
			this.messages = updatedMessages;
			console.log('Finalized streaming message:', finalText.substring(0, 50));
		} else {
			// No streaming message found, create final message directly
			this.addMessageToState({
				role: 'assistant',
				content: finalText,
				timestamp: new SvelteDate()
			});
			console.log('Created final message directly:', finalText.substring(0, 50));
		}

		// Clear any streaming state
		this.currentTranscript = '';
		this.isTranscribing = false;
	}

	private sendInitialConfiguration(): void {
		if (!this.realtimeConnection || !this.language) return;

		const languageName = this.language.name;
		const languageCode = this.language.code;

		// Get user preferences for instructions
		const userPrefs = userPreferencesStore.getPreferences();

		const sessionConfig: SessionConfig = {
			model: 'gpt-4o-mini-realtime-preview-2024-12-17',
			voice: this.voice,
			instructions: generateCustomInstructions(this.language, userPrefs),

			// Critical: Enable input audio transcription
			input_audio_transcription: {
				model: 'whisper-1' as const,
				language: languageCode
			},

			// Optimized VAD settings for better user speech detection
			turn_detection: {
				type: 'server_vad' as const,
				threshold: 0.3, // Lower threshold = more sensitive
				prefix_padding_ms: 500, // Capture more audio before speech
				silence_duration_ms: 800 // Wait longer before considering speech done
			},

			// Audio format settings
			input_audio_format: 'pcm16' as const,
			output_audio_format: 'pcm16' as const
		};

		console.log('Sending session configuration:', {
			language: languageName,
			voice: this.voice,
			model: sessionConfig.model,
			transcription: sessionConfig.input_audio_transcription,
			turnDetection: sessionConfig.turn_detection
		});

		const configEvent = realtimeService.createSessionUpdate(sessionConfig);
		realtimeService.sendEvent(this.realtimeConnection, configEvent);
	}

	private sendInitialGreeting(isFirstTime: boolean): void {
		if (!this.realtimeConnection || !this.language) return;

		// Generate greeting prompt using the instructions service
		const userPrefs = userPreferencesStore.getPreferences();
		const greetingPrompt = generateInitialGreeting(this.language, userPrefs, isFirstTime);

		// Send the greeting prompt to trigger AI response
		const greetingEvent = realtimeService.createTextMessage(greetingPrompt);
		realtimeService.sendEvent(this.realtimeConnection, greetingEvent);

		// Request the AI to respond
		const responseEvent = realtimeService.createResponse(['text', 'audio']);
		realtimeService.sendEvent(this.realtimeConnection, responseEvent);

		console.log(`Sent ${isFirstTime ? 'first-time' : 'returning'} greeting prompt`);
	}

	private clearTranscriptionState(): void {
		this.currentTranscript = '';
		this.isTranscribing = false;
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
		if (this.status === 'error') {
			this.status = 'idle';
		}
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

	/**
	 * Trigger onboarding analysis when the conversation timer expires
	 * This method is called as a callback from the timer store
	 */
	private triggerOnboardingAnalysis = async (): Promise<void> => {
		if (!this.language || this.messages.length === 0) {
			console.warn('Cannot trigger onboarding analysis: missing language or messages');
			return;
		}

		try {
			console.log('🎯 Triggering onboarding analysis...');

			// Prepare conversation messages for analysis
			const conversationMessages = this.messages
				.filter((msg) => msg.role === 'user' && msg.content.trim())
				.map((msg) => msg.content);

			if (conversationMessages.length === 0) {
				console.warn('No user messages found for onboarding analysis');
				return;
			}

			// Call the onboarding analysis API
			const response = await fetch('/api/analyze-onboarding', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					conversationMessages,
					targetLanguage: this.language.code,
					sessionId: this.sessionId
				})
			});

			if (!response.ok) {
				throw new Error(`Onboarding analysis failed: ${response.statusText}`);
			}

			const result = await response.json();

			if (result.success) {
				console.log('✅ Onboarding analysis completed successfully');

				// Update user preferences with analyzed data and increment conversation count
				await userPreferencesStore.updatePreferences({
					...result.data,
					totalConversations: (userPreferencesStore.getPreference('totalConversations') || 0) + 1
				});
			} else {
				console.error('❌ Onboarding analysis failed:', result.error);
			}
		} catch (error) {
			console.error('Failed to trigger onboarding analysis:', error);
		}
	};
}

// Export singleton instance
export const conversationStore = new ConversationStore();
