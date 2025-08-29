// src/lib/services/message.service.ts
// Pure functions for message management
import type { Message } from '$lib/server/db/types';
import { SvelteDate } from 'svelte/reactivity';

export function createUserPlaceholder(sessionId: string): Message {
	return {
		role: 'user',
		content: '',
		timestamp: new SvelteDate(),
		id: `user_placeholder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		conversationId: sessionId,
		audioUrl: null
	};
}

export function updatePlaceholderToTranscribing(messages: Message[]): Message[] {
	const placeholderIndex = messages.findIndex(
		(msg) => msg.role === 'user' && msg.id.startsWith('user_placeholder_')
	);

	if (placeholderIndex === -1) return messages;

	const updatedMessages = [...messages];
	updatedMessages[placeholderIndex] = {
		...updatedMessages[placeholderIndex],
		id: `user_transcribing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
	};
	return updatedMessages;
}

export function updatePlaceholderWithPartial(messages: Message[], partialText: string): Message[] {
	const placeholderIndex = messages.findIndex(
		(msg) =>
			msg.role === 'user' &&
			(msg.id.startsWith('user_placeholder_') ||
				msg.id.startsWith('user_transcribing_') ||
				msg.id.startsWith('user_partial_'))
	);

	if (placeholderIndex === -1) return messages;

	const updatedMessages = [...messages];
	updatedMessages[placeholderIndex] = {
		...updatedMessages[placeholderIndex],
		content: partialText,
		id: `user_partial_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
	};
	return updatedMessages;
}

export function replaceUserPlaceholderWithFinal(
	messages: Message[],
	finalText: string,
	sessionId: string
): Message[] {
	const placeholderIndex = messages.findIndex(
		(msg) =>
			msg.role === 'user' &&
			(msg.id.startsWith('user_placeholder_') ||
				msg.id.startsWith('user_transcribing_') ||
				msg.id.startsWith('user_partial_'))
	);

	if (placeholderIndex === -1) {
		// No placeholder found, add new message
		return [...messages, createFinalUserMessage(finalText, sessionId)];
	}

	const updatedMessages = [...messages];
	updatedMessages[placeholderIndex] = {
		...updatedMessages[placeholderIndex],
		content: finalText,
		id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		timestamp: new SvelteDate()
	};
	return updatedMessages;
}

export function createFinalUserMessage(content: string, sessionId: string): Message {
	return {
		role: 'user',
		content,
		timestamp: new SvelteDate(),
		id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		conversationId: sessionId,
		audioUrl: null
	};
}

export function createStreamingMessage(content: string, sessionId: string): Message {
	return {
		role: 'assistant',
		content,
		timestamp: new SvelteDate(),
		id: `streaming_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		conversationId: sessionId,
		audioUrl: null
	};
}

export function updateStreamingMessage(messages: Message[], deltaText: string): Message[] {
	const streamingMessageIndex = messages.findIndex(
		(msg) => msg.role === 'assistant' && msg.id.startsWith('streaming_')
	);

	if (streamingMessageIndex === -1) {
		// Create new streaming message
		return [...messages, createStreamingMessage(deltaText, messages[0]?.conversationId || '')];
	}

	// Accumulate text in existing streaming message
	const updatedMessages = [...messages];
	updatedMessages[streamingMessageIndex] = {
		...updatedMessages[streamingMessageIndex],
		content: updatedMessages[streamingMessageIndex].content + deltaText
	};
	return updatedMessages;
}

export function finalizeStreamingMessage(messages: Message[], finalText: string): Message[] {
	const streamingMessageIndex = messages.findIndex(
		(msg) => msg.role === 'assistant' && msg.id.startsWith('streaming_')
	);

	if (streamingMessageIndex === -1) {
		// No streaming message found, create final message directly
		return [...messages, createFinalAssistantMessage(finalText, messages[0]?.conversationId || '')];
	}

	// Replace streaming message with final message
	const updatedMessages = [...messages];
	updatedMessages[streamingMessageIndex] = {
		...updatedMessages[streamingMessageIndex],
		content: finalText,
		id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		timestamp: new SvelteDate()
	};
	return updatedMessages;
}

export function createFinalAssistantMessage(content: string, sessionId: string): Message {
	return {
		role: 'assistant',
		content,
		timestamp: new SvelteDate(),
		id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		conversationId: sessionId,
		audioUrl: null
	};
}

export function hasPendingUserPlaceholder(messages: Message[]): boolean {
	return messages.some(
		(msg) =>
			msg.role === 'user' &&
			(msg.id.startsWith('user_placeholder_') ||
				msg.id.startsWith('user_transcribing_') ||
				msg.id.startsWith('user_partial_'))
	);
}

export function hasStreamingMessage(messages: Message[]): boolean {
	return messages.some((msg) => msg.role === 'assistant' && msg.id.startsWith('streaming_'));
}

export function createMessageFromEventData(
	data: { role: string; content: string; timestamp: Date },
	sessionId: string
): Message {
	return {
		role: data.role as 'user' | 'assistant',
		content: data.content,
		timestamp: new SvelteDate(),
		id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		conversationId: sessionId,
		audioUrl: null
	};
}

export function isDuplicateMessage(
	messages: Message[],
	newMessage: { role: string; content: string; timestamp: Date }
): boolean {
	return messages.some(
		(msg) =>
			msg.role === newMessage.role &&
			msg.content === newMessage.content &&
			Math.abs(msg.timestamp.getTime() - newMessage.timestamp.getTime()) < 2000
	);
}
