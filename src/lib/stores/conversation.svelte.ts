// �� Conversation Store for Svelte 5 Runes
// Provides reactive UI binding

import { conversationManager } from '$lib/features/conversation/conversation-manager';
import { audioDeviceManager } from '$lib/features/audio/device-manager';
import type { ConversationMessage } from '$lib/features/conversation/conversation-manager';

export function createConversationStore() {
	let devices = $state<MediaDeviceInfo[]>([]);
	let selectedDevice = $state<string>('default');
	let isConnected = $state(false);
	let isConnecting = $state(false);
	let messages = $state<ConversationMessage[]>([]);
	let error = $state<string | null>(null);
	let currentLanguage = $state('en');
	let currentVoice = $state('alloy');

	// Load audio devices
	$effect(() => {
		audioDeviceManager.getAvailableDevices().then((d) => {
			devices = d;
		});
	});

	// Watch conversation manager state
	$effect(() => {
		const state = conversationManager.getState();
		isConnected = state.status === 'connected';
		isConnecting = state.status === 'connecting';
		messages = state.messages;
		error = state.error;
		currentLanguage = state.currentLanguage;
		currentVoice = state.currentVoice;
	});

	async function start(language = 'en', voice = 'alloy') {
		try {
			await conversationManager.startConversation(language, voice, selectedDevice);
		} catch (e) {
			// Error is handled by the effect above
			console.error('Failed to start conversation:', e);
		}
	}

	async function stop() {
		await conversationManager.endConversation();
	}

	function sendMessage(text: string) {
		conversationManager.sendMessage(text);
	}

	function clearError() {
		conversationManager.clearError();
	}

	function selectDevice(deviceId: string) {
		selectedDevice = deviceId;
	}

	function selectLanguage(language: string) {
		currentLanguage = language;
	}

	function selectVoice(voice: string) {
		currentVoice = voice;
	}

	return {
		// State
		get devices() {
			return devices;
		},
		get selectedDevice() {
			return selectedDevice;
		},
		get isConnected() {
			return isConnected;
		},
		get isConnecting() {
			return isConnecting;
		},
		get messages() {
			return messages;
		},
		get error() {
			return error;
		},
		get currentLanguage() {
			return currentLanguage;
		},
		get currentVoice() {
			return currentVoice;
		},

		// Actions
		start,
		stop,
		sendMessage,
		clearError,
		selectDevice,
		selectLanguage,
		selectVoice
	};
}
