import { json } from '@sveltejs/kit';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import type { UserPreferences } from '$lib/server/db/types';
import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';

export const GET = async ({ locals }) => {
	try {
		const userId = locals.user?.id;
		if (!userId) {
			return json(createErrorResponse('User not authenticated'), { status: 401 });
		}

		let preferences = await userPreferencesRepository.getPreferencesByUserId(userId);
		if (!preferences) {
			// Use the first available language from our static data
			const { languages } = await import('$lib/data/languages');
			const defaultLanguage = languages.find((lang) => lang.isSupported) || languages[0];

			// Create default preferences using a valid language ID
			preferences = await userPreferencesRepository.createPreferences({
				userId,
				targetLanguageId: defaultLanguage.id,
				learningGoal: 'Connection',
				preferredVoice: DEFAULT_VOICE,
				dailyGoalSeconds: 240, // 4 minutes (Full length of free version)
				speakingLevel: 5,
				listeningLevel: 5,
				readingLevel: 5,
				writingLevel: 5,
				speakingConfidence: 50,
				challengePreference: 'moderate',
				correctionStyle: 'gentle'
			});
		}

		return json(createSuccessResponse(preferences, 'User preferences retrieved successfully'));
	} catch (error) {
		console.error('Error fetching user preferences:', error);
		return json(createErrorResponse('Failed to fetch user preferences'), { status: 500 });
	}
};

export const PUT = async ({ request, locals }) => {
	try {
		const userId = locals.user?.id;
		if (!userId) {
			return json(createErrorResponse('User not authenticated'), { status: 401 });
		}

		const body = await request.json();
		const {
			targetLanguageId,
			learningGoal,
			preferredVoice,
			dailyGoalSeconds,
			speakingLevel,
			listeningLevel,
			readingLevel,
			writingLevel,
			speakingConfidence,
			challengePreference,
			correctionStyle,
			specificGoals,
			conversationContext
		} = body;

		// Validate the input
		const validLearningGoals = ['Connection', 'Career', 'Travel', 'Academic', 'Culture', 'Growth'];
		const validChallengePreferences = ['comfortable', 'moderate', 'challenging'];
		const validCorrectionStyles = ['immediate', 'gentle', 'end_of_session'];

		if (learningGoal && !validLearningGoals.includes(learningGoal)) {
			return json(createErrorResponse('Invalid learning goal'), { status: 400 });
		}

		if (challengePreference && !validChallengePreferences.includes(challengePreference)) {
			return json(createErrorResponse('Invalid challenge preference'), { status: 400 });
		}

		if (correctionStyle && !validCorrectionStyles.includes(correctionStyle)) {
			return json(createErrorResponse('Invalid correction style'), { status: 400 });
		}

		// Validate skill levels (1-100)
		const skillLevels = {
			speakingLevel,
			listeningLevel,
			readingLevel,
			writingLevel,
			speakingConfidence
		};
		for (const [key, value] of Object.entries(skillLevels)) {
			if (value !== undefined && (value < 1 || value > 100)) {
				return json(createErrorResponse(`Invalid ${key}: must be between 1 and 100`), {
					status: 400
				});
			}
		}

		// Validate daily goal (reasonable range)
		if (dailyGoalSeconds !== undefined && (dailyGoalSeconds < 60 || dailyGoalSeconds > 7200)) {
			return json(createErrorResponse('Daily goal must be between 1 and 120 minutes'), {
				status: 400
			});
		}

		// Prepare updates object
		const updates: Partial<UserPreferences> = {};
		if (targetLanguageId !== undefined) updates.targetLanguageId = targetLanguageId;
		if (learningGoal !== undefined) updates.learningGoal = learningGoal;
		if (preferredVoice !== undefined) updates.preferredVoice = preferredVoice;
		if (dailyGoalSeconds !== undefined) updates.dailyGoalSeconds = dailyGoalSeconds;
		if (speakingLevel !== undefined) updates.speakingLevel = speakingLevel;
		if (listeningLevel !== undefined) updates.listeningLevel = listeningLevel;
		if (readingLevel !== undefined) updates.readingLevel = readingLevel;
		if (writingLevel !== undefined) updates.writingLevel = writingLevel;
		if (speakingConfidence !== undefined) updates.speakingConfidence = speakingConfidence;
		if (challengePreference !== undefined) updates.challengePreference = challengePreference;
		if (correctionStyle !== undefined) updates.correctionStyle = correctionStyle;
		if (specificGoals !== undefined) updates.specificGoals = specificGoals;
		if (conversationContext !== undefined) updates.conversationContext = conversationContext;

		// Update preferences
		const updatedPreferences = await userPreferencesRepository.updatePreferences(userId, updates);

		if (!updatedPreferences) {
			return json(createErrorResponse('Failed to update preferences'), { status: 500 });
		}

		return json(createSuccessResponse(updatedPreferences, 'User preferences updated successfully'));
	} catch (error) {
		console.error('Error updating user preferences:', error);
		return json(createErrorResponse('Failed to update user preferences'), { status: 500 });
	}
};
