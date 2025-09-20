// src/routes/api/analyze-onboarding/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	analyzeOnboardingConversation,
	parseAndValidateJSON
} from '$lib/server/services/openai.service';
import type { AnalysisFocus } from '$lib/server/services/openai.service';
import {
	updateAnonymousSessionPreferences,
	getOrCreateAnonymousSession
} from '$lib/server/services/session.service';
import type { UserPreferences } from '$lib/server/db/types';

export interface AnalyzeOnboardingRequest {
	conversationMessages: string[];
	targetLanguage: string;
	sessionId?: string;
	scenarioCategory?: string;
	analysisFocus?: AnalysisFocus[];
}

export interface AnalyzeOnboardingResponse {
	success: boolean;
	data?: Partial<UserPreferences> & { sessionId: string };
	error?: string;
	sessionId: string;
	// Enhanced transparency fields
	analysisMetadata?: {
		rawAIResponse: string;
		sanitizedResult: Partial<UserPreferences>;
		conversationSummary: string;
		assessmentNotes?: string;
		processingSteps: string[];
		scenarioCategory: string;
		analysisFocus: AnalysisFocus[];
		timestamp: string;
	};
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body: AnalyzeOnboardingRequest = await request.json();
		const { conversationMessages, targetLanguage, scenarioCategory, analysisFocus } = body;

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

		// Get or create anonymous session
		const sessionData = getOrCreateAnonymousSession(cookies, {
			targetLanguageId: targetLanguage
		});

		console.log(`Analyzing onboarding for session: ${sessionData.sessionId}`);

		// Call OpenAI to analyze the conversation
		const analysisResponse = await analyzeOnboardingConversation(conversationMessages, {
			targetLanguage,
			scenarioCategory,
			analysisFocus
		});

		console.log('🧠 [Onboarding API] Raw OpenAI response', {
			scenarioCategory: scenarioCategory ?? 'general',
			response: analysisResponse.content
		});

		// Parse the JSON response
		const analysisResult = parseAndValidateJSON<Partial<UserPreferences>>(analysisResponse.content);

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

		const combinedFocus = Array.from(
			new Set<AnalysisFocus>([
				'preferences',
				'memories',
				...(analysisFocus ?? [])
			])
		);

		// Create analysis metadata for transparency
		const analysisMetadata = {
			rawAIResponse: analysisResponse.content,
			sanitizedResult,
			conversationSummary: `Analyzed ${conversationMessages.length} messages in ${targetLanguage}`,
			assessmentNotes:
				(analysisResult as { assessmentNotes?: string }).assessmentNotes ||
				'No specific notes provided',
			processingSteps: [
				'AI analyzed conversation content',
				'Extracted learning preferences and skill levels',
				'Validated and sanitized results',
				'Applied business logic constraints'
			],
			scenarioCategory: scenarioCategory ?? 'general',
			analysisFocus: combinedFocus,
			timestamp: new Date().toISOString()
		};

		// Update session with analyzed data
		const updatedSession = updateAnonymousSessionPreferences(cookies, {
			targetLanguageId: targetLanguage,
			learningGoal: sanitizedResult.learningGoal,
			speakingLevel: sanitizedResult.speakingLevel,
			listeningLevel: sanitizedResult.listeningLevel,
			speakingConfidence: sanitizedResult.speakingConfidence,
			specificGoals: sanitizedResult.specificGoals,
			challengePreference: sanitizedResult.challengePreference,
			correctionStyle: sanitizedResult.correctionStyle,
			dailyGoalSeconds: sanitizedResult.dailyGoalSeconds,
			// Derive reading/writing levels from speaking level
			readingLevel: Math.max(1, (sanitizedResult.speakingLevel || 25) - 5),
			writingLevel: Math.max(1, (sanitizedResult.speakingLevel || 25) - 10)
		});

		if (sanitizedResult.memories?.length) {
			console.log('🧠 [Onboarding API] Sanitized memories', sanitizedResult.memories);
		} else {
			console.log('🧠 [Onboarding API] No memories returned in sanitized result');
		}

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

		// Return the analysis result with session ID and metadata
		return json({
			success: true,
			data: {
				...sanitizedResult,
				sessionId: updatedSession.sessionId
			},
			sessionId: updatedSession.sessionId,
			analysisMetadata
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
function sanitizeAnalysisResult(result: Partial<UserPreferences>): Partial<UserPreferences> {
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

	const validDailyGoals = [60, 120, 180, 300];

	return {
		learningGoal: validMotivations.includes(
			result.learningGoal as 'Connection' | 'Career' | 'Travel' | 'Academic' | 'Culture' | 'Growth'
		)
			? result.learningGoal
			: 'Connection',
		speakingLevel: clampNumber(result.speakingLevel, 1, 100, 25),
		listeningLevel: clampNumber(result.listeningLevel, 1, 100, 30),
		speakingConfidence: clampNumber(result.speakingConfidence, 1, 100, 50),
		specificGoals: Array.isArray(result.specificGoals)
			? result.specificGoals.filter((goal) => typeof goal === 'string' && goal.length > 0)
			: [],
		challengePreference: validChallengePrefs.includes(
			result.challengePreference as 'comfortable' | 'moderate' | 'challenging'
		)
			? result.challengePreference
			: 'moderate',
		correctionStyle: validCorrectionStyles.includes(
			result.correctionStyle as 'immediate' | 'gentle' | 'end_of_session'
		)
			? result.correctionStyle
			: 'gentle',
		dailyGoalSeconds: validDailyGoals.includes(result.dailyGoalSeconds as number)
			? result.dailyGoalSeconds
			: 180,
		memories: Array.isArray(result.memories)
			? result.memories
				.filter((memory) => typeof memory === 'string')
				.map((memory) => memory.trim())
				.filter(Boolean)
			: []
	};
}

/**
 * Clamp a number between min and max, with a default fallback
 */
function clampNumber(
	value: number | undefined,
	min: number,
	max: number,
	defaultValue: number
): number {
	if (typeof value !== 'number' || isNaN(value)) {
		return defaultValue;
	}
	return Math.max(min, Math.min(max, Math.round(value)));
}
