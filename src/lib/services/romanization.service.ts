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

// Language detection - improved to prevent furigana interference for Chinese learners
export function isJapaneseText(text: string): boolean {
	if (!text) return false;

	// First check for uniquely Japanese characters (hiragana and katakana)
	const hasHiragana = /[\u3040-\u309F]/.test(text);
	const hasKatakana = /[\u30A0-\u30FF]/.test(text);

	// If we find hiragana or katakana, it's definitely Japanese
	if (hasHiragana || hasKatakana) {
		return true;
	}

	// For CJK ideographs only, be more conservative
	// Only consider it Japanese if no Chinese-specific indicators are present
	const hasCJK = /[\u4E00-\u9FAF]/.test(text);
	if (hasCJK) {
		// Check for Chinese-specific indicators
		const hasChinesePunctuation = /[，。；：！？""''（）【】《》〈〉]/.test(text);
		const hasSimplifiedChars = /[亿万币值贝财购买你好世界热很国人民]/.test(text);
		const hasChineseGrammarWords = /[了的吗呢吧]/.test(text);

		// If we detect Chinese indicators, don't treat as Japanese
		if (hasChinesePunctuation || hasSimplifiedChars || hasChineseGrammarWords) {
			return false;
		}

		// Otherwise, could be Japanese kanji
		return true;
	}

	return false;
}

export function isChineseText(text: string): boolean {
	if (!text) return false;

	// Check for CJK ideographs
	const hasCJK = /[\u4E00-\u9FAF]/.test(text);
	if (!hasCJK) return false;

	// If there are uniquely Japanese characters, it's not Chinese
	const hasHiragana = /[\u3040-\u309F]/.test(text);
	const hasKatakana = /[\u30A0-\u30FF]/.test(text);

	if (hasHiragana || hasKatakana) {
		return false;
	}

	// Otherwise, treat CJK characters as Chinese by default
	return true;
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
				// Try server-side pinyin API first (more accurate)
				try {
					const response = await fetch('/api/features/pinyin', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify({
							text,
							messageId: `client-chinese-${Date.now()}`
						})
					});

					if (response.ok) {
						const serverResult = await response.json();
						result.romanization = serverResult.romanization;
						result.pinyin = serverResult.pinyin;
						result.otherScripts = serverResult.otherScripts;
						break; // Success - exit case
					}
				} catch (apiError) {
					console.warn('Server-side pinyin API failed, using client fallback:', apiError);
				}

				// Fallback to lightweight client-side pinyin
				try {
					const { pinyinize, pinyinWithTones } = await import('$lib/utils/chinese-pinyin');
					const pinyinPlainStr = pinyinize(text);
					const pinyinWithTonesStr = pinyinWithTones(text);
					result.romanization = pinyinPlainStr.charAt(0).toUpperCase() + pinyinPlainStr.slice(1);
					result.pinyin = pinyinWithTonesStr;
					result.otherScripts = {
						pinyin: pinyinWithTonesStr,
						pinyinPlain: pinyinPlainStr
					};
				} catch (error) {
					console.error('Client-side pinyin failed:', error);
					result.pinyin = text; // Final fallback
				}
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
		const response = await fetch('/api/features/romanization', {
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
 * Process Chinese text for Pinyin - tries server-side API first, then lightweight fallback
 */
export async function processChineseText(text: string): Promise<{
	romanization?: string;
	pinyin?: string;
	otherScripts?: Record<string, string>;
}> {
	try {
		console.log('[ROMANIZATION] Processing Chinese text:', text);

		// Check if we're in a server environment and try native API
		if (typeof window === 'undefined') {
			try {
				const response = await fetch('/api/features/pinyin', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						text,
						messageId: `chinese-${Date.now()}`
					})
				});

				if (response.ok) {
					const result = await response.json();
					console.log('[ROMANIZATION] Server-side pinyin result:', result);
					return result;
				} else {
					console.warn('[ROMANIZATION] Server-side pinyin failed, using lightweight fallback');
				}
			} catch (apiError) {
				console.warn('[ROMANIZATION] Pinyin API error, using lightweight fallback:', apiError);
			}
		}

		// Use our lightweight implementation as fallback
		const { pinyinize, pinyinWithTones } = await import('$lib/utils/chinese-pinyin');
		const pinyinPlainStr = pinyinize(text);
		const pinyinWithTonesStr = pinyinWithTones(text);

		console.log('[ROMANIZATION] Chinese pinyin lightweight result:', {
			withTones: pinyinWithTonesStr,
			plain: pinyinPlainStr
		});

		return {
			romanization: pinyinPlainStr,
			pinyin: pinyinWithTonesStr,
			otherScripts: {
				pinyin: pinyinWithTonesStr,
				pinyinPlain: pinyinPlainStr
			}
		};
	} catch (error) {
		console.error('Failed to process Chinese text:', error);
		// Final fallback - return original text
		return {
			pinyin: text,
			otherScripts: { pinyin: text }
		};
	}
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
					const result = await processChineseText(text);
					return {
						romanization: result.romanization,
						pinyin: result.pinyin,
						otherScripts: result.otherScripts
					};
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
