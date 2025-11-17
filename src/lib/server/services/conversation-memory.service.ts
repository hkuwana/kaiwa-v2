import { logger } from '$lib/logger';
import { randomUUID } from 'crypto';
import * as openaiService from './openai.service';
import type { Message, Language } from '$lib/server/db/types';

/**
 * Memory extracted from a conversation
 */
export interface ConversationMemory {
	id: string;
	conversationId: string;
	userId: string;
	languageId: string;
	createdAt: Date;
	topic: string; // What was discussed
	keyPhrases: string[]; // Useful phrases learned
	difficulties: string[]; // Pain points/struggles
	successfulPatterns: string[]; // What worked well
	duration: number; // Seconds
	engagement: 'low' | 'medium' | 'high';
}

export interface MemoryExtractionResult {
	success: boolean;
	memory?: ConversationMemory;
	error?: string;
}

/**
 * Format conversation messages into readable text for GPT analysis
 */
function formatMessagesForGPT(messages: Message[]): string {
	const formatted = messages
		.map((msg) => {
			// Skip system messages and placeholders
			if (msg.role === 'system' || msg.content?.includes('[Speaking...]')) {
				return null;
			}

			const role = msg.role === 'user' ? 'Learner' : 'Teacher';
			return `${role}: ${msg.content}`;
		})
		.filter((msg): msg is string => msg !== null)
		.join('\n\n');

	return formatted;
}

/**
 * Parse GPT response to extract memory insights
 */
function parseMemoryResponse(response: string): Partial<ConversationMemory> {
	try {
		// Try to parse as JSON if the response looks like JSON
		if (response.trim().startsWith('{')) {
			const parsed = JSON.parse(response);
			return {
				topic: parsed.topic || parsed.title || 'Conversation',
				keyPhrases: Array.isArray(parsed.keyPhrases) ? parsed.keyPhrases : [],
				difficulties: Array.isArray(parsed.difficulties) ? parsed.difficulties : [],
				successfulPatterns: Array.isArray(parsed.successfulPatterns)
					? parsed.successfulPatterns
					: []
			};
		}
	} catch {
		// If JSON parsing fails, fall back to text parsing
	}

	// Fallback: try to extract structured data from text
	const memory: Partial<ConversationMemory> = {
		topic: 'Language Conversation',
		keyPhrases: [],
		difficulties: [],
		successfulPatterns: []
	};

	// Simple text extraction patterns
	const topicMatch = response.match(/topic:?\s*(.+?)(?:\n|$)/i);
	if (topicMatch) {
		memory.topic = topicMatch[1].trim();
	}

	const phrasesMatch = response.match(
		/(?:key\s*phrases?|useful\s*phrases?):?\s*\[?(.+?)\]?(?:\n|$)/i
	);
	if (phrasesMatch) {
		memory.keyPhrases = phrasesMatch[1]
			.split(',')
			.map((p) => p.trim())
			.filter((p) => p.length > 0);
	}

	return memory;
}

/**
 * Call GPT to extract memory insights from conversation
 */
async function extractMemoryViaGPT(
	conversationText: string,
	languageId: string
): Promise<Partial<ConversationMemory>> {
	const systemPrompt = `You are a language learning coach. Analyze this conversation between a language learner and a teacher.
Extract key insights in the following JSON format:
{
  "topic": "What was the main topic discussed",
  "keyPhrases": ["useful phrase 1", "useful phrase 2"],
  "difficulties": ["struggle 1", "struggle 2"],
  "successfulPatterns": ["what worked well 1", "what worked well 2"]
}

Focus on:
- Topic: The main theme of conversation
- Key Phrases: Useful words/phrases the learner said or learned
- Difficulties: Any struggles or misunderstandings
- Successful Patterns: What the learner did well`;

	const userPrompt = `Analyze this ${languageId} language conversation:\n\n${conversationText}`;

	try {
		const response = await openaiService.createCompletion(
			[
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt }
			],
			{
				model: 'gpt-4o-mini',
				temperature: 0.7,
				maxTokens: 500,
				responseFormat: 'text'
			}
		);

		const parsed = parseMemoryResponse(response.content);

		logger.info('✅ Memory extracted via GPT:', {
			topic: parsed.topic,
			phraseCount: parsed.keyPhrases?.length || 0,
			difficultyCount: parsed.difficulties?.length || 0
		});

		return parsed;
	} catch (error) {
		logger.error('❌ GPT extraction failed:', error);
		throw error;
	}
}

/**
 * Determine engagement level based on message count
 */
function determineEngagementLevel(messageCount: number): 'low' | 'medium' | 'high' {
	if (messageCount < 5) return 'low';
	if (messageCount < 15) return 'medium';
	return 'high';
}

/**
 * Extract conversation memory from messages
 */
export const conversationMemoryService = {
	/**
	 * Extract conversation memory and insights
	 */
	async extractConversationMemory(
		conversationId: string,
		userId: string,
		messages: Message[],
		language: Language,
		durationSeconds: number
	): Promise<ConversationMemory> {
		try {
			// Filter user messages for analysis
			const userMessages = messages.filter(
				(msg) =>
					msg.role === 'user' &&
					msg.content?.trim().length > 0 &&
					!msg.content.includes('[Speaking...]')
			);

			// Format conversation for GPT
			const conversationText = formatMessagesForGPT(messages);

			// Extract memory via GPT
			const memoryData = await extractMemoryViaGPT(conversationText, language.id);

			// Determine engagement level
			const engagement = determineEngagementLevel(userMessages.length);

			// Create final memory object
			const memory: ConversationMemory = {
				id: `mem_${randomUUID()}`,
				conversationId,
				userId,
				languageId: language.id,
				createdAt: new Date(),
				topic: memoryData.topic || 'Language Conversation',
				keyPhrases: memoryData.keyPhrases || [],
				difficulties: memoryData.difficulties || [],
				successfulPatterns: memoryData.successfulPatterns || [],
				duration: durationSeconds,
				engagement
			};

			logger.info('✅ Conversation memory created:', {
				conversationId,
				topic: memory.topic,
				engagement,
				duration: durationSeconds
			});

			return memory;
		} catch (error) {
			logger.error('❌ Memory extraction error:', error);
			throw error;
		}
	},

	/**
	 * Format messages for debugging/display
	 */
	formatMessagesForGPT,

	/**
	 * Determine engagement level
	 */
	determineEngagementLevel
};
