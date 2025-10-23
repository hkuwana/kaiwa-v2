import { json } from '@sveltejs/kit';
import { isJapaneseText, isChineseText } from '$lib/services/romanization.service';
import { messagesRepository } from '$lib/server/repositories/messages.repository';

// Direct Kuroshiro processing function that bypasses the disabled checks
async function processJapaneseTextDirect(text: string): Promise<{
	hiragana?: string;
	romanization?: string;
	otherScripts?: Record<string, string>;
}> {
	try {
		console.log('[DIRECT_KUROSHIRO] Starting Japanese text processing for:', text);

		// Import Kuroshiro modules directly
		const KuroshiroModule = await import('kuroshiro');
		const KuromojiAnalyzerModule = await import('kuroshiro-analyzer-kuromoji');

		const Kuroshiro = KuroshiroModule.default.default;
		const KuromojiAnalyzer = KuromojiAnalyzerModule.default;

		const kuroshiro = new Kuroshiro();
		const analyzer = new KuromojiAnalyzer();

		console.log('[DIRECT_KUROSHIRO] Initializing kuroshiro...');
		await kuroshiro.init(analyzer);

		console.log('[DIRECT_KUROSHIRO] Converting to different scripts...');

		// Generate all scripts in parallel
		const [hiraganaResult, romajiResult, katakanaResult] = await Promise.all([
			kuroshiro.convert(text, { to: 'hiragana', mode: 'furigana' }),
			kuroshiro.convert(text, { to: 'romaji', mode: 'spaced', romajiSystem: 'hepburn' }),
			kuroshiro.convert(text, { to: 'katakana', mode: 'furigana' })
		]);

		console.log('[DIRECT_KUROSHIRO] Processing complete:', {
			hiragana: hiraganaResult,
			romaji: romajiResult,
			katakana: katakanaResult
		});

		// Clean up HTML entities from the results
		const cleanHtml = (html: string) => {
			return html
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&amp;/g, '&');
		};

		return {
			hiragana: cleanHtml(hiraganaResult),
			romanization: romajiResult.charAt(0).toUpperCase() + romajiResult.slice(1),
			otherScripts: {
				katakana: cleanHtml(katakanaResult),
				furigana: cleanHtml(hiraganaResult) // Use hiragana as furigana for now
			}
		};
	} catch (error) {
		console.error('[DIRECT_KUROSHIRO] Error processing Japanese text:', error);
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

// Direct Chinese processing function with pinyin-pro
async function processChineseTextDirect(text: string): Promise<{
	romanization?: string;
	pinyin?: string;
	pinyinRuby?: string;
	otherScripts?: Record<string, string>;
}> {
	try {
		console.log('[DIRECT_PINYIN] Starting Chinese text processing with pinyin-pro for:', text);

		// Import pinyin-pro for robust Chinese conversion
		const { pinyin } = await import('pinyin-pro');

		// Get pinyin with tone marks (e.g., "nǐ hǎo")
		const pinyinWithTones = pinyin(text, {
			toneType: 'symbol', // Use tone marks (nǐ, hǎo)
			type: 'array' // Return as array for character-by-character mapping
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

		// Generate ruby HTML markup for display (character-by-character)
		const characters = text.split('');
		let pinyinRubyHTML = '';

		for (let i = 0; i < characters.length; i++) {
			const char = characters[i];
			const pinyinForChar = Array.isArray(pinyinWithTones) ? pinyinWithTones[i] : '';

			// Skip non-Chinese characters (punctuation, spaces, etc.)
			if (!/[\u4E00-\u9FAF]/.test(char)) {
				pinyinRubyHTML += char;
				continue;
			}

			// Create ruby markup for Chinese characters
			pinyinRubyHTML += `<ruby>${char}<rt>${pinyinForChar}</rt></ruby>`;
		}

		console.log('[DIRECT_PINYIN] Pinyin-pro result:', {
			withTones: pinyinWithTonesStr,
			plain: pinyinPlainStr,
			ruby: pinyinRubyHTML.substring(0, 100) + '...'
		});

		return {
			romanization: pinyinPlainStr.charAt(0).toUpperCase() + pinyinPlainStr.slice(1),
			pinyin: pinyinWithTonesStr,
			pinyinRuby: pinyinRubyHTML,
			otherScripts: {
				pinyin: pinyinWithTonesStr,
				pinyinPlain: pinyinPlainStr,
				pinyinRuby: pinyinRubyHTML
			}
		};
	} catch (error) {
		console.error('[DIRECT_PINYIN] Pinyin-pro processing failed:', error);

		// Fallback to lightweight implementation
		try {
			const { pinyinize, pinyinWithTones } = await import('$lib/utils/chinese-pinyin');
			const pinyinPlainStr = pinyinize(text);
			const pinyinWithTonesStr = pinyinWithTones(text);

			console.log('[DIRECT_PINYIN] Using lightweight fallback:', {
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
		} catch (fallbackError) {
			console.error('[DIRECT_PINYIN] Fallback also failed:', fallbackError);
			return {
				romanization: text,
				pinyin: text
			};
		}
	}
}

export const POST = async ({ request, params }) => {
	try {
		const messageId = params.messageId;
		const { text, language } = await request.json();

		if (!messageId || !text) {
			return json({ error: 'Missing required parameters: messageId, text' }, { status: 400 });
		}

		console.log(
			`Generating scripts for message ${messageId} in language ${language}:`,
			text.substring(0, 50)
		);

		// Generate scripts based on language
		let scriptResults: {
			hiragana?: string;
			romanization?: string;
			katakana?: string;
			furigana?: string;
			pinyin?: string;
			pinyinRuby?: string;
			otherScripts?: Record<string, string>;
		} = {};

		if (language === 'ja' || isJapaneseText(text)) {
			console.log('Generating Japanese scripts directly with Kuroshiro...');

			// Use our direct Kuroshiro processing that bypasses the disabled checks
			scriptResults = await processJapaneseTextDirect(text);

			console.log('Direct Kuroshiro results:', scriptResults);
		} else if (language === 'zh' || isChineseText(text)) {
			console.log('Generating Chinese scripts directly with pinyin-pro...');

			// Use our direct pinyin processing for Chinese text
			scriptResults = await processChineseTextDirect(text);

			console.log('Direct Pinyin results:', scriptResults);
		} else if (language && language !== 'en') {
			console.log(`No script generation implemented for language: ${language}`);
			return json({ success: true, message: `No script generation implemented for ${language}` });
		} else {
			console.log('No script generation needed for English text');
			return json({ success: true, message: 'No script generation needed for English text' });
		}

		console.log('Generated script results:', scriptResults);

		// Update the message in the database with the generated scripts
		const updateData: {
			hiragana?: string;
			romanization?: string;
			otherScripts?: Record<string, string>;
		} = {};

		if (scriptResults.hiragana) {
			updateData.hiragana = scriptResults.hiragana;
		}

		if (scriptResults.romanization) {
			updateData.romanization = scriptResults.romanization;
		}

		// Handle otherScripts (katakana, furigana, pinyin, pinyinRuby, etc.)
		if (
			scriptResults.katakana ||
			scriptResults.furigana ||
			scriptResults.pinyin ||
			scriptResults.pinyinRuby ||
			scriptResults.otherScripts
		) {
			const otherScripts: Record<string, string> = {};

			if (scriptResults.katakana) {
				otherScripts.katakana = scriptResults.katakana;
			}

			if (scriptResults.furigana) {
				otherScripts.furigana = scriptResults.furigana;
			}

			if (scriptResults.pinyin) {
				otherScripts.pinyin = scriptResults.pinyin;
			}

			if (scriptResults.pinyinRuby) {
				otherScripts.pinyinRuby = scriptResults.pinyinRuby;
			}

			// Merge any existing otherScripts
			if (scriptResults.otherScripts && typeof scriptResults.otherScripts === 'object') {
				Object.assign(otherScripts, scriptResults.otherScripts);
			}

			if (Object.keys(otherScripts).length > 0) {
				updateData.otherScripts = otherScripts;
			}
		}

		// Only update if we have script data to save
		if (Object.keys(updateData).length > 0) {
			console.log('Updating message in database with scripts:', updateData);

			await messagesRepository.updateMessage(messageId, updateData);

			console.log(`Scripts successfully saved to database for message ${messageId}`);
		}

		return json({
			success: true,
			messageId,
			scriptsGenerated: Object.keys(updateData),
			data: scriptResults
		});
	} catch (error) {
		console.error('Script generation and storage error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Script generation failed',
				messageId: params.messageId
			},
			{ status: 500 }
		);
	}
};
