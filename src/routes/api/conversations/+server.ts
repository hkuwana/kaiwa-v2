import { json } from '@sveltejs/kit';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import { createErrorResponse, createSuccessResponse } from '$lib/types/api';
import { getUserFromSession } from '$lib/server/auth';

export const GET = async ({ url, cookies }) => {
	try {
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
		const offset = parseInt(url.searchParams.get('offset') || '0', 10);
		const languageId = url.searchParams.get('languageId') || undefined;
		const searchQuery = url.searchParams.get('search');

		console.log('📚 Fetching conversations for user:', userId, {
			limit,
			offset,
			languageId,
			searchQuery
		});

		const conversations = await conversationRepository.findConversationsByUserId(
			userId,
			limit,
			offset
		);

		const filtered = languageId
			? conversations.filter((c) => c.targetLanguageId === languageId)
			: conversations;

		// Get additional details for each conversation
		const conversationsWithDetails = await Promise.all(
			filtered.map(async (conversation) => {
				try {
					// Get recent messages for preview
					const recentMessages = await messagesRepository.getRecentMessages(conversation.id, 3);

					// Get first user message for preview
					const allMessages = await messagesRepository.getConversationMessages(conversation.id, 10);
					const firstUserMessage = allMessages.find((m) => m.role === 'user');

					return {
						id: conversation.id,
						title:
							conversation.title || `${conversation.targetLanguageId.toUpperCase()} Conversation`,
						targetLanguageId: conversation.targetLanguageId,
						scenarioId: conversation.scenarioId,
						isOnboarding: conversation.isOnboarding,
						startedAt: conversation.startedAt?.toISOString?.() || conversation.startedAt,
						endedAt: conversation.endedAt
							? (conversation.endedAt as Date).toISOString?.() || conversation.endedAt
							: null,
						durationSeconds: conversation.durationSeconds || 0,
						messageCount: conversation.messageCount || 0,
						preview: {
							firstUserMessage: firstUserMessage?.content?.substring(0, 150) || null,
							lastMessage: recentMessages[0]?.content?.substring(0, 100) || null,
							messageCount: recentMessages.length
						}
					};
				} catch (error) {
					console.warn('Error fetching details for conversation:', conversation.id, error);
					return {
						id: conversation.id,
						title:
							conversation.title || `${conversation.targetLanguageId.toUpperCase()} Conversation`,
						targetLanguageId: conversation.targetLanguageId,
						scenarioId: conversation.scenarioId,
						isOnboarding: conversation.isOnboarding,
						startedAt: conversation.startedAt?.toISOString?.() || conversation.startedAt,
						endedAt: conversation.endedAt
							? (conversation.endedAt as Date).toISOString?.() || conversation.endedAt
							: null,
						durationSeconds: conversation.durationSeconds || 0,
						messageCount: conversation.messageCount || 0,
						preview: {
							firstUserMessage: null,
							lastMessage: null,
							messageCount: 0
						}
					};
				}
			})
		);

		// Filter by search query if provided
		let finalConversations = conversationsWithDetails;
		if (searchQuery && searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			finalConversations = conversationsWithDetails.filter(
				(conv) =>
					conv.title?.toLowerCase().includes(query) ||
					conv.preview.firstUserMessage?.toLowerCase().includes(query) ||
					conv.preview.lastMessage?.toLowerCase().includes(query)
			);
		}

		// Get total count for pagination
		const allUserConversations = await conversationRepository.findConversationsByUserId(
			userId,
			1000,
			0
		);
		const totalFiltered = languageId
			? allUserConversations.filter((c) => c.targetLanguageId === languageId).length
			: allUserConversations.length;

		return json(
			createSuccessResponse({
				conversations: finalConversations,
				pagination: {
					limit,
					offset,
					total: totalFiltered,
					hasMore: offset + limit < totalFiltered
				}
			})
		);
	} catch (error) {
		console.error('Get conversations API error:', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};
