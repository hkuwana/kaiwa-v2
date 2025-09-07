import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { translateTextWithScripts } from '$lib/server/services/translation.service';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text, messageId, language } = await request.json();

		if (!text || !messageId || !language) {
			return json(
				{ error: 'Missing required parameters: text, messageId, language' },
				{ status: 400 }
			);
		}

		// Use the existing translation service to generate scripts
		const result = await translateTextWithScripts(text, messageId, language, 'en');

		// Return only the script-related data
		return json({
			romanization: result.romanization,
			hiragana: result.hiragana,
			katakana: result.otherScripts?.katakana,
			hangul: result.otherScripts?.hangul,
			pinyin: result.otherScripts?.pinyin,
			otherScripts: result.otherScripts
		});
	} catch (error) {
		console.error('Romanization API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Romanization failed' },
			{ status: 500 }
		);
	}
};
