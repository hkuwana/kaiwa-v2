import { json } from '@sveltejs/kit';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { conversationSummaryService, userService } from '$lib/server/services';
import { usageService } from '$lib/server/services/usage.service';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';

export const POST = async ({ request }) => {
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

		// Record usage for the user
		if (endedConversation.userId) {
			try {
				await usageService.recordConversation(endedConversation.userId, {
					seconds: durationSeconds
				});
			} catch (usageError) {
				console.error('Error recording conversation usage:', usageError);
			}
		}

		// Generate conversation memories if user is logged in
		let summaryResult = null;
		if (endedConversation.userId) {
			try {
				const userTier = await userService.getUserTier(endedConversation.userId);
				const userPreferences = await userService.getUserPreferences(endedConversation.userId);

				if (userTier && userPreferences) {
					// Check if we should generate memories based on tier limits
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
				// Don't fail the conversation end if memory generation fails
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
