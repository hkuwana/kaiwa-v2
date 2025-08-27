// src/lib/services/conversation.service.ts
// Pure functional conversation service - no classes, no state, just functions

import type { Message } from '$lib/server/db/types';
import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';

export interface ConversationState {
	status: 'idle' | 'connecting' | 'connected' | 'streaming' | 'error';
	sessionId: string;
	messages: Message[];
	startTime: number;
	language: string;
	voice: string;
	error?: string;
}

export interface ConversationInput {
	state: ConversationState;
	message?: Message;
	error?: string;
	updates?: Partial<ConversationState>;
}

export interface ConversationResult {
	state: ConversationState;
	shouldNotifyStateChange: boolean;
	shouldNotifyMessageAdded: boolean;
	shouldNotifyError: boolean;
}

export interface ConversationValidationResult {
	isValid: boolean;
	error?: string;
}

// === CONVERSATION STATE FUNCTIONS ===

/**
 * Create initial conversation state
 * @param language - Initial language
 * @param voice - Initial voice
 * @returns Initial conversation state
 */
export function createInitialConversationState(
	language: string = 'en',
	voice: string = DEFAULT_VOICE
): ConversationState {
	return {
		status: 'idle',
		sessionId: '',
		messages: [],
		startTime: 0,
		language,
		voice
	};
}

/**
 * Create conversation state with custom settings
 * @param overrides - Partial state to override defaults
 * @returns Conversation state
 */
export function createConversationState(overrides: Partial<ConversationState>): ConversationState {
	const initialState = createInitialConversationState();
	return { ...initialState, ...overrides };
}

/**
 * Validate conversation state
 * @param state - Conversation state to validate
 * @returns Validation result
 */
export function validateConversationState(state: ConversationState): ConversationValidationResult {
	if (!state.language || state.language.trim() === '') {
		return { isValid: false, error: 'Language is required' };
	}
	if (!state.voice || state.voice.trim() === '') {
		return { isValid: false, error: 'Voice is required' };
	}
	if (state.startTime < 0) {
		return { isValid: false, error: 'Start time cannot be negative' };
	}
	return { isValid: true };
}

// === CONVERSATION OPERATIONS ===

/**
 * Add a message to the conversation
 * @param input - Conversation input with current state and message
 * @returns Conversation result
 */
export function addMessage(input: ConversationInput): ConversationResult {
	const { state, message } = input;

	if (!message) {
		return {
			state,
			shouldNotifyStateChange: false,
			shouldNotifyMessageAdded: false,
			shouldNotifyError: false
		};
	}

	const updatedState: ConversationState = {
		...state,
		messages: [...state.messages, message]
	};

	return {
		state: updatedState,
		shouldNotifyStateChange: true,
		shouldNotifyMessageAdded: true,
		shouldNotifyError: false
	};
}

/**
 * Clear all messages from the conversation
 * @param input - Conversation input with current state
 * @returns Conversation result
 */
export function clearMessages(input: ConversationInput): ConversationResult {
	const { state } = input;

	const updatedState: ConversationState = {
		...state,
		messages: []
	};

	return {
		state: updatedState,
		shouldNotifyStateChange: true,
		shouldNotifyMessageAdded: false,
		shouldNotifyError: false
	};
}

/**
 * Set error in conversation state
 * @param input - Conversation input with current state and error
 * @returns Conversation result
 */
export function setError(input: ConversationInput): ConversationResult {
	const { state, error } = input;

	if (!error) {
		return {
			state,
			shouldNotifyStateChange: false,
			shouldNotifyMessageAdded: false,
			shouldNotifyError: false
		};
	}

	const updatedState: ConversationState = {
		...state,
		error,
		status: 'error'
	};

	return {
		state: updatedState,
		shouldNotifyStateChange: true,
		shouldNotifyMessageAdded: false,
		shouldNotifyError: true
	};
}

/**
 * Clear error from conversation state
 * @param input - Conversation input with current state
 * @returns Conversation result
 */
export function clearError(input: ConversationInput): ConversationResult {
	const { state } = input;

	if (state.status !== 'error') {
		return {
			state,
			shouldNotifyStateChange: false,
			shouldNotifyMessageAdded: false,
			shouldNotifyError: false
		};
	}

	const updatedState: ConversationState = {
		...state,
		error: undefined,
		status: 'idle'
	};

	return {
		state: updatedState,
		shouldNotifyStateChange: true,
		shouldNotifyMessageAdded: false,
		shouldNotifyError: false
	};
}

/**
 * Update conversation state with partial updates
 * @param input - Conversation input with current state and updates
 * @returns Conversation result
 */
export function updateConversationState(input: ConversationInput): ConversationResult {
	const { state, updates } = input;

	if (!updates || Object.keys(updates).length === 0) {
		return {
			state,
			shouldNotifyStateChange: false,
			shouldNotifyMessageAdded: false,
			shouldNotifyError: false
		};
	}

	const updatedState: ConversationState = { ...state, ...updates };

	return {
		state: updatedState,
		shouldNotifyStateChange: true,
		shouldNotifyMessageAdded: false,
		shouldNotifyError: false
	};
}

