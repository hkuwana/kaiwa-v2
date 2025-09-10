import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { userPreferencesRepository } from '$lib/server/repositories/userPreferences.repository';
import { languageRepository } from '$lib/server/repositories/language.repository';
import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';

export const load: PageServerLoad = async ({ locals }) => {
	// Early authentication check - redirect if not authenticated or is guest
	if (!locals.user || locals.user.id === 'guest') {
		console.log('⚠️ Profile access denied: User not authenticated');
		throw redirect(302, '/auth');
	}

	// Additional safety check - ensure user has a valid ID
	if (!locals.user.id || typeof locals.user.id !== 'string') {
		console.error('⚠️ Profile access denied: Invalid user ID');
		throw redirect(302, '/auth');
	}

	try {
		// Load user preferences for authenticated user only
		console.log(`👤 Loading preferences for user: ${locals.user.id}`);
		let userPreferences = await userPreferencesRepository.getPreferencesByUserId(locals.user.id);

		if (!userPreferences) {
			console.log('👤 No preferences found, creating default preferences');

			// Get languages from the database to ensure foreign key constraint is satisfied
			const languages = await languageRepository.findSupportedLanguages();
			const defaultLanguage = languages.find((lang) => lang.isSupported) || languages[0];

			if (!defaultLanguage) {
				console.error('❌ No languages found in database');
				throw new Error('No languages found in database. Please seed the languages table.');
			}

			console.log(
				`👤 Creating preferences with language: ${defaultLanguage.id} (${defaultLanguage.name})`
			);

			// Create default preferences using a valid language ID from the database
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

			console.log('✅ Default preferences created successfully');
		}

		return {
			user: locals.user,
			userPreferences
		};
	} catch (error) {
		console.error('❌ Error loading profile:', error);

		// If it's a database/foreign key error, provide more context
		if (error instanceof Error && error.message.includes('foreign key')) {
			throw new Error('Database configuration error. Please ensure all required data is seeded.');
		}

		// Re-throw other errors
		throw error;
	}
};
