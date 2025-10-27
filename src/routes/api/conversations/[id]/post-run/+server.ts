import { json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/server/auth';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import { createErrorResponse, createSuccessResponse } from '$lib/types/api';

export const POST = async ({ params, cookies, request }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		// 2. Parse request body
		const body = await request.json();
		const { messageCount, durationSeconds } = body;

		const conversationId = params.id;
		if (!conversationId) {
			return json(createErrorResponse('Conversation ID is required'), { status: 400 });
		}

		// 3. Validate message count >= 2
		if (!messageCount || typeof messageCount !== 'number' || messageCount < 2) {
			console.log('⏭️ Skipping post-run: insufficient engagement (< 2 messages)', {
				conversationId,
				messageCount
			});
			return json(
				createSuccessResponse({
					skipped: true,
					reason: 'insufficient_messages',
					message: 'Conversation requires at least 2 user messages for analysis'
				})
			);
		}

		// 4. Verify conversation exists and belongs to user
		const conversation = await conversationRepository.findConversationById(conversationId);
		if (!conversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		if (conversation.userId !== userId) {
			return json(createErrorResponse('Access denied'), { status: 403 });
		}

		// 5. Triple-check: verify actual message count from database
		const messages = await messagesRepository.getConversationMessages(conversationId, 1000);
		const userMessages = messages.filter(
			(msg) =>
				msg.role === 'user' &&
				msg.content?.trim().length > 0 &&
				!msg.content.includes('[Speaking...]')
		);
		const actualUserMessageCount = userMessages.length;

		if (actualUserMessageCount < 2) {
			console.warn('Message count mismatch:', {
				conversationId,
				claimed: messageCount,
				actual: actualUserMessageCount
			});
			return json(
				createSuccessResponse({
					skipped: true,
					reason: 'insufficient_engagement',
					message: 'Conversation has fewer than 2 user messages after database verification'
				})
			);
		}

		// 6. Success - pass validation
		console.log('✅ Post-run validation passed:', {
			conversationId,
			userId,
			userMessageCount: actualUserMessageCount,
			durationSeconds
		});

		return json(
			createSuccessResponse({
				success: true,
				message: 'Post-run validation successful. Ready for memory extraction.',
				data: {
					conversationId,
					userMessageCount: actualUserMessageCount,
					totalMessages: messages.length,
					durationSeconds
				}
			})
		);
	} catch (error) {
		console.error('❌ Post-run endpoint error:', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};
