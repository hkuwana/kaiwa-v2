// src/lib/stores/conversation.store.svelte.ts
import { SvelteDate } from 'svelte/reactivity';

import { RealtimeService, realtimeService } from '$lib/services/realtime.service';
import { AudioService, audioService, type AudioLevel } from '$lib/services/audio.service';
import type { Message, Language } from '$lib/server/db/types';
import type { Speaker } from '$lib/types';
import { DummyAudioService, type DummyRealtimeService } from '$lib/services/dummy.service';
import {
	createConversationTimerStore,
	type ConversationTimerStore
} from './conversation-timer.store.svelte';

export class ConversationStore {
	// Services - use the exported instances that handle browser/server automatically
	private realtimeService: RealtimeService | DummyRealtimeService;
	private audioService: AudioService | DummyAudioService;

	// Timer store for conversation management
	private timerStore: ConversationTimerStore;

	// Reactive state as class properties
	status = $state<'idle' | 'connecting' | 'connected' | 'streaming' | 'error'>('idle');
	messages = $state<Message[]>([]);
	userId = $state<string | null>(null);
	sessionId = $state<string>('');
	startTime = $state<number>(0);
	language = $state<Language | null>(null); // Store full language object
	voice = 'alloy';
	error = $state<string | null>(null);
	audioLevel = $state.raw<number>(0);
	availableDevices = $state<MediaDeviceInfo[]>([]);
	selectedDeviceId = $state<string>('default');

	// Transcription state
	transcriptionMode = $state<boolean>(false);
	currentTranscript = $state<string>('');
	isTranscribing = $state<boolean>(false);

	constructor() {
		// Use the exported instances that automatically handle browser/server
		this.realtimeService = realtimeService;
		this.audioService = audioService;

		// Initialize timer store
		this.timerStore = createConversationTimerStore('free'); // Default to free tier

		// The rest of your constructor can now safely call methods on this.audioService
		this.audioService.initialize();
		this.audioService.getAvailableDevices().then((devices) => {
			this.availableDevices = devices;
		});

		this.audioService.onStreamReady((stream: MediaStream) => {
			console.log('Audio stream ready:', stream);
		});
		this.audioService.onStreamError((errorMsg: string) => {
			this.error = errorMsg;
			this.status = 'error';
		});
	}

