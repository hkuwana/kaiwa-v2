import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { userPreferencesRepository } from '$lib/server/repositories/userPreferences.repository';
import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect if not authenticated
	if (!locals.user || locals.user.id === 'guest') {
		throw redirect(302, '/auth');
	}

	// Load user preferences
	let userPreferences = await userPreferencesRepository.getPreferencesByUserId(locals.user.id);
	if (!userPreferences) {
		// Use the first available language from our static data
		const { languages } = await import('$lib/data/languages');
		const defaultLanguage = languages.find((lang) => lang.isSupported) || languages[0];

		// Create default preferences using a valid language ID
		userPreferences = await userPreferencesRepository.createPreferences({
			userId: locals.user.id,
			targetLanguageId: defaultLanguage.id,
			learningGoal: 'Connection',
			preferredVoice: DEFAULT_VOICE,
			dailyGoalSeconds: 1800, // 30 minutes
			speakingLevel: 5,
			listeningLevel: 5,
			readingLevel: 5,
			writingLevel: 5,
			speakingConfidence: 50,
			challengePreference: 'moderate',
			correctionStyle: 'gentle'
		});
	}

	return {
		user: locals.user,
		userPreferences
	};
};
