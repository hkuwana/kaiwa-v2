// 🌐 Romanization Service
// Pure functions for romanization (client and server implementations)

import type { Message } from '$lib/server/db/types';

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
				// Use our lightweight client-side Korean romanization
				const { romanizeKorean } = await import('$lib/utils/korean-romanization');
				result.romanization = romanizeKorean(text);
				result.hangul = text; // Original Korean text
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

// ============================================================================
// SERVER-SIDE SCRIPT CONVERSION FUNCTIONS
// These functions only work on the server side and use Kuroshiro for Japanese
// ============================================================================

/**
 * Convert Japanese text to hiragana using Kuroshiro
 * This function only works on the server side
 */
export async function convertToHiragana(text: string): Promise<string> {
	// Temporarily disabled during build to prevent hanging
	console.warn('Hiragana conversion temporarily disabled during build');
	return '';

	// Check if we're in a browser environment or during build
	if (
		typeof window !== 'undefined' ||
		typeof process === 'undefined' ||
		(process.env.NODE_ENV === 'production' && !process.env.SSR) ||
		process.env.VITE_BUILD ||
		process.env.BUILDING
	) {
		console.warn('Hiragana conversion is not available in browser environment or during build');
		return '';
	}

	// Additional check to prevent execution during build
	if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production' && !process.env.SSR) {
		return '';
	}

	try {
		console.log('[ROMANIZATION] Starting hiragana conversion for text:', text);

		// Import Kuroshiro and KuromojiAnalyzer as per documentation
		const KuroshiroModule = await import('kuroshiro');
		const KuromojiAnalyzerModule = await import('kuroshiro-analyzer-kuromoji');

		const Kuroshiro = KuroshiroModule.default.default;
		const KuromojiAnalyzer = KuromojiAnalyzerModule.default;

		const kuroshiro = new Kuroshiro();
		const analyzer = new KuromojiAnalyzer();

		console.log('[ROMANIZATION] Initializing kuroshiro with analyzer...');
		await kuroshiro.init(analyzer);

		console.log('[ROMANIZATION] Converting text to hiragana...');
		const result = await kuroshiro.convert(text, {
			to: 'hiragana',
			mode: 'furigana'
		});

		console.log('[ROMANIZATION] Hiragana conversion result:', result);
		return result;
	} catch (error) {
		console.error('Failed to convert to hiragana:', error);
		return '';
	}
}

/**
 * Convert Japanese text to katakana using Kuroshiro
 * This function only works on the server side
 */
export async function convertToKatakana(text: string): Promise<string> {
	// Temporarily disabled during build to prevent hanging
	console.warn('Katakana conversion temporarily disabled during build');
	return '';

	// Check if we're in a browser environment or during build
	if (
		typeof window !== 'undefined' ||
		typeof process === 'undefined' ||
		(process.env.NODE_ENV === 'production' && !process.env.SSR) ||
		process.env.VITE_BUILD
	) {
		console.warn('Katakana conversion is not available in browser environment or during build');
		return '';
	}

	try {
		console.log('[ROMANIZATION] Starting katakana conversion for text:', text);

		// Import Kuroshiro and KuromojiAnalyzer as per documentation
		const KuroshiroModule = await import('kuroshiro');
		const KuromojiAnalyzerModule = await import('kuroshiro-analyzer-kuromoji');

		const Kuroshiro = KuroshiroModule.default.default;
		const KuromojiAnalyzer = KuromojiAnalyzerModule.default;

		const kuroshiro = new Kuroshiro();
		const analyzer = new KuromojiAnalyzer();

		console.log('[ROMANIZATION] Initializing kuroshiro with analyzer...');
		await kuroshiro.init(analyzer);

		console.log('[ROMANIZATION] Converting text to katakana...');
		const result = await kuroshiro.convert(text, {
			to: 'katakana',
			mode: 'furigana'
		});

		console.log('[ROMANIZATION] Katakana conversion result:', result);
		return result;
	} catch (error) {
		console.error('Failed to convert to katakana:', error);
		return '';
	}
}

/**
 * Convert Japanese text to romaji using Kuroshiro
 * This function only works on the server side
 */
