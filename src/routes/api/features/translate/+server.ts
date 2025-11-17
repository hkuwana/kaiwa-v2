import { logger } from '$lib/logger';
import { json } from '@sveltejs/kit';
import { translateTextWithScripts } from '$lib/server/services/translation.service';

export const POST = async ({ request }) => {
	try {
		const { text, messageId, sourceLanguage, targetLanguage } = await request.json();

		if (!text || !messageId || !sourceLanguage || !targetLanguage) {
			return json(
				{ error: 'Missing required parameters: text, messageId, sourceLanguage, targetLanguage' },
				{ status: 400 }
			);
		}

		const result = await translateTextWithScripts(text, messageId, sourceLanguage, targetLanguage);

		return json(result);
	} catch (error) {
		logger.error('Translation API error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Translation failed' },
			{ status: 500 }
		);
	}
};
