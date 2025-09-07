// 🌐 Romanization Service
// Pure functions for romanization (client and server implementations)

import type { Message } from '$lib/server/db/types';
import { capitalize } from '$lib/utils';

// Romanization result interface
export interface RomanizationResult {
	romanization?: string;
	hiragana?: string;
	katakana?: string;
	hangul?: string;
	pinyin?: string;
	otherScripts?: Record<string, string>;
}

// Language detection
export function isJapaneseText(text: string): boolean {
	if (!text) return false;
	return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

export function isChineseText(text: string): boolean {
	if (!text) return false;
	return /[\u4E00-\u9FAF]/.test(text);
}

export function isKoreanText(text: string): boolean {
	if (!text) return false;
	return /[\uAC00-\uD7AF]/.test(text);
}

// Client-side romanization (fast, basic)
export async function generateRomanizationClient(
	text: string,
	language: string
): Promise<RomanizationResult> {
	const result: RomanizationResult = {};

	switch (language) {
		case 'ja':
			if (isJapaneseText(text)) {
				// Basic client-side Japanese processing
				result.romanization = text; // Placeholder - would use a lightweight library
				result.hiragana = text; // Placeholder
			}
			break;
		case 'zh':
			if (isChineseText(text)) {
				// Basic client-side Chinese processing
				result.pinyin = text; // Placeholder
			}
			break;
		case 'ko':
			if (isKoreanText(text)) {
				// Basic client-side Korean processing
				result.hangul = text; // Placeholder
			}
			break;
	}

	return result;
}

// Server-side romanization (accurate, complete)
export async function generateRomanizationServer(
	text: string,
	language: string,
	messageId: string
): Promise<RomanizationResult> {
	try {
		const response = await fetch('/api/romanization', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				text,
				messageId,
				language
			})
		});

		if (!response.ok) {
			throw new Error('Romanization API failed');
		}

		return await response.json();
	} catch (error) {
		console.error('Server romanization failed:', error);
		// Fallback to client-side
		return await generateRomanizationClient(text, language);
	}
}

// Get romanization display mode
export function getRomanizationDisplayMode(message: Message): 'furigana' | 'hiragana' | 'basic' {
	// This could be based on user preferences
	if (message.hiragana && message.romanization) {
		return 'furigana';
	}
	if (message.hiragana) {
		return 'hiragana';
	}
	return 'basic';
}
