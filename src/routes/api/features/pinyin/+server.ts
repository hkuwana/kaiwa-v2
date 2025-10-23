import { json } from '@sveltejs/kit';
import { isChineseText } from '$lib/services/romanization.service';
import { SecuritySanitizer } from '$lib/utils/security';

// Generate ruby HTML markup for Chinese text with pinyin
function generatePinyinRuby(text: string, pinyinArray: string[]): string {
	const characters = text.split('');
	let rubyHTML = '';

	for (let i = 0; i < characters.length; i++) {
		const char = characters[i];
		const pinyin = pinyinArray[i] || '';

		// Skip non-Chinese characters (punctuation, spaces, etc.)
		if (!/[\u4E00-\u9FAF]/.test(char)) {
			rubyHTML += char;
			continue;
		}

		// Create ruby markup for Chinese characters
		rubyHTML += `<ruby>${char}<rt>${pinyin}</rt></ruby>`;
	}

	return rubyHTML;
}

// Server-side pinyin processing with pinyin-pro
async function processChineseTextWithPinyinPro(text: string): Promise<{
	romanization?: string;
	pinyin?: string;
	pinyinRuby?: string;
	otherScripts?: Record<string, string>;
}> {
	try {
		console.log('[PINYIN_API] Starting Chinese text processing with pinyin-pro for:', text);

		// Import pinyin-pro for robust Chinese conversion
		const { pinyin } = await import('pinyin-pro');

		// Get pinyin with tone marks (e.g., "nǐ hǎo")
		const pinyinWithTones = pinyin(text, {
			toneType: 'symbol', // Use tone marks (nǐ, hǎo)
			type: 'array' // Return as array for word boundaries
		});

		// Get pinyin without tone marks (e.g., "ni hao")
		const pinyinPlain = pinyin(text, {
			toneType: 'none', // No tone marks
			type: 'array'
		});

		// Join arrays into strings with spaces
		const pinyinWithTonesStr = Array.isArray(pinyinWithTones)
			? pinyinWithTones.join(' ')
			: String(pinyinWithTones);
		const pinyinPlainStr = Array.isArray(pinyinPlain) ? pinyinPlain.join(' ') : String(pinyinPlain);

		// Generate ruby HTML markup for display (word-boundary aware)
		const pinyinRubyHTML = generatePinyinRuby(
			text,
			Array.isArray(pinyinWithTones) ? pinyinWithTones : [String(pinyinWithTones)]
		);

		console.log('[PINYIN_API] Pinyin-pro result:', {
			withTones: pinyinWithTonesStr,
			plain: pinyinPlainStr,
			ruby: pinyinRubyHTML.substring(0, 100) + '...'
		});

		const result = {
			romanization: pinyinPlainStr.charAt(0).toUpperCase() + pinyinPlainStr.slice(1),
			pinyin: pinyinWithTonesStr,
			pinyinRuby: pinyinRubyHTML,
			otherScripts: {
				pinyin: pinyinWithTonesStr,
				pinyinPlain: pinyinPlainStr,
				pinyinRuby: pinyinRubyHTML
			}
		};

		// Validate and sanitize before returning
		if (!SecuritySanitizer.validateScriptContent(result as Record<string, unknown>)) {
			console.warn('[PINYIN_API] ⚠️ Generated content failed security validation');
			throw new Error('Generated content contains potentially unsafe data');
		}

		return {
			romanization: SecuritySanitizer.sanitizeScriptContent(result.romanization),
			pinyin: SecuritySanitizer.sanitizeScriptContent(result.pinyin),
			pinyinRuby: SecuritySanitizer.sanitizeFuriganaHTML(result.pinyinRuby),
			otherScripts: {
				pinyin: SecuritySanitizer.sanitizeScriptContent(result.otherScripts.pinyin),
				pinyinPlain: SecuritySanitizer.sanitizeScriptContent(result.otherScripts.pinyinPlain),
				pinyinRuby: SecuritySanitizer.sanitizeFuriganaHTML(result.otherScripts.pinyinRuby)
			}
		};
	} catch (error) {
		console.error('[PINYIN_API] Pinyin-pro processing failed:', error);

		// Fallback to lightweight implementation
		const { pinyinize, pinyinWithTones } = await import('$lib/utils/chinese-pinyin');
		const pinyinPlainStr = pinyinize(text);
		const pinyinWithTonesStr = pinyinWithTones(text);

		console.log('[PINYIN_API] Using lightweight fallback:', {
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
	}
}

export const POST = async ({ request }) => {
	try {
		const { text, messageId } = await request.json();

		if (!text || !messageId) {
			return json({ error: 'Missing required parameters: text, messageId' }, { status: 400 });
		}

		console.log('[PINYIN_API] Processing request for:', text.substring(0, 50));

		// Only generate pinyin for Chinese text
		if (!isChineseText(text)) {
			console.log('[PINYIN_API] Text is not Chinese, returning empty result');
			return json({});
		}

		// Process Chinese text with pinyin-pro
		const result = await processChineseTextWithPinyinPro(text);

		// Return the pinyin data with ruby markup
		return json({
			romanization: result.romanization,
			pinyin: result.pinyin,
			pinyinRuby: result.pinyinRuby,
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
