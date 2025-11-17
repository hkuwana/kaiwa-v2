import { logger } from '$lib/logger';
import { json } from '@sveltejs/kit';
import { generateScriptsServer } from '$lib/services/romanization.service';

export const POST = async ({ request }) => {
	try {
		const { text, messageId, language } = await request.json();

		if (!text || !messageId || !language) {
			return json(
				{ error: 'Missing required parameters: text, messageId, language' },
				{ status: 400 }
			);
		}

		// Use the romanization service to generate scripts only (no translation)
		const result = await generateScriptsServer(text, language);

		// Return only the script-related data
		return json({
			romanization: result.romanization,
			hiragana: result.hiragana,
			katakana: result.katakana || result.otherScripts?.katakana,
			hangul: result.hangul || result.otherScripts?.hangul,
			pinyin: result.pinyin || result.otherScripts?.pinyin,
			otherScripts: result.otherScripts
		});
	} catch (error) {
		logger.error('Romanization API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Romanization failed' },
			{ status: 500 }
		);
	}
};
