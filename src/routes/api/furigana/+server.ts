import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { translateTextWithScripts } from '$lib/server/services/translation.service';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text, messageId } = await request.json();

		if (!text || !messageId) {
			return json({ error: 'Missing required parameters: text, messageId' }, { status: 400 });
		}

		// Use the existing translation service to generate Japanese scripts
		const result = await translateTextWithScripts(text, messageId, 'ja', 'en');

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
