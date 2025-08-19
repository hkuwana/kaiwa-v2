# 🔄 Event System Architecture

> **Core Principle**: All inter-feature communication happens through typed events, ensuring loose coupling and maintainability.

---

## 🎯 Event System Overview

The event system is the backbone of Kaiwa v2's feature isolation strategy. It enables features to communicate without direct dependencies, making the system more maintainable and testable.

### 🔌 Event System Components

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Event Bus     │    │   Event Schema  │    │   Event Handler │
│   (Core)        │    │   (Validation)  │    │   (Consumer)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Event Store   │    │   Type Safety   │    │   Event Queue   │
│   (Persistence) │    │   (Contracts)   │    │   (Processing)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🏗️ Event System Architecture

### Core Event Bus Interface

```typescript
export interface EventBus {
	emit<T>(eventName: string, payload: T): void;
	on<T>(eventName: string, handler: EventHandler<T>): void;
	off(eventName: string, handler: EventHandler<any>): void;
	once<T>(eventName: string, handler: EventHandler<T>): void;
	clear(): void;
}

export type EventHandler<T> = (payload: T) => void | Promise<void>;
```

### MVP Implementation: In-Memory Event Bus

```typescript
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
```

---

## 📋 Event Schema Definitions

### Core Business Domain Events

#### 1. Authentication Events

```typescript
export interface AuthEvents {
	'auth.user.login': {
		userId: string;
		email: string;
		tier: string;
		timestamp: Date;
	};
	'auth.user.logout': {
		userId: string;
		timestamp: Date;
	};
	'auth.user.registered': {
		userId: string;
		email: string;
		tier: string;
		timestamp: Date;
	};
	'auth.subscription.updated': {
		userId: string;
		oldTier: string;
		newTier: string;
		timestamp: Date;
	};
}
```

#### 2. Conversation Events

```typescript
export interface ConversationEvents {
	'conversation.started': {
		conversationId: string;
		userId: string;
		targetLanguage: string;
		mode: 'traditional' | 'realtime';
		timestamp: Date;
	};
	'conversation.message.sent': {
		conversationId: string;
		messageId: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
	};
	'conversation.ended': {
		conversationId: string;
		userId: string;
		duration: number;
		messageCount: number;
		timestamp: Date;
	};
	'conversation.error': {
		conversationId: string;
		error: string;
		context: Record<string, any>;
		timestamp: Date;
	};
}
```

#### 3. Audio Events

```typescript
export interface AudioEvents {
	'audio.recording.started': {
		sessionId: string;
		userId?: string;
		timestamp: Date;
	};
	'audio.recording.stopped': {
		sessionId: string;
		duration: number;
		audioSize: number;
		timestamp: Date;
	};
	'audio.transcription.completed': {
		sessionId: string;
		transcription: string;
		confidence: number;
		language: string;
		timestamp: Date;
	};
	'audio.playback.started': {
		sessionId: string;
		audioId: string;
		timestamp: Date;
	};
}
```

#### 4. Vocabulary Events

```typescript
export interface VocabularyEvents {
	'vocabulary.word.encountered': {
		userId: string;
		word: string;
		language: string;
		context: string;
		timestamp: Date;
	};
	'vocabulary.word.mastered': {
		userId: string;
		word: string;
		language: string;
		masteryLevel: 'new' | 'learning' | 'practicing' | 'mastered';
		timestamp: Date;
	};
	'vocabulary.lesson.completed': {
		userId: string;
		lessonId: string;
		wordsLearned: string[];
		score: number;
		timestamp: Date;
	};
}
```

#### 5. Subscription Events

```typescript
export interface SubscriptionEvents {
	'subscription.created': {
		userId: string;
		subscriptionId: string;
		tier: string;
		amount: number;
		currency: string;
		timestamp: Date;
	};
	'subscription.canceled': {
		userId: string;
		subscriptionId: string;
		reason?: string;
		timestamp: Date;
	};
	'subscription.renewed': {
		userId: string;
		subscriptionId: string;
		nextBillingDate: Date;
		timestamp: Date;
	};
}
```

#### 6. Analytics Events

```typescript
export interface AnalyticsEvents {
	'analytics.feature.used': {
		userId?: string;
		sessionId: string;
		feature: string;
		action: string;
		properties: Record<string, any>;
		timestamp: Date;
	};
	'analytics.error.occurred': {
		userId?: string;
		sessionId: string;
		error: string;
		context: Record<string, any>;
		timestamp: Date;
	};
	'analytics.performance.metric': {
		userId?: string;
		sessionId: string;
		metric: string;
		value: number;
		unit: string;
		timestamp: Date;
	};
}
```

---

## 🔧 Event Schema Validation

### Event Schema Interface

