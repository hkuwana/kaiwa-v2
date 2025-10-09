import { json } from '@sveltejs/kit';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import { createErrorResponse, createSuccessResponse } from '$lib/types/api';
import { z } from 'zod';
import type { NewConversation, NewMessage } from '$lib/server/db/types';

const querySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(10),
	offset: z.coerce.number().int().min(0).default(0)
});

const deleteSchema = z.object({
	conversationIds: z.array(z.string().min(1)).min(1).max(50)
});

export const GET = async ({ locals, url }) => {
	const user = locals.user;
	if (!user) {
		return json(createErrorResponse('Unauthorized'), { status: 401 });
	}

	const params = querySchema.safeParse(Object.fromEntries(url.searchParams));

	if (!params.success) {
		return json(createErrorResponse('Invalid query parameters', params.error.flatten()), {
			status: 400
		});
	}

	try {
		const { limit, offset } = params.data;
		const conversations = await conversationRepository.findConversationsByUserId(
			user.id,
			limit,
			offset
		);
		const totalConversations = await conversationRepository.countConversationsByUserId(user.id);

		return json(
			createSuccessResponse({
				conversations,
				total: totalConversations
			})
		);
	} catch (error) {
		console.error('Get conversations API error:', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};

export const POST = async ({ request, locals }) => {
	try {
		const { conversation, messages } = await request.json();

		if (!conversation) {
			return json({ error: 'Conversation data is required' }, { status: 400 });
		}

		// Get user info from locals
		const user = locals.user;

		// Prepare conversation data
		const conversationData: NewConversation = {
			id: conversation.id,
			userId: user?.id || null,
			guestId: !user ? conversation.guestId || 'anonymous' : null,
			targetLanguageId: conversation.targetLanguageId,
			title: conversation.title || null,
			mode: conversation.mode || 'realtime',
			voice: conversation.voice || null,
			scenarioId: conversation.scenarioId || null,
			isOnboarding: conversation.isOnboarding || 'false',
			startedAt: conversation.startedAt ? new Date(conversation.startedAt) : new Date(),
			endedAt: conversation.endedAt ? new Date(conversation.endedAt) : null,
			durationSeconds: conversation.durationSeconds || null,
			messageCount: messages?.length || 0,
			audioSeconds: conversation.audioSeconds || '0',
			comfortRating: conversation.comfortRating || null,
			engagementLevel: conversation.engagementLevel || null
		};

		// Create new conversation
		const savedConversation = await conversationRepository.createConversation(conversationData);

		// Save messages if provided
		const savedMessages = [];
		if (messages && Array.isArray(messages) && messages.length > 0) {
			for (const message of messages) {
				const messageData: NewMessage = {
					id: message.id,
					conversationId: conversation.id,
					role: message.role,
					content: message.content,
					timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
					sequenceId: message.sequence?.toString() || null,
					translatedContent: message.translatedContent || null,
					sourceLanguage: message.sourceLanguage || null,
					targetLanguage: message.targetLanguage || null,
					userNativeLanguage: message.userNativeLanguage || null,
					romanization: message.romanization || null,
					hiragana: message.hiragana || null,
					otherScripts: message.otherScripts || null,
					translationConfidence: message.translationConfidence || null,
					translationProvider: message.translationProvider || null,
					translationNotes: message.translationNotes || null,
					isTranslated: !!message.translatedContent,
					grammarAnalysis: message.grammarAnalysis || null,
					vocabularyAnalysis: message.vocabularyAnalysis || null,
					pronunciationScore: message.pronunciationScore || null,
					audioUrl: message.audioUrl || null,
					audioDuration: message.audioDuration || null,
					speechTimings: message.speechTimings || null,
					difficultyLevel: message.difficultyLevel || null,
					learningTags: message.learningTags || null,
					conversationContext: message.conversationContext || null,
					messageIntent: message.messageIntent || null
				};

				const savedMessage = await messagesRepository.createMessage(messageData);
				savedMessages.push(savedMessage);
			}
		}

		return json(
			createSuccessResponse({
				conversation: savedConversation,
				messagesCount: savedMessages.length
			})
		);
	} catch (error) {
		console.error('Create conversation API error:', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};

export const DELETE = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json(createErrorResponse('Unauthorized'), { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json(createErrorResponse('Invalid request body'), { status: 400 });
	}

	const parsed = deleteSchema.safeParse(body);
	if (!parsed.success) {
		return json(createErrorResponse('Invalid request body'), { status: 400 });
	}

	try {
		const { conversationIds } = parsed.data;
		const ownedConversations = await conversationRepository.findConversationsByIdsForUser(
			conversationIds,
			user.id
		);

		if (ownedConversations.length === 0) {
			return json(createErrorResponse('No conversations found for deletion'), { status: 404 });
		}

		const ownedIds = ownedConversations.map((conversation) => conversation.id);
		const skippedIds = conversationIds.filter((id) => !ownedIds.includes(id));

		const deletedIds = await conversationRepository.deleteConversations(ownedIds);
		const totalAfterDeletion = await conversationRepository.countConversationsByUserId(user.id);

		return json(
			createSuccessResponse({
				deletedIds,
				skippedIds,
				deletedCount: deletedIds.length,
				skippedCount: skippedIds.length,
				totalAfterDeletion
			})
		);
	} catch (error) {
		console.error('Delete conversations API error:', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};
