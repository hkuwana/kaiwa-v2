import { json } from '@sveltejs/kit';
import { isJapaneseText } from '$lib/services/romanization.service';
import { SecuritySanitizer } from '$lib/utils/security';

// Direct Kuroshiro processing function that bypasses the disabled checks
async function processJapaneseTextDirect(text: string): Promise<{
	hiragana?: string;
	romanization?: string;
	otherScripts?: Record<string, string>;
}> {
	try {
		console.log('[FURIGANA_API] Starting Japanese text processing for:', text);

		// Import Kuroshiro modules directly
		const KuroshiroModule = await import('kuroshiro');
		const KuromojiAnalyzerModule = await import('kuroshiro-analyzer-kuromoji');

		const Kuroshiro = KuroshiroModule.default.default;
		const KuromojiAnalyzer = KuromojiAnalyzerModule.default;

		const kuroshiro = new Kuroshiro();
		const analyzer = new KuromojiAnalyzer();

		console.log('[FURIGANA_API] Initializing kuroshiro...');
		await kuroshiro.init(analyzer);

		console.log('[FURIGANA_API] Converting to different scripts...');

		// Generate all scripts in parallel
		const [hiraganaResult, romajiResult, katakanaResult] = await Promise.all([
			kuroshiro.convert(text, { to: 'hiragana', mode: 'furigana' }),
			kuroshiro.convert(text, { to: 'romaji', mode: 'spaced', romajiSystem: 'hepburn' }),
			kuroshiro.convert(text, { to: 'katakana', mode: 'furigana' })
		]);

		console.log('[FURIGANA_API] Processing complete:', {
			hiragana: hiraganaResult,
			romaji: romajiResult,
			katakana: katakanaResult
		});

		const result = {
			hiragana: hiraganaResult,
			romanization: romajiResult.charAt(0).toUpperCase() + romajiResult.slice(1),
			otherScripts: {
				katakana: katakanaResult,
				furigana: hiraganaResult // Use hiragana as furigana for now
			}
		};

		// 🔒 Validate and sanitize all generated content before returning
		if (!SecuritySanitizer.validateScriptContent(result)) {
			console.warn('[FURIGANA_API] ⚠️ Generated content failed security validation');
			throw new Error('Generated content contains potentially unsafe data');
		}

		return {
			hiragana: SecuritySanitizer.sanitizeFuriganaHTML(result.hiragana),
			romanization: SecuritySanitizer.sanitizeScriptContent(result.romanization),
			otherScripts: {
				katakana: SecuritySanitizer.sanitizeScriptContent(result.otherScripts.katakana),
				furigana: SecuritySanitizer.sanitizeFuriganaHTML(result.otherScripts.furigana)
			}
		};
	} catch (error) {
		console.error('[FURIGANA_API] Error processing Japanese text:', error);
		return {
			hiragana: text,
			romanization: text,
			otherScripts: {
				katakana: text,
				furigana: text
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

		console.log('[FURIGANA_API] Processing request for:', text.substring(0, 50));

		// Only generate scripts, NO TRANSLATION
		if (!isJapaneseText(text)) {
			console.log('[FURIGANA_API] Text is not Japanese, returning empty result');
			return json({});
		}

		// Use direct Kuroshiro processing (no translation)
		const result = await processJapaneseTextDirect(text);

		// Return only the Japanese script-related data
		return json({
			hiragana: result.hiragana,
			romanization: result.romanization,
			katakana: result.otherScripts?.katakana,
			furigana: result.otherScripts?.furigana
		});
	} catch (error) {
		console.error('Furigana API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Furigana generation failed' },
			{ status: 500 }
		);
	}
};
