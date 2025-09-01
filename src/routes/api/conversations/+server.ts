import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { conversationSessionsRepository } from '$lib/server/repositories/conversationSessions.repository';
import { generateSessionId } from '$lib/utils';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { getOnboardingScenario } from '$lib/data/scenarios';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const {
			userId,
			guestId,
			targetLanguageId,
			title,
			mode = 'traditional',
			voice,
			scenarioId,
			deviceType = 'desktop'
		} = body;

		// Validate required fields
		if (!targetLanguageId) {
			return json(createErrorResponse('targetLanguageId is required'), { status: 400 });
		}

		// If no scenario is specified, use the onboarding scenario
		let finalScenarioId = scenarioId;
		if (!finalScenarioId) {
			const onboardingScenario = getOnboardingScenario();
			finalScenarioId = onboardingScenario?.id || null;
		}

		// Create new conversation
		const conversation = await conversationRepository.createConversation({
			id: generateSessionId(),
			userId: userId || null,
			guestId: guestId || null,
			targetLanguageId,
			title: title || `Conversation in ${targetLanguageId}`,
			mode,
			voice: voice || null,
			scenarioId: finalScenarioId,
			isOnboarding: finalScenarioId === 'onboarding-welcome' ? 'true' : 'false'
		});

		// Create conversation session for tracking
		const session = await conversationSessionsRepository.createSession({
			id: generateSessionId(),
			userId: userId || guestId || 'anonymous',
			language: targetLanguageId,
			startTime: new Date(),
			durationMinutes: 0,
			minutesConsumed: 0,
			deviceType
		});

		return json(
			createSuccessResponse(
				{
					conversation,
					sessionId: session.id
				},
				'Conversation started successfully'
			)
		);
	} catch (error) {
		console.error('Error starting conversation:', error);
		return json(createErrorResponse('Failed to start conversation'), { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url }) => {
	try {
		const conversationId = url.searchParams.get('id');
		const userId = url.searchParams.get('userId');
		const guestId = url.searchParams.get('guestId');
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// If conversationId is provided, get specific conversation
		if (conversationId) {
			const conversation = await conversationRepository.findConversationById(conversationId);

			if (!conversation) {
				return json(createErrorResponse('Conversation not found'), { status: 404 });
			}

			// Get messages for this conversation
			const messages = await conversationRepository.findMessagesByConversationId(conversationId);
			return json(createSuccessResponse({ conversation, messages }));
		}

		// Otherwise, get conversations list
		if (!userId && !guestId) {
			return json(createErrorResponse('userId or guestId is required'), { status: 400 });
		}

		let conversations: unknown[] = [];
		if (userId) {
			conversations = await conversationRepository.findConversationsByUserId(userId, limit, offset);
		}

		return json(createSuccessResponse({ conversations }));
	} catch (error) {
		console.error('Error fetching conversations:', error);
		return json(createErrorResponse('Failed to fetch conversations'), { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ url, request }) => {
	try {
		const conversationId = url.searchParams.get('id');
		if (!conversationId) {
			return json(createErrorResponse('conversation id is required'), { status: 400 });
		}

		const body = await request.json();
		const {
			title,
			mode,
			voice,
			scenarioId,
			isOnboarding,
			endedAt,
			durationSeconds,
			messageCount,
			audioSeconds,
			comfortRating,
			engagementLevel
		} = body;

		// Update conversation
		const updatedConversation = await conversationRepository.updateConversation(conversationId, {
			...(title !== undefined && { title }),
			...(mode !== undefined && { mode }),
			...(voice !== undefined && { voice }),
			...(scenarioId !== undefined && { scenarioId }),
			...(isOnboarding !== undefined && { isOnboarding: isOnboarding ? 'true' : 'false' }),
			...(endedAt !== undefined && { endedAt: endedAt ? new Date(endedAt) : null }),
			...(durationSeconds !== undefined && { durationSeconds }),
			...(messageCount !== undefined && { messageCount }),
			...(audioSeconds !== undefined && { audioSeconds }),
			...(comfortRating !== undefined && { comfortRating }),
			...(engagementLevel !== undefined && { engagementLevel })
		});

		if (!updatedConversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		return json(createSuccessResponse(updatedConversation, 'Conversation updated successfully'));
	} catch (error) {
		console.error('Error updating conversation:', error);
		return json(createErrorResponse('Failed to update conversation'), { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const conversationId = url.searchParams.get('id');
		if (!conversationId) {
			return json(createErrorResponse('conversation id is required'), { status: 400 });
		}

		const result = await conversationRepository.deleteConversation(conversationId);

		if (!result.success) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		return json(createSuccessResponse(null, 'Conversation deleted successfully'));
	} catch (error) {
		console.error('Error deleting conversation:', error);
		return json(createErrorResponse('Failed to delete conversation'), { status: 500 });
	}
};