```typescript
export interface EventSchema<T> {
	name: string;
	version: string;
	description: string;
	payload: T;
	validate: (payload: any) => payload is T;
}

// Example: User authentication event schema
export const USER_LOGIN_EVENT_SCHEMA: EventSchema<{
	userId: string;
	email: string;
	tier: string;
	timestamp: Date;
}> = {
	name: 'auth.user.login',
	version: '1.0.0',
	description: 'User successfully logged in',
	payload: {
		userId: 'string',
		email: 'string',
		tier: 'string',
		timestamp: 'Date'
	},
	validate: (
		payload
	): payload is {
		userId: string;
		email: string;
		tier: string;
		timestamp: Date;
	} => {
		return (
			typeof payload === 'object' &&
			payload !== null &&
			typeof payload.userId === 'string' &&
			typeof payload.email === 'string' &&
			typeof payload.tier === 'string' &&
			payload.timestamp instanceof Date
		);
	}
};
```

### Event Validation Service

```typescript
export class EventValidationService {
	private schemas = new Map<string, EventSchema<any>>();

	registerSchema<T>(schema: EventSchema<T>): void {
		this.schemas.set(schema.name, schema);
	}

	validateEvent<T>(eventName: string, payload: any): payload is T {
		const schema = this.schemas.get(eventName);
		if (!schema) {
			console.warn(`No schema found for event: ${eventName}`);
			return true; // Allow unknown events in development
		}
		return schema.validate(payload);
	}

	getSchema(eventName: string): EventSchema<any> | undefined {
		return this.schemas.get(eventName);
	}
}
```

---

## 🚀 Event Implementation Examples

### 1. Feature Event Emission

```typescript
// In a conversation feature
export class ConversationService {
	constructor(private eventBus: EventBus) {}

	async startConversation(userId: string, targetLanguage: string): Promise<Conversation> {
		try {
			const conversation = await this.createConversation(userId, targetLanguage);

			// Emit success event
			this.eventBus.emit('conversation.started', {
				conversationId: conversation.id,
				userId,
				targetLanguage,
				mode: 'traditional',
				timestamp: new Date()
			});

			return conversation;
		} catch (error) {
			// Emit error event
			this.eventBus.emit('conversation.error', {
				conversationId: 'unknown',
				error: error.message,
				context: { userId, targetLanguage },
				timestamp: new Date()
			});
			throw error;
		}
	}
}
```

### 2. Feature Event Consumption

```typescript
// In an analytics feature
export class AnalyticsService {
	constructor(private eventBus: EventBus) {
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		// Listen to conversation events
		this.eventBus.on('conversation.started', this.handleConversationStarted.bind(this));
		this.eventBus.on('conversation.ended', this.handleConversationEnded.bind(this));

		// Listen to audio events
		this.eventBus.on('audio.transcription.completed', this.handleTranscriptionCompleted.bind(this));
	}

	private handleConversationStarted(event: ConversationStartedEvent): void {
		this.trackEvent('conversation.started', {
			userId: event.userId,
			language: event.targetLanguage,
			mode: event.mode
		});
	}

	private handleConversationEnded(event: ConversationEndedEvent): void {
		this.trackEvent('conversation.ended', {
			userId: event.userId,
			duration: event.duration,
			messageCount: event.messageCount
		});
	}

	private handleTranscriptionCompleted(event: TranscriptionCompletedEvent): void {
		this.trackEvent('audio.transcription.completed', {
			sessionId: event.sessionId,
			confidence: event.confidence,
			language: event.language
		});
	}

	private trackEvent(eventName: string, properties: Record<string, any>): void {
		// Send to analytics service
		this.sendToAnalytics(eventName, properties);
	}
}
```

### 3. Cross-Feature Communication

```typescript
// Auth feature emits user login event
export class AuthService {
	constructor(private eventBus: EventBus) {}

	async loginUser(credentials: LoginCredentials): Promise<User> {
		const user = await this.authenticateUser(credentials);

		// Emit login event for other features
		this.eventBus.emit('auth.user.login', {
			userId: user.id,
			email: user.email,
			tier: user.tier,
			timestamp: new Date()
		});

		return user;
	}
}

// Conversation feature reacts to user login
export class ConversationService {
	constructor(private eventBus: EventBus) {
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.eventBus.on('auth.user.login', this.handleUserLogin.bind(this));
	}

	private handleUserLogin(event: UserLoginEvent): void {
		// Update user's conversation preferences
		this.updateUserPreferences(event.userId, event.tier);

		// Emit analytics event
		this.eventBus.emit('analytics.feature.used', {
			userId: event.userId,
			sessionId: 'auth-session',
			feature: 'conversation',
			action: 'user_login_processed',
			properties: { tier: event.tier },
			timestamp: new Date()
		});
	}
}
```

---

## 🔍 Event Debugging & Monitoring

### Event History Tracking

