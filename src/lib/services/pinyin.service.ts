// 🌐 Pinyin Service
// Pure functions for Chinese pinyin processing (client and server implementations)

import type { Message } from '$lib/server/db/types';
import { isChineseText } from './romanization.service';
import { SecuritySanitizer } from '$lib/utils/security';

// Pinyin result interface
export interface PinyinResult {
	pinyin?: string; // Pinyin with tone marks
	romanization?: string; // Pinyin without tone marks (plain)
	pinyinRuby?: string; // HTML with ruby markup for display
	otherScripts?: Record<string, string>;
}

// Client-side pinyin (fast, lightweight)
export async function generatePinyinClient(text: string): Promise<PinyinResult> {
	if (!isChineseText(text)) {
		return {};
	}

	try {
		// Use lightweight fallback implementation
		const { pinyinize, pinyinWithTones } = await import('$lib/utils/chinese-pinyin');
		const pinyinPlain = pinyinize(text);
		const pinyinTones = pinyinWithTones(text);

		return {
			romanization: pinyinPlain.charAt(0).toUpperCase() + pinyinPlain.slice(1),
			pinyin: pinyinTones,
			otherScripts: {
				pinyin: pinyinTones,
				pinyinPlain: pinyinPlain
			}
		};
	} catch (error) {
		console.error('Client-side pinyin failed:', error);
		return {
			pinyin: text // Fallback to original text
		};
	}
}

// Server-side pinyin (accurate, complete with ruby markup)
export async function generatePinyinServer(text: string, messageId: string): Promise<PinyinResult> {
	if (!isChineseText(text)) {
		return {};
	}

	try {
		const response = await fetch('/api/features/pinyin', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				text,
				messageId
			})
		});

		if (!response.ok) {
			throw new Error('Pinyin API failed');
		}

		return await response.json();
	} catch (error) {
		console.error('Server pinyin failed:', error);
		// Fallback to client-side
		return await generatePinyinClient(text);
	}
}

// Update message with pinyin data - WITH SANITIZATION
export function updateMessageWithPinyin(message: Message, pinyinData: PinyinResult): Message {
	// Validate and sanitize all script content before storing
	if (!SecuritySanitizer.validateScriptContent(pinyinData as Record<string, unknown>)) {
		console.warn('⚠️ Potentially unsafe pinyin content detected, using fallback');
		return message; // Return original message if validation fails
	}

	return {
		...message,
		romanization: pinyinData.romanization
			? SecuritySanitizer.sanitizeScriptContent(pinyinData.romanization)
			: message.romanization,
		otherScripts: {
			...(message.otherScripts || {}),
			...(pinyinData.pinyin && {
				pinyin: SecuritySanitizer.sanitizeScriptContent(pinyinData.pinyin)
			}),
			...(pinyinData.pinyinRuby && {
				pinyinRuby: SecuritySanitizer.sanitizeFuriganaHTML(pinyinData.pinyinRuby)
			}),
			...(pinyinData.otherScripts || {})
		}
	};
}

// Generate pinyin for a message (auto-detect client/server)
export async function generatePinyinForMessage(
	message: Message,
	useServer: boolean = true
): Promise<PinyinResult> {
	if (!isChineseText(message.content)) {
		return {};
	}

	if (useServer) {
		return await generatePinyinServer(message.content, message.id);
	} else {
		return await generatePinyinClient(message.content);
	}
}
