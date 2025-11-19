// src/routes/api/scenarios/generate-personalized/+server.ts
// API endpoint for generating personalized scenarios based on user goals

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { userPersonalizedScenarios, userPreferences } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '$lib/server/logger';
import {
	generatePersonalizedScenario,
	type PersonalizedScenarioRequest
} from '$lib/server/services/personalized-scenario-generator.service';
import { getLanguageById } from '$lib/types';

/**
 * POST /api/scenarios/generate-personalized
 *
 * Generate a personalized scenario for the authenticated user based on their conversation goal
 *
 * Request body:
 * {
 *   targetLanguageId: string;
 *   conversationGoal: string;
 *   conversationTimeline?: string;
 *   conversationParticipants?: string;
 *   conversationImportance?: number;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   scenarioId?: string;
 *   scenario?: GeneratedPersonalizedScenario;
 *   error?: string;
 * }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Auth check
		const session = await locals.auth();
		if (!session?.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const userId = session.user.id;

		// Parse request body
		const body = await request.json();
		const {
			targetLanguageId,
			conversationGoal,
			conversationTimeline,
			conversationParticipants,
			conversationImportance
		} = body;

		// Validate required fields
		if (!targetLanguageId || !conversationGoal) {
			return json(
				{
					success: false,
					error: 'Missing required fields: targetLanguageId, conversationGoal'
				},
				{ status: 400 }
			);
		}

		// Get target language
		const targetLanguage = getLanguageById(targetLanguageId);
		if (!targetLanguage) {
			return json({ success: false, error: 'Invalid language ID' }, { status: 400 });
		}

		logger.info('Generating personalized scenario', {
			userId,
			targetLanguageId,
			conversationGoal
		});

		// Get user preferences for additional context
		const preferences = await db.query.userPreferences.findFirst({
			where: and(
				eq(userPreferences.userId, userId),
				eq(userPreferences.targetLanguageId, targetLanguageId)
			)
		});

		// Build generation request
		const generationRequest: PersonalizedScenarioRequest = {
			userId,
			targetLanguage,
			conversationGoal,
			conversationTimeline,
			conversationParticipants,
			userContext: {
				occupation: preferences?.conversationContext?.occupation,
				learningReason: preferences?.conversationContext?.learningReason,
				interests: preferences?.comfortZone || [],
				nativeLanguage: session.user.nativeLanguageId || 'en'
			}
		};

		// Generate scenario using OpenAI
		const generated = await generatePersonalizedScenario(generationRequest);

		// Save to database
		const [savedScenario] = await db
			.insert(userPersonalizedScenarios)
			.values({
				userId,
				targetLanguage: targetLanguageId,
				conversationGoal,
				conversationTimeline,
				conversationParticipants,
				title: generated.title,
				description: generated.description,
				context: generated.context,
				expectedOutcome: generated.expectedOutcome,
				learningObjectives: generated.learningObjectives,
				personalizedPhrases: generated.personalizedPhrases,
				userContext: generationRequest.userContext,
				isPrimary: true, // Make this the featured personalized scenario
				isActive: true,
				generatedBy: 'openai-gpt-4'
			})
			.returning();

		// Update user preferences with conversation goal
		await db
			.update(userPreferences)
			.set({
				conversationGoal,
				conversationTimeline,
				conversationParticipants,
				conversationImportance,
				updatedAt: new Date()
			})
			.where(
				and(eq(userPreferences.userId, userId), eq(userPreferences.targetLanguageId, targetLanguageId))
			);

		logger.info('Successfully saved personalized scenario', {
			userId,
			scenarioId: savedScenario.id,
			title: generated.title
		});

		return json({
			success: true,
			scenarioId: savedScenario.id,
			scenario: generated
		});
	} catch (error) {
		logger.error('Failed to generate personalized scenario', {
			error: error instanceof Error ? error.message : 'Unknown error'
		});

		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to generate scenario'
			},
			{ status: 500 }
		);
	}
};

/**
 * GET /api/scenarios/generate-personalized
 *
 * Get user's personalized scenarios
 *
 * Query params:
 * - languageId?: string (filter by language)
 * - primary?: boolean (only get primary/featured scenario)
 *
 * Response:
 * {
 *   success: boolean;
 *   scenarios: UserPersonalizedScenario[];
 *   error?: string;
 * }
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Auth check
		const session = await locals.auth();
		if (!session?.user) {
			return json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const userId = session.user.id;
		const languageId = url.searchParams.get('languageId');
		const primaryOnly = url.searchParams.get('primary') === 'true';

		// Build query
		const conditions = [eq(userPersonalizedScenarios.userId, userId), eq(userPersonalizedScenarios.isActive, true)];

		if (languageId) {
			conditions.push(eq(userPersonalizedScenarios.targetLanguage, languageId));
		}

		if (primaryOnly) {
			conditions.push(eq(userPersonalizedScenarios.isPrimary, true));
		}

		const scenarios = await db.query.userPersonalizedScenarios.findMany({
			where: and(...conditions),
			orderBy: (scenarios, { desc }) => [desc(scenarios.isPrimary), desc(scenarios.createdAt)]
		});

		logger.info('Retrieved personalized scenarios', {
			userId,
			count: scenarios.length,
			languageId,
			primaryOnly
		});

		return json({
			success: true,
			scenarios
		});
	} catch (error) {
		logger.error('Failed to retrieve personalized scenarios', {
			error: error instanceof Error ? error.message : 'Unknown error'
		});

		return json(
			{
				success: false,
				error: 'Failed to retrieve scenarios'
			},
			{ status: 500 }
		);
	}
};