export async function convertToRomaji(text: string): Promise<string> {
	// Temporarily disabled during build to prevent hanging
	console.warn('Romaji conversion temporarily disabled during build');
	return '';

	// Check if we're in a browser environment or during build
	if (
		typeof window !== 'undefined' ||
		typeof process === 'undefined' ||
		(process.env.NODE_ENV === 'production' && !process.env.SSR) ||
		process.env.VITE_BUILD
	) {
		console.warn('Romaji conversion is not available in browser environment or during build');
		return '';
	}

	try {
		console.log('[ROMANIZATION] Starting romaji conversion for text:', text);

		// Import Kuroshiro and KuromojiAnalyzer as per documentation
		const KuroshiroModule = await import('kuroshiro');
		const KuromojiAnalyzerModule = await import('kuroshiro-analyzer-kuromoji');

		const Kuroshiro = KuroshiroModule.default.default;
		const KuromojiAnalyzer = KuromojiAnalyzerModule.default;

		const kuroshiro = new Kuroshiro();
		const analyzer = new KuromojiAnalyzer();

		console.log('[ROMANIZATION] Initializing kuroshiro with analyzer...');
		await kuroshiro.init(analyzer);

		console.log('[ROMANIZATION] Converting text to romaji...');
		const result = await kuroshiro.convert(text, {
			to: 'romaji',
			mode: 'spaced', // Use 'spaced' mode to add proper spacing between words
			romajiSystem: 'hepburn'
		});

		console.log('[ROMANIZATION] Romaji conversion result:', result);
		return result;
	} catch (error) {
		console.error('Failed to convert to romaji:', error);
		return '';
	}
}

/**
 * Process Japanese text and generate all scripts using Kuroshiro
 */
export async function processJapaneseText(text: string): Promise<{
	hiragana?: string;
	romanization?: string;
	otherScripts?: Record<string, string>;
}> {
	const result: {
		hiragana?: string;
		romanization?: string;
		otherScripts?: Record<string, string>;
	} = {};

	// Convert to hiragana
	const hiragana = await convertToHiragana(text);
	if (hiragana) {
		result.hiragana = hiragana;
	}

	// Convert to romaji (stored in romanization field)
	const romaji = await convertToRomaji(text);
	if (romaji) {
		result.romanization = romaji.charAt(0).toUpperCase() + romaji.slice(1);
	}

	// Convert to katakana (stored in otherScripts)
	const katakana = await convertToKatakana(text);
	if (katakana) {
		result.otherScripts = { katakana };
	}

	return result;
}

/**
 * Process Chinese text for Pinyin (placeholder - would need a Chinese library)
 */
export async function processChineseText(text: string): Promise<{
	pinyin?: string;
	otherScripts?: Record<string, string>;
}> {
	// This is a placeholder - in a real implementation, you'd use a Chinese library
	// like pinyin-pro or similar to convert Chinese characters to Pinyin
	console.log('[ROMANIZATION] Chinese text processing not implemented yet:', text);
	return {
		otherScripts: { pinyin: text } // Placeholder
	};
}

/**
 * Process Korean text for Hangul romanization
 */
export async function processKoreanText(text: string): Promise<{
	romanization?: string;
	hangul?: string;
	otherScripts?: Record<string, string>;
}> {
	try {
		console.log('[ROMANIZATION] Processing Korean text:', text);
		
		// Use our lightweight client-side Korean romanization
		const { romanizeKorean } = await import('$lib/utils/korean-romanization');
		const romanized = romanizeKorean(text);
		console.log('[ROMANIZATION] Korean romanization result:', romanized);
		
		return {
			romanization: romanized,
			hangul: text, // Original Korean text
			otherScripts: { hangul: text }
		};
	} catch (error) {
		console.error('Failed to process Korean text:', error);
		// Fallback - return original text
		return {
			hangul: text,
			otherScripts: { hangul: text }
		};
	}
}

/**
 * Generate scripts for any language (server-side only)
 */
export async function generateScriptsServer(
	text: string,
	language: string
): Promise<RomanizationResult> {
	// Check if we're in a browser environment or during build
	if (
		typeof window !== 'undefined' ||
		typeof process === 'undefined' ||
		(process.env.NODE_ENV === 'production' && !process.env.SSR) ||
		process.env.VITE_BUILD
	) {
		console.warn('Script generation is not available in browser environment or during build');
		return {};
	}

	try {
		console.log(`[ROMANIZATION] Generating scripts for ${language} text:`, text);

		switch (language) {
			case 'ja':
				if (isJapaneseText(text)) {
					return await processJapaneseText(text);
				}
				break;
			case 'zh':
				if (isChineseText(text)) {
					return await processChineseText(text);
				}
				break;
			case 'ko':
				if (isKoreanText(text)) {
					return await processKoreanText(text);
				}
				break;
			default:
				console.log(`[ROMANIZATION] No script processing available for language: ${language}`);
				return {};
		}

		return {};
	} catch (error) {
		console.error('Script generation failed:', error);
		return {};
	}
}
