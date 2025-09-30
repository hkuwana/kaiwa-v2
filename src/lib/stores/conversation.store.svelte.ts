// src/lib/stores/conversation.store.svelte.ts
// Simplified conversation store using functional realtime service
// ! Need to make sure that onboarding update in the beginning of the conversation is handled
// ! Need to make sure that the conversation is properly handled
// ! Need to make sure that the user preferences are properly handled
// ! Need to ensure that when the conversation is ended, the onboarding for userPreferences runs

import { browser } from '$app/environment';

// Environment-based logging
const isDev = browser && typeof window !== 'undefined' && window.location.hostname === 'localhost';
const log = (...args: unknown[]) => isDev && console.log(...args);
import { realtimeService } from '$lib/services';
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
import type { Message, Language, UserPreferences, UserTier } from '$lib/server/db/types';
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
import { SvelteDate, SvelteSet } from 'svelte/reactivity';
import { conversationPersistenceService } from '$lib/services/conversation-persistence.service';

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

	// Conversation tracking
	private conversationStartTime = $state<Date | null>(null);
	private lastSaveTime = $state<Date | null>(null);

	// Private connection state (SDK only)
	private audioStream: MediaStream | null = null;
	private messageUnsub: (() => void) | null = null;
	private timer: ConversationTimerStore = $state(createConversationTimerStore('free'));
	private currentOptions: Partial<UserPreferences> | null = null;
	// Mirror + sanitize tracking
	private sanitizedMessageIds = new SvelteSet<string>();
	private lastInstructions: string = '';
	private nativeSwitchAnnounced: boolean = false;

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
		console.log('🚀 ConversationStore: Starting conversation:', {
			browser,
			isBrowser: typeof window !== 'undefined',
			status: this.status,
			language: language?.name,
			speaker: typeof speaker === 'object' ? speaker?.voiceName : speaker
		});

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
			// 1. Initialize audio store if not already initialized
			if (!audioStore.isInitialized) {
				console.log('🎵 ConversationStore: Initializing audio store...');
				await audioStore.initialize();
			}

			// 2. Request audio permission and start recording
			console.log('🎵 ConversationStore: Requesting audio permission and starting recording...');
			const audioResult = await audioStore.requestPermissionGracefully();

			if (!audioResult.success) {
				const errorMessage = audioResult.error?.message || 'Failed to get microphone access';
				console.error('❌ ConversationStore: Audio permission denied:', errorMessage);
				throw new Error(`Audio setup failed: ${errorMessage}`);
			}

			// Get the stream from the audio store
			this.audioStream = audioStore.getCurrentStream();
			console.log(
				'🎵 ConversationStore: After starting recording - stream exists:',
				!!this.audioStream,
				'audioStore.isRecording:',
				audioStore.isRecording
			);
			if (this.audioStream === null) {
				throw new Error('No audio stream available after successful permission request');
			}

			// 3. Get session from backend
			const sessionData = await this.fetchSessionFromBackend();
			this.sessionId = sessionData.session_id;

			// 4. Connect via SDK-backed store
			await realtimeOpenAI.connect(sessionData, this.audioStream, {
				voice: this.voice
			});

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
		if (!browser) return;
		// Send via SDK high-level API; ConversationStore mirrors from realtimeOpenAI
		realtimeOpenAI.sendTextMessage(content);
	};

	pauseStreaming = () => {
		if (!this.audioStream) {
			console.log('🎙️ ConversationStore: pauseStreaming ignored - no active stream');
			return;
		}

		const track = this.audioStream.getAudioTracks()[0];
		console.log('🎙️ ConversationStore: pauseStreaming requested', {
			audioStoreRecording: audioStore.isRecording,
			currentLevel: audioStore.currentLevel.level,
			streamId: this.audioStream.id,
			track: this.describeAudioTrack(track)
		});

		realtimeOpenAI.pttStop(this.audioStream);
		if (track) {
			track.enabled = false;
		}
		try {
			audioStore.currentLevel = { level: 0, timestamp: Date.now() };
		} catch (err) {
			console.warn('🎙️ ConversationStore: Failed to reset audio level on pause', err);
		}

		console.log('🎙️ ConversationStore: pauseStreaming applied', {
			track: this.describeAudioTrack(track)
		});
	};

	resumeStreaming = () => {
		if (!this.audioStream) {
			console.log('🎙️ ConversationStore: resumeStreaming ignored - no active stream');
			return;
		}

		const track = this.audioStream.getAudioTracks()[0];
		console.log('🎙️ ConversationStore: resumeStreaming requested', {
			audioStoreRecording: audioStore.isRecording,
			currentLevel: audioStore.currentLevel.level,
			streamId: this.audioStream.id,
			track: this.describeAudioTrack(track)
		});

		realtimeOpenAI.pttStart(this.audioStream);
		if (track) {
			track.enabled = true;
		}

		console.log('🎙️ ConversationStore: resumeStreaming applied', {
			track: this.describeAudioTrack(track)
		});
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
		if (this.status === 'idle' || !this.language) return;

		const currentConfig = sessionManagerService.createSessionUpdateConfig(
			updates,
			this.language,
			this.voice
		);

		realtimeOpenAI.updateSessionConfig({
			model: currentConfig.model,
			voice: this.voice,
			instructions: currentConfig.instructions
		});
	};

	// === GETTERS ===

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
			}
		};
	};

	private describeAudioTrack(track?: MediaStreamTrack) {
		if (!track) return null;
		let settings: MediaTrackSettings | undefined;
		let constraints: MediaTrackConstraints | undefined;
		try {
			settings = track.getSettings();
		} catch (error) {
			console.warn('🎙️ ConversationStore: Failed to read track settings', error);
		}
		try {
			constraints = track.getConstraints();
		} catch (error) {
			console.warn('🎙️ ConversationStore: Failed to read track constraints', error);
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

	// === PRIVATE METHODS ===

	private async fetchSessionFromBackend() {
		const lang = this.language?.code || 'en';
		// Use existing sessionId if available, otherwise generate new one
		const sessionIdToUse = this.sessionId || crypto.randomUUID();
		this.sessionId = sessionIdToUse; // Ensure sessionId is set
		return sessionManagerService.fetchSessionFromBackend(sessionIdToUse, this.voice, lang);
	}

	private setupRealtimeEventHandlers(): void {
		// Subscribe to SDK history stream through the new store
		try {
			this.messageUnsub?.();
		} catch {
			console.log('an error with conversation store. Chekc it out');
		}
		this.messageUnsub = realtimeOpenAI.onMessageStream(async (ev) => {
			console.log('📨 ConversationStore: Message stream event:', {
				role: ev.role,
				final: ev.final,
				realtimeMessagesCount: realtimeOpenAI.messages.length,
				currentConvMessagesCount: this.messages.length
			});

			// Mirror: copy realtime messages directly with duplicate removal
			const newMessages = messageService.removeDuplicateMessages(
				messageService.sortMessagesBySequence([...realtimeOpenAI.messages])
			);

			console.log('🔄 ConversationStore: Message mirroring:', {
				before: this.messages.length,
				after: newMessages.length,
				change: newMessages.length - this.messages.length
			});

			this.messages = newMessages;

			if (!ev.final) return;

			// Auto-save after user messages (every few user interactions)
			if (ev.role === 'user') {
				const userMessageCount = this.messages.filter((m) => m.role === 'user').length;
				// Save every 3 user messages, or if it's been more than 2 minutes since last save
				const timeSinceLastSave = this.lastSaveTime
					? Date.now() - this.lastSaveTime.getTime()
					: Number.MAX_SAFE_INTEGER;

				// Only save if no streaming messages are currently active
				const hasStreamingMessages = messageService.hasStreamingMessage(this.messages);

				if ((userMessageCount % 3 === 0 || timeSinceLastSave > 120000) && !hasStreamingMessages) {
					console.log('🔄 Auto-saving conversation (user message trigger)');
					this.queueConversationSave();
				} else if (hasStreamingMessages) {
					console.log('⏭️ Skipping auto-save - streaming messages active');
				}
			}

			// Trigger save after assistant messages complete (with delay to ensure finalization)
			if (ev.role === 'assistant') {
				const hasStreamingMessages = messageService.hasStreamingMessage(this.messages);
				if (!hasStreamingMessages) {
					console.log('🤖 Assistant message complete - scheduling save');
					// Delay save slightly to ensure all message processing is complete
					setTimeout(() => {
						this.queueConversationSave();
					}, 500);
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
						if (lang !== 'other') {
							generateAndStoreScriptsForMessage(msg.id, msg.content, lang).catch(() => {});
						}
					}
				}

				// Add translation if needed
				// For language learning: if user is learning Japanese, their native language is English
				const userNativeLanguage = userManager.user.nativeLanguageId || 'en';

				if (messageService.needsTranslation(updatedMsg, userNativeLanguage)) {
					console.log(
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

		// Immediately emulate session-created logic
		console.log('🎵 ConversationStore: Session created, sending initial setup...');
		console.log(
			'🎵 ConversationStore: Event handlers set up, realtime messages:',
			realtimeOpenAI.messages.length
		);
		this.sendInitialSetup();
		this.status = 'connected';
		console.log('🎵 ConversationStore: Status changed to "connected"');

		// Always start with streaming paused so the user explicitly taps the mic
		// before any audio is sent. This avoids capturing audio before consent.
		try {
			if (this.audioStream) {
				this.pauseStreaming();
			}
		} catch (e) {
			console.warn('Failed to apply initial push_to_talk gating:', e);
		}

		// Create preferences provider for checking onboarding
		const preferencesProvider = {
			isGuest: () => userPreferencesStore.isGuest(),
			getPreference: <K extends keyof import('$lib/server/db/types').UserPreferences>(key: K) =>
				userPreferencesStore.getPreference(key),
			updatePreferences: (updates: Partial<import('$lib/server/db/types').UserPreferences>) =>
				userPreferencesStore.updatePreferences(updates)
		};

		// Start timer with onboarding callback if needed
		if (onboardingManagerService.shouldTriggerOnboarding(preferencesProvider)) {
			this.timer.start(() => {
				console.log('Conversation timer expired!');
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

		console.log('Sending session configuration with complete instructions:', {
			language: this.language.name,
			voice: this.voice,
			model: sessionConfig.model,
			isFirstTime,
			isGuest: this.isGuestUser,
			instructionType: isFirstTime ? 'complete-onboarding' : 'complete-session'
		});

		// Send the combined configuration
		realtimeOpenAI.updateSessionConfig({
			model: sessionConfig.model,
			voice: this.voice,
			instructions: sessionConfig.instructions
		});

		this.lastInstructions = sessionConfig.instructions;

		// Greet proactively based on preferences
		// TODO: Get autoGreet from userSettings instead
		const autoGreet = true; // Default since audioSettings moved to userSettings table
		if (autoGreet) {
			// Force a greeting even without prior user input
			realtimeOpenAI.sendResponse();

			// Optional safety retry after 1.5s if no assistant message yet
			setTimeout(() => {
				if (!realtimeOpenAI.isConnected) return;
				const hasAssistant = this.messages.some((m) => m.role === 'assistant');
				if (!hasAssistant) {
					realtimeOpenAI.sendResponse();
				}
			}, 1500);
		} else {
			// Fallback: basic response request
			realtimeOpenAI.sendResponse();
		}
	}

	private applyInstructionUpdate(delta: string) {
		if (!this.language) return;
		const combined = `${this.lastInstructions}\n\n${delta}`;
		realtimeOpenAI.updateSessionConfig({
			instructions: combined
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
		console.log('🧹 ConversationStore: Cleaning up conversation resources...');
		console.log(
			'🧹 ConversationStore: Before cleanup - audioStore.isRecording:',
			audioStore.isRecording,
			'audioStream exists:',
			!!this.audioStream
		);

		// Close realtime session
		console.log('🧹 ConversationStore: Closing SDK realtime session');
		try {
			this.messageUnsub?.();
		} catch {
			console.log('an error with conversation store. Chekc it out');
		}
		this.messageUnsub = null;
		try {
			realtimeOpenAI.disconnect();
		} catch {
			console.log('an error with conversation store. Chekc it out');
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
		const audioIsPlaying = false;

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
		this.waitingForAudioCompletion = false;
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
		// We don't maintain a direct audio element reference here with the new store
		const audioElement = undefined as unknown as HTMLAudioElement | undefined;

		const onAudioEnd = () => {
			console.log('Audio playback completed');
			this.waitingForAudioCompletion = false;
			try {
				audioElement?.removeEventListener('ended', onAudioEnd);
			} catch {
				console.log('an error with conversation store. Chekc it out');
			}
			try {
				audioElement?.removeEventListener('pause', onAudioEnd);
			} catch {
				console.log('an error with conversation store. Chekc it out');
			}
			this.checkIfReadyToEnd();
		};

		try {
			audioElement?.addEventListener('ended', onAudioEnd);
		} catch {
			console.log('an error with conversation store. Chekc it out');
		}
		try {
			audioElement?.addEventListener('pause', onAudioEnd);
		} catch {
			console.log('an error with conversation store. Chekc it out');
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

			// Ensure realtime session and audio are fully torn down before analysis
			// so the connection does not linger after the timer expires.
			// This preserves messages for analysis while cutting the transport.
			try {
				this.cleanup();
			} catch (e) {
				console.warn('Cleanup before analysis failed (continuing):', e);
			}

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
			console.log('⏭️ Skipping save - no session or language');
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
			console.log('⏭️ Skipping save - no meaningful messages');
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

			console.log('💾 Saving conversation to database...', {
				sessionId: this.sessionId,
				messagesCount: preparedMessages.length,
				isOnDestroy,
				durationSeconds
			});

			// Use retry logic for critical saves (onDestroy)
			const result = isOnDestroy
				? await conversationPersistenceService.saveConversationWithRetry(
						conversationData,
						preparedMessages
					)
				: await conversationPersistenceService.saveConversation(conversationData, preparedMessages);

			if (result.success) {
				this.lastSaveTime = now;
				console.log('✅ Conversation saved successfully');
			} else {
				console.error('❌ Failed to save conversation:', result.error);
			}
		} catch (error) {
			console.error('❌ Error saving conversation:', error);
		}
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

		conversationPersistenceService.queueSave(conversationData, preparedMessages);
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

		// Save conversation to database before ending
		this.saveConversationToDatabase(false).catch((error) => {
			console.warn('Failed to save conversation on end:', error);
		});

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

	// Add method to preserve conversation context for analysis navigation
	preserveForAnalysis = () => {
		if (!browser) return;

		console.log('Preserving conversation for analysis...');

		// Keep messages and session info for analysis page
		this.messagesForAnalysis = [...this.messages];

		// Stop timer but don't reset session info yet
		this.timer.stop();

		// Clean up realtime connections but preserve state
		this.cleanup();

		console.log(
			'Conversation preserved for analysis with',
			this.messagesForAnalysis.length,
			'messages'
		);
	};

	// Add method to completely destroy conversation (for page changes, etc.)
	destroyConversation = async () => {
		if (!browser) return;

		console.log('Destroying conversation completely...');

		// Save conversation to database before destroying (critical save with retry)
		await this.saveConversationToDatabase(true).catch((error) => {
			console.error('Failed to save conversation on destroy:', error);
		});

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
		this.conversationStartTime = null;
		this.lastSaveTime = null;
		this.clearTranscriptionState();
	}
}

// Export singleton instance
export const conversationStore = new ConversationStore();
