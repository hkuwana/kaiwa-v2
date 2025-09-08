// src/lib/server/services/conversationSummary.service.ts

import * as openaiService from './openai.service';
import { conversationRepository } from '$lib/server/repositories/conversation.repository';
import * as userPreferencesService from './userPreferences.service';
import { getMaxMemories } from '$lib/server/tiers';
import type { UserTier } from '$lib/server/db/types';

export interface ConversationMemoriesOptions {
	userId: string;
	conversationId: string;
	userTier: UserTier;
	existingMemories?: string[];
}

export interface ConversationMemoriesResult {
	success: boolean;
	memories?: string[];
	error?: string;
	truncated?: boolean;
}

/**
 * Generate conversation memories and update user preferences
 */
export async function generateConversationMemories(
	options: ConversationMemoriesOptions
): Promise<ConversationMemoriesResult> {
	try {
		const { userId, conversationId, userTier, existingMemories = [] } = options;

		// Get conversation messages
		const messages = await conversationRepository.findMessagesByConversationId(conversationId);

		if (messages.length === 0) {
			return { success: false, error: 'No messages found in conversation' };
		}

		// Format messages for AI processing
		const conversationText = messages.map((msg) => `${msg.role}: ${msg.content}`).join('\n\n');

		// Get user preferences to understand context
		const userPreferences = await userPreferencesService.getUserPreferences(userId);
		const targetLanguage = userPreferences?.targetLanguageId || 'unknown';

		// Generate memories using OpenAI
		const newMemories = await generateMemoriesWithAI(
			conversationText,
			targetLanguage,
			existingMemories,
			userTier
		);

		if (!newMemories || newMemories.length === 0) {
			return { success: false, error: 'Failed to generate memories' };
		}

		// Combine existing and new memories, removing duplicates
		const allMemories = [...existingMemories, ...newMemories];
		const uniqueMemories = Array.from(new Set(allMemories));

		// Check if memories exceed tier limits
		const maxMemories = getMaxMemories(userTier);
		let finalMemories = uniqueMemories;
		let truncated = false;

		if (uniqueMemories.length > maxMemories) {
			finalMemories = uniqueMemories.slice(0, maxMemories);
			truncated = true;
		}

		// Update user preferences with new memories
		await userPreferencesService.updateUserPreferences(userId, {
			memories: finalMemories
		});

		return {
			success: true,
			memories: finalMemories,
			truncated
		};
	} catch (error) {
		console.error('Error generating conversation memories:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Generate memories using OpenAI with context from existing memories
 */
async function generateMemoriesWithAI(
	conversationText: string,
	targetLanguage: string,
	existingMemories: string[] = [],
	userTier?: UserTier
): Promise<string[] | null> {
	const systemPrompt = `You are an expert language learning assistant. Your task is to extract personal facts, preferences, and insights about the student from their language learning conversation.

The student is learning ${targetLanguage}.

${
	existingMemories.length > 0
		? `EXISTING MEMORIES (avoid duplicating these):
${existingMemories.map((memory, i) => `${i + 1}. ${memory}`).join('\n')}

`
		: ''
}Extract personal facts and preferences as individual bullet points. Each memory should be:
- A complete, standalone sentence
- About the student's personal life, preferences, goals, or background
- Specific and meaningful (not generic)
- Written in third person (e.g., "Student enjoys boba tea" not "I enjoy boba tea")

Examples of good memories:
- "Wants to learn because of speaking with grandma"
- "Enjoys boba tea"
- "Has never been to China"
- "Is shy about practicing Japanese"
- "Is a devout Catholic who believes in mysticism and learning from Buddhist scriptures in Japanese"
- "Works as a software engineer"
- "Plans to visit Japan next year"
- "Loves anime and manga"

${
	userTier === 'premium'
		? 'Extract 5-8 detailed memories.'
		: userTier === 'plus'
			? 'Extract 3-5 memories.'
			: 'Extract 2-3 key memories.'
}

Return ONLY a JSON array of strings, no explanations or markdown.`;

	const userPrompt = `Extract personal memories from this language learning conversation:

${conversationText}

Return a JSON array of memory strings.`;

	try {
		const response = await openaiService.createCompletion(
			[
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt }
			],
			{
				model: 'gpt-4o-mini',
				temperature: 0.3, // Lower temperature for more consistent extraction
				maxTokens: userTier === 'premium' ? 800 : userTier === 'plus' ? 500 : 300,
				responseFormat: 'json'
			}
		);

		// Parse the JSON response
		const parsed = openaiService.parseAndValidateJSON<string[]>(response.content);
		return parsed;
	} catch (error) {
		console.error('OpenAI memory generation failed:', error);
		return null;
	}
}

/**
 * Check if user has reached their memory limit
 */
export function checkMemoryLimit(
	currentMemories: string[],
	userTier: UserTier
): { withinLimit: boolean; currentCount: number; maxCount: number } {
	const maxCount = getMaxMemories(userTier);
	const currentCount = currentMemories?.length || 0;

	return {
		withinLimit: currentCount < maxCount,
		currentCount,
		maxCount
	};
}

/**
 * Truncate memories to fit within tier limits
 */
export function truncateMemoriesToLimit(
	memories: string[],
	userTier: UserTier
): { memories: string[]; wasTruncated: boolean } {
	const maxCount = getMaxMemories(userTier);

	if (memories.length <= maxCount) {
		return { memories, wasTruncated: false };
	}

	// Truncate to max count
	const truncated = memories.slice(0, maxCount);
	return { memories: truncated, wasTruncated: true };
}

export default {
	generateConversationMemories,
	checkMemoryLimit,
	truncateMemoriesToLimit
};
