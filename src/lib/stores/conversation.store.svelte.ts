import { logger } from '$lib/logger';
// src/lib/stores/conversation.store.svelte.ts
// Simplified conversation store using functional realtime service
// ! Need to make sure that onboarding update in the beginning of the conversation is handled
// ! Need to make sure that the conversation is properly handled
// ! Need to make sure that the user preferences are properly handled
// ! Need to ensure that when the conversation is ended, the onboarding for userPreferences runs

import { browser, dev } from '$app/environment';

// Environment-based logging

const log = (...args: unknown[]) => dev && logger.info(...args);
import { realtimeOpenAI } from '$lib/stores/realtime-openai.store.svelte';
import { audioStore } from '$lib/stores/audio.store.svelte';
import { scenarioStore } from '$lib/stores/scenario.store.svelte';
import { getInstructions } from '$lib/services/instructions.service';
import * as messageService from '$lib/services/message.service';
import * as sessionManagerService from '$lib/services/session-manager.service';
import * as transcriptionStateService from '$lib/services/transcription-state.service';
import * as onboardingManagerService from '$lib/services/onboarding-manager.service';
import {
	needsScriptGeneration,
	generateScriptsForMessage,
	updateMessageWithScripts,
	detectLanguage,
	generateAndStoreScriptsForMessage
} from '$lib/services/scripts.service';
import { usageTracker, type UsageContext } from '$lib/services/usage-tracker.service';
import type {
	Message,
	Language,
	UserPreferences,
	UserTier,
	NewConversationSession,
	AudioInputMode
} from '$lib/server/db/types';
import type { Speaker } from '$lib/types';
import type { Voice } from '$lib/types/openai.realtime.types';
import { DEFAULT_VOICE, isValidVoice } from '$lib/types/openai.realtime.types';
import {
	createConversationTimerStore,
	type ConversationTimerStore
} from './conversation-timer.store.svelte';
import { userPreferencesStore } from './user-preferences.store.svelte';
import type { ConversationStatus } from '$lib/services/conversation.service';
import { userManager } from './user.store.svelte';
import { usageStore } from '$lib/stores/usage.store.svelte';
import { SvelteDate, SvelteSet } from 'svelte/reactivity';
import { conversationPersistenceService } from '$lib/services/conversation-persistence.service';
import { languages as dataLanguages } from '$lib/data/languages';

const KNOWN_USER_TIERS: UserTier[] = ['free', 'plus', 'premium'];
export class ConversationStore {
	// Reactive state
	status = $state<ConversationStatus>('idle');
	messages = $state<Message[]>([]);
	messagesForAnalysis = $state<Message[]>([]);
	userId = $state<string | null>(null);
	sessionId = $state<string>('');
	language = $state<Language>(dataLanguages[0]);
	voice: Voice = DEFAULT_VOICE;
	speaker = $state<Speaker | undefined>(undefined);
	error = $state<string | null>(null);
	waitingForUserToStart = $state<boolean>(false);
	audioInputMode = $state<AudioInputMode>('ptt'); // Default to Push-to-Talk

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

	// Conversation tracking
	private conversationStartTime = $state<Date | null>(null);
	private lastSaveTime = $state<Date | null>(null);

	// Private connection state (SDK only)
	private audioStream: MediaStream | null = null;
	private messageUnsub: (() => void) | null = null;
	private sessionReadyUnsub: (() => void) | null = null;
	private vadUnsub: (() => void) | null = null;
	private timer: ConversationTimerStore = $state(createConversationTimerStore('free'));
	private currentOptions: Partial<UserPreferences> | null = null;
	// Mirror + sanitize tracking
	private sanitizedMessageIds = new SvelteSet<string>();
	private lastInstructions: string = '';
	private nativeSwitchAnnounced: boolean = false;
	private sessionReadyHandled = false;
	// Browser lifecycle tracking
	private unloadHandler: ((event: BeforeUnloadEvent) => void) | null = null;
	private visibilityHandler: (() => void) | null = null;
	private saveScheduled: boolean = false;
	private saveTimeout: ReturnType<typeof setTimeout> | null = null;
	private currentTurnStartMs: number | null = null;
	private turnLevelMonitor: ReturnType<typeof setInterval> | null = null;
	private turnMaxInputLevel = 0;
	private suppressNextUserTranscript = false;
	private usageRecorded = false;
	private messageHandlersSetup = false;

	constructor(userTier: UserTier = 'free') {
		log('🏗️ ConversationStore constructor:', {
			browser,
			isBrowser: typeof window !== 'undefined',
			userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'SSR',
			userTier
		});

		// Only initialize services in browser
		if (!browser) {
			log('ConversationStore: SSR mode, skipping service initialization');
			// Create a dummy timer store for SSR
			return;
		}

		// Browser initialization
		log('🚀 ConversationStore: Browser mode, initializing services');
		this.timer = createConversationTimerStore(userTier);
		this.initializeServices();
		this.initializeUserPreferences();

		realtimeOpenAI.setTranscriptFilter((meta) => {
			if (meta.role !== 'user') {
				return true;
			}

			logger.warn('🔍 TRANSCRIPT FILTER CHECK', {
				itemId: meta.itemId,
				text: meta.text,
				textLength: meta.text.length,
				suppressFlag: this.suppressNextUserTranscript,
				timestamp: new SvelteDate().toISOString()
			});

			const shouldSuppress = this.suppressNextUserTranscript;
			// Reset flag regardless of decision so it only applies once
			this.suppressNextUserTranscript = false;

			logger.warn('🔍 SUPPRESSION FLAG AFTER CHECK', {
				itemId: meta.itemId,
				wasSuppressFlag: shouldSuppress,
				nowSuppressFlag: this.suppressNextUserTranscript,
				willContinueCheck: shouldSuppress,
				timestamp: new SvelteDate().toISOString()
			});

			if (!shouldSuppress) {
				logger.warn('✅ TRANSCRIPT ALLOWED (suppression flag was false)', {
					itemId: meta.itemId,
					text: meta.text.substring(0, 50)
				});
				return true;
			}

			const tokenCount = meta.text.trim().split(/\s+/).length;
			const isLongUtterance = tokenCount > 6 || meta.text.trim().length > 40;
			if (isLongUtterance) {
				logger.warn('✅ TRANSCRIPT ALLOWED (long utterance override)', {
					itemId: meta.itemId,
					tokenCount,
					textLength: meta.text.trim().length,
					text: meta.text.substring(0, 50)
				});
				return true;
			}

			logger.warn('🧹 ConversationStore: Suppressing low-activity user transcript', {
				itemId: meta.itemId,
				text: meta.text
			});
			return false;
		});
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
		// Audio service will be initialized only when conversation starts
		// This prevents unnecessary microphone access requests on non-conversation pages

		// Set up browser lifecycle handlers
		this.setupBrowserLifecycleHandlers();
	}

	/**
	 * Set up handlers for browser lifecycle events to ensure conversations are saved
	 */
	private setupBrowserLifecycleHandlers(): void {
		if (!browser || typeof window === 'undefined') return;

		// Handle page unload/navigation - save conversation before leaving
		this.unloadHandler = (event: BeforeUnloadEvent) => {
			if (this.status !== 'idle' && this.messages.length > 0) {
				logger.info('🚪 Page unload detected - saving conversation...');

				// Use sendBeacon for reliable save during unload
				this.saveConversationViaBeacon();

				// Optional: Show warning if conversation is active
				if (this.status === 'streaming' || this.status === 'connected') {
					event.preventDefault();
					event.returnValue = '';
				}
			}
		};

		// Handle visibility changes - save when tab becomes hidden
		this.visibilityHandler = () => {
			if (document.hidden && this.status !== 'idle' && this.messages.length > 0) {
				logger.info('👁️ Tab hidden - queueing conversation save...');
				this.queueConversationSave();
			}
		};

		window.addEventListener('beforeunload', this.unloadHandler);
		document.addEventListener('visibilitychange', this.visibilityHandler);
	}

