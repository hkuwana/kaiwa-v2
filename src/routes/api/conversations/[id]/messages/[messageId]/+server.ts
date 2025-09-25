import { json } from '@sveltejs/kit';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { getUserFromSession } from '$lib/server/auth';

export const GET = async ({ params, cookies }) => {
	try {
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		const { id: conversationId, messageId } = params;
		if (!conversationId || !messageId) {
			return json(createErrorResponse('Conversation ID and Message ID are required'), { status: 400 });
		}

		const conversation = await conversationRepository.findConversationById(conversationId);
		if (!conversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		if (conversation.userId !== userId) {
			return json(createErrorResponse('Access denied'), { status: 403 });
		}

		const message = await messagesRepository.getMessageById(messageId);

		if (!message || message.conversationId !== conversationId) {
			return json(createErrorResponse('Message not found'), { status: 404 });
		}

		return json(createSuccessResponse(message));
	} catch (error) {
		console.error('Error fetching message:', error);
		return json(createErrorResponse('Failed to fetch message'), { status: 500 });
	}
};

export const PUT = async ({ params, request, cookies }) => {
	try {
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		const { id: conversationId, messageId } = params;
		if (!conversationId || !messageId) {
			return json(createErrorResponse('Conversation ID and Message ID are required'), { status: 400 });
		}

		const conversation = await conversationRepository.findConversationById(conversationId);
		if (!conversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		if (conversation.userId !== userId) {
			return json(createErrorResponse('Access denied'), { status: 403 });
		}

		const message = await messagesRepository.getMessageById(messageId);

		if (!message || message.conversationId !== conversationId) {
			return json(createErrorResponse('Message not found'), { status: 404 });
		}

		const body = await request.json();
		const { content, audioUrl } = body;

		if (!content) {
			return json(createErrorResponse('content is required'), { status: 400 });
		}

		const updatedMessage = await messagesRepository.updateMessage(messageId, {
			content,
			...(audioUrl !== undefined && { audioUrl })
		});

		if (!updatedMessage) {
			return json(createErrorResponse('Message not found'), { status: 404 });
		}

		return json(createSuccessResponse(updatedMessage, 'Message updated successfully'));
	} catch (error) {
		console.error('Error updating message:', error);
		return json(createErrorResponse('Failed to update message'), { status: 500 });
	}
};

export const DELETE = async ({ params, cookies }) => {
	try {
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		const { id: conversationId, messageId } = params;
		if (!conversationId || !messageId) {
			return json(createErrorResponse('Conversation ID and Message ID are required'), { status: 400 });
		}

		const conversation = await conversationRepository.findConversationById(conversationId);
		if (!conversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		if (conversation.userId !== userId) {
			return json(createErrorResponse('Access denied'), { status: 403 });
		}

		const message = await messagesRepository.getMessageById(messageId);

		if (!message || message.conversationId !== conversationId) {
			return json(createErrorResponse('Message not found'), { status: 404 });
		}

		const success = await messagesRepository.deleteMessage(messageId);

		if (!success) {
			return json(createErrorResponse('Message not found'), { status: 404 });
		}

		return json(createSuccessResponse(null, 'Message deleted successfully'));
	} catch (error) {
		console.error('Error deleting message:', error);
		return json(createErrorResponse('Failed to delete message'), { status: 500 });
	}
};
