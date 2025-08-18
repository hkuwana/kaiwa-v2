// 🎭 Conversation Store (Svelte 5 Runes)
// Reactive store using the app orchestrator for state management

import { appOrchestrator } from '$lib/app/orchestrator';
import { RealtimeConversationStatus } from './kernel';

// 🎯 Reactive store using Svelte 5 runes
export function createConversationStore() {
	// Use $state for reactive state management
	let state = $state(appOrchestrator.getConversationState());

	// Polling function to keep state in sync
	const pollForUpdates = () => {
		const newState = appOrchestrator.getConversationState();
		if (JSON.stringify(newState) !== JSON.stringify(state)) {
			state = newState;
		}
	};

	// Set up periodic polling (we'll improve this later with proper event system)
	const interval = setInterval(pollForUpdates, 100);

	// Cleanup function
	const cleanup = () => {
		clearInterval(interval);
		appOrchestrator.cleanup();
	};

	// Cleanup on page unload
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeunload', cleanup);
	}

	return {
		// Reactive state
		get state() {
			return state;
		},

		// Derived state
		get isRecording() {
			return state.status === RealtimeConversationStatus.STREAMING;
		},
		get isProcessing() {
			return state.status === RealtimeConversationStatus.CONNECTING;
		},
		get isSpeaking() {
			return state.status === RealtimeConversationStatus.STREAMING;
		},
		get canRecord() {
			return state.status === RealtimeConversationStatus.IDLE;
		},
		get hasError() {
			return !!state.error;
		},
		get messageCount() {
			return Math.floor(state.messages.length / 2);
		},

		// Actions
		async startConversation(language?: string, voice?: string) {
			const newState = await appOrchestrator.startConversation(language, voice);
			state = newState;
			return newState;
		},

		async startRecording() {
			await appOrchestrator.startStreaming();
			state = appOrchestrator.getConversationState();
		},

		async stopRecording() {
			await appOrchestrator.stopStreaming();
			state = appOrchestrator.getConversationState();
			// State will be updated automatically by polling
		},

		async endConversation() {
			const newState = await appOrchestrator.endConversation();
			state = newState;
		},

		async toggleRecording() {
			if (state.status === 'idle') {
				if (!state.sessionId) {
					await this.startConversation();
				}
				await this.startRecording();
			} else if (state.status === 'recording') {
				await this.stopRecording();
			}
		},

		// Utility
		cleanup,

		// Debug methods
		getEventHistory() {
			return appOrchestrator.getEventHistory();
		},

		getHandlerCount(eventName: string) {
			return appOrchestrator.getHandlerCount(eventName);
		}
	};
}
