// src/lib/services/message.service.ts
// Pure functions for message management
import type { Message } from '$lib/server/db/types';
import { SvelteDate } from 'svelte/reactivity';
import {
	generateScriptsForMessage,
	updateMessageWithScripts,
	needsScriptGeneration,
	generateAndStoreScriptsForMessage,
	detectLanguage
} from './scripts.service';

export function createUserPlaceholder(sessionId: string): Message {
	return {
		role: 'user',
		content: '',
		timestamp: new SvelteDate(),
		id: `user_placeholder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		conversationId: sessionId,
		audioUrl: null,

		// Translation and language fields
		translatedContent: null,
		sourceLanguage: null,
		targetLanguage: null,
		userNativeLanguage: null,

		// Multi-language script support
		romanization: null,
		hiragana: null,

		otherScripts: null,

		// Translation metadata
		translationConfidence: null,
		translationProvider: null,
		translationNotes: null,
		isTranslated: false,

		// Analysis and feedback
		grammarAnalysis: null,
		vocabularyAnalysis: null,
		pronunciationScore: null,
		audioDuration: null,
		difficultyLevel: null,
		learningTags: null,

		// Context fields
		conversationContext: null,
		messageIntent: null
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
	// Build final user message
	const finalized = {
		...updatedMessages[placeholderIndex],
		content: finalText,
		id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		timestamp: new SvelteDate()
	};
	// Remove placeholder from its current position and append finalized message to end
	updatedMessages.splice(placeholderIndex, 1);
	return [...updatedMessages, finalized];
}

export function createFinalUserMessage(content: string, sessionId: string): Message {
	return {
		role: 'user',
		content,
		timestamp: new SvelteDate(),
		id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		conversationId: sessionId,
		audioUrl: null,

		// Translation and language fields
		translatedContent: null,
		sourceLanguage: null,
		targetLanguage: null,
		userNativeLanguage: null,

		// Multi-language script support
		romanization: null,
		hiragana: null,
		otherScripts: null,

		// Translation metadata
		translationConfidence: null,
		translationProvider: null,
		translationNotes: null,
		isTranslated: false,

		// Analysis and feedback
		grammarAnalysis: null,
		vocabularyAnalysis: null,
		pronunciationScore: null,
		audioDuration: null,
		difficultyLevel: null,
		learningTags: null,

		// Context fields
		conversationContext: null,
		messageIntent: null
	};
}

export function createStreamingMessage(content: string, sessionId: string): Message {
	return {
		role: 'assistant',
		content,
		timestamp: new SvelteDate(),
		id: `streaming_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
		conversationId: sessionId,
		audioUrl: null,

		// Translation and language fields
		translatedContent: null,
		sourceLanguage: null,
		targetLanguage: null,
		userNativeLanguage: null,

		// Multi-language script support
		romanization: null,
		hiragana: null,
		otherScripts: null,

		// Translation metadata
		translationConfidence: null,
		translationProvider: null,
		translationNotes: null,
		isTranslated: false,

		// Analysis and feedback
		grammarAnalysis: null,
		vocabularyAnalysis: null,
		pronunciationScore: null,
		audioDuration: null,
		difficultyLevel: null,
		learningTags: null,

		// Context fields
		conversationContext: null,
		messageIntent: null
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
		audioUrl: null,

		// Translation and language fields
		translatedContent: null,
		sourceLanguage: null,
		targetLanguage: null,
		userNativeLanguage: null,

		// Multi-language script support
		romanization: null,
		hiragana: null,
		otherScripts: null,

		// Translation metadata
		translationConfidence: null,
		translationProvider: null,
		translationNotes: null,
		isTranslated: false,

		// Analysis and feedback
		grammarAnalysis: null,
		vocabularyAnalysis: null,
		pronunciationScore: null,
		audioDuration: null,
		difficultyLevel: null,
		learningTags: null,

		// Context fields
		conversationContext: null,
		messageIntent: null
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
		audioUrl: null,

		// Translation and language fields
		translatedContent: null,
		sourceLanguage: null,
		targetLanguage: null,
		userNativeLanguage: null,

		// Multi-language script support
		romanization: null,
		hiragana: null,
		otherScripts: null,

		// Translation metadata
		translationConfidence: null,
		translationProvider: null,
		translationNotes: null,
		isTranslated: false,

		// Analysis and feedback
		grammarAnalysis: null,
		vocabularyAnalysis: null,
		pronunciationScore: null,
		audioDuration: null,
		difficultyLevel: null,
		learningTags: null,

		// Context fields
		conversationContext: null,
		messageIntent: null
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

/**
 * Finalize a message with furigana generation for Japanese content
 */
export async function finalizeMessageWithFurigana(
	messages: Message[],
	finalText: string,
	sessionId: string,
	role: 'user' | 'assistant' = 'user'
): Promise<Message[]> {
	// Create the final message
	const finalMessage =
		role === 'user'
			? createFinalUserMessage(finalText, sessionId)
			: createFinalAssistantMessage(finalText, sessionId);

	// Always check if the message needs script generation
	if (needsScriptGeneration(finalMessage)) {
		console.log(`Generating scripts for ${role} message:`, finalText.substring(0, 50));
		try {
			const scriptData = await generateScriptsForMessage(finalMessage, true); // Use server
			if (scriptData && Object.keys(scriptData).length > 0) {
				console.log('Scripts generated successfully:', scriptData);
				const updatedMessage = updateMessageWithScripts(finalMessage, scriptData);
				return [...messages, updatedMessage];
			} else {
				console.log('No script data generated');
			}
		} catch (error) {
			console.error('Error generating scripts for message:', error);
		}
	}

	// Return the message without furigana if generation failed or not needed
	return [...messages, finalMessage];
}

/**
 * Replace user placeholder with final message including furigana generation
 */
export async function replaceUserPlaceholderWithFinalAndFurigana(
	messages: Message[],
	finalText: string,
	sessionId: string,
	conversationLanguage: string = 'en'
): Promise<Message[]> {
	const placeholderIndex = messages.findIndex(
		(msg) =>
			msg.role === 'user' &&
			(msg.id.startsWith('user_placeholder_') ||
				msg.id.startsWith('user_transcribing_') ||
				msg.id.startsWith('user_partial_'))
	);

	if (placeholderIndex === -1) {
		// No placeholder found, add new message with furigana
		return await finalizeMessageWithFurigana(messages, finalText, sessionId, 'user');
	}

	// Create the final message
	const finalMessage = createFinalUserMessage(finalText, sessionId);

	// Determine if we should generate scripts based on conversation language or text detection
	const shouldGenerateScripts =
		conversationLanguage === 'ja' || needsScriptGeneration(finalMessage);
	const scriptLanguage = conversationLanguage === 'ja' ? 'ja' : detectLanguage(finalText);

	if (shouldGenerateScripts && scriptLanguage !== 'other') {
		console.log(
			`🇯🇵 Auto-generating scripts for user message (conversation lang: ${conversationLanguage}):`,
			finalText.substring(0, 50)
		);

		try {
			const scriptData = await generateScriptsForMessage(finalMessage, true); // Use server
			if (scriptData && Object.keys(scriptData).length > 0) {
				console.log('Scripts generated successfully for user message:', scriptData);
				const updatedMessage = updateMessageWithScripts(finalMessage, scriptData);
				const updatedMessages = [...messages];
				// Replace placeholder in its original position to maintain correct chronological order
				updatedMessages[placeholderIndex] = updatedMessage;

				// Trigger server-side generation and database storage
				generateAndStoreScriptsForMessage(finalMessage.id, finalText, scriptLanguage)
					.then((success) => {
						if (success) {
							console.log('✅ Server-side scripts generated and stored for user message');
						} else {
							console.warn('⚠️ Server-side script generation failed for user message');
						}
					})
					.catch((error) => {
						console.error('❌ Error in server-side script generation for user message:', error);
					});

				return updatedMessages;
			} else {
				console.log('No script data generated for user message');
			}
		} catch (error) {
			console.error('Error generating scripts for user message:', error);
		}
	}

	// Replace placeholder in its original position to maintain correct chronological order
	const updatedMessages = [...messages];
	updatedMessages[placeholderIndex] = finalMessage;

	// Always trigger server-side generation for Japanese conversations or detected Japanese text
	if (scriptLanguage !== 'other') {
		console.log(`📝 Triggering server-side script storage (${scriptLanguage})...`);
		generateAndStoreScriptsForMessage(finalMessage.id, finalText, scriptLanguage)
			.then((success) => {
				if (success) {
					console.log('✅ Server-side scripts generated and stored for user message (fallback)');
				}
			})
			.catch((error) => {
				console.error('❌ Error in server-side script generation (fallback):', error);
			});
	}

	return updatedMessages;
}

/**
 * Finalize streaming message with furigana generation
 */
export async function finalizeStreamingMessageWithFurigana(
	messages: Message[],
	finalText: string,
	conversationLanguage: string = 'en'
): Promise<Message[]> {
	const streamingMessageIndex = messages.findIndex(
		(msg) => msg.role === 'assistant' && msg.id.startsWith('streaming_')
	);

	if (streamingMessageIndex === -1) {
		// No streaming message found, create final message with furigana
		return await finalizeMessageWithFurigana(
			messages,
			finalText,
			messages[0]?.conversationId || '',
			'assistant'
		);
	}

	// Create the final message
	const finalMessage = createFinalAssistantMessage(finalText, messages[0]?.conversationId || '');

	// Determine if we should generate scripts based on conversation language or text detection
	const shouldGenerateScripts =
		conversationLanguage === 'ja' || needsScriptGeneration(finalMessage);
	const scriptLanguage = conversationLanguage === 'ja' ? 'ja' : detectLanguage(finalText);

	if (shouldGenerateScripts && scriptLanguage !== 'other') {
		console.log(
			`🤖 Auto-generating scripts for assistant message (conversation lang: ${conversationLanguage}):`,
			finalText.substring(0, 50)
		);

		try {
			const scriptData = await generateScriptsForMessage(finalMessage, true); // Use server
			if (scriptData && Object.keys(scriptData).length > 0) {
				console.log('Scripts generated successfully for assistant message:', scriptData);
				const updatedMessage = updateMessageWithScripts(finalMessage, scriptData);
				const updatedMessages = [...messages];
				updatedMessages[streamingMessageIndex] = updatedMessage;

				// Trigger server-side generation and database storage
				generateAndStoreScriptsForMessage(finalMessage.id, finalText, scriptLanguage)
					.then((success) => {
						if (success) {
							console.log('✅ Server-side scripts generated and stored for assistant message');
						} else {
							console.warn('⚠️ Server-side script generation failed for assistant message');
						}
					})
					.catch((error) => {
						console.error(
							'❌ Error in server-side script generation for assistant message:',
							error
						);
					});

				return updatedMessages;
			} else {
				console.log('No script data generated for assistant message');
			}
		} catch (error) {
			console.error('Error generating scripts for assistant message:', error);
		}
	}

	// Replace streaming message with final message
	const updatedMessages = [...messages];
	updatedMessages[streamingMessageIndex] = finalMessage;

	// Always trigger server-side generation for Japanese conversations or detected Japanese text
	if (scriptLanguage !== 'other') {
		console.log(`🤖📝 Triggering server-side script storage (${scriptLanguage})...`);
		generateAndStoreScriptsForMessage(finalMessage.id, finalText, scriptLanguage)
			.then((success) => {
				if (success) {
					console.log(
						'✅ Server-side scripts generated and stored for assistant message (fallback)'
					);
				}
			})
			.catch((error) => {
				console.error('❌ Error in server-side script generation (fallback):', error);
			});
	}

	return updatedMessages;
}
