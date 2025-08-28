import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const messageId = url.searchParams.get('id');
		if (!messageId) {
			return json(createErrorResponse('message id is required'), { status: 400 });
		}

		const message = await messagesRepository.getMessageById(messageId);

		if (!message) {
			return json(createErrorResponse('Message not found'), { status: 404 });
		}

		return json(createSuccessResponse(message));
	} catch (error) {
		console.error('Error fetching message:', error);
		return json(createErrorResponse('Failed to fetch message'), { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ url, request }) => {
	try {
		const messageId = url.searchParams.get('id');
		if (!messageId) {
			return json(createErrorResponse('message id is required'), { status: 400 });
		}

		const body = await request.json();
		const { content, audioUrl } = body;

		// Validate required fields
		if (!content) {
			return json(createErrorResponse('content is required'), { status: 400 });
		}

		// Update message
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

export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const messageId = url.searchParams.get('id');
		if (!messageId) {
			return json(createErrorResponse('message id is required'), { status: 400 });
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
