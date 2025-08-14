// place files you want to import through the `$lib` alias in this folder.

// Auth store for orchestrator and kernel access
export { authStore, authActions, authHelpers } from '$lib/authStore';
export {
	userContextStore,
	userCapabilities,
	userLimits,
	userPreferences,
	contextHelpers
} from '$lib/userContextStore';

// Core conversation functionality

// 🎭 Feature exports
export { createConversationStore } from './features/conversation/store.svelte';

// 🎭 App orchestrator
export { appOrchestrator } from './app/orchestrator';

// 🔌 Event system
export { EventBusFactory, InMemoryEventBus, MockEventBus } from './shared/events/eventBus';
export type { EventBus, EventHandler } from './shared/events/eventBus';
export { EventValidationService } from './shared/events/schemas';
export type { AllEvents } from './shared/events/schemas';

// 🗄️ Database repositories
export * from '$lib/server/repositories/index';
