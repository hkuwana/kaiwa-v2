// 🔄 Conversation Feature Events
// Defines all events that the conversation feature can emit and listen to

import type { EventBus } from '$lib/shared/events/eventBus';
import type { ConversationEvents, AudioEvents, AnalyticsEvents } from '$lib/shared/events/schemas';

// 🎯 Conversation Event Emitters
export const conversationEvents = {
	emit: {
		// Conversation lifecycle events
		started: (eventBus: EventBus, payload: ConversationEvents['conversation.started']) => {
			eventBus.emit('conversation.started', payload);
		},

		messageSent: (eventBus: EventBus, payload: ConversationEvents['conversation.message.sent']) => {
			eventBus.emit('conversation.message.sent', payload);
		},

		ended: (eventBus: EventBus, payload: ConversationEvents['conversation.ended']) => {
			eventBus.emit('conversation.ended', payload);
		},

		error: (eventBus: EventBus, payload: ConversationEvents['conversation.error']) => {
			eventBus.emit('conversation.error', payload);
		},

		// Audio events
		recordingStarted: (eventBus: EventBus, payload: AudioEvents['audio.recording.started']) => {
			eventBus.emit('audio.recording.started', payload);
		},

		recordingStopped: (eventBus: EventBus, payload: AudioEvents['audio.recording.stopped']) => {
			eventBus.emit('audio.recording.stopped', payload);
		},

		transcriptionCompleted: (
			eventBus: EventBus,
			payload: AudioEvents['audio.transcription.completed']
		) => {
			eventBus.emit('audio.transcription.completed', payload);
		},

		playbackStarted: (eventBus: EventBus, payload: AudioEvents['audio.playback.started']) => {
			eventBus.emit('audio.playback.started', payload);
		},

		// Analytics events
		featureUsed: (eventBus: EventBus, payload: AnalyticsEvents['analytics.feature.used']) => {
			eventBus.emit('analytics.feature.used', payload);
		},

		errorOccurred: (eventBus: EventBus, payload: AnalyticsEvents['analytics.error.occurred']) => {
			eventBus.emit('analytics.error.occurred', payload);
		}
	},

	on: {
		// Listen to events from other features
		userLogin: (eventBus: EventBus, handler: (payload: any) => void) => {
			eventBus.on('auth.user.login', handler);
		},

		userLogout: (eventBus: EventBus, handler: (payload: any) => void) => {
			eventBus.on('auth.user.logout', handler);
		},

		subscriptionUpdated: (eventBus: EventBus, handler: (payload: any) => void) => {
			eventBus.on('auth.subscription.updated', handler);
		}
	}
};

// 🎯 Event Payload Factories
export const createEventPayloads = {
	conversationStarted: (
		conversationId: string,
		language: string,
		mode: 'traditional' | 'realtime' = 'traditional',
		userId?: string
	) => ({
		conversationId,
		userId,
		targetLanguage: language,
		mode,
		timestamp: new Date()
	}),

	messageSent: (
		conversationId: string,
		messageId: string,
		role: 'user' | 'assistant',
		content: string
	) => ({
		conversationId,
		messageId,
		role,
		content,
		timestamp: new Date()
	}),

	conversationEnded: (
		conversationId: string,
		duration: number,
		messageCount: number,
		userId?: string
	) => ({
		conversationId,
		userId,
		duration,
		messageCount,
		timestamp: new Date()
	}),

	conversationError: (
		conversationId: string,
		error: string,
		context: Record<string, any> = {}
	) => ({
		conversationId,
		error,
		context,
		timestamp: new Date()
	}),

	recordingStarted: (sessionId: string, userId?: string) => ({
		sessionId,
		userId,
		timestamp: new Date()
	}),

	recordingStopped: (sessionId: string, duration: number, audioSize: number) => ({
		sessionId,
		duration,
		audioSize,
		timestamp: new Date()
	}),

	transcriptionCompleted: (
		sessionId: string,
		transcription: string,
		confidence: number,
		language: string
	) => ({
		sessionId,
		transcription,
		confidence,
		language,
		timestamp: new Date()
	}),

	playbackStarted: (sessionId: string, audioId: string) => ({
		sessionId,
		audioId,
		timestamp: new Date()
	}),

	featureUsed: (
		feature: string,
		action: string,
		sessionId: string,
		userId?: string,
		properties: Record<string, any> = {}
	) => ({
		userId,
		sessionId,
		feature,
		action,
		properties,
		timestamp: new Date()
	}),

	errorOccurred: (
		error: string,
		sessionId: string,
		userId?: string,
		context: Record<string, any> = {}
	) => ({
		userId,
		sessionId,
		error,
		context,
		timestamp: new Date()
	})
};
