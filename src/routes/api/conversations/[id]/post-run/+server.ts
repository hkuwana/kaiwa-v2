import { json } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/server/auth';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import { conversationMemoryService } from '$lib/server/services/conversation-memory.service';
import { createErrorResponse, createSuccessResponse } from '$lib/types/api';
import { normalizeMemoriesList, formatMemoryEntry } from '$lib/utils/memory-format';

// In-memory cache for idempotency (in production, use Redis)
const idempotencyCache = new Map<string, { result: unknown; timestamp: number }>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory rate limiter (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per hour

/**
 * Check and update rate limit for user
 */
function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
	const now = Date.now();
	const key = `rate-limit:${userId}`;
	const entry = rateLimitStore.get(key);

	if (!entry || now > entry.resetTime) {
		// Create new window
		rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
		return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
	}

	if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
		return { allowed: false, remaining: 0 };
	}

	// Increment counter
	entry.count++;
	return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count };
}

/**
 * Check idempotency cache
 */
function getIdempotencyResult(key: string): unknown | null {
	const entry = idempotencyCache.get(key);
	if (!entry) return null;

	const now = Date.now();
	if (now > entry.timestamp + IDEMPOTENCY_TTL) {
		// Expired
		idempotencyCache.delete(key);
		return null;
	}

	return entry.result;
}

/**
 * Store idempotency result
 */
function setIdempotencyResult(key: string, result: unknown): void {
	idempotencyCache.set(key, { result, timestamp: Date.now() });
}

export const POST = async ({ params, cookies, request }) => {
	try {
		// 1. Authenticate user
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		// 2. Check rate limit
		const rateLimit = checkRateLimit(userId);
		if (!rateLimit.allowed) {
			console.warn('⏱️ Rate limit exceeded for user:', userId);
			return json(createErrorResponse('Rate limit exceeded. Maximum 10 requests per hour.'), {
				status: 429
			});
		}

		// 3. Check idempotency key
		const idempotencyKey = request.headers.get('Idempotency-Key');
		if (idempotencyKey) {
			const cachedResult = getIdempotencyResult(idempotencyKey);
			if (cachedResult) {
				console.log('📦 Returning cached post-run result for idempotency key:', idempotencyKey);
				return json(createSuccessResponse({ ...cachedResult, fromCache: true }));
			}
		}

		// 4. Parse request body
		const body = await request.json();
		const { messageCount, durationSeconds } = body;

		const conversationId = params.id;
		if (!conversationId) {
			return json(createErrorResponse('Conversation ID is required'), { status: 400 });
		}

		// 5. Validate message count >= 2
		if (!messageCount || typeof messageCount !== 'number' || messageCount < 2) {
			console.log('⏭️ Skipping post-run: insufficient engagement (< 2 messages)', {
				conversationId,
				messageCount
			});
			const result = {
				skipped: true,
				reason: 'insufficient_messages',
				message: 'Conversation requires at least 2 user messages for analysis'
			};
			if (idempotencyKey) setIdempotencyResult(idempotencyKey, result);
			return json(createSuccessResponse(result));
		}

		// 6. Verify conversation exists and belongs to user
		const conversation = await conversationRepository.findConversationById(conversationId);
		if (!conversation) {
			return json(createErrorResponse('Conversation not found'), { status: 404 });
		}

		if (conversation.userId !== userId) {
			return json(createErrorResponse('Access denied'), { status: 403 });
		}

		// 7. Triple-check: verify actual message count from database
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
			const result = {
				skipped: true,
				reason: 'insufficient_engagement',
				message: 'Conversation has fewer than 2 user messages after database verification'
			};
			if (idempotencyKey) setIdempotencyResult(idempotencyKey, result);
			return json(createSuccessResponse(result));
		}

		console.log('✅ Post-run validation passed:', {
			conversationId,
			userId,
			userMessageCount: actualUserMessageCount,
			durationSeconds
		});

		// 8. Try to extract memory via GPT (graceful degradation if fails)
		let memory = null;
		let gptFailed = false;

		try {
			console.log('🧠 Extracting conversation memory via GPT...');
			memory = await conversationMemoryService.extractConversationMemory(
				conversationId,
				userId,
				messages,
				conversation.targetLanguageId ? { id: conversation.targetLanguageId } : { id: 'unknown' },
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
				engagement:
					actualUserMessageCount > 5 ? 'high' : actualUserMessageCount > 2 ? 'medium' : 'low'
			};
		}

		// 9. Update user preferences with memory and metrics
		try {
			console.log('📝 Updating user preferences with memory and metrics...');
			const currentPreferences = await userPreferencesRepository.getPreferencesByUserId(userId);

			if (!currentPreferences) {
				console.warn('⚠️ User preferences not found, skipping update');
				const result = {
					success: true,
					memory,
					preferences: null,
					gptFailed,
					note: 'Memory extracted but user preferences not found'
				};
				if (idempotencyKey) setIdempotencyResult(idempotencyKey, result);
				return json(createSuccessResponse(result));
			}

			const existingMemories = normalizeMemoriesList(
				currentPreferences.memories as unknown
			);
			const formattedMemory = formatMemoryEntry(memory);
			const mergedMemories =
				formattedMemory && !existingMemories.includes(formattedMemory)
					? [formattedMemory, ...existingMemories]
					: existingMemories;

			// Atomically update preferences
			const updatedPreferences = await userPreferencesRepository.updateMultiplePreferences(userId, {
				memories: mergedMemories,
				successfulExchanges: ((currentPreferences.successfulExchanges as number) || 0) + 1,
				updatedAt: new Date()
			});

			console.log('✅ User preferences updated:', {
				newMemoryCount: (updatedPreferences?.memories as unknown[] | undefined)?.length,
				successfulExchanges: updatedPreferences?.successfulExchanges
			});

			const result = {
				success: true,
				memory,
				preferences: updatedPreferences,
				gptFailed: gptFailed ? true : undefined,
				note: gptFailed ? 'Memory extracted with fallback due to GPT error' : undefined
			};
			if (idempotencyKey) setIdempotencyResult(idempotencyKey, result);
			return json(createSuccessResponse(result));
		} catch (prefError) {
			console.error('❌ Failed to update preferences:', prefError);
			// Still return success because memory extraction worked
			const result = {
				success: true,
				memory,
				preferences: null,
				gptFailed,
				note: 'Memory extracted successfully but preference update failed'
			};
			if (idempotencyKey) setIdempotencyResult(idempotencyKey, result);
			return json(createSuccessResponse(result), { status: 200 });
		}
	} catch (error) {
		console.error('❌ Post-run endpoint error:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json(createErrorResponse(`Post-run processing failed: ${errorMessage}`), {
			status: 500
		});
	}
};
