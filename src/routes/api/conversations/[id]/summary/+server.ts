import { json } from '@sveltejs/kit';
import { conversationSummaryService } from '$lib/server/services';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { getUserFromSession } from '$lib/server/auth';
import * as userService from '$lib/server/services/user.service';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';

export const POST = async ({ params, cookies }) => {
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

		const userTier = await userService.getUserTier(userId);
		if (!userTier) {
			return json(createErrorResponse('Unable to determine user tier'), { status: 500 });
		}

		const userPreferences = await userService.getUserPreferences(userId);
		const existingMemories = userPreferences?.memories || [];

		const result = await conversationSummaryService.generateConversationMemories({
			userId,
			conversationId,
			userTier,
			existingMemories
		});

		if (!result.success) {
			return json(createErrorResponse(result.error || 'Failed to generate summary'), {
				status: 500
			});
		}

		return json(
			createSuccessResponse({
				memories: result.memories,
				truncated: result.truncated,
				message: 'Conversation memories generated successfully'
			})
		);
	} catch (error) {
		console.error('Conversation summary API error:', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};