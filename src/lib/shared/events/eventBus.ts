// 🔌 Core Event Bus Interface
export interface EventBus {
	emit<T>(eventName: string, payload: T): void;
	on<T>(eventName: string, handler: EventHandler<T>): void;
	off(eventName: string, handler: EventHandler<any>): void;
	once<T>(eventName: string, handler: EventHandler<T>): void;
	clear(): void;
}

export type EventHandler<T> = (payload: T) => void | Promise<void>;

// 🎯 MVP Implementation: In-Memory Event Bus
export class InMemoryEventBus implements EventBus {
	private handlers = new Map<string, EventHandler<any>[]>();
	private eventHistory: Array<{ name: string; payload: any; timestamp: Date }> = [];

	emit<T>(eventName: string, payload: T): void {
		// Store event in history for debugging
		this.eventHistory.push({
			name: eventName,
			payload,
			timestamp: new Date()
		});

		// Execute handlers
		const handlers = this.handlers.get(eventName) || [];
		handlers.forEach((handler) => {
			try {
				const result = handler(payload);
				if (result instanceof Promise) {
					result.catch((error) => {
						console.error(`Event handler error for ${eventName}:`, error);
					});
				}
			} catch (error) {
				console.error(`Event handler error for ${eventName}:`, error);
			}
		});
	}

	on<T>(eventName: string, handler: EventHandler<T>): void {
		const handlers = this.handlers.get(eventName) || [];
		handlers.push(handler);
		this.handlers.set(eventName, handlers);
	}

	off(eventName: string, handler: EventHandler<any>): void {
		const handlers = this.handlers.get(eventName) || [];
		const index = handlers.indexOf(handler);
		if (index > -1) {
			handlers.splice(index, 1);
		}
	}

	once<T>(eventName: string, handler: EventHandler<T>): void {
		const onceHandler = (payload: T) => {
			handler(payload);
			this.off(eventName, onceHandler);
		};
		this.on(eventName, onceHandler);
	}

	clear(): void {
		this.handlers.clear();
		this.eventHistory = [];
	}

	// Debug methods
	getEventHistory(): Array<{ name: string; payload: any; timestamp: Date }> {
		return [...this.eventHistory];
	}

	getHandlerCount(eventName: string): number {
		return this.handlers.get(eventName)?.length || 0;
	}
}

// 🏭 Event Bus Factory
export class EventBusFactory {
	static create(type: 'memory' | 'redis' = 'memory'): EventBus {
		switch (type) {
			case 'memory':
				return new InMemoryEventBus();
			case 'redis':
				throw new Error('Redis event bus not implemented yet');
			default:
				throw new Error(`Unknown event bus type: ${type}`);
		}
	}
}

// 🧪 Mock Event Bus for Testing
export class MockEventBus implements EventBus {
	public emittedEvents: Array<{ name: string; payload: any }> = [];

	emit<T>(eventName: string, payload: T): void {
		this.emittedEvents.push({ name: eventName, payload });
	}

	on<T>(eventName: string, handler: EventHandler<T>): void {}
	off(eventName: string, handler: EventHandler<any>): void {}
	once<T>(eventName: string, handler: EventHandler<T>): void {}
	clear(): void {
		this.emittedEvents = [];
	}

	getEmittedEvents(eventName?: string): Array<{ name: string; payload: any }> {
		if (eventName) {
			return this.emittedEvents.filter((event) => event.name === eventName);
		}
		return [...this.emittedEvents];
	}
}
