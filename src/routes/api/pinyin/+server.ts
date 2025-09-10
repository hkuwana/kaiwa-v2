import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Server-side only native pinyin processing
async function processChineseTextNative(text: string): Promise<{
	romanization?: string;
	pinyin?: string;
	otherScripts?: Record<string, string>;
}> {
	try {
		console.log('[PINYIN_API] Starting native Chinese text processing for:', text);

		// Try to import the native library using dynamic import
		const pinyinModule = await import('@napi-rs/pinyin');

		// Check if the module loaded properly
		if (pinyinModule.pinyin && pinyinModule.PINYIN_STYLE) {
			// Convert Chinese text to pinyin with tones
			const pinyinWithTones = pinyinModule.pinyin(text, {
				style: pinyinModule.PINYIN_STYLE.WithTone,
				heteronym: false
			});

			// Convert to plain pinyin for romanization
			const pinyinPlain = pinyinModule.pinyin(text, {
				style: pinyinModule.PINYIN_STYLE.Plain,
				heteronym: false
			});

			// Join the arrays into strings
			const pinyinWithTonesStr = pinyinWithTones.join(' ');
			const pinyinPlainStr = pinyinPlain.join(' ');

			console.log('[PINYIN_API] Native pinyin result:', {
				withTones: pinyinWithTonesStr,
				plain: pinyinPlainStr
			});

			return {
				romanization: pinyinPlainStr.charAt(0).toUpperCase() + pinyinPlainStr.slice(1),
				pinyin: pinyinWithTonesStr,
				otherScripts: {
					pinyin: pinyinWithTonesStr,
					pinyinPlain: pinyinPlainStr
				}
			};
		} else {
			throw new Error('Native pinyin module not loaded properly');
		}
	} catch (error) {
		console.error('[PINYIN_API] Native pinyin processing failed:', error);

		// Fallback to lightweight implementation
		const { pinyinize, pinyinWithTones } = await import('$lib/utils/chinese-pinyin');
		const pinyinPlainStr = pinyinize(text);
		const pinyinWithTonesStr = pinyinWithTones(text);

		console.log('[PINYIN_API] Using lightweight fallback:', {
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
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text, messageId } = await request.json();

		if (!text || !messageId) {
			return json({ error: 'Missing required parameters: text, messageId' }, { status: 400 });
		}

		console.log('[PINYIN_API] Processing request for:', text.substring(0, 50));

		// Process Chinese text with native library (server-side only)
		const result = await processChineseTextNative(text);

		// Return the pinyin data
		return json({
			romanization: result.romanization,
			pinyin: result.pinyin,
			otherScripts: result.otherScripts
		});
	} catch (error) {
		console.error('Pinyin API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Pinyin generation failed' },
			{ status: 500 }
		);
	}
};