	// Actions become class methods
	startConversation = async (
		language?: Language,
		speaker?: Speaker | string,
		transcriptionOnly: boolean = false
	) => {
		console.log('🚀 startConversation called with:', {
			language: language ? { name: language.name, code: language.code } : 'undefined',
			speaker: speaker
				? typeof speaker === 'string'
					? speaker
					: { voiceName: (speaker as Speaker).voiceName }
				: 'undefined',
			transcriptionOnly
		});

		if (this.status !== 'idle') return;

		// Update language and speaker if provided
		if (language) {
			this.language = language;
			console.log('🌍 Language set in conversation store:', {
				name: this.language.name,
				code: this.language.code,
				nativeName: this.language.nativeName
			});
		} else {
			console.warn('⚠️ No language provided to startConversation');
		}

		// Extract the openAIId from the speaker object if provided
		if (speaker && typeof speaker === 'object' && 'openAIId' in speaker) {
			this.voice = speaker.openAIId || 'alloy';
			console.log('🎭 Using voice:', this.voice, 'for speaker:', speaker.voiceName);
		} else if (speaker && typeof speaker === 'string') {
			// Fallback for backward compatibility
			this.voice = speaker;
			console.log('🎭 Using voice (fallback):', this.voice);
		} else {
			// Default voice if no speaker provided
			this.voice = 'alloy';
			console.log('🎭 Using default voice:', this.voice);
		}

		this.transcriptionMode = transcriptionOnly;
		this.status = 'connecting';
		this.error = null;
		this.currentTranscript = '';
		this.isTranscribing = false;

		try {
			// 1. Test audio constraints for mobile compatibility
			console.log('🧪 Testing audio constraints for mobile compatibility...');
			const constraintTest = await this.audioService.testConstraints();
			if (!constraintTest.success) {
				console.warn('⚠️ Audio constraint test failed:', constraintTest.error);
				console.log('🔄 Proceeding with default constraints...');
			} else {
				console.log('✅ Audio constraint test passed with:', constraintTest.constraints);
			}

			// 2. Get audio stream
			console.log('🎵 Getting audio stream...');
			const audioStream = await this.audioService.getStream(this.selectedDeviceId);
			console.log('✅ Audio stream obtained');

			// Set up audio level tracking immediately after getting the stream
			this.audioService.onLevelUpdate((level: AudioLevel) => {
				this.audioLevel = level.level;
			});

			// 2. Get a session from our backend
			console.log('🔗 Fetching realtime session...');
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
				console.error('❌ Realtime session creation failed:', errorData);

				// Extract the actual error message from OpenAI if available
				let errorMessage = `Failed to get session: ${response.status}`;
				if (errorData.details?.response) {
					try {
						const openAIError = JSON.parse(errorData.details.response);
						if (openAIError.error?.message) {
							errorMessage = `OpenAI Error: ${openAIError.error.message}`;
						}
					} catch {
						// If we can't parse the error, use the raw response
						errorMessage = `OpenAI Error: ${errorData.details.response}`;
					}
				} else if (errorData.error) {
					errorMessage = errorData.error;
				}

				throw new Error(errorMessage);
			}

			const sessionData = await response.json();
			this.sessionId = sessionData.session_id;
			console.log('✅ Session obtained:', this.sessionId);

			// 3. Connect to realtime service
			// Build session configuration based on speaker and language
			console.log('🔍 Current language state:', {
				language: this.language,
				name: this.language?.name,
				code: this.language?.code
			});

			const languageName = this.language?.name || 'English';
			const languageCode = this.language?.code || 'en';

			// Language-specific instructions
			const getLanguageSpecificInstructions = (langName: string, langCode: string) => {
				const baseInstructions = `You are a helpful language tutor for ${langName}. Help the user practice and improve their language skills through natural conversation. Be patient, encouraging, and provide gentle corrections when needed. IMPORTANT: You must respond in ${langName} only. Do not respond in any other language unless specifically asked to translate or explain something.`;

				// Add language-specific guidance
				switch (langCode) {
					case 'ja':
						return `${baseInstructions} Since this is Japanese, pay special attention to pronunciation, honorifics (敬語), and cultural context. Use appropriate politeness levels and explain cultural nuances when relevant. Always respond in Japanese.`;
					case 'ko':
						return `${baseInstructions} Since this is Korean, focus on pronunciation, honorifics (존댓말), and sentence structure. Help with formal vs informal speech patterns. Always respond in Korean.`;
					case 'zh':
						return `${baseInstructions} Since this is Chinese, emphasize tones, character recognition, and cultural context. Help with simplified vs traditional characters if relevant. Always respond in Chinese.`;
					case 'ar':
						return `${baseInstructions} Since this is Arabic, focus on pronunciation, script reading, and cultural context. Pay attention to formal vs informal speech. Always respond in Arabic.`;
					case 'he':
						return `${baseInstructions} Since this is Hebrew, emphasize pronunciation, script reading, and cultural context. Help with formal vs informal speech patterns. Always respond in Hebrew.`;
					case 'fr':
						return `${baseInstructions} Since this is French, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech (tu vs vous). Always respond in French.`;
					case 'es':
						return `${baseInstructions} Since this is Spanish, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech (tú vs usted). Always respond in Spanish.`;
					case 'de':
						return `${baseInstructions} Since this is German, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech (du vs Sie). Always respond in German.`;
					case 'it':
						return `${baseInstructions} Since this is Italian, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech (tu vs Lei). Always respond in Italian.`;
					case 'pt':
						return `${baseInstructions} Since this is Portuguese, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech (tu vs você). Always respond in Portuguese.`;
					case 'ru':
						return `${baseInstructions} Since this is Russian, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech (ты vs вы). Always respond in Russian.`;
					case 'hi':
						return `${baseInstructions} Since this is Hindi, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech (तू vs आप). Always respond in Hindi.`;
					case 'vi':
						return `${baseInstructions} Since this is Vietnamese, focus on pronunciation, tones, and cultural context. Help with formal vs informal speech. Always respond in Vietnamese.`;
					case 'nl':
						return `${baseInstructions} Since this is Dutch, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech (jij vs u). Always respond in Dutch.`;
					case 'tr':
						return `${baseInstructions} Since this is Turkish, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech (sen vs siz). Always respond in Turkish.`;
					case 'id':
						return `${baseInstructions} Since this is Indonesian, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech. Always respond in Indonesian.`;
					case 'fil':
						return `${baseInstructions} Since this is Filipino, focus on pronunciation, grammar, and cultural context. Help with formal vs informal speech. Always respond in Filipino.`;
					default:
						return `${baseInstructions} Always respond in ${langName}.`;
				}
			};

			// Language-specific turn detection settings
			const getLanguageSpecificTurnDetection = (langCode: string) => {
				switch (langCode) {
					case 'ja':
					case 'ko':
					case 'zh':
						// Asian languages often have different speech patterns
						return {
							type: 'server_vad' as const,
							threshold: 0.4, // More sensitive for tonal languages
							prefix_padding_ms: 400, // Longer prefix for complex sounds
							silence_duration_ms: 800 // Longer silence for natural pauses
						};
					case 'ar':
					case 'he':
						// Right-to-left languages might need different settings
						return {
							type: 'server_vad' as const,
							threshold: 0.5, // Standard sensitivity
							prefix_padding_ms: 350, // Medium prefix
							silence_duration_ms: 700 // Medium silence
						};
					default:
						// Default settings for Latin-based languages
						return {
							type: 'server_vad' as const,
							threshold: 0.45, // Sensitive turn detection for language learning
							prefix_padding_ms: 300, // Capture beginning of speech
							silence_duration_ms: 600 // Wait for natural pauses
						};
				}
			};

			const sessionConfig = {
				model: 'gpt-4o-mini-realtime-preview-2024-12-17',
				voice: this.voice,
				language: languageCode,
				instructions: getLanguageSpecificInstructions(languageName, languageCode),
				turnDetection: getLanguageSpecificTurnDetection(languageCode),
				inputAudioTranscription: {
					model: 'whisper-1',
					language: languageCode
				}
			};

			console.log('🎯 Session configuration:', sessionConfig);
			console.log(`🌍 Language: ${languageName} (${languageCode})`);
			console.log(`🎤 Turn detection: ${JSON.stringify(sessionConfig.turnDetection)}`);
			console.log(`📝 Instructions: ${sessionConfig.instructions.substring(0, 100)}...`);
			console.log(`🎭 Voice: ${this.voice}`);
			console.log(`🔤 Transcription language: ${languageCode}`);
			console.log('🔍 Full session config object:', JSON.stringify(sessionConfig, null, 2));

			await this.realtimeService.connectWithSession(
				sessionData,
				audioStream,
				(message: Message) => {
					// onMessage callback
					console.log('📨 Received message:', message);

					// Check if this message already exists to prevent duplicates
					const messageExists = this.messages.some(
						(msg) => msg.role === message.role && msg.content === message.content
					);

					if (!messageExists) {
						this.messages = [
							...this.messages,
							{
								...message,
								timestamp: new SvelteDate(),
								id: '',
								conversationId: '',
								audioUrl: null
							}
						];
						console.log('📨 Added new message to conversation');
					} else {
						console.log('⚠️ Message already exists, skipping duplicate:', message.content);
					}
				},
				(connectionState: RTCPeerConnectionState) => {
					// onConnectionStateChange callback
					console.log('🔌 Connection state changed:', connectionState);
					if (connectionState === 'connected') {
						this.status = 'connected';
						this.startTime = Date.now();
						console.log('✅ Realtime service connected successfully');
					} else if (connectionState === 'failed' || connectionState === 'closed') {
						this.status = 'idle';
						this.error = 'Connection lost';
						console.log('❌ Connection failed or closed');
					} else if (connectionState === 'connecting') {
						this.status = 'connecting';
						console.log('🔄 Still connecting...');
					}
				},
				this.handleTranscriptionUpdate, // Connect the transcription callback
				sessionConfig
			);

			// Note: Transcription handling is built into the realtime service
			// No need for additional setup
		} catch (e) {
			console.error('❌ Failed to start conversation:', e);
			this.error = e instanceof Error ? e.message : 'Unknown error';
			this.status = 'error';
			throw e; // Re-throw to let the caller handle it
		}
	};

	// Handle real-time transcription updates
	private handleTranscriptionUpdate = (event: {
		type: 'user_transcript' | 'assistant_transcript';
		text: string;
		isFinal: boolean;
		timestamp: Date;
	}) => {
		console.log('🎯 Transcription callback received:', event);

		if (event.isFinal) {
			// Final transcript - add to messages and clear current
			this.currentTranscript = '';
			this.isTranscribing = false;
			console.log('✅ Transcription completed:', event.text);

			// Add final transcript to messages if it's from the assistant
			if (event.type === 'assistant_transcript') {
				// Check if this message already exists to prevent duplicates
				const messageExists = this.messages.some(
					(msg) => msg.role === 'assistant' && msg.content === event.text
				);

				if (!messageExists) {
					const message: Message = {
						role: 'assistant',
						content: event.text,
						timestamp: new SvelteDate(),
						id: '',
						conversationId: '',
						audioUrl: null
					};
					this.messages = [...this.messages, message];
					console.log('📨 Added final transcript to messages');
				} else {
					console.log('⚠️ Message already exists, skipping duplicate:', event.text);
				}
			}
		} else {
			// Incremental update - update current transcript
			this.currentTranscript = event.text;
			this.isTranscribing = true;
			console.log('🔄 Transcription update:', event.text);
		}
	};

	// Start streaming
	startStreaming = async () => {
		if (this.status !== 'connected') return;

		console.log('🎤 Starting streaming...');

		try {
			// Resume streaming in the realtime service
			this.realtimeService.resumeStreaming();

			// Update status
			this.status = 'streaming';
			console.log('✅ Streaming started');
		} catch (error) {
			console.error('❌ Failed to start streaming:', error);
			this.error = 'Failed to start streaming';
			this.status = 'error';
		}
	};

	// Stop streaming
	stopStreaming = async () => {
		if (this.status !== 'streaming') return;

		console.log('⏸️ Stopping streaming...');

		try {
			// Pause streaming in the realtime service (keeps connection alive)
			this.realtimeService.pauseStreaming();

			// Update status
			this.status = 'connected';
			console.log('✅ Streaming stopped (connection maintained)');
		} catch (error) {
			console.error('❌ Failed to stop streaming:', error);
			this.error = 'Failed to stop streaming';
		}
	};

	// End the conversation and disconnect completely
	endConversation = () => {
		console.log('🔌 Ending conversation and disconnecting...');

		// First stop streaming if active
		if (this.status === 'streaming') {
			this.stopStreaming();
		}

		// Disconnect the WebRTC connection completely
		this.realtimeService.disconnect();

		// Clean up audio service
		this.audioService.cleanup();

		// Reset state
		this.status = 'idle';
		this.messages = [];
		this.userId = null;
		this.sessionId = '';
		this.startTime = 0;
		this.error = null;
		this.audioLevel = 0;
		this.transcriptionMode = false;
		this.currentTranscript = '';
		this.isTranscribing = false;

		console.log('✅ Conversation ended and fully disconnected');
	};

	// Add a new method for complete disconnection
	disconnectCompletely = () => {
		console.log('🔌 Disconnecting completely...');

		// Stop streaming first if active
		if (this.status === 'streaming') {
			this.stopStreaming();
		}

		// Then disconnect the WebRTC connection
		this.realtimeService.disconnect();

		// Clean up audio
		this.audioService.cleanup();

		// Reset to idle
		this.status = 'idle';
		console.log('✅ Completely disconnected');
	};

	// Send a message
	sendMessage = (content: string) => {
		const message: Message = {
			role: 'user',
			content,
			timestamp: new SvelteDate(),
			id: '',
			conversationId: '',
			audioUrl: null
		};
		this.messages = [...this.messages, message];

		// Send via realtime service
		this.realtimeService.sendEvent({
			type: 'conversation.item.create',
			item: {
				type: 'message',
				role: 'user',
				content: [{ type: 'input_text', text: content }]
			}
		});
	};

	// Select audio device
	selectDevice = async (deviceId: string) => {
		this.selectedDeviceId = deviceId;
		if (this.status === 'streaming') {
			// Re-acquire stream with new device
			try {
				await this.audioService.getStream(deviceId);
			} catch (e) {
				console.error('Failed to switch audio device:', e);
			}
		}
	};

	// Test audio level for debugging
	testAudioLevel = () => {
		if (this.audioService.hasActiveStream()) {
			// Trigger a manual audio level update
			this.audioService.triggerLevelUpdate();
			console.log('Test audio level triggered');
		} else {
			console.log('No active audio stream');
		}
	};

	// Get detailed debug information (dev only)
	getDebugInfo = () => {
		return {
			status: this.status,
			audioLevel: this.audioLevel,
			messages: this.messages.length,
			language: this.language,
			voice: this.voice,
			sessionId: this.sessionId,
			startTime: this.startTime,
			availableDevices: this.availableDevices.length,
			selectedDeviceId: this.selectedDeviceId,
			transcriptionMode: this.transcriptionMode,
			currentTranscript: this.currentTranscript,
			isTranscribing: this.isTranscribing,
			connectionStatus: this.realtimeService.getConnectionStatus()
		};
	};

	// Get detailed connection status
	getConnectionStatus = () => {
		return this.realtimeService.getConnectionStatus();
	};

	// Timer management methods
	configureTimerForUserTier = (tier: 'free' | 'plus' | 'premium') => {
		this.timerStore.configureForUserTier(tier);
		console.log(`⏰ Conversation timer configured for ${tier} tier`);
	};

	startConversationTimer = () => {
		this.timerStore.start();
		console.log('⏰ Conversation timer started');
	};

	stopConversationTimer = () => {
		this.timerStore.stop();
		console.log('⏰ Conversation timer stopped');
	};

	getTimerState = () => {
		return this.timerStore.state;
	};

	getTimeRemaining = () => {
		return this.timerStore.getTimeRemaining();
	};

	extendConversation = () => {
		return this.timerStore.extendDefault();
	};

	// Check if streaming is currently paused
	isStreamingPaused = () => {
		return this.realtimeService.getStreamingPausedState();
	};

	// Update session configuration dynamically
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
		if (this.status === 'connected' || this.status === 'streaming') {
			console.log('🔄 Updating session configuration:', updates);

			// Send updated configuration to the realtime service
			this.realtimeService.sendEvent({
				type: 'session.update',
				session: updates
			});
		} else {
			console.log('⚠️ Cannot update session config: not connected');
		}
	};

	// Clear error
	clearError = () => {
		this.error = null;
		if (this.status === 'error') {
			this.status = 'idle';
		}
	};
	get reactiveAudioLevel() {
		return this.audioLevel;
	}

	// Reset the store
	reset = () => {
		this.status = 'idle';
		this.messages = [];
		this.userId = null;
		this.sessionId = '';
		this.startTime = 0;
		this.error = null;
		this.audioLevel = 0;
		this.availableDevices = [];
		this.selectedDeviceId = 'default';
		this.transcriptionMode = false;
		this.currentTranscript = '';
		this.isTranscribing = false;

		this.realtimeService.disconnect();
		this.audioService.cleanup();
		this.timerStore.reset();

		console.log('🔄 Conversation store reset');
	};

	// Force cleanup - more aggressive than reset, ensures all connections are closed
	forceCleanup = () => {
		console.log('🧹 Force cleaning up conversation store...');

		// First try normal cleanup
		try {
			this.realtimeService.disconnect();
			this.audioService.cleanup();
		} catch (error) {
			console.warn('⚠️ Error during normal cleanup:', error);
		}

		// Force close any remaining connections
		try {
			// Force disconnect realtime service
			if (this.realtimeService) {
				this.realtimeService.forceDisconnect();
			}
		} catch (error) {
			console.warn('⚠️ Error during realtime force cleanup:', error);
		}

		// Clean up timer store
		try {
			this.timerStore.cleanup();
		} catch (error) {
			console.warn('⚠️ Error during timer cleanup:', error);
		}

		// Reset all state
		this.status = 'idle';
		this.messages = [];
		this.userId = null;
		this.sessionId = '';
		this.startTime = 0;
		this.error = null;
		this.audioLevel = 0;
		this.availableDevices = [];
		this.selectedDeviceId = 'default';
		this.transcriptionMode = false;
		this.currentTranscript = '';
		this.isTranscribing = false;

		console.log('✅ Force cleanup complete');
	};
}

// Export a default instance for backward compatibility
export const conversationStore = new ConversationStore();
