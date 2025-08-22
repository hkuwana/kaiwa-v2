// src/lib/stores/conversation.store.svelte.ts
import { SvelteDate } from 'svelte/reactivity';

import { RealtimeService, realtimeService } from '$lib/services/realtime.service';
import { AudioService, audioService, type AudioLevel } from '$lib/services/audio.service';
import type { Message, Language } from '$lib/server/db/types';
import type { Speaker } from '$lib/types';
import { DummyAudioService, type DummyRealtimeService } from '$lib/services/dummy.service';

export class ConversationStore {
	// Services - use the exported instances that handle browser/server automatically
	private realtimeService: RealtimeService | DummyRealtimeService;
	private audioService: AudioService | DummyAudioService;

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
		if (this.status !== 'idle') return;

		// Update language and speaker if provided
		if (language) this.language = language;

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
			const languageName = this.language?.name || 'English';
			const languageCode = this.language?.code || 'en';

			// Language-specific instructions
			const getLanguageSpecificInstructions = (langName: string, langCode: string) => {
				const baseInstructions = `You are a helpful language tutor for ${langName}. Help the user practice and improve their language skills through natural conversation. Be patient, encouraging, and provide gentle corrections when needed.`;

				// Add language-specific guidance
				switch (langCode) {
					case 'ja':
						return `${baseInstructions} Since this is Japanese, pay special attention to pronunciation, honorifics (敬語), and cultural context. Use appropriate politeness levels and explain cultural nuances when relevant.`;
					case 'ko':
						return `${baseInstructions} Since this is Korean, focus on pronunciation, honorifics (존댓말), and sentence structure. Help with formal vs informal speech patterns.`;
					case 'zh':
						return `${baseInstructions} Since this is Chinese, emphasize tones, character recognition, and cultural context. Help with simplified vs traditional characters if relevant.`;
					case 'ar':
						return `${baseInstructions} Since this is Arabic, focus on pronunciation, script reading, and cultural context. Pay attention to formal vs informal speech.`;
					case 'he':
						return `${baseInstructions} Since this is Hebrew, emphasize pronunciation, script reading, and cultural context. Help with formal vs informal speech patterns.`;
					default:
						return baseInstructions;
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

	// Start streaming (after connection is established)
	startStreaming = async () => {
		if (this.status !== 'connected') return;

		this.status = 'streaming';
		console.log('Started streaming audio');

		// Ensure audio monitoring is active
		if (this.audioService.hasActiveStream()) {
			// Re-establish audio monitoring if needed
			const currentStream = this.audioService.getCurrentStream();
			if (currentStream) {
				// Force a small audio level update to ensure monitoring is working
				const currentLevel = this.audioService.getCurrentAudioLevel();
				this.audioLevel = currentLevel;
				console.log('Audio monitoring active, current level:', currentLevel);
			}
		}
	};

	// Stop streaming
	stopStreaming = async () => {
		if (this.status !== 'streaming') return;

		this.status = 'connected';
		console.log('Stopped streaming audio');
	};

	// End the conversation
	endConversation = () => {
		this.realtimeService.disconnect();
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
			isTranscribing: this.isTranscribing
		};
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

		console.log('🔄 Conversation store reset');
	};
}

// Export a default instance for backward compatibility
export const conversationStore = new ConversationStore();
