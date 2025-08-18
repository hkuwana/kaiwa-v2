// 🎭 Main App Orchestrator
// Coordinates between different features using the event system

import { EventBusFactory, type EventBus } from '$lib/shared/events/eventBus';
import { ConversationOrchestrator } from '$lib/features/conversation/conversation-orchestrator.svelte';
import type { RealtimeConversationState } from '$lib/features/conversation/conversation-orchestrator.svelte';

export class AppOrchestrator {
	private eventBus: EventBus;
	private conversationOrchestrator: ConversationOrchestrator;

	constructor() {
		// Create the event bus
		this.eventBus = EventBusFactory.create('memory');

		// Initialize feature orchestrators
		this.conversationOrchestrator = new ConversationOrchestrator(this.eventBus);

		// Setup cross-feature event handling
		this.setupCrossFeatureEvents();
	}

	// 🎯 Setup cross-feature event handling
	private setupCrossFeatureEvents(): void {
		// Example: When conversation starts, other features can react
		this.eventBus.on('conversation.started', (payload) => {
			console.log('🎯 App orchestrator: Conversation started, notifying other features:', payload);
			// Here we could notify analytics, user tracking, etc.
		});

		// Example: When conversation ends, other features can react
		this.eventBus.on('conversation.ended', (payload) => {
			console.log('🎯 App orchestrator: Conversation ended, notifying other features:', payload);
			// Here we could update user progress, save analytics, etc.
		});

		// Example: Handle errors across features
		this.eventBus.on('analytics.error.occurred', (payload) => {
			console.log('🎯 App orchestrator: Error occurred, handling across features:', payload);
			// Here we could implement global error handling, user notifications, etc.
		});
	}

	// 🎯 Get the event bus for features to use
	getEventBus(): EventBus {
		return this.eventBus;
	}

	// 🎯 Conversation feature methods
	async startConversation(language?: string, voice?: string): Promise<void> {
		await this.conversationOrchestrator.startConversation(language, voice);
	}

	async startStreaming(): Promise<void> {
		await this.conversationOrchestrator.startStreaming();
	}

	async stopStreaming(): Promise<void> {
		await this.conversationOrchestrator.stopStreaming();
	}

	async endConversation(): Promise<void> {
		await this.conversationOrchestrator.endConversation();
	}

	getConversationState(): RealtimeConversationState {
		return this.conversationOrchestrator.getState();
	}

	// 🎯 Cleanup resources
	cleanup(): void {
		this.eventBus.clear();
	}

	// 🎯 Debug methods
	getEventHistory() {
		if ('getEventHistory' in this.eventBus) {
			return (this.eventBus as { getEventHistory(): unknown[] }).getEventHistory();
		}
		return [];
	}

	getHandlerCount(eventName: string) {
		if ('getHandlerCount' in this.eventBus) {
			return (this.eventBus as { getHandlerCount(eventName: string): number }).getHandlerCount(
				eventName
			);
		}
		return 0;
	}
}

// 🎯 Global app orchestrator instance
const appOrchestrator = new AppOrchestrator();

// 🎯 Export the instance and class
export { appOrchestrator };
export default AppOrchestrator;
