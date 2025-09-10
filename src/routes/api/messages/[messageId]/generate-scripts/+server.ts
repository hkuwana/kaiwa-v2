import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateScriptsServer, isJapaneseText } from '$lib/services/romanization.service';
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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

		return {
			hiragana: hiraganaResult,
			romanization: romajiResult.charAt(0).toUpperCase() + romajiResult.slice(1),
			otherScripts: {
				katakana: katakanaResult,
				furigana: hiraganaResult // Use hiragana as furigana for now
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

export const POST: RequestHandler = async ({ request, params }) => {
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
		let scriptResults: any = {};

		if (language === 'ja' || isJapaneseText(text)) {
			console.log('Generating Japanese scripts directly with Kuroshiro...');

			// Use our direct Kuroshiro processing that bypasses the disabled checks
			scriptResults = await processJapaneseTextDirect(text);

			console.log('Direct Kuroshiro results:', scriptResults);
		} else if (language && language !== 'en') {
			console.log(`Generating scripts for ${language}...`);

			// Generate scripts for other languages
			scriptResults = await generateScriptsServer(text, language);
		} else {
			console.log('No script generation needed for English text');
			return json({ success: true, message: 'No script generation needed for English text' });
		}

		console.log('Generated script results:', scriptResults);

		// Update the message in the database with the generated scripts
		const updateData: any = {};

		if (scriptResults.hiragana) {
			updateData.hiragana = scriptResults.hiragana;
		}

		if (scriptResults.romanization) {
			updateData.romanization = scriptResults.romanization;
		}

		// Handle otherScripts (katakana, furigana, etc.)
		if (scriptResults.katakana || scriptResults.furigana || scriptResults.otherScripts) {
			const otherScripts: Record<string, string> = {};

			if (scriptResults.katakana) {
				otherScripts.katakana = scriptResults.katakana;
			}

			if (scriptResults.furigana) {
				otherScripts.furigana = scriptResults.furigana;
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

			await db.update(messages).set(updateData).where(eq(messages.id, messageId));

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