```typescript
export class EventDebugger {
	constructor(private eventBus: InMemoryEventBus) {}

	getRecentEvents(limit: number = 50): Array<{ name: string; payload: any; timestamp: Date }> {
		const history = this.eventBus.getEventHistory();
		return history.slice(-limit);
	}

	getEventsByName(eventName: string): Array<{ name: string; payload: any; timestamp: Date }> {
		const history = this.eventBus.getEventHistory();
		return history.filter((event) => event.name === eventName);
	}

	getEventFlow(userId: string): Array<{ name: string; payload: any; timestamp: Date }> {
		const history = this.eventBus.getEventHistory();
		return history.filter(
			(event) =>
				event.payload &&
				typeof event.payload === 'object' &&
				'userId' in event.payload &&
				event.payload.userId === userId
		);
	}
}
```

### Event Performance Monitoring

```typescript
export class EventPerformanceMonitor {
	private eventTimings = new Map<string, number[]>();

	trackEventTiming(eventName: string, duration: number): void {
		const timings = this.eventTimings.get(eventName) || [];
		timings.push(duration);
		this.eventTimings.set(eventName, timings);
	}

	getEventPerformanceStats(eventName: string): {
		count: number;
		averageDuration: number;
		minDuration: number;
		maxDuration: number;
	} | null {
		const timings = this.eventTimings.get(eventName);
		if (!timings || timings.length === 0) return null;

		const count = timings.length;
		const averageDuration = timings.reduce((sum, time) => sum + time, 0) / count;
		const minDuration = Math.min(...timings);
		const maxDuration = Math.max(...timings);

		return { count, averageDuration, minDuration, maxDuration };
	}
}
```

---

## 🚀 Future Scaling Considerations

### Redis Streams Migration

```typescript
// Future implementation for multi-instance support
export class RedisEventBus implements EventBus {
	constructor(private redis: Redis) {}

	async emit<T>(eventName: string, payload: T): Promise<void> {
		const event = {
			id: Date.now().toString(),
			name: eventName,
			payload: JSON.stringify(payload),
			timestamp: new Date().toISOString()
		};

		await this.redis.xadd('events', '*', 'data', JSON.stringify(event));
	}

	async on<T>(eventName: string, handler: EventHandler<T>): Promise<void> {
		// Subscribe to Redis stream
		const stream = this.redis.xread('BLOCK', 0, 'STREAMS', 'events', '$');

		for await (const [, messages] of stream) {
			for (const [, fields] of messages) {
				const event = JSON.parse(fields.data);
				if (event.name === eventName) {
					await handler(JSON.parse(event.payload));
				}
			}
		}
	}
}
```

### Event Persistence

```typescript
export class PersistentEventBus implements EventBus {
	constructor(
		private memoryBus: InMemoryEventBus,
		private eventStore: EventStore
	) {}

	async emit<T>(eventName: string, payload: T): Promise<void> {
		// Store event for persistence
		await this.eventStore.storeEvent(eventName, payload);

		// Emit to memory bus for immediate processing
		this.memoryBus.emit(eventName, payload);
	}
}
```

---

## 📊 Event System Best Practices

### 1. Event Naming Convention

```typescript
// Use dot notation: domain.action.result
'auth.user.login'; // ✅ Good
'conversation.message.sent'; // ✅ Good
'userLogin'; // ❌ Bad
'CONVERSATION_STARTED'; // ❌ Bad
```

### 2. Event Payload Design

```typescript
// ✅ Good: Include all necessary context
{
  userId: 'user-123',
  conversationId: 'conv-456',
  action: 'message_sent',
  timestamp: new Date(),
  metadata: { language: 'ja', mode: 'traditional' }
}

// ❌ Bad: Missing context
{
  message: 'Hello'
}
```

### 3. Error Handling

```typescript
// Always handle errors in event handlers
this.eventBus.on('conversation.started', async (event) => {
	try {
		await this.processConversationStart(event);
	} catch (error) {
		console.error('Failed to process conversation start:', error);
		// Emit error event
		this.eventBus.emit('analytics.error.occurred', {
			error: error.message,
			context: { event, handler: 'conversation.started' },
			timestamp: new Date()
		});
	}
});
```

### 4. Event Ordering

```typescript
// Use timestamps for event ordering
this.eventBus.emit('conversation.started', {
	conversationId: 'conv-123',
	timestamp: new Date()
});

// Process events in chronological order
const sortedEvents = events.sort(
	(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
);
```

---

## 🔧 Development Tools

### Event Bus Factory

```typescript
export class EventBusFactory {
	static create(type: 'memory' | 'redis' = 'memory'): EventBus {
		switch (type) {
			case 'memory':
				return new InMemoryEventBus();
			case 'redis':
				return new RedisEventBus(new Redis());
			default:
				throw new Error(`Unknown event bus type: ${type}`);
		}
	}
}
```

### Event Testing Utilities

```typescript
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
```

---

_The event system is the foundation of Kaiwa v2's maintainable architecture. Follow these patterns to build features that communicate effectively without tight coupling._
