// 💬 ConversationService - Handles conversation business logic
// Plain TypeScript class with no Svelte dependencies

import type { Message } from '$lib/server/db/types';

export interface ConversationState {
	status: 'idle' | 'connecting' | 'connected' | 'streaming' | 'error';
	sessionId: string;
	messages: Message[];
	startTime: number;
	language: string;
	voice: string;
	error?: string;
}

export class ConversationService {
	private state: ConversationState = this.createInitialState();

	createInitialState(): ConversationState {
		return {
			status: 'idle',
			sessionId: '',
			messages: [],
			startTime: 0,
			language: 'en',
			voice: 'alloy'
		};
	}

	// Get current state
	getState(): ConversationState {
		return { ...this.state };
	}

	// Update state
	updateState(updates: Partial<ConversationState>): void {
		this.state = { ...this.state, ...updates };
	}

	// Add a message to the conversation
	addMessage(message: Message): void {
		this.state.messages = [...this.state.messages, message];
	}

	// Clear all messages
	clearMessages(): void {
		this.state.messages = [];
	}

	// Set error
	setError(error: string): void {
		this.state.error = error;
		this.state.status = 'error';
	}

	// Clear error
	clearError(): void {
		this.state.error = undefined;
		if (this.state.status === 'error') {
			this.state.status = 'idle';
		}
	}

	// Reset conversation to initial state
	reset(): void {
		this.state = this.createInitialState();
	}

	// Get conversation duration
	getDuration(): number {
		if (this.state.startTime === 0) return 0;
		return Date.now() - this.state.startTime;
	}

	// Get message count
	getMessageCount(): number {
		return this.state.messages.length;
	}

	// Check if conversation is active
	isActive(): boolean {
		return this.state.status === 'connected' || this.state.status === 'streaming';
	}

	// Check if conversation is idle
	isIdle(): boolean {
		return this.state.status === 'idle';
	}

	// Check if conversation is in error state
	hasError(): boolean {
		return this.state.status === 'error';
	}
}
