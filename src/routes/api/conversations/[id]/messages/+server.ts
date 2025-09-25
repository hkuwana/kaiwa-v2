import { json } from '@sveltejs/kit';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
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
		const { role, content, audioUrl } = body;

		if (!role || !content) {
			return json(createErrorResponse('role and content are required'), { status: 400 });
		}

		const message = await messagesRepository.createMessage({
			id: crypto.randomUUID(),
			conversationId,
			role,
			content,
			audioUrl: audioUrl || null,
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			userNativeLanguage: null,
			romanization: null,
			hiragana: null,
			otherScripts: null,
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: false,
			grammarAnalysis: null,
			vocabularyAnalysis: null,
			pronunciationScore: null,
			audioDuration: null,
			difficultyLevel: null,
			learningTags: null,
			conversationContext: null,
			messageIntent: null
		});

		await conversationRepository.incrementMessageCount(conversationId);

		return json(
			createSuccessResponse({
				message,
				messageCount: (conversation.messageCount || 0) + 1
			})
		);
	} catch (error) {
		console.error('Error creating message:', error);
		return json(createErrorResponse('Failed to create message'), { status: 500 });
	}
};

export const GET = async ({ url, params, cookies }) => {
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

		const limit = parseInt(url.searchParams.get('limit') || '100');
		const offset = parseInt(url.searchParams.get('offset') || '0');
		const role = url.searchParams.get('role');

		let messages;
		if (role) {
			messages = await messagesRepository.getConversationMessagesByRole(
				conversationId,
				role as 'assistant' | 'user' | 'system',
				limit
			);
		} else {
			messages = await messagesRepository.getConversationMessages(conversationId, limit, offset);
		}

		return json(createSuccessResponse({ messages, conversationId }));
	} catch (error) {
		console.error('Error fetching messages:', error);
		return json(createErrorResponse('Failed to fetch messages'), { status: 500 });
	}
};
