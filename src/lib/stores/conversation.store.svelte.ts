// 🎯 Conversation Store - The "state holder" using Svelte 5 runes
// Single source of truth for conversation UI state

import { RealtimeService } from '$lib/services/realtime.service';
import { AudioService, type AudioLevel } from '$lib/services/audio.service';
import { ConversationService } from '$lib/services/conversation.service';
import type { Message } from '$lib/server/db/types';

function createConversationStore() {
	// Instantiate services
	const realtimeService = new RealtimeService();
	const audioService = new AudioService();
	const conversationService = new ConversationService();

	// Reactive state using Svelte 5 runes
	let status = $state<'idle' | 'connecting' | 'connected' | 'streaming' | 'error'>('idle');
	let messages = $state<Message[]>([]);
	let userId = $state<string | null>(null);
	let sessionId = $state<string>('');
	let startTime = $state<number>(0);
	let language = $state<string>('en');
	let voice = $state<string>('alloy');
	let error = $state<string | null>(null);
	let audioLevel = $state<number>(0);
	let availableDevices = $state<MediaDeviceInfo[]>([]);
	let selectedDeviceId = $state<string>('default');

	// Initialize audio service
	$effect(() => {
		audioService.initialize();
		audioService.getAvailableDevices().then((devices) => {
			availableDevices = devices;
		});
	});

	// Set up audio service callbacks
	$effect(() => {
		audioService.onLevelUpdate((level: AudioLevel) => {
			audioLevel = level.level;
		});

		audioService.onStreamReady((stream: MediaStream) => {
			console.log('Audio stream ready:', stream);
		});

		audioService.onStreamError((errorMsg: string) => {
			error = errorMsg;
			status = 'error';
		});
	});

	// Start a new conversation
	const startConversation = async (
		currentUserId: string | null,
		selectedLanguage: string = 'en',
		selectedVoice: string = 'alloy'
	) => {
		if (status !== 'idle') return;

		status = 'connecting';
		userId = currentUserId;
		language = selectedLanguage;
		voice = selectedVoice;
		startTime = Date.now();
		error = null;

		try {
			// 1. Get audio stream
			const audioStream = await audioService.getStream(selectedDeviceId);

			// 2. Get a session ID from our backend
			const response = await fetch('/api/realtime-session', { method: 'POST' });
			const { url } = await response.json();
			sessionId = url;

			// 3. Connect the realtime service
			await realtimeService.connect(
				url,
				(newMessage: Message) => {
					// onMessage callback
					messages = [...messages, newMessage];
				},
				(connectionState: RTCPeerConnectionState) => {
					// onConnectionStateChange callback
					if (connectionState === 'connected') {
						status = 'connected';
						// Add audio track to WebRTC connection
						if (audioStream) {
							const audioTrack = audioStream.getTracks()[0];
							// Note: In a real implementation, you'd add this track to the RTCPeerConnection
							// For MVP, we'll simulate the connection
						}
					}
					if (connectionState === 'failed' || connectionState === 'closed') {
						status = 'idle';
						error = 'Connection lost';
					}
				}
			);
		} catch (e) {
			console.error('Failed to start conversation', e);
			error = e instanceof Error ? e.message : 'Unknown error';
			status = 'error';
		}
	};

	// Start streaming (after connection is established)
	const startStreaming = async () => {
		if (status !== 'connected') return;

		status = 'streaming';
		console.log('Started streaming audio');
	};

	// Stop streaming
	const stopStreaming = async () => {
		if (status !== 'streaming') return;

		status = 'connected';
		console.log('Stopped streaming audio');
	};

	// End the conversation
	const endConversation = () => {
		realtimeService.disconnect();
		audioService.cleanup();

		// Reset state
		status = 'idle';
		messages = [];
		userId = null;
		sessionId = '';
		startTime = 0;
		error = null;
		audioLevel = 0;
	};

	// Select audio device
	const selectDevice = async (deviceId: string) => {
		selectedDeviceId = deviceId;
		if (status === 'streaming') {
			// Re-acquire stream with new device
			try {
				await audioService.getStream(deviceId);
			} catch (e) {
				console.error('Failed to switch audio device:', e);
			}
		}
	};

	// Send a message
	const sendMessage = (content: string) => {
		const message: Message = {
			role: 'user',
			content,
			timestamp: Date.now()
		};
		messages = [...messages, message];

		// Send via realtime service
		realtimeService.send({ type: 'message', content });
	};

	// Clear error
	const clearError = () => {
		error = null;
		if (status === 'error') {
			status = 'idle';
		}
	};

	return {
		// State
		get status() {
			return status;
		},
		get messages() {
			return messages;
		},
		get userId() {
			return userId;
		},
		get sessionId() {
			return sessionId;
		},
		get startTime() {
			return startTime;
		},
		get language() {
			return language;
		},
		get voice() {
			return voice;
		},
		get error() {
			return error;
		},
		get audioLevel() {
			return audioLevel;
		},
		get availableDevices() {
			return availableDevices;
		},
		get selectedDeviceId() {
			return selectedDeviceId;
		},

		// Actions
		startConversation,
		startStreaming,
		stopStreaming,
		endConversation,
		selectDevice,
		sendMessage,
		clearError
	};
}

export const conversationStore = createConversationStore();
