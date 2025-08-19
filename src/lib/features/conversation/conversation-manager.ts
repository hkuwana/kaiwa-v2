// 💬 Conversation Manager
// Coordinates features, maintains conversation state

import { webrtcConnection } from '$lib/features/realtime/webrtc-connection';
import { audioDeviceManager } from '$lib/features/audio/device-manager';

export interface ConversationMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}

export interface ConversationState {
	status: 'idle' | 'connecting' | 'connected' | 'error';
	messages: ConversationMessage[];
	currentLanguage: string;
	currentVoice: string;
	error: string | null;
}

export class ConversationManager {
	private state: ConversationState = {
		status: 'idle',
		messages: [],
		currentLanguage: 'en',
		currentVoice: 'alloy',
		error: null
	};

	async startConversation(language = 'en', voice = 'alloy', deviceId?: string): Promise<void> {
		try {
			this.state.status = 'connecting';
			this.state.currentLanguage = language;
			this.state.currentVoice = voice;
			this.state.error = null;

			// Connect via WebRTC
			await webrtcConnection.connect(voice, deviceId);

			// Set up message handler
			webrtcConnection.onMessage((event) => {
				this.handleServerEvent(event);
			});

			this.state.status = 'connected';

			// Send initial greeting
			this.sendMessage(`I want to practice ${language}`);
		} catch (error) {
			this.state.status = 'error';
			this.state.error = error instanceof Error ? error.message : 'Unknown error';
			throw error;
		}
	}

	sendMessage(text: string): void {
		if (this.state.status !== 'connected') return;

		const message: ConversationMessage = {
			role: 'user',
			content: text,
			timestamp: Date.now()
		};

		this.state.messages.push(message);

		webrtcConnection.sendEvent({
			type: 'conversation.item.create',
			item: {
				type: 'message',
				role: 'user',
				content: [{ type: 'input_text', text }]
			}
		});

		webrtcConnection.sendEvent({ type: 'response.create' });
	}

	private handleServerEvent(event: any): void {
		switch (event.type) {
			case 'conversation.item.completed':
				if (event.item?.role === 'assistant' && event.item?.content) {
					const content = event.item.content.find((c: any) => c.type === 'output_text');
					if (content?.text) {
						const message: ConversationMessage = {
							role: 'assistant',
							content: content.text,
							timestamp: Date.now()
						};
						this.state.messages.push(message);
					}
				}
				break;

			case 'error':
				this.state.error = event.error?.message || 'Unknown error';
				break;
		}
	}

	async endConversation(): Promise<void> {
		webrtcConnection.cleanup();
		this.state.status = 'idle';
		this.state.messages = [];
		this.state.error = null;
	}

	// Get current state (immutable copy)
	getState(): ConversationState {
		return { ...this.state };
	}

	// Get messages (immutable copy)
	getMessages(): ConversationMessage[] {
		return [...this.state.messages];
	}

	// Get current status
	getStatus(): string {
		return this.state.status;
	}

	// Get current error
	getError(): string | null {
		return this.state.error;
	}

	// Check if connected
	isConnected(): boolean {
		return this.state.status === 'connected';
	}

	// Check if connecting
	isConnecting(): boolean {
		return this.state.status === 'connecting';
	}

	// Clear error
	clearError(): void {
		this.state.error = null;
	}
}

export const conversationManager = new ConversationManager();
