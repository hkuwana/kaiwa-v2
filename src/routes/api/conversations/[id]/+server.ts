import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import { createErrorResponse, createSuccessResponse } from '$lib/types/api';
import { getUserFromSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		const conversationId = params.id;
		if (!conversationId) {
			return json(createErrorResponse('Conversation ID is required'), { status: 400 });
		}

		console.log('📖 Fetching conversation details:', conversationId, 'for user:', userId);

		// Get conversation details
		const conversation = await conversationRepository.findConversationById(conversationId);

		if (!conversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		// Verify the conversation belongs to the user
		if (conversation.userId !== userId) {
			return json(createErrorResponse('Access denied'), { status: 403 });
		}

		// Get all messages for this conversation
		const messages = await messagesRepository.getConversationMessages(conversationId, 1000);

		// Calculate conversation statistics
		const userMessages = messages.filter((m) => m.role === 'user');
		const assistantMessages = messages.filter((m) => m.role === 'assistant');

		const stats = {
			totalMessages: messages.length,
			userMessages: userMessages.length,
			assistantMessages: assistantMessages.length,
			averageWordsPerMessage:
				messages.length > 0
					? Math.round(
							messages.reduce((sum, msg) => sum + (msg.content?.split(' ').length || 0), 0) /
								messages.length
						)
					: 0,
			conversationDuration: conversation.durationSeconds || 0,
			languageMix: {
				userLanguage: userMessages.filter((m) => m.sourceLanguage === conversation.targetLanguageId)
					.length,
				targetLanguage: userMessages.filter(
					(m) => m.sourceLanguage !== conversation.targetLanguageId
				).length
			}
		};

		// Format conversation details
		const conversationDetails = {
			id: conversation.id,
			title: conversation.title || `${conversation.targetLanguageId.toUpperCase()} Conversation`,
			targetLanguageId: conversation.targetLanguageId,
			scenarioId: conversation.scenarioId,
			isOnboarding: conversation.isOnboarding,
			startedAt: conversation.startedAt?.toISOString?.() || conversation.startedAt,
			endedAt: conversation.endedAt
				? (conversation.endedAt as Date).toISOString?.() || conversation.endedAt
				: null,
			durationSeconds: conversation.durationSeconds || 0,
			messageCount: conversation.messageCount || 0,
			mode: conversation.mode || 'realtime',
			voice: conversation.voice,
			comfortRating: conversation.comfortRating,
			engagementLevel: conversation.engagementLevel,
			stats
		};

		// Format messages
		const formattedMessages = messages.map((msg) => ({
			id: msg.id,
			role: msg.role,
			content: msg.content,
			timestamp: msg.timestamp,
			translatedContent: msg.translatedContent,
			sourceLanguage: msg.sourceLanguage,
			targetLanguage: msg.targetLanguage,
			romanization: msg.romanization,
			hiragana: msg.hiragana,
			sequence: msg.sequenceId ? parseInt(msg.sequenceId) : undefined
		}));

		console.log('✅ Found conversation with', formattedMessages.length, 'messages');

		return json(
			createSuccessResponse({
				conversation: conversationDetails,
				messages: formattedMessages
			})
		);
	} catch (error) {
		console.error('Get conversation details API error:', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};