	/**
	 * Clean up browser lifecycle handlers
	 */
	private cleanupBrowserLifecycleHandlers(): void {
		if (!browser || typeof window === 'undefined') return;

		if (this.unloadHandler) {
			window.removeEventListener('beforeunload', this.unloadHandler);
			this.unloadHandler = null;
		}

		if (this.visibilityHandler) {
			document.removeEventListener('visibilitychange', this.visibilityHandler);
			this.visibilityHandler = null;
		}
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
		logger.info('🚀 ConversationStore: Starting conversation:', {
			browser,
			isBrowser: typeof window !== 'undefined',
			status: this.status,
			language: language?.name,
			speaker: typeof speaker === 'object' ? speaker?.voiceName : speaker
		});

		if (!browser) {
			logger.warn('Cannot start conversation on server');
			return;
		}

		if (this.status !== 'idle') {
			logger.warn('Conversation already in progress');
			return;
		}

		// Clear any leftover data from previous conversation sessions
		this.messages = [];
		this.messagesForAnalysis = [];
		this.usageRecorded = false;

		// Store options for later use and merge with existing preferences if provided
		this.currentOptions = options || null;

		// Update user preferences with provided options
		if (options) {
			await userPreferencesStore.updatePreferences(options);
		}

		// Set up conversation parameters from user preferences
		this.language = language ?? dataLanguages[0];
		this.speaker = typeof speaker === 'object' ? speaker : undefined;
		this.transcriptionMode = userPreferencesStore.getTranscriptionMode();

		// Set audio input mode from options or user preferences
		this.audioInputMode =
			options?.audioInputMode ||
			(userPreferencesStore.getPreference('audioInputMode') as AudioInputMode | undefined) ||
			'ptt'; // Default to Push-to-Talk

		logger.info('🎙️ ConversationStore: Audio input mode:', this.audioInputMode);

		this.timer.configureForUserTier(userManager.effectiveTier);

		const hasUsageBudget = await this.ensureUsageBudget();
		if (!hasUsageBudget) {
			this.status = 'idle';
			return;
		}

		this.status = 'connecting';
		this.error = null;
		this.clearTranscriptionState();

		// Track conversation start time for persistence
		this.conversationStartTime = new SvelteDate();

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
			this.sessionReadyHandled = false;
			// 1. Initialize audio store if not already initialized
			if (!audioStore.isInitialized) {
				logger.info('🎵 ConversationStore: Initializing audio store...');
				await audioStore.initialize();
			}

			// 2. Request audio permission and start recording
			logger.info('🎵 ConversationStore: Requesting audio permission and starting recording...');
			const audioResult = await audioStore.requestPermissionGracefully();

			if (!audioResult.success) {
				const errorMessage = audioResult.error?.message || 'Failed to get microphone access';
				logger.error('❌ ConversationStore: Audio permission denied:', errorMessage);
				throw new Error(`Audio setup failed: ${errorMessage}`);
			}

			// Get the stream from the audio store
			this.audioStream = audioStore.getCurrentStream();
			logger.info(
				'🎵 ConversationStore: After starting recording - stream exists:',
				!!this.audioStream,
				'audioStore.isRecording:',
				audioStore.isRecording
			);
			if (this.audioStream === null) {
				throw new Error('No audio stream available after successful permission request');
			}

			// IMPORTANT: Disable audio track BEFORE connecting to prevent initial buffer accumulation
			// This prevents the "weird audio clip" issue where audio captured during setup gets committed
			const track = this.audioStream.getAudioTracks()[0];
			if (track) {
				track.enabled = false;
				logger.info(
					'🎵 ConversationStore: Disabled audio track before connection to prevent initial buffer'
				);
			}

			// 3. Get session from backend
			const sessionData = await this.fetchSessionFromBackend();
			this.sessionId = sessionData.session_id;

			// 4. Connect via SDK-backed store with conversation context
			await realtimeOpenAI.connect(sessionData, this.audioStream, {
				voice: this.voice,
				transcriptionLanguage: this.language.code,
				skipInitialSessionUpdate: true,
				conversationContext: {
					sessionId: this.sessionId,
					languageCode: this.language.code,
					userId: userManager.user?.id
				}
			});

			// 5. Set up event handlers
			this.setupRealtimeEventHandlers();

			logger.info('Connection established, waiting for session creation...');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Connection failed';
			this.error = errorMessage;
			this.status = 'error';

			// Save conversation before cleanup on error
			logger.info('⚠️ Connection error - saving conversation before cleanup');
			await this.saveConversationToDatabase(false).catch((saveError) => {
				logger.error('Failed to save conversation on error:', saveError);
			});

			this.cleanup();
			throw error;
		}
	};

	sendMessage = (content: string) => {
		if (!browser) return;
		// Send via SDK high-level API; ConversationStore mirrors from realtimeOpenAI
		realtimeOpenAI.sendTextMessage(content);
	};

	// Track last pause time to detect duplicate calls
	private lastPauseTime: number = 0;
	private pauseCallCounter: number = 0;

	pauseStreaming = () => {
		this.pauseCallCounter++;
		const now = Date.now();
		const timeSinceLastPause = now - this.lastPauseTime;
		const callStack = new Error().stack?.split('\n').slice(1, 5).join('\n') || 'unknown';

		logger.warn('⏸️ ConversationStore: pauseStreaming() CALLED', {
			hasAudioStream: !!this.audioStream,
			callNumber: this.pauseCallCounter,
			timeSinceLastPause: `${timeSinceLastPause}ms`,
			callStack,
			timestamp: new SvelteDate().toISOString()
		});

		// Detect rapid duplicate calls (within 200ms)
		if (timeSinceLastPause < 200 && timeSinceLastPause > 0) {
			logger.warn('⚠️ DUPLICATE pauseStreaming() DETECTED!', {
				timeSinceLastPause: `${timeSinceLastPause}ms`,
				callNumber: this.pauseCallCounter,
				previousCallTime: new SvelteDate(this.lastPauseTime).toISOString(),
				currentCallTime: new SvelteDate(now).toISOString(),
				callStack
			});
		}

		this.lastPauseTime = now;

		if (!this.audioStream) {
			logger.info('🎙️ ConversationStore: pauseStreaming ignored - no active stream');
			return;
		}

		// Cancel any pending greeting retry when user commits audio
		if (this.greetingRetryTimeout) {
			logger.info('🎵 ConversationStore: Canceling greeting retry - user committed audio');
			clearTimeout(this.greetingRetryTimeout);
			this.greetingRetryTimeout = null;
		}

		const track = this.audioStream.getAudioTracks()[0];
		logger.warn('⏸️ PAUSE STREAMING (PTT STOP)', {
			audioStoreRecording: audioStore.isRecording,
			currentLevel: audioStore.currentLevel.level,
			streamId: this.audioStream.id,
			trackEnabled: track?.enabled,
			trackReadyState: track?.readyState,
			timestamp: new SvelteDate().toISOString()
		});

		// CRITICAL: Disable track BEFORE committing buffer to prevent audio bleed
		if (track) {
			track.enabled = false;
		}

		logger.warn('⚠️ COMMITTING AUDIO BUFFER - This should result in exactly ONE commit!', {
			streamId: this.audioStream.id,
			trackEnabled: track?.enabled,
			timestamp: new SvelteDate().toISOString()
		});

		// Immediately commit without delay to prevent second buffer accumulation
		// The 50ms delay was allowing a second buffer to accumulate, causing duplicate commits
		realtimeOpenAI.pttStop(this.audioStream);

		const hadActiveTurn = this.currentTurnStartMs !== null;
		this.stopTurnLevelMonitor();

		if (hadActiveTurn) {
			const now = Date.now();
			const durationMs = this.currentTurnStartMs ? now - this.currentTurnStartMs : 0;
			const hadTranscriptDelta = (realtimeOpenAI.userDelta || '').trim().length > 0;
			const MIN_DURATION_MS = 350;
			const MIN_LEVEL = 0.02;
			const hadAudioEnergy = this.turnMaxInputLevel >= MIN_LEVEL || this.speechDetected;

			const shouldSuppress =
				!hadTranscriptDelta &&
				(!hadAudioEnergy || durationMs < MIN_DURATION_MS || this.turnMaxInputLevel === 0);

			logger.warn('🎯 SILENCE DETECTION LOGIC', {
				durationMs,
				turnMaxInputLevel: this.turnMaxInputLevel,
				hadTranscriptDelta,
				hadAudioEnergy,
				speechDetected: this.speechDetected,
				shouldSuppress,
				currentSuppressFlag: this.suppressNextUserTranscript,
				timestamp: new SvelteDate().toISOString()
			});

			if (shouldSuppress) {
				logger.warn('🧹 ConversationStore: SETTING suppressNextUserTranscript = TRUE', {
					durationMs,
					turnMaxInputLevel: this.turnMaxInputLevel,
					hadTranscriptDelta,
					hadAudioEnergy,
					beforeFlag: this.suppressNextUserTranscript,
					timestamp: new SvelteDate().toISOString()
				});
				this.suppressNextUserTranscript = true;
				logger.warn('🧹 ConversationStore: suppressNextUserTranscript is now TRUE', {
					afterFlag: this.suppressNextUserTranscript
				});
			} else {
				logger.warn('✅ NOT SUPPRESSING - turn had activity', {
					durationMs,
					turnMaxInputLevel: this.turnMaxInputLevel,
					hadTranscriptDelta,
					hadAudioEnergy,
					suppressFlag: this.suppressNextUserTranscript
				});
			}
		}

		this.currentTurnStartMs = null;
		this.turnMaxInputLevel = 0;

		try {
			audioStore.currentLevel = { level: 0, timestamp: Date.now() };
		} catch (err) {
			logger.warn('🎙️ ConversationStore: Failed to reset audio level on pause', err);
		}
	};

	resumeStreaming = () => {
		const callStack = new Error().stack?.split('\n').slice(1, 4).join('\n') || 'unknown';
		logger.warn('▶️ ConversationStore: resumeStreaming() CALLED', {
			hasAudioStream: !!this.audioStream,
			callStack,
			timestamp: new SvelteDate().toISOString()
		});

		if (!this.audioStream) {
			logger.info('🎙️ ConversationStore: resumeStreaming ignored - no active stream');
			return;
		}

		const track = this.audioStream.getAudioTracks()[0];
		logger.warn('▶️ RESUME STREAMING (PTT START)', {
			audioStoreRecording: audioStore.isRecording,
			currentLevel: audioStore.currentLevel.level,
			streamId: this.audioStream.id,
			trackEnabled: track?.enabled,
			trackReadyState: track?.readyState,
			timestamp: new SvelteDate().toISOString()
		});

		logger.warn('🔄 RESETTING SUPPRESSION FLAG IN resumeStreaming()', {
			beforeFlag: this.suppressNextUserTranscript,
			timestamp: new SvelteDate().toISOString()
		});

		this.currentTurnStartMs = Date.now();
		this.turnMaxInputLevel = 0;
		this.suppressNextUserTranscript = false;
		this.speechDetected = false;

		logger.warn('🔄 SUPPRESSION FLAG RESET TO FALSE', {
			afterFlag: this.suppressNextUserTranscript,
			currentTurnStartMs: this.currentTurnStartMs,
			timestamp: new SvelteDate().toISOString()
		});

		this.startTurnLevelMonitor();

		// CRITICAL: Enable track BEFORE clearing buffer to ensure audio starts flowing
		if (track) {
			track.enabled = true;
		}

		// Clear buffer after track is enabled
		realtimeOpenAI.pttStart(this.audioStream);

		logger.info('🎙️ ConversationStore: resumeStreaming applied', {
			track: this.describeAudioTrack(track)
		});
	};

	private startTurnLevelMonitor(): void {
		if (this.turnLevelMonitor) {
			clearInterval(this.turnLevelMonitor);
		}
		this.turnLevelMonitor = setInterval(() => {
			const level = audioStore.currentLevel.level;
			if (level > this.turnMaxInputLevel) {
				this.turnMaxInputLevel = level;
			}
			if (level > 0.02) {
				this.speechDetected = true;
			}
		}, 50);
	}

	private stopTurnLevelMonitor(): void {
		if (this.turnLevelMonitor) {
			clearInterval(this.turnLevelMonitor);
			this.turnLevelMonitor = null;
		}
	}

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

		try {
			if (this.status === 'streaming' || this.status === 'connected') {
				// Switch live stream to the new device when actively recording
				await audioStore.switchToDevice(deviceId);

				// Update our reference to the active MediaStream so downstream consumers stay in sync
				this.audioStream = audioStore.getCurrentStream();

				logger.info('Audio device switched successfully');
			} else {
				// Persist the preference for the next time recording starts
				audioStore.selectedDeviceId = deviceId;
			}
		} catch (error) {
			logger.error('Failed to switch audio device:', error);
			this.error = 'Failed to switch audio device';
		}
	};

	/**
	 * Update audio input mode during an active conversation
	 * This will send a session.update to OpenAI with the new turn detection config
	 */
	updateAudioInputMode = (mode: AudioInputMode) => {
		if (this.status === 'idle' || !this.language) {
			logger.warn('⚠️ Cannot update audio mode - conversation not active');
			return;
		}

		const previousMode = this.audioInputMode;
		this.audioInputMode = mode;

		logger.info('🎙️ ConversationStore: Audio input mode changing', {
			from: previousMode,
			to: mode,
			status: this.status
		});

		// Send session update with new turn detection config
		const turnDetectionConfig = this.getTurnDetectionConfig();
		realtimeOpenAI.updateSessionConfig({
			turnDetection: turnDetectionConfig,
			voice: this.voice,
			transcriptionLanguage: this.language.code
		});

		// Handle audio track state based on mode
		const track = this.audioStream?.getAudioTracks()[0];
		if (track) {
			if (mode === 'vad') {
				// In VAD mode, audio track should be enabled for continuous listening
				track.enabled = true;
				this.waitingForUserToStart = false;
				logger.info('🎙️ ConversationStore: VAD mode - audio track enabled for continuous listening');
			} else {
				// In PTT mode, disable track until user presses button
				track.enabled = false;
				this.waitingForUserToStart = true;
				logger.info('🎙️ ConversationStore: PTT mode - audio track disabled until button press');
			}
		}

		logger.info('✅ ConversationStore: Audio input mode updated successfully', {
			mode,
			turnDetection: turnDetectionConfig ? 'server_vad' : 'manual (PTT)',
			trackEnabled: track?.enabled
		});
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
		if (this.status === 'idle' || !this.language) return;

		const currentConfig = sessionManagerService.createSessionUpdateConfig(
			updates,
			this.language,
			this.voice
		);

		realtimeOpenAI.updateSessionConfig({
			model: currentConfig.model,
			voice: this.voice,
			instructions: currentConfig.instructions,
			turnDetection: this.getTurnDetectionConfig(),
			audio: currentConfig.audio
		});
	};

	// === GETTERS ===

	/**
	 * Calculate turn detection config based on current audio input mode
	 * @returns Turn detection config for VAD mode, or null for PTT mode
	 */
	private getTurnDetectionConfig() {
		return this.audioInputMode === 'vad'
			? {
					type: 'server_vad' as const,
					threshold: 0.5, // Sensitivity (0.0 to 1.0)
					prefixPaddingMs: 300, // Audio before speech starts
					silenceDurationMs: 500 // Silence duration to detect end of speech
				}
			: null; // null for PTT mode - disables server-side turn detection
	}

	isConnected = () => {
		if (!browser) return false;
		return !!realtimeOpenAI.isConnected;
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

		if (!realtimeOpenAI.isConnected) {
			return {
				peerConnectionState: 'disconnected',
				dataChannelState: 'closed',
				isStreamingPaused: false,
				hasLocalStream: !!this.audioStream
			};
		}
		return {
			peerConnectionState: realtimeOpenAI.isConnected ? 'connected' : 'disconnected',
			dataChannelState: realtimeOpenAI.isConnected ? 'open' : 'closed',
			isStreamingPaused: false,
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
			hasConnection: !!realtimeOpenAI.isConnected,
			hasAudioStream: !!this.audioStream,
			timerState: this.timer.state,
			audio: this.getAudioDebugInfo()
		};
	};

	getAudioDebugInfo = () => {
		const stream = this.audioStream;
		const track = stream?.getAudioTracks()[0];
		return {
			hasStream: !!stream,
			streamId: stream?.id,
			trackCount: stream?.getAudioTracks().length || 0,
			track: this.describeAudioTrack(track),
			selectedDeviceId: this.selectedDeviceId,
			audioStore: {
				isInitialized: audioStore.isInitialized,
				isRecording: audioStore.isRecording,
				currentLevel: audioStore.currentLevel.level,
				lastLevelTimestamp: audioStore.currentLevel.timestamp,
				selectedDeviceId: audioStore.selectedDeviceId,
				permissionState: audioStore.permissionState
			},
			output: realtimeOpenAI.getAudioOutputDebugInfo()
		};
	};

	private describeAudioTrack(track?: MediaStreamTrack) {
		if (!track) return null;
		let settings: MediaTrackSettings | undefined;
		let constraints: MediaTrackConstraints | undefined;
		try {
			settings = track.getSettings();
		} catch (error) {
			logger.warn('🎙️ ConversationStore: Failed to read track settings', error);
		}
		try {
			constraints = track.getConstraints();
		} catch (error) {
			logger.warn('🎙️ ConversationStore: Failed to read track constraints', error);
		}
		return {
			id: track.id,
			label: track.label,
			kind: track.kind,
			enabled: track.enabled,
			muted: track.muted,
			readyState: track.readyState,
			settings,
			constraints
		};
	}

	private async ensureUsageBudget(): Promise<boolean> {
		const userId = userManager.user?.id;
		if (!userId || userId === 'guest') {
			return true;
		}

		const usageContext = await usageTracker.refreshUsageContext(userId);

		if (usageContext) {
			this.applyUsageContext(userId, usageContext);
		}

		if (!usageContext) {
			// Fail open if we cannot load usage; treat as warning rather than a blocker.
			return true;
		}

		if (!usageContext.canUseRealtime) {
			this.error = 'Realtime conversations are not available on your current plan.';
			return false;
		}

		if (!usageContext.canStartConversation) {
			this.error = 'You have reached your conversation limit for this billing cycle.';
			return false;
		}

		if (usageContext.timerLimits.remainingSeconds <= 0) {
			this.error = 'You have used all available conversation time for this period.';
			return false;
		}

		return true;
	}

	private applyUsageContext(userId: string, context: UsageContext): void {
		try {
			usageStore.setUser(userId, context.tier);
			usageStore.usage = context.usage;
		} catch (error) {
			logger.error('Failed to apply usage context to usageStore', error);
		}

		const tierId = context.tier?.id;

		if (tierId && KNOWN_USER_TIERS.includes(tierId as UserTier)) {
			this.timer.configureForUserTier(tierId as UserTier);
		}

		this.timer.syncUsageLimits(context.timerLimits);
	}

	// === PRIVATE METHODS ===

	private async fetchSessionFromBackend() {
		const lang = this.language?.code || 'en';
		// Use existing sessionId if available, otherwise generate new one
		const sessionIdToUse = this.sessionId || crypto.randomUUID();
		this.sessionId = sessionIdToUse; // Ensure sessionId is set
		return sessionManagerService.fetchSessionFromBackend(sessionIdToUse, this.voice, lang);
	}

	private setupRealtimeEventHandlers(): void {
		// Guard against duplicate handler registration (Bug #4 fix)
		if (this.messageHandlersSetup) {
			logger.warn(
				'⚠️ ConversationStore: setupRealtimeEventHandlers called multiple times, skipping duplicate setup'
			);
			return;
		}

		logger.info('📋 ConversationStore: Setting up realtime event handlers');
		this.messageHandlersSetup = true;

		// Subscribe to SDK history stream through the new store
		try {
			this.messageUnsub?.();
		} catch {
			logger.info('an error with conversation store. Chekc it out');
		}
		try {
			this.sessionReadyUnsub?.();
		} catch {
			logger.info('an error with session ready listener cleanup');
		}
		this.sessionReadyUnsub = realtimeOpenAI.onSessionReady(() => {
			this.handleRealtimeSessionReady();
		});

		// Subscribe to VAD speech detection events
		try {
			this.vadUnsub?.();
		} catch {
			logger.info('an error with VAD listener cleanup');
		}
		this.vadUnsub = realtimeOpenAI.onVADEvent((ev) => {
			if (ev.type === 'speech_started') {
				this.speechDetected = true;
				this.userSpeechStartTime = ev.audioStartMs || Date.now();
				logger.info('🎙️ VAD: User started speaking', {
					audioStartMs: ev.audioStartMs,
					itemId: ev.itemId
				});
			} else if (ev.type === 'speech_stopped') {
				this.speechDetected = false;
				this.userSpeechStartTime = null;
				logger.info('🎙️ VAD: User stopped speaking', {
					audioEndMs: ev.audioEndMs,
					itemId: ev.itemId
				});
			}
		});

		this.messageUnsub = realtimeOpenAI.onMessageStream(async (ev) => {
			logger.info('📨 ConversationStore: Message stream event:', {
				role: ev.role,
				final: ev.final,
				realtimeMessagesCount: realtimeOpenAI.messages.length,
				currentConvMessagesCount: this.messages.length
			});

			// Mirror: copy realtime messages directly with duplicate removal
			const newMessages = messageService.removeDuplicateMessages(
				messageService.sortMessagesBySequence([...realtimeOpenAI.messages])
			);

			logger.info('🔄 ConversationStore: Message mirroring:', {
				before: this.messages.length,
				after: newMessages.length,
				change: newMessages.length - this.messages.length,
				sampleNewMessage: newMessages[newMessages.length - 1]?.id || 'none'
			});

			// Guard against unexpected message count growth (Bug #4 detection)
			if (this.messages.length > 0 && newMessages.length > this.messages.length + 2) {
				logger.warn(
					'⚠️ ConversationStore: Unexpected message growth detected! This may indicate duplicate responses.',
					{
						previousLength: this.messages.length,
						newLength: newMessages.length,
						growth: newMessages.length - this.messages.length
					}
				);
			}

			this.messages = newMessages;

			if (!ev.final) return;

			// Aggressive auto-save strategy
			if (ev.role === 'user') {
				const userMessageCount = this.messages.filter((m) => m.role === 'user').length;
				// Save every 2 user messages (more aggressive), or if it's been more than 1 minute since last save
				const timeSinceLastSave = this.lastSaveTime
					? Date.now() - this.lastSaveTime.getTime()
					: Number.MAX_SAFE_INTEGER;

				// Only save if no streaming messages are currently active
				const hasStreamingMessages = messageService.hasStreamingMessage(this.messages);

				// More aggressive save triggers
				if ((userMessageCount % 2 === 0 || timeSinceLastSave > 60000) && !hasStreamingMessages) {
					logger.info('🔄 Auto-saving conversation (user message trigger)');
					this.debouncedSave();
				} else if (hasStreamingMessages) {
					logger.info('⏭️ Skipping auto-save - streaming messages active');
				}
			}

			// Trigger save after assistant messages complete (with delay to ensure finalization)
			if (ev.role === 'assistant') {
				const hasStreamingMessages = messageService.hasStreamingMessage(this.messages);
				if (!hasStreamingMessages) {
					logger.info('🤖 Assistant message complete - scheduling save');
					// More aggressive save after assistant responses
					this.debouncedSave();
				}
			}
			// Sanitize just-finalized message: add scripts if applicable
			let idx = -1;
			for (let i = this.messages.length - 1; i >= 0; i--) {
				if (
					this.messages[i].role === ev.role &&
					(this.messages[i].content || '').trim().length > 0
				) {
					idx = i;
					break;
				}
			}
			if (idx === -1) return;
			const msg = this.messages[idx];
			if (this.sanitizedMessageIds.has(msg.id)) return;
			try {
				let updatedMsg = msg;

				// Add scripts if needed
				if (needsScriptGeneration(msg)) {
					const scriptData = await generateScriptsForMessage(msg, true);
					if (scriptData && Object.keys(scriptData).length > 0) {
						updatedMsg = updateMessageWithScripts(updatedMsg, scriptData);
						const lang = detectLanguage(msg.content);
						if (lang !== 'other' && this.sessionId) {
							generateAndStoreScriptsForMessage(this.sessionId, msg.id, msg.content, lang).catch(
								() => {}
							);
						}
					}
				}

				// Add translation if needed
				// For language learning: if user is learning Japanese, their native language is English
				const userNativeLanguage = userManager.user.nativeLanguageId || 'en';

				if (messageService.needsTranslation(updatedMsg, userNativeLanguage)) {
					logger.info(
						`🌐 Adding translation for ${updatedMsg.role} message: "${updatedMsg.content.substring(0, 50)}..." from auto-detected to ${userNativeLanguage}`
					);
					updatedMsg = await messageService.addTranslationToMessage(updatedMsg, userNativeLanguage);
				}

				// Detect native-language usage during onboarding and update instructions once
				if (ev.role === 'user' && this.language && !this.nativeSwitchAnnounced) {
					const detectedCode = this.detectLanguageCode(
						msg.content || '',
						userManager.user.nativeLanguageId,
						this.language.code
					);
					if (
						detectedCode &&
						detectedCode === userManager.user.nativeLanguageId &&
						detectedCode !== this.language.code
					) {
						const detectedName =
							(await import('$lib/data/languages')).getLanguageById(detectedCode)?.name ||
							'your native language';
						const userPrefs = userPreferencesStore.getPreferences();
						const delta = getInstructions('update', {
							user: userManager.user,
							language: this.language,
							preferences: userPrefs,
							updateType: 'native_switch',
							updateContext: { type: 'native_switch', language: detectedName }
						});
						this.applyInstructionUpdate(delta);
						this.nativeSwitchAnnounced = true;
					}
				}

				// Update the message array if any changes were made
				if (updatedMsg !== msg) {
					const next = [...this.messages];
					next[idx] = updatedMsg;
					this.messages = messageService.sortMessagesBySequence(next);
				}
			} finally {
				this.sanitizedMessageIds.add(msg.id);
			}
		});

		// No legacy transport fallback in mirror mode
	}

	private handleRealtimeSessionReady(): void {
		if (this.sessionReadyHandled) return;
		this.sessionReadyHandled = true;

		logger.info('🎵 ConversationStore: Realtime session ready, applying initial setup...');
		logger.info(
			'🎵 ConversationStore: Event handlers set up, realtime messages:',
			realtimeOpenAI.messages.length
		);

		this.sendInitialSetup();
		this.status = 'connected';
		logger.info('🎵 ConversationStore: Status changed to "connected"');

		// Handle audio track based on mode
		if (this.audioStream) {
			const track = this.audioStream.getAudioTracks()[0];
			if (track) {
				if (this.audioInputMode === 'vad') {
					// VAD mode: Enable audio track immediately - server handles turn detection
					track.enabled = true;
					logger.info('🎵 ConversationStore: Enabled audio track for VAD mode');
				} else {
					// PTT mode: Keep track disabled until user presses button
					track.enabled = false;
					logger.info(
						'🎵 ConversationStore: Audio track disabled for PTT mode - waiting for user press'
					);
				}
			}
		}

		const preferencesProvider = {
			isGuest: () => userPreferencesStore.isGuest(),
			getPreference: <K extends keyof import('$lib/server/db/types').UserPreferences>(key: K) =>
				userPreferencesStore.getPreference(key),
			updatePreferences: (updates: Partial<import('$lib/server/db/types').UserPreferences>) =>
				userPreferencesStore.updatePreferences(updates)
		};

		if (onboardingManagerService.shouldTriggerOnboarding(preferencesProvider)) {
			this.timer.start(() => {
				logger.info('Conversation timer expired!');
				this.handleTimerExpiration();
			});
		} else {
			this.timer.start();
		}

		setTimeout(() => {
			this.status = 'streaming';
			logger.info('🎵 ConversationStore: Status changed to "streaming"');
		}, 500);
	}

	private sendInitialSetup(): void {
		if (!this.language) return;

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

		// Configure turn detection based on audio input mode
		const turnDetectionConfig = this.getTurnDetectionConfig();

		logger.info('Sending session configuration:', {
			language: this.language.name,
			voice: this.voice,
			model: sessionConfig.model,
			isFirstTime,
			isGuest: this.isGuestUser,
			instructionType: isFirstTime ? 'complete-onboarding' : 'complete-session',
			audioInputMode: this.audioInputMode,
			turnDetection: turnDetectionConfig ? 'server_vad' : 'manual (PTT)'
		});

		// Send the combined configuration with mode-specific turn detection
		realtimeOpenAI.updateSessionConfig({
			model: sessionConfig.model,
			voice: this.voice,
			instructions: sessionConfig.instructions,
			turnDetection: turnDetectionConfig,
			transcriptionLanguage: this.language.code
		});

		this.lastInstructions = sessionConfig.instructions;

		// With VAD enabled, audio is always flowing - no need for manual start
		// With PTT, user must press button to start
		this.waitingForUserToStart = this.audioInputMode === 'ptt';
		logger.info(
			`🎵 ConversationStore: ${this.audioInputMode === 'vad' ? 'VAD mode enabled - ready for conversation' : 'PTT mode enabled - press to speak'}`
		);

		// In PTT mode, trigger initial greeting immediately since user needs to press to speak
		// In VAD mode, wait for user to start speaking (greeting triggered by first user input)
		if (this.audioInputMode === 'ptt' && this.waitingForUserToStart) {
			logger.info('🎵 ConversationStore: PTT mode - triggering initial greeting automatically');
			this.triggerInitialGreeting();
		}
	}

	private greetingRetryTimeout: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Trigger the AI's first greeting after user interaction
	 * This should be called when the user taps the AudioVisualizer for the first time
	 */
	triggerInitialGreeting = () => {
		// If a scenario is active, don't send a generic greeting.

		if (!this.waitingForUserToStart) {
			logger.info('🎵 ConversationStore: Initial greeting already sent');
			return;
		}

		logger.info('🎵 ConversationStore: User initiated conversation, sending initial greeting...');
		this.waitingForUserToStart = false;

		// Add a small delay to ensure session update is processed before sending response
		setTimeout(() => {
			// Send the initial response to get AI greeting
			realtimeOpenAI.sendResponse();
		}, 100);

		// REMOVED: Retry mechanism that was causing duplicate responses
		// The retry was sending a second response.create while the first was still processing,
		// causing the AI to respond to itself. The initial sendResponse() is sufficient.
		// If users report issues with the initial greeting not appearing, we can add a more
		// robust check that properly detects streaming responses in progress.
	};

	/**
	 * Enable the microphone audio tracks
	 * This should be called after the user clicks the start button and animation completes
	 */
	enableMicrophone = () => {
		if (!this.audioStream) {
			logger.warn('🎵 ConversationStore: No audio stream available to enable');
			return;
		}

		logger.info('🎵 ConversationStore: Enabling microphone audio tracks...');
		this.audioStream.getAudioTracks().forEach((track) => {
			logger.info(`🔊 Track ${track.id} enabled: ${track.enabled} -> true`);
			track.enabled = true;
		});
		logger.info('✅ ConversationStore: Microphone enabled');
	};

	private applyInstructionUpdate(delta: string) {
		if (!this.language) return;
		const combined = `${this.lastInstructions}\n\n${delta}`;
		realtimeOpenAI.updateSessionConfig({
			instructions: combined,
			turnDetection: this.getTurnDetectionConfig(),
			voice: this.voice,
			transcriptionLanguage: this.language.code
		});
		this.lastInstructions = combined;
	}

	private detectLanguageCode(text: string, nativeCode: string, _targetCode: string): string | null {
		const t = (text || '').toLowerCase();
		if (!t || t.length < 2) return null;
		// Script-based quick checks
		if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(t)) return 'ja';
		if (/[\uAC00-\uD7AF]/.test(t)) return 'ko';
		if (/[\u0400-\u04FF]/.test(t)) return 'ru';
		if (/[\u0600-\u06FF]/.test(t)) return 'ar';
		if (/[\u0900-\u097F]/.test(t)) return 'hi';
		if (/[\u4E00-\u9FFF]/.test(t)) return 'zh';
		// Latin-based heuristic; focus on user's native language cues
		const asciiLetters = t.match(/[a-z]/g)?.length || 0;
		const asciiRatio = asciiLetters / t.length;
		if (asciiRatio < 0.5) return null;
		// Minimal stopwords per lang
		const stops: Record<string, string[]> = {
			en: [' the ', ' and ', ' i ', " i'm ", ' you ', ' to ', ' in ', ' is ', ' it ', " don't "],
			nl: [' de ', ' het ', ' en ', ' ik ', ' jij ', ' je ', ' niet ', ' een ', ' van ', ' voor '],
			es: [' el ', ' la ', ' y ', ' de ', ' que ', ' no ', ' una ', ' un '],
			fr: [' le ', ' la ', ' les ', ' de ', ' des ', ' et ', ' je ', ' ne ', " c'", ' pas '],
			de: [' der ', ' die ', ' das ', ' und ', ' ist ', ' nicht ', ' ich ', ' du '],
			it: [' il ', ' la ', ' e ', ' di ', ' che ', ' non ', ' un ', ' una '],
			pt: [' o ', ' a ', ' e ', ' de ', ' que ', ' não ', ' um ', ' uma '],
			tr: [' ve ', ' bir ', ' değil ', ' için ', ' ben ', ' sen ', ' o '],
			id: [' dan ', ' yang ', ' saya ', ' kamu ', ' tidak ', ' ini ', ' itu '],
			fil: [' at ', ' ako ', ' ikaw ', ' hindi ', ' ito ', ' iyon '],
			vi: [' và ', ' tôi ', ' bạn ', ' không ', ' một ', ' là ', ' trong ']
		};
		const nativeStops = stops[nativeCode];
		if (nativeStops && nativeStops.some((w) => t.includes(w))) return nativeCode;
		// If text looks purely ASCII words and no strong native stopword match, guess English as fallback
		if (!nativeStops && asciiRatio > 0.7) return 'en';
		return null;
	}

	private clearTranscriptionState(): void {
		const newState = transcriptionStateService.clearTranscriptionState();
		this.currentTranscript = newState.currentTranscript;
		this.isTranscribing = newState.isTranscribing;
	}

	private cleanup(): void {
		logger.info('🧹 ConversationStore: Cleaning up conversation resources...');
		logger.info(
			'🧹 ConversationStore: Before cleanup - audioStore.isRecording:',
			audioStore.isRecording,
			'audioStream exists:',
			!!this.audioStream
		);

		// Clean up browser lifecycle handlers
		this.cleanupBrowserLifecycleHandlers();

		// Clear any pending save timeouts
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
			this.saveTimeout = null;
		}

		// Clear any pending greeting retry
		if (this.greetingRetryTimeout) {
			clearTimeout(this.greetingRetryTimeout);
			this.greetingRetryTimeout = null;
		}

		// Close realtime session
		logger.info('🧹 ConversationStore: Closing SDK realtime session');
		try {
			this.messageUnsub?.();
		} catch {
			logger.info('an error with conversation store. Chekc it out');
		}
		this.messageUnsub = null;
		try {
			this.sessionReadyUnsub?.();
		} catch {
			logger.info('an error with session ready listener cleanup');
		}
		this.sessionReadyUnsub = null;
		try {
			this.vadUnsub?.();
		} catch {
			logger.info('an error with VAD listener cleanup');
		}
		this.vadUnsub = null;
		this.sessionReadyHandled = false;
		this.messageHandlersSetup = false;
		this.stopTurnLevelMonitor();
		this.currentTurnStartMs = null;
		this.turnMaxInputLevel = 0;
		this.suppressNextUserTranscript = false;
		try {
			realtimeOpenAI.disconnect();
		} catch {
			logger.info('an error with conversation store. Chekc it out');
		}

		// Stop audio stream
		if (this.audioStream) {
			logger.info('🧹 ConversationStore: Stopping audio stream');
			audioStore.stopRecording();
			this.audioStream = null;
		}

		this.timer.cleanup();

		// Note: Don't stop audio recording here - it should continue for UI audio level display
		// The audio store will handle its own cleanup when needed
		logger.info(
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

	// New method: Only dismiss analysis notification without resetting conversation
	dismissAnalysisNotification = () => {
		userPreferencesStore.clearAnalysisResults();
		// Don't reset conversation state - keep messages and continue conversation
	};

	reset = () => {
		if (browser) {
			this.cleanup();
		}
		this.resetState();
		this.timer.reset();
		this.currentOptions = null;
		log('Conversation store reset');
	};

	forceCleanup = () => {
		logger.info('Force cleaning up conversation store...');
		try {
			this.cleanup();
		} catch (error) {
			logger.warn('Error during cleanup:', error);
		}
		try {
			this.timer.cleanup();
		} catch (error) {
			logger.warn('Error during timer cleanup:', error);
		}
		this.resetState();
		logger.info('Force cleanup complete');
	};

	private handleTimerExpiration(): void {
		logger.info('Timer expired - initiating graceful shutdown');

		// Set graceful ending state
		this.isGracefullyEnding = true;

		// Check if we need to wait for audio/AI completion
		const needsGracefulWait = this.shouldWaitBeforeEnding();

		if (needsGracefulWait) {
			logger.info('Waiting for audio/AI completion before ending conversation');
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
		const audioIsPlaying = false;

		logger.info('Graceful shutdown check:', {
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
		this.waitingForAudioCompletion = false;
		this.waitingForAIResponse = messageService.hasStreamingMessage(this.messages);

		// Set up listeners for completion events
		this.setupGracefulShutdownListeners();

		// Set a maximum wait time (e.g., 10 seconds)
		setTimeout(() => {
			if (this.isGracefullyEnding) {
				logger.info('Graceful shutdown timeout - proceeding with analysis');
				this.proceedWithAnalysisAndEnd();
			}
		}, 10000); // 10 second timeout
	}

	private setupGracefulShutdownListeners(): void {
		// Listen for audio completion
		// We don't maintain a direct audio element reference here with the new store
		const audioElement = undefined as unknown as HTMLAudioElement | undefined;

		const onAudioEnd = () => {
			logger.info('Audio playback completed');
			this.waitingForAudioCompletion = false;
			try {
				audioElement?.removeEventListener('ended', onAudioEnd);
			} catch {
				logger.info('an error with conversation store. Chekc it out');
			}
			try {
				audioElement?.removeEventListener('pause', onAudioEnd);
			} catch {
				logger.info('an error with conversation store. Chekc it out');
			}
			this.checkIfReadyToEnd();
		};

		try {
			audioElement?.addEventListener('ended', onAudioEnd);
		} catch {
			logger.info('an error with conversation store. Chekc it out');
		}
		try {
			audioElement?.addEventListener('pause', onAudioEnd);
		} catch {
			logger.info('an error with conversation store. Chekc it out');
		}

		// The AI response completion will be handled in your existing message handling
		// We'll check for completion in the existing handleProcessedEvent method
	}

	private checkIfReadyToEnd(): void {
		if (!this.isGracefullyEnding) return;

		const stillWaiting =
			this.waitingForAudioCompletion ||
			this.waitingForAIResponse ||
			this.speechDetected ||
			this.isTranscribing ||
			messageService.hasStreamingMessage(this.messages);

		logger.info('Checking if ready to end:', {
			stillWaiting,
			waitingForAudioCompletion: this.waitingForAudioCompletion,
			waitingForAIResponse: this.waitingForAIResponse,
			speechDetected: this.speechDetected,
			isTranscribing: this.isTranscribing,
			hasStreamingMessage: messageService.hasStreamingMessage(this.messages)
		});

		if (!stillWaiting) {
			logger.info('All conditions met - proceeding with analysis and end');
			this.proceedWithAnalysisAndEnd();
		}
	}

	private async proceedWithAnalysisAndEnd(): Promise<void> {
		if (this.analysisTriggered) {
			logger.info('Analysis already triggered, skipping');
			return;
		}

		this.analysisTriggered = true;

		try {
			logger.info('Starting conversation analysis...');

			// Ensure realtime session and audio are fully torn down before analysis
			// so the connection does not linger after the timer expires.
			// This preserves messages for analysis while cutting the transport.
			try {
				this.cleanup();
			} catch (e) {
				logger.warn('Cleanup before analysis failed (continuing):', e);
			}

			// Trigger analysis if we have messages and language
			if (this.messages.length > 0 && this.language) {
				this.status = 'analyzing';
				await this.triggerOnboardingAnalysis();
				this.status = 'analyzed';

				logger.info('Analysis completed successfully');
			} else {
				logger.info('Skipping analysis - no messages or language');
				// End conversation normally without analysis
				this.endConversation();
			}
		} catch (error) {
			logger.error('Error during analysis:', error);
			// Even if analysis fails, we should still end the conversation
			this.endConversation();
		}
	}

	// Modify your existing triggerOnboardingAnalysis method to be more robust
	public async triggerOnboardingAnalysis(messagesToAnalyze?: Message[]): Promise<void> {
		if (!this.language) {
			logger.warn('Cannot trigger onboarding analysis: missing language');
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
			logger.info('No complete messages for analysis');
			return;
		}

		logger.info(`Analyzing ${completeMessages.length} complete messages`);

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
			logger.info('Analysis results saved to user preferences');
		} else {
			logger.error('Onboarding analysis failed:', result.error);
			userPreferencesStore.clearAnalysisResults();
			throw new Error(`Analysis failed: ${result.error}`);
		}
	}

	get timerState(): ConversationTimerStore['state'] {
		return this.timer.state;
	}

	get usageLimits(): ConversationTimerStore['usageLimits'] {
		return this.timer.usageLimits;
	}

	get analysisMessages(): Message[] {
		return this.messagesForAnalysis;
	}

	get currentSessionId(): string {
		return this.sessionId;
	}

	// === CONVERSATION PERSISTENCE ===

	/**
	 * Save current conversation to database
	 */
	private async saveConversationToDatabase(isOnDestroy = false): Promise<void> {
		if (!browser || !this.sessionId || !this.language) {
			logger.info('⏭️ Skipping save - no session or language');
			return;
		}

		// Only save if we have meaningful messages
		const meaningfulMessages = this.messages.filter(
			(msg) =>
				msg.content &&
				msg.content.trim().length > 0 &&
				!msg.content.includes('[Speaking...]') &&
				!msg.content.includes('[Transcribing...]')
		);

		if (meaningfulMessages.length === 0) {
			logger.info('⏭️ Skipping save - no meaningful messages');
			return;
		}

		try {
			const now = new SvelteDate();
			const startTime = this.conversationStartTime || now;
			const durationSeconds = Math.round((now.getTime() - startTime.getTime()) / 1000);

			const conversationData = conversationPersistenceService.createConversationSaveData(
				this.sessionId,
				this.language,
				this.isGuestUser,
				userManager.user?.id,
				startTime,
				now,
				durationSeconds
			);

			const preparedMessages =
				conversationPersistenceService.prepareMessagesForSave(meaningfulMessages);

			const sessionMetadata = this.buildSessionMetadata(startTime, now, durationSeconds);

			logger.info('💾 Saving conversation to database...', {
				sessionId: this.sessionId,
				messagesCount: preparedMessages.length,
				isOnDestroy,
				durationSeconds,
				hasSessionMetadata: !!sessionMetadata
			});

			// Use retry logic for critical saves (onDestroy)
			const result = isOnDestroy
				? await conversationPersistenceService.saveConversationWithRetry(
						conversationData,
						preparedMessages,
						sessionMetadata
					)
				: await conversationPersistenceService.saveConversation(
						conversationData,
						preparedMessages,
						sessionMetadata
					);

			if (result.success) {
				this.lastSaveTime = now;
				logger.info('✅ Conversation saved successfully');
			} else {
				logger.error('❌ Failed to save conversation:', result.error);
			}
		} catch (error) {
			logger.error('❌ Error saving conversation:', error);
		}
	}

	/**
	 * Save conversation using sendBeacon for reliable save during page unload
	 */
	private saveConversationViaBeacon(): void {
		if (!browser || !this.sessionId || !this.language || typeof navigator === 'undefined') {
			return;
		}

		const meaningfulMessages = this.messages.filter(
			(msg) =>
				msg.content &&
				msg.content.trim().length > 0 &&
				!msg.content.includes('[Speaking...]') &&
				!msg.content.includes('[Transcribing...]')
		);

		if (meaningfulMessages.length === 0) return;

		try {
			const now = new SvelteDate();
			const startTime = this.conversationStartTime || now;
			const durationSeconds = Math.round((now.getTime() - startTime.getTime()) / 1000);

			const conversationData = conversationPersistenceService.createConversationSaveData(
				this.sessionId,
				this.language,
				this.isGuestUser,
				userManager.user?.id,
				startTime,
				now,
				durationSeconds
			);

			const preparedMessages =
				conversationPersistenceService.prepareMessagesForSave(meaningfulMessages);

			const sessionMetadata = this.buildSessionMetadata(startTime, now, durationSeconds);

			const payload = JSON.stringify({
				conversation: conversationData,
				messages: preparedMessages,
				...(sessionMetadata && {
					sessionMetadata: {
						...sessionMetadata,
						startTime: sessionMetadata.startTime?.toISOString(),
						endTime: sessionMetadata.endTime ? sessionMetadata.endTime.toISOString() : null
					}
				})
			});

			// Use sendBeacon for reliable delivery during page unload
			const sent = navigator.sendBeacon('/api/conversations', payload);

			if (sent) {
				logger.info('📡 Conversation sent via beacon');
			} else {
				logger.warn('⚠️ Failed to send beacon - falling back to sync save');
				// Fallback: try synchronous fetch
				fetch('/api/conversations', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: payload,
					keepalive: true
				}).catch((error) => {
					logger.error('❌ Beacon fallback failed:', error);
				});
			}
		} catch (error) {
			logger.error('❌ Error saving via beacon:', error);
		}
	}

	/**
	 * Count user messages (excluding empty messages and [Speaking...] placeholders)
	 */
	private countUserMessages(): number {
		return this.messages.filter(
			(msg) =>
				msg.role === 'user' &&
				msg.content?.trim().length > 0 &&
				!msg.content.includes('[Speaking...]')
		).length;
	}

	/**
	 * Call post-run endpoint for conversation analysis
	 * Includes idempotency key to prevent duplicate processing
	 */
	private async callPostRunEndpoint(
		userId: string,
		userMessageCount: number,
		durationSeconds: number
	): Promise<void> {
		try {
			// Generate unique idempotency key for this post-run
			const idempotencyKey = `post-run_${this.sessionId}_${Date.now()}`;

			const response = await fetch(`/api/conversations/${this.sessionId}/post-run`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Idempotency-Key': idempotencyKey
				},
				body: JSON.stringify({
					userId,
					messageCount: userMessageCount,
					durationSeconds
				})
			});

			const data = await response.json();

			if (response.ok) {
				logger.info('✅ Post-run processing complete:', data);
			} else {
				logger.warn('⚠️ Post-run processing failed:', data);
			}
		} catch (error) {
			logger.warn('⚠️ Post-run endpoint call failed:', error);
			// Don't throw - conversation is already saved, this is just enhancement
		}
	}

	private async completeSessionUsage(reason: 'manual-end' | 'destroy'): Promise<void> {
		if (this.usageRecorded) return;

		const elapsedSeconds = this.timer.getTimeElapsedSeconds();

		if (elapsedSeconds <= 0) {
			this.usageRecorded = true;
			return;
		}

		const timerState = this.timer.state;
		const extensionsUsed = timerState?.extensionsUsed ?? 0;

		// Update local usage snapshot immediately so UI reflects the session we just finished.
		this.timer.updateUsage();

		const userId = userManager.user?.id;
		if (!userId || userId === 'guest' || !this.sessionId) {
			this.usageRecorded = true;
			return;
		}

		try {
			const usageSnapshot = await usageTracker.recordConversationUsage({
				userId,
				conversationId: this.sessionId,
				sessionId: this.sessionId,
				durationSeconds: elapsedSeconds,
				audioSeconds: elapsedSeconds,
				wasExtended: extensionsUsed > 0,
				extensionsUsed
			});

			if (usageSnapshot) {
				this.applyUsageContext(userId, usageSnapshot);
			}

			// NEW: Call post-run endpoint for memory extraction and preference updates
			const userMessageCount = this.countUserMessages();
			if (userMessageCount >= 2) {
				logger.info('📨 Calling post-run endpoint:', {
					conversationId: this.sessionId,
					userId,
					messageCount: userMessageCount,
					durationSeconds: elapsedSeconds
				});
				await this.callPostRunEndpoint(userId, userMessageCount, elapsedSeconds);
			} else {
				logger.info('⏭️ Skipping post-run: fewer than 2 user messages', {
					conversationId: this.sessionId,
					messageCount: userMessageCount
				});
			}
		} catch (error) {
			logger.error('Failed to record conversation usage', { reason, error });
		} finally {
			this.usageRecorded = true;
		}
	}

	/**
	 * Debounced save - prevents too many rapid saves
	 */
	private debouncedSave(): void {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}

		this.saveTimeout = setTimeout(() => {
			this.queueConversationSave();
			this.saveTimeout = null;
		}, 500); // 500ms debounce
	}

	/**
	 * Queue conversation for background saving
	 */
	queueConversationSave(): void {
		if (!browser || !this.sessionId || !this.language) return;

		const meaningfulMessages = this.messages.filter(
			(msg) =>
				msg.content &&
				msg.content.trim().length > 0 &&
				!msg.content.includes('[Speaking...]') &&
				!msg.content.includes('[Transcribing...]')
		);

		if (meaningfulMessages.length === 0) return;

		const now = new SvelteDate();
		const startTime = this.conversationStartTime || now;
		const durationSeconds = Math.round((now.getTime() - startTime.getTime()) / 1000);

		const conversationData = conversationPersistenceService.createConversationSaveData(
			this.sessionId,
			this.language,
			this.isGuestUser,
			userManager.user?.id,
			startTime,
			now,
			durationSeconds
		);

		const preparedMessages =
			conversationPersistenceService.prepareMessagesForSave(meaningfulMessages);

		const sessionMetadata = this.buildSessionMetadata(startTime, now, durationSeconds);

		conversationPersistenceService.queueSave(conversationData, preparedMessages, sessionMetadata);
	}

	// Modify your existing endConversation method to handle graceful shutdown
	endConversation = async () => {
		if (!browser) return;

		logger.info('Ending conversation...', {
			isGracefullyEnding: this.isGracefullyEnding,
			analysisTriggered: this.analysisTriggered,
			status: this.status,
			stack: new Error().stack
		});

		// If we're not already gracefully ending, set the flag
		if (!this.isGracefullyEnding) {
			this.isGracefullyEnding = true;
		}

		// Save conversation to database before ending
		try {
			await this.saveConversationToDatabase(false);
		} catch (error) {
			logger.warn('Failed to save conversation on end:', error);
		}

		await this.completeSessionUsage('manual-end');

		// Stop timer
		this.timer.stop();

		// Clean up connections but preserve messages for analysis
		this.cleanup();

		// Trigger analysis if we have messages and haven't already analyzed
		if (this.messages.length > 0 && this.language && !this.analysisTriggered) {
			logger.info('Manually ending conversation - triggering analysis');
			logger.info('Messages count:', this.messages.length);
			logger.info('Language:', this.language);
			logger.info('Analysis triggered:', this.analysisTriggered);

			// Store messages for analysis display before clearing them
			this.messagesForAnalysis = [...this.messages];

			this.status = 'analyzing';
			this.analysisTriggered = true;

			// Store messages for analysis before they might get cleared
			const messagesForAnalysis = [...this.messages];

			this.triggerOnboardingAnalysis(messagesForAnalysis)
				.then(() => {
					this.status = 'analyzed';
					logger.info('Analysis completed after manual end');
				})
				.catch((error) => {
					logger.error('Error during analysis after manual end:', error);
					this.status = 'idle';
				});
		} else {
			logger.info('No analysis needed - resetting state');
			logger.info('Messages count:', this.messages.length);
			logger.info('Language:', this.language);
			logger.info('Analysis triggered:', this.analysisTriggered);
			// Reset state if no analysis needed
			this.resetState();
		}

		logger.info('Conversation ended');
	};

	// Add getter for graceful ending state for UI
	get gracefullyEnding(): boolean {
		return this.isGracefullyEnding;
	}

	// Add method to force end if needed
	forceEndConversation = () => {
		logger.info('Force ending conversation...');
		this.isGracefullyEnding = false;
		this.analysisTriggered = false;
		this.waitingForAudioCompletion = false;
		this.waitingForAIResponse = false;
		this.endConversation();
	};

	// Add method to start new conversation from reviewable state
	// Preserves language, speaker, and scenario for a seamless restart
	startNewConversationFromReview = () => {
		if (!browser) return;

		logger.info('Starting new conversation from review state...');

		// Preserve current conversation context before reset
		const preservedLanguage = this.language;
		const preservedSpeaker = this.speaker;
		const preservedOptions = this.currentOptions;

		// Clear messages and reset state
		this.resetState();

		// Start fresh conversation with preserved context
		if (preservedLanguage) {
			logger.info('Restarting conversation with:', {
				language: preservedLanguage.name,
				speaker: preservedSpeaker?.voiceName,
				hasOptions: !!preservedOptions
			});
			this.startConversation(preservedLanguage, preservedSpeaker, preservedOptions);
		}
	};

	// Add method to preserve conversation context for analysis navigation
	preserveForAnalysis = () => {
		if (!browser) return;

		logger.info('Preserving conversation for analysis...');

		// Keep messages and session info for analysis page
		this.messagesForAnalysis = [...this.messages];

		// Stop timer but don't reset session info yet
		this.timer.stop();

		// Clean up realtime connections but preserve state
		this.cleanup();

		logger.info(
			'Conversation preserved for analysis with',
			this.messagesForAnalysis.length,
			'messages'
		);
	};

	// Add method to completely destroy conversation (for page changes, etc.)
	destroyConversation = async () => {
		if (!browser) return;

		logger.info('Destroying conversation completely...');

		// Save conversation to database before destroying (critical save with retry)
		try {
			await this.saveConversationToDatabase(true);
		} catch (error) {
			logger.error('Failed to save conversation on destroy:', error);
		}

		await this.completeSessionUsage('destroy');

		// Stop timer completely
		this.timer.stop();

		// Clean up all resources
		this.cleanup();

		// Reset all state
		this.resetState();

		logger.info('Conversation completely destroyed');
	};

	// Add method to force clear all conversation state without saving
	forceClearConversation = () => {
		if (!browser) return;

		logger.info('🧹 Force clearing conversation state...');

		// Stop timer
		this.timer.stop();

		// Clean up all resources
		this.cleanup();

		// Reset all state
		this.resetState();

		// Clear any pending saves
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
			this.saveTimeout = null;
		}

		logger.info('✅ Conversation state force cleared');
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
		this.conversationStartTime = null;
		this.lastSaveTime = null;
		this.clearTranscriptionState();
		this.usageRecorded = false;
	}

	private detectDeviceType(): 'desktop' | 'mobile' | 'tablet' | null {
		if (!browser || typeof navigator === 'undefined') {
			return null;
		}

		const ua = navigator.userAgent.toLowerCase();

		if (/(ipad|tablet|playbook|silk)/.test(ua)) {
			return 'tablet';
		}

		if (/(mobi|android|iphone|ipod)/.test(ua)) {
			return 'mobile';
		}

		return 'desktop';
	}

	private buildSessionMetadata(
		startTime: Date,
		endTime: Date,
		durationSeconds: number
	): NewConversationSession | null {
		if (!this.language) {
			return null;
		}

		const userId = userManager.user?.id ?? null;
		const secondsConsumed = this.timer.getTimeElapsedSeconds() || durationSeconds;
		const timerState = this.timer.state;
		const extensionsUsed = timerState?.extensionsUsed ?? 0;

		return conversationPersistenceService.createSessionMetadata(this.sessionId, {
			language: this.language,
			userId,
			startTime,
			endTime,
			durationSeconds,
			secondsConsumed,
			inputTokens: 0,
			wasExtended: extensionsUsed > 0,
			extensionsUsed,
			transcriptionMode: this.transcriptionMode,
			deviceType: this.detectDeviceType()
		});
	}
}

// Export singleton instance
export const conversationStore = new ConversationStore();
