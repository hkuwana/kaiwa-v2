import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import type { NewConversation, NewMessage } from '$lib/server/db/types';

export const POST: RequestHandler = async ({ request, locals }) => {
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

		console.log(
			'💾 Saving conversation:',
			conversationData.id,
			'with',
			messages?.length || 0,
			'messages'
		);

		// Check if conversation already exists
		const existingConversation = await conversationRepository.findConversationById(conversation.id);

		let savedConversation;
		if (existingConversation) {
			// Update existing conversation
			savedConversation = await conversationRepository.updateConversation(conversation.id, {
				endedAt: conversationData.endedAt,
				durationSeconds: conversationData.durationSeconds,
				messageCount: conversationData.messageCount,
				audioSeconds: conversationData.audioSeconds,
				comfortRating: conversationData.comfortRating,
				engagementLevel: conversationData.engagementLevel
			});
			console.log('📝 Updated existing conversation:', conversation.id);
		} else {
			// Create new conversation
			savedConversation = await conversationRepository.createConversation(conversationData);
			console.log('✨ Created new conversation:', conversation.id);
		}

		// Save messages if provided
		const savedMessages = [];
		if (messages && Array.isArray(messages) && messages.length > 0) {
			console.log('💬 Saving', messages.length, 'messages...');

			for (const message of messages) {
				try {
					// Check if message already exists
					const existingMessage = await messagesRepository.getMessageById(message.id);

					if (!existingMessage) {
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
							difficultyLevel: message.difficultyLevel || null,
							learningTags: message.learningTags || null,
							conversationContext: message.conversationContext || null,
							messageIntent: message.messageIntent || null
						};

						const savedMessage = await messagesRepository.createMessage(messageData);
						savedMessages.push(savedMessage);
					} else {
						// Message already exists, optionally update it
						const updatedMessage = await messagesRepository.updateMessage(message.id, {
							translatedContent: message.translatedContent || existingMessage.translatedContent,
							romanization: message.romanization || existingMessage.romanization,
							hiragana: message.hiragana || existingMessage.hiragana,
							isTranslated: !!message.translatedContent || existingMessage.isTranslated
						});
						if (updatedMessage) {
							savedMessages.push(updatedMessage);
						}
					}
				} catch (messageError) {
					console.warn('⚠️ Failed to save message:', message.id, messageError);
					// Continue with other messages
				}
			}

			console.log('✅ Saved', savedMessages.length, 'messages successfully');
		}

		return json({
			success: true,
			conversation: savedConversation,
			messagesCount: savedMessages.length,
			message: 'Conversation and messages saved successfully'
		});
	} catch (error) {
		console.error('❌ Error saving conversation:', error);
		return json(
			{
				success: false,
				error: 'Failed to save conversation',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
