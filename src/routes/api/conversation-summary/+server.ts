import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { conversationSummaryService } from '$lib/server/services';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { getUserFromSession } from '$lib/server/auth';
import * as userService from '$lib/server/services/user.service';
import { getMaxMemories } from '$lib/data/tiers';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Get authenticated user ID
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		const body = await request.json();
		const { conversationId } = body;

		if (!conversationId) {
			return json(createErrorResponse('conversationId is required'), { status: 400 });
		}

		// Get user's current tier
		const userTier = await userService.getUserTier(userId);
		if (!userTier) {
			return json(createErrorResponse('Unable to determine user tier'), { status: 500 });
		}

		// Get existing memories to build upon
		const userPreferences = await userService.getUserPreferences(userId);
		const existingMemories = userPreferences?.memories || [];

		// Generate conversation memories
		const result = await conversationSummaryService.generateConversationMemories({
			userId,
			conversationId,
			userTier,
			existingMemories
		});

		if (!result.success) {
			return json(createErrorResponse(result.error || 'Failed to generate summary'), {
				status: 500
			});
		}

		return json(
			createSuccessResponse({
				memories: result.memories,
				truncated: result.truncated,
				message: 'Conversation memories generated successfully'
			})
		);
	} catch (error) {
		console.error('Conversation summary API error:', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		// Get authenticated user ID
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		// Get user's current memories
		const userPreferences = await userService.getUserPreferences(userId);
		const memories = userPreferences?.memories || [];

		// Get user's tier for limit information
		const userTier = await userService.getUserTier(userId);
		const maxCount = userTier ? getMaxMemories(userTier) : 10;

		return json(
			createSuccessResponse({
				memories,
				count: memories.length,
				maxCount,
				withinLimit: memories.length < maxCount
			})
		);
	} catch (error) {
		console.error('Get conversation summary API error:', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request, cookies }) => {
	try {
		// Get authenticated user ID
		const userId = await getUserFromSession(cookies);
		if (!userId) {
			return json(createErrorResponse('Authentication required'), { status: 401 });
		}

		const body = await request.json();
		const { memories } = body;

		if (!Array.isArray(memories)) {
			return json(createErrorResponse('Memories must be an array of strings'), { status: 400 });
		}

		// Validate all memories are strings
		if (!memories.every((memory) => typeof memory === 'string')) {
			return json(createErrorResponse('All memories must be strings'), { status: 400 });
		}

		// Get user's tier for limit checking
		const userTier = await userService.getUserTier(userId);
		if (!userTier) {
			return json(createErrorResponse('Unable to determine user tier'), { status: 500 });
		}

		// Check if memories exceed tier limits
		const limitCheck = conversationSummaryService.checkMemoryLimit(memories, userTier);

		if (!limitCheck.withinLimit) {
			return json(
				createErrorResponse(
					`Memories exceed tier limit. Current: ${limitCheck.currentCount}, Max: ${limitCheck.maxCount}`
				),
				{ status: 400 }
			);
		}

		// Update user preferences
		await userService.updateUserPreferences(userId, {
			memories
		});

		return json(
			createSuccessResponse({
				memories,
				count: memories.length,
				maxCount: limitCheck.maxCount,
				message: 'Conversation memories updated successfully'
			})
		);
	} catch (error) {
		console.error('Update conversation summary API error:', error);
		return json(createErrorResponse('Internal server error'), { status: 500 });
	}
};
