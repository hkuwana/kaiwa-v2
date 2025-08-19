// 🎭 Conversation Feature - Main Export
// Exports all conversation feature components

export { conversationKernel, createInitialState, realtimeSanitizer } from './kernel/index';
export type {
	ConversationState,
	ConversationAction,
	ConversationEffect,
	RealtimeConversationStatus
} from './kernel/index'; 
export { conversationEvents, createEventPayloads } from './events';
export { createConversationStore } from './store.svelte';
export { adapters } from './adapters';
export type { AudioAdapter, AIAdapter, StorageAdapter } from './adapters';
