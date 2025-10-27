import { json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/server/auth';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import { conversationMemoryService } from '$lib/server/services/conversation-memory.service';
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
			console.warn('⚠️ Message count mismatch:', {
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

		console.log('✅ Post-run validation passed:', {
			conversationId,
			userId,
			userMessageCount: actualUserMessageCount,
			durationSeconds
		});

		// 6. Try to extract memory via GPT (graceful degradation if fails)
		let memory = null;
		let gptFailed = false;

		try {
			console.log('🧠 Extracting conversation memory via GPT...');
			memory = await conversationMemoryService.extractConversationMemory(
				conversationId,
				userId,
				messages,
				conversation.targetLanguageId ? { id: conversation.targetLanguageId } : ({ id: 'unknown' } as any),
				durationSeconds || 0
			);
			console.log('✅ Memory extracted successfully:', { topic: memory.topic });
		} catch (gptError) {
			console.warn('⚠️ GPT extraction failed, using fallback memory:', gptError);
			gptFailed = true;

			// Create minimal memory object with just basic metrics
			memory = {
				id: `mem_fallback_${Date.now()}`,
				conversationId,
				userId,
				languageId: conversation.targetLanguageId || 'unknown',
				createdAt: new Date(),
				topic: 'Conversation',
				keyPhrases: [],
				difficulties: [],
				successfulPatterns: [],
				duration: durationSeconds || 0,
				engagement: actualUserMessageCount > 5 ? 'high' : actualUserMessageCount > 2 ? 'medium' : 'low'
			};
		}

		// 7. Update user preferences with memory and metrics
		try {
			console.log('📝 Updating user preferences with memory and metrics...');
			const currentPreferences = await userPreferencesRepository.getPreferencesByUserId(userId);

			if (!currentPreferences) {
				console.warn('⚠️ User preferences not found, skipping update');
				return json(
					createSuccessResponse({
						success: true,
						memory,
						preferences: null,
						gptFailed,
						note: 'Memory extracted but user preferences not found'
					})
				);
			}

			// Atomically update preferences
			const updatedPreferences = await userPreferencesRepository.updateMultiplePreferences(
				userId,
				{
					memories: [...((currentPreferences.memories as unknown[]) || []), memory],
					successfulExchanges: ((currentPreferences.successfulExchanges as number) || 0) + 1,
					updatedAt: new Date()
				}
			);

			console.log('✅ User preferences updated:', {
				newMemoryCount: (updatedPreferences?.memories as unknown[] | undefined)?.length,
				successfulExchanges: updatedPreferences?.successfulExchanges
			});

			return json(
				createSuccessResponse({
					success: true,
					memory,
					preferences: updatedPreferences,
					gptFailed: gptFailed ? true : undefined,
					note: gptFailed ? 'Memory extracted with fallback due to GPT error' : undefined
				})
			);
		} catch (prefError) {
			console.error('❌ Failed to update preferences:', prefError);
			// Still return success because memory extraction worked
			return json(
				createSuccessResponse({
					success: true,
					memory,
					preferences: null,
					gptFailed,
					note: 'Memory extracted successfully but preference update failed'
				}),
				{ status: 200 }
			);
		}
	} catch (error) {
		console.error('❌ Post-run endpoint error:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json(
			createErrorResponse(`Post-run processing failed: ${errorMessage}`),
			{ status: 500 }
		);
	}
};
