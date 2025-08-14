// 🎭 Conversation Feature - Main Export
// Exports all conversation feature components

export {
	createConversationKernel,
	conversationKernel,
	createInitialState
} from './kernel/index.js';
export type { ConversationState, ConversationAction, ConversationEffect } from './kernel/index.js';
export { ConversationOrchestrator } from './orchestrator.svelte';
export { conversationEvents, createEventPayloads } from './events';
export { createConversationStore } from './store.svelte';
export { adapters } from './adapters';
export type { AudioAdapter, AIAdapter, StorageAdapter } from './adapters';