/**
 * Reset conversation to initial state
 * @param input - Conversation input with current state
 * @param language - New language (optional)
 * @param voice - New voice (optional)
 * @returns Conversation result
 */
export function resetConversation(
	input: ConversationInput,
	language?: string,
	voice?: string
): ConversationResult {
	const { state } = input;

	const resetState = createInitialConversationState(
		language || state.language,
		voice || state.voice
	);

	return {
		state: resetState,
		shouldNotifyStateChange: true,
		shouldNotifyMessageAdded: false,
		shouldNotifyError: false
	};
}

/**
 * Start conversation session
 * @param input - Conversation input with current state
 * @param sessionId - Session ID to start
 * @returns Conversation result
 */
export function startConversation(input: ConversationInput, sessionId: string): ConversationResult {
	const { state } = input;

	const updatedState: ConversationState = {
		...state,
		status: 'connecting',
		sessionId,
		startTime: Date.now()
	};

	return {
		state: updatedState,
		shouldNotifyStateChange: true,
		shouldNotifyMessageAdded: false,
		shouldNotifyError: false
	};
}

/**
 * Connect conversation session
 * @param input - Conversation input with current state
 * @returns Conversation result
 */
export function connectConversation(input: ConversationInput): ConversationResult {
	const { state } = input;

	if (state.status !== 'connecting') {
		return {
			state,
			shouldNotifyStateChange: false,
			shouldNotifyMessageAdded: false,
			shouldNotifyError: false
		};
	}

	const updatedState: ConversationState = {
		...state,
		status: 'connected'
	};

	return {
		state: updatedState,
		shouldNotifyStateChange: true,
		shouldNotifyMessageAdded: false,
		shouldNotifyError: false
	};
}

/**
 * Start streaming conversation
 * @param input - Conversation input with current state
 * @returns Conversation result
 */
export function startStreaming(input: ConversationInput): ConversationResult {
	const { state } = input;

	if (state.status !== 'connected') {
		return {
			state,
			shouldNotifyStateChange: false,
			shouldNotifyMessageAdded: false,
			shouldNotifyError: false
		};
	}

	const updatedState: ConversationState = {
		...state,
		status: 'streaming'
	};

	return {
		state: updatedState,
		shouldNotifyStateChange: true,
		shouldNotifyMessageAdded: false,
		shouldNotifyError: false
	};
}

// === UTILITY FUNCTIONS ===

/**
 * Get conversation duration
 * @param state - Conversation state
 * @returns Duration in milliseconds
 */
export function getConversationDuration(state: ConversationState): number {
	if (state.startTime === 0) return 0;
	return Date.now() - state.startTime;
}

/**
 * Get message count
 * @param state - Conversation state
 * @returns Number of messages
 */
export function getMessageCount(state: ConversationState): number {
	return state.messages.length;
}

/**
 * Check if conversation is active
 * @param state - Conversation state
 * @returns True if conversation is active
 */
export function isConversationActive(state: ConversationState): boolean {
	return state.status === 'connected' || state.status === 'streaming';
}

/**
 * Check if conversation is idle
 * @param state - Conversation state
 * @returns True if conversation is idle
 */
export function isConversationIdle(state: ConversationState): boolean {
	return state.status === 'idle';
}

/**
 * Check if conversation has error
 * @param state - Conversation state
 * @returns True if conversation has error
 */
export function hasConversationError(state: ConversationState): boolean {
	return state.status === 'error';
}

/**
 * Get conversation statistics
 * @param state - Conversation state
 * @returns Conversation statistics
 */
export function getConversationStats(state: ConversationState): {
	duration: number;
	messageCount: number;
	userMessageCount: number;
	assistantMessageCount: number;
	language: string;
	voice: string;
} {
	const duration = getConversationDuration(state);
	const messageCount = getMessageCount(state);
	const userMessageCount = state.messages.filter((m) => m.role === 'user').length;
	const assistantMessageCount = state.messages.filter((m) => m.role === 'assistant').length;

	return {
		duration,
		messageCount,
		userMessageCount,
		assistantMessageCount,
		language: state.language,
		voice: state.voice
	};
}

/**
 * Filter messages by role
 * @param state - Conversation state
 * @param role - Role to filter by
 * @returns Filtered messages
 */
export function filterMessagesByRole(
	state: ConversationState,
	role: 'user' | 'assistant'
): Message[] {
	return state.messages.filter((message) => message.role === role);
}

/**
 * Get last message
 * @param state - Conversation state
 * @returns Last message or undefined
 */
export function getLastMessage(state: ConversationState): Message | undefined {
	if (state.messages.length === 0) return undefined;
	return state.messages[state.messages.length - 1];
}

/**
 * Check if conversation can be started
 * @param state - Conversation state
 * @returns True if conversation can be started
 */
export function canStartConversation(state: ConversationState): boolean {
	return state.status === 'idle' && Boolean(state.language) && Boolean(state.voice);
}

/**
 * Check if conversation can be stopped
 * @param state - Conversation state
 * @returns True if conversation can be stopped
 */
export function canStopConversation(state: ConversationState): boolean {
	return state.status === 'connected' || state.status === 'streaming';
}
