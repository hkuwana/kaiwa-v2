// src/routes/admin/learning-paths/+page.server.ts
import type { PageServerLoad } from './$types';
import { languageRepository } from '$lib/server/repositories/language.repository';
import { languages as languageData } from '$lib/data/languages';

export const load: PageServerLoad = async () => {
	// Try to load from database first, fall back to data file
	let languages: Array<{ code: string; name: string }> = [];

	try {
		const dbLanguages = await languageRepository.findSupportedLanguages();
		if (dbLanguages.length > 0) {
			languages = dbLanguages.map((lang) => ({
				code: lang.code,
				name: lang.name
			}));
		}
	} catch (error) {
		console.warn('[Admin/Learning-Paths] Failed to load languages from database:', error);
	}

	// Fallback to data file if database is empty or failed
	if (languages.length === 0) {
		languages = languageData
			.filter((lang) => lang.isSupported)
			.map((lang) => ({
				code: lang.code,
				name: lang.name
			}));
	}

	return {
		languages
	};
};
