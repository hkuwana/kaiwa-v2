import { json } from '@sveltejs/kit';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { conversationSummaryService, userService } from '$lib/server/services';
import { usageService } from '$lib/server/services/usage.service';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { getUserFromSession } from '$lib/server/auth';

export const POST = async ({ request, params, cookies }) => {
	try {
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		const conversationId = params.id;
		if (!conversationId) {
			return json(createErrorResponse('Conversation ID is required'), { status: 400 });
		}

		const conversation = await conversationRepository.findConversationById(conversationId);
		if (!conversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		if (conversation.userId !== userId) {
			return json(createErrorResponse('Access denied'), { status: 403 });
		}

		const body = await request.json();
		const {
			durationSeconds,
			audioSeconds = 0,
			comfortRating,
			engagementLevel,
			sessionId,
			wasExtended = false,
			extensionsUsed = 0
		} = body;

		if (durationSeconds === undefined) {
			return json(createErrorResponse('durationSeconds is required'), { status: 400 });
		}

		const endedConversation = await conversationRepository.endConversation(
			conversationId,
			durationSeconds
		);

		if (!endedConversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		const updatedConversation = await conversationRepository.updateConversation(conversationId, {
			audioSeconds: audioSeconds.toString(),
			...(comfortRating !== undefined && { comfortRating }),
			...(engagementLevel !== undefined && { engagementLevel })
		});

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

		if (endedConversation.userId) {
			try {
				await usageService.recordConversation(endedConversation.userId, {
					seconds: durationSeconds
				});
			} catch (usageError) {
				console.error('Error recording conversation usage:', usageError);
			}
		}

		let summaryResult = null;
		if (endedConversation.userId) {
			try {
				const userTier = await userService.getUserTier(endedConversation.userId);
				const userPreferences = await userService.getUserPreferences(endedConversation.userId);

				if (userTier && userPreferences) {
					const limitCheck = conversationSummaryService.checkMemoryLimit(
						userPreferences.memories || [],
						userTier
					);

					if (limitCheck.withinLimit) {
						summaryResult = await conversationSummaryService.generateConversationMemories({
							userId: endedConversation.userId,
							conversationId,
							userTier,
							existingMemories: userPreferences.memories || []
						});
					}
				}
			} catch (summaryError) {
				console.error('Error generating conversation memories:', summaryError);
			}
		}

		return json(
			createSuccessResponse(
				{
					conversation: updatedConversation,
					durationSeconds,
					audioSeconds,
					...(summaryResult && {
						memories: {
							generated: summaryResult.success,
							truncated: summaryResult.truncated,
							error: summaryResult.error
						}
					})
				},
				'Conversation ended successfully'
			)
		);
	} catch (error) {
		console.error('Error ending conversation:', error);
		return json(createErrorResponse('Failed to end conversation'), { status: 500 });
	}
};