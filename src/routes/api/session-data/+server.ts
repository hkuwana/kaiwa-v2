// src/routes/api/analyze-onboarding/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyzeOnboardingConversation, parseAndValidateJSON } from '$lib/server/services/openai';
import { updateSessionData, getOrCreateSession } from '$lib/server/services/session.service';
import type { OnboardingAnalysisResult } from '$lib/server/services/session.service';

export interface AnalyzeOnboardingRequest {
	conversationMessages: string[];
	targetLanguage: string;
	sessionId?: string;
}

export interface AnalyzeOnboardingResponse {
	success: boolean;
	data?: OnboardingAnalysisResult & { sessionId: string };
	error?: string;
	sessionId: string;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body: AnalyzeOnboardingRequest = await request.json();
		const { conversationMessages, targetLanguage } = body;

		// Validation
		if (
			!conversationMessages ||
			!Array.isArray(conversationMessages) ||
			conversationMessages.length === 0
		) {
			return json(
				{
					success: false,
					error: 'Conversation messages are required',
					sessionId: ''
				},
				{ status: 400 }
			);
		}

		if (!targetLanguage) {
			return json(
				{
					success: false,
					error: 'Target language is required',
					sessionId: ''
				},
				{ status: 400 }
			);
		}

		// Get or create session
		const sessionData = getOrCreateSession(cookies, {
			targetLanguageId: targetLanguage
		});

		console.log(`Analyzing onboarding for session: ${sessionData.sessionId}`);

		// Call OpenAI to analyze the conversation
		const analysisResponse = await analyzeOnboardingConversation(
			conversationMessages,
			targetLanguage
		);

		// Parse the JSON response
		const analysisResult = parseAndValidateJSON<OnboardingAnalysisResult>(analysisResponse.content);

		if (!analysisResult) {
			console.error('Failed to parse analysis result:', analysisResponse.content);
			return json(
				{
					success: false,
					error: 'Failed to analyze conversation data',
					sessionId: sessionData.sessionId
				},
				{ status: 500 }
			);
		}

		// Validate and sanitize the analysis result
		const sanitizedResult = sanitizeAnalysisResult(analysisResult);

		// Update session with analyzed data
		const updatedSession = updateSessionData(cookies, {
			targetLanguageId: targetLanguage,
			learningMotivation: sanitizedResult.learningMotivation,
			speakingLevel: sanitizedResult.speakingLevel,
			listeningLevel: sanitizedResult.listeningLevel,
			confidenceLevel: sanitizedResult.confidenceLevel,
			specificGoals: sanitizedResult.specificGoals,
			challengePreference: sanitizedResult.challengePreference,
			correctionStyle: sanitizedResult.correctionStyle,
			dailyGoalMinutes: sanitizedResult.dailyGoalMinutes,
			assessmentNotes: sanitizedResult.assessmentNotes,
			// Derive reading/writing levels from speaking level
			readingLevel: Math.max(1, sanitizedResult.speakingLevel - 5),
			writingLevel: Math.max(1, sanitizedResult.speakingLevel - 10)
		});

		if (!updatedSession) {
			return json(
				{
					success: false,
					error: 'Failed to update session data',
					sessionId: sessionData.sessionId
				},
				{ status: 500 }
			);
		}

		console.log(`Onboarding analysis completed for session: ${updatedSession.sessionId}`);

		// Return the analysis result with session ID
		return json({
			success: true,
			data: {
				...sanitizedResult,
				sessionId: updatedSession.sessionId
			},
			sessionId: updatedSession.sessionId
		});
	} catch (error) {
		console.error('Error analyzing onboarding:', error);

		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Internal server error',
				sessionId: ''
			},
			{ status: 500 }
		);
	}
};

/**
 * Sanitize and validate the analysis result from OpenAI
 */
function sanitizeAnalysisResult(result: Partial<OnboardingAnalysisResult>): OnboardingAnalysisResult {
	const validMotivations: Array<
		'Connection' | 'Career' | 'Travel' | 'Academic' | 'Culture' | 'Growth'
	> = ['Connection', 'Career', 'Travel', 'Academic', 'Culture', 'Growth'];

	const validChallengePrefs: Array<'comfortable' | 'moderate' | 'challenging'> = [
		'comfortable',
		'moderate',
		'challenging'
	];

	const validCorrectionStyles: Array<'immediate' | 'gentle' | 'end_of_session'> = [
		'immediate',
		'gentle',
		'end_of_session'
	];

	const validDailyGoals = [15, 30, 45, 60];

	return {
		learningMotivation: validMotivations.includes(result.learningMotivation)
			? result.learningMotivation
			: 'Connection',
		speakingLevel: clampNumber(result.speakingLevel, 1, 100, 25),
		listeningLevel: clampNumber(result.listeningLevel, 1, 100, 30),
		confidenceLevel: clampNumber(result.confidenceLevel, 1, 100, 50),
		specificGoals: Array.isArray(result.specificGoals)
			? result.specificGoals.filter((goal: string) => typeof goal === 'string' && goal.length > 0)
			: [],
		challengePreference: validChallengePrefs.includes(result.challengePreference)
			? result.challengePreference
			: 'moderate',
		correctionStyle: validCorrectionStyles.includes(result.correctionStyle)
			? result.correctionStyle
			: 'gentle',
		dailyGoalMinutes: validDailyGoals.includes(result.dailyGoalMinutes)
			? result.dailyGoalMinutes
			: 30,
		assessmentNotes:
			typeof result.assessmentNotes === 'string'
				? result.assessmentNotes.substring(0, 500) // Limit length
				: 'Assessment completed successfully.'
	};
}

/**
 * Clamp a number between min and max, with a default fallback
 */
function clampNumber(value: any, min: number, max: number, defaultValue: number): number {
	if (typeof value !== 'number' || isNaN(value)) {
		return defaultValue;
	}
	return Math.max(min, Math.min(max, Math.round(value)));
}
