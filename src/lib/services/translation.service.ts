// 🌐 Client-Side Translation Service
// Handles translation functionality on the client side by making API calls to server

import type { Message } from '$lib/server/db/types';

// Translation result interface (simplified)
interface TranslationResult {
	messageId: string;
	translatedContent: string;
	romanization?: string;
	hiragana?: string;
	otherScripts?: Record<string, string>; // For katakana, hangul, kanji, etc.
	sourceLanguage: string;
	targetLanguage: string;
	confidence?: 'low' | 'medium' | 'high';
	provider?: string;
}

/**
 * Translate text using the server-side translation API
 */
export async function translateText(
	text: string,
	messageId: string,
	sourceLanguage: string,
	targetLanguage: string,
	model?: string,
	enableRomanization?: boolean
): Promise<TranslationResult> {
	const response = await fetch('/api/translate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			text,
			messageId,
			sourceLanguage,
			targetLanguage,
			model,
			enableRomanization
		})
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Translation failed');
	}

	return await response.json();
}

/**
 * Translate a message using the server-side translation API
 */
export async function translateMessage(
	message: Message,
	targetLanguage: string,
	sourceLanguage: string = 'en'
): Promise<TranslationResult> {
	return await translateText(message.content, message.id, sourceLanguage, targetLanguage);
}

/**
 * Check if a message has been translated
 */
export function isMessageTranslated(message: Message): boolean {
	return (
		message.isTranslated === true &&
		message.translatedContent !== null &&
		message.translatedContent.trim() !== ''
	);
}

/**
 * Get the display content for a message (translated if available, original otherwise)
 */
export function getMessageDisplayContent(message: Message): string {
	return message.translatedContent || message.content;
}

/**
 * Get romanization for a message if available
 */
export function getMessageRomanization(message: Message): string | null {
	return message.romanization || null;
}

/**
 * Get hiragana for a message if available
 */
export function getMessageHiragana(message: Message): string | null {
	return message.hiragana || null;
}

/**
 * Get all available scripts for a message
 */
export function getMessageScripts(message: Message): Record<string, string> {
	const scripts: Record<string, string> = {};

	if (message.romanization) scripts.romanization = message.romanization;
	if (message.hiragana) scripts.hiragana = message.hiragana;

	// Add other scripts from the otherScripts field
	if (message.otherScripts) {
		Object.assign(scripts, message.otherScripts);
	}

	return scripts;
}
