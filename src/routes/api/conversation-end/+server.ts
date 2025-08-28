import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { conversationSessionsRepository } from '$lib/server/repositories/conversationSessions.repository';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const {
			conversationId,
			durationSeconds,
			audioSeconds = 0,
			comfortRating,
			engagementLevel,
			sessionId,
			wasExtended = false,
			extensionsUsed = 0
		} = body;

		// Validate required fields
		if (!conversationId) {
			return json(createErrorResponse('conversationId is required'), { status: 400 });
		}
		if (durationSeconds === undefined) {
			return json(createErrorResponse('durationSeconds is required'), { status: 400 });
		}

		// End the conversation
		const endedConversation = await conversationRepository.endConversation(
			conversationId,
			durationSeconds
		);

		if (!endedConversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		// Update conversation with additional metadata
		const updatedConversation = await conversationRepository.updateConversation(conversationId, {
			audioSeconds: audioSeconds.toString(),
			...(comfortRating !== undefined && { comfortRating }),
			...(engagementLevel !== undefined && { engagementLevel })
		});

		// Update conversation session if sessionId is provided
		if (sessionId) {
			const durationMinutes = Math.ceil(durationSeconds / 60);

			await conversationSessionsRepository.endSession(sessionId, new Date(), durationMinutes);

			if (wasExtended || extensionsUsed > 0) {
				await conversationSessionsRepository.updateSessionExtensions(
					sessionId,
					extensionsUsed,
					wasExtended
				);
			}
		}

		return json(
			createSuccessResponse(
				{
					conversation: updatedConversation,
					durationSeconds,
					audioSeconds
				},
				'Conversation ended successfully'
			)
		);
	} catch (error) {
		console.error('Error ending conversation:', error);
		return json(createErrorResponse('Failed to end conversation'), { status: 500 });
	}
};
