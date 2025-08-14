// 📋 Event Schema Definitions
export interface EventSchema<T> {
	name: string;
	version: string;
	description: string;
	payload: T;
	validate: (payload: any) => payload is T;
}

// 🎯 Core Business Domain Events

// 1. Authentication Events
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

// 2. Conversation Events
export interface ConversationEvents {
	'conversation.started': {
		conversationId: string;
		userId?: string;
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
		userId?: string;
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

// 3. Audio Events
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

// 4. Vocabulary Events
export interface VocabularyEvents {
	'vocabulary.word.encountered': {
		userId?: string;
		word: string;
		language: string;
		context: string;
		timestamp: Date;
	};
	'vocabulary.word.mastered': {
		userId?: string;
		word: string;
		language: string;
		masteryLevel: 'new' | 'learning' | 'practicing' | 'mastered';
		timestamp: Date;
	};
}

// 5. Subscription Events
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
}

// 6. Analytics Events
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
}

// 🎯 Combined Event Types
export type AllEvents = AuthEvents &
	ConversationEvents &
	AudioEvents &
	VocabularyEvents &
	SubscriptionEvents &
	AnalyticsEvents;

// 🔧 Event Schema Validation Service
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

// 📝 Example Event Schemas
export const CONVERSATION_STARTED_SCHEMA: EventSchema<ConversationEvents['conversation.started']> =
	{
		name: 'conversation.started',
		version: '1.0.0',
		description: 'A new conversation has been started',
		payload: {
			conversationId: 'string',
			userId: 'string?',
			targetLanguage: 'string',
			mode: 'traditional | realtime',
			timestamp: 'Date'
		},
		validate: (payload): payload is ConversationEvents['conversation.started'] => {
			return (
				typeof payload === 'object' &&
				payload !== null &&
				typeof payload.conversationId === 'string' &&
				(typeof payload.userId === 'string' || payload.userId === undefined) &&
				typeof payload.targetLanguage === 'string' &&
				['traditional', 'realtime'].includes(payload.mode) &&
				payload.timestamp instanceof Date
			);
		}
	};
