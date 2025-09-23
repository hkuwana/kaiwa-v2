import { json } from '@sveltejs/kit';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';

export const POST = async ({ request }) => {
	try {
		const body = await request.json();
		const { conversationId, role, content, audioUrl } = body;

		// Validate required fields
		if (!conversationId || !role || !content) {
			return json(createErrorResponse('conversationId, role, and content are required'), {
				status: 400
			});
		}

		// Verify conversation exists
		const conversation = await conversationRepository.findConversationById(conversationId);
		if (!conversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		// Create new message with comprehensive language support
		const message = await messagesRepository.createMessage({
			id: crypto.randomUUID(),
			conversationId,
			role,
			content,
			audioUrl: audioUrl || null,

			// Translation and language fields
			translatedContent: null,
			sourceLanguage: null,
			targetLanguage: null,
			userNativeLanguage: null,

			// Multi-language script support
			romanization: null,
			hiragana: null,
			otherScripts: null,

			// Translation metadata
			translationConfidence: null,
			translationProvider: null,
			translationNotes: null,
			isTranslated: false,

			// Analysis and feedback
			grammarAnalysis: null,
			vocabularyAnalysis: null,
			pronunciationScore: null,

			// Audio features
			audioDuration: null,

			// Metadata for language learning
			difficultyLevel: null,
			learningTags: null,

			// Context fields
			conversationContext: null,
			messageIntent: null
		});

		// Increment message count in conversation
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

export const GET = async ({ url }) => {
	try {
		const conversationId = url.searchParams.get('conversationId');
		const limit = parseInt(url.searchParams.get('limit') || '100');
		const offset = parseInt(url.searchParams.get('offset') || '0');
		const role = url.searchParams.get('role');

		if (!conversationId) {
			return json(createErrorResponse('conversationId is required'), { status: 400 });
		}

		// Verify conversation exists
		const conversation = await conversationRepository.findConversationById(conversationId);
		if (!conversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

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
