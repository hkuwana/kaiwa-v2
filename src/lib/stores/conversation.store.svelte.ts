// src/lib/stores/conversation.store.svelte.ts
import { SvelteDate } from 'svelte/reactivity';

import { RealtimeService, realtimeService } from '$lib/services/realtime.service';
import { AudioService, audioService, type AudioLevel } from '$lib/services/audio.service';
import type { Message } from '$lib/server/db/types';
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
	language = 'en'; // This can be a regular property
	voice = 'alloy';
	error = $state<string | null>(null);
	audioLevel = $state<number>(0);
	availableDevices = $state<MediaDeviceInfo[]>([]);
	selectedDeviceId = $state<string>('default');

	constructor() {
		// Use the exported instances that automatically handle browser/server
		this.realtimeService = realtimeService;
		this.audioService = audioService;

		// The rest of your constructor can now safely call methods on this.audioService
		this.audioService.initialize();
		this.audioService.getAvailableDevices().then((devices) => {
			this.availableDevices = devices;
		});

		// This is also safe, as the dummy version has an empty onLevelUpdate method.
		this.audioService.onLevelUpdate((level: AudioLevel) => {
			this.audioLevel = level.level;
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
	startConversation = async (language?: string, speaker?: Speaker | string) => {
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

		this.status = 'connecting';
		this.error = null;

		try {
			// 1. Get audio stream
			console.log('🎵 Getting audio stream...');
			const audioStream = await this.audioService.getStream(this.selectedDeviceId);
			console.log('✅ Audio stream obtained');

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

			// 3. Connect the realtime service with the stream and session data
			console.log('📡 Connecting realtime service...');

			// Pass the session data directly instead of trying to fetch it again
			await this.realtimeService.connectWithSession(
				sessionData,
				audioStream,
				(newMessage: { role: string; content: string }) => {
					// onMessage callback - convert to our Message type
					console.log('📨 New message received:', newMessage);
					const message: Message = {
						role: newMessage.role === 'assistant' ? 'assistant' : 'user',
						content: newMessage.content,
						timestamp: new SvelteDate(),
						id: '',
						conversationId: '',
						audioUrl: null
					};
					this.messages = [...this.messages, message];
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
				}
			);
		} catch (e) {
			console.error('❌ Failed to start conversation:', e);
			this.error = e instanceof Error ? e.message : 'Unknown error';
			this.status = 'error';
			throw e; // Re-throw to let the caller handle it
		}
	};

	// Start streaming (after connection is established)
	startStreaming = async () => {
		if (this.status !== 'connected') return;

		this.status = 'streaming';
		console.log('Started streaming audio');
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

	// Clear error
	clearError = () => {
		this.error = null;
		if (this.status === 'error') {
			this.status = 'idle';
		}
	};

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

		this.realtimeService.disconnect();
		this.audioService.cleanup();

		console.log('🔄 Conversation store reset');
	};
}

// Export a default instance for backward compatibility
export const conversationStore = new ConversationStore();
