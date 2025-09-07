// 🌐 Furigana Service
// Pure functions for Japanese furigana processing (client and server implementations)

import type { Message } from '$lib/server/db/types';
import { isJapaneseText } from './romanization.service';

// Furigana result interface
export interface FuriganaResult {
	hiragana?: string;
	romanization?: string;
	katakana?: string;
	furigana?: string; // HTML with furigana markup
}

// Client-side furigana (fast, basic)
export async function generateFuriganaClient(text: string): Promise<FuriganaResult> {
	if (!isJapaneseText(text)) {
		return {};
	}

	// Basic client-side processing - this would use a lightweight library
	// For now, return placeholders
	return {
		hiragana: text, // Placeholder
		romanization: text, // Placeholder
		katakana: text, // Placeholder
		furigana: text // Placeholder
	};
}

// Server-side furigana (accurate, complete)
export async function generateFuriganaServer(
	text: string,
	messageId: string
): Promise<FuriganaResult> {
	if (!isJapaneseText(text)) {
		return {};
	}

	try {
		const response = await fetch('/api/furigana', {
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
			throw new Error('Furigana API failed');
		}

		return await response.json();
	} catch (error) {
		console.error('Server furigana failed:', error);
		// Fallback to client-side
		return await generateFuriganaClient(text);
	}
}

// Update message with furigana data
export function updateMessageWithFurigana(message: Message, furiganaData: FuriganaResult): Message {
	return {
		...message,
		hiragana: furiganaData.hiragana || message.hiragana,
		romanization: furiganaData.romanization || message.romanization,
		otherScripts: {
			...(message.otherScripts || {}),
			...(furiganaData.katakana && { katakana: furiganaData.katakana }),
			...(furiganaData.furigana && { furigana: furiganaData.furigana })
		}
	};
}

// Generate furigana for a message (auto-detect client/server)
export async function generateFuriganaForMessage(
	message: Message,
	useServer: boolean = true
): Promise<FuriganaResult> {
	if (!isJapaneseText(message.content)) {
		return {};
	}

	if (useServer) {
		return await generateFuriganaServer(message.content, message.id);
	} else {
		return await generateFuriganaClient(message.content);
	}
}
