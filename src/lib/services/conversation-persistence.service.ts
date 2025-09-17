// src/lib/services/conversation-persistence.service.ts
// Service for persisting conversation data to the database

import type { Message, Language } from '$lib/server/db/types';
import { userManager } from '$lib/stores/user.store.svelte';

export interface ConversationSaveData {
	id: string;
	guestId?: string;
	targetLanguageId: string;
	title?: string;
	mode?: 'traditional' | 'realtime';
	voice?: string;
	scenarioId?: string;
	isOnboarding?: string;
	startedAt?: Date;
	endedAt?: Date;
	durationSeconds?: number;
	audioSeconds?: string;
	comfortRating?: number;
	engagementLevel?: 'low' | 'medium' | 'high';
}

export class ConversationPersistenceService {
	/**
	 * Save conversation and messages to database
	 */
	async saveConversation(
		conversationData: ConversationSaveData,
		messages: Message[]
	): Promise<{ success: boolean; error?: string }> {
		try {
			console.log('💾 ConversationPersistenceService: Saving conversation...', {
				conversationId: conversationData.id,
				messagesCount: messages.length,
				isAuthenticated: userManager.isLoggedIn
			});

			const response = await fetch('/api/conversation/save', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					conversation: conversationData,
					messages: messages
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			const result = await response.json();
			console.log('✅ ConversationPersistenceService: Save successful', {
				conversationId: conversationData.id,
				savedMessages: result.messagesCount
			});

			return { success: true };
		} catch (error) {
			console.error('❌ ConversationPersistenceService: Save failed', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Create conversation data from store state
	 */
	createConversationSaveData(
		sessionId: string,
		language: Language | null,
		startTime?: Date,
		endTime?: Date,
		durationSeconds?: number
	): ConversationSaveData {
		if (!language) {
			throw new Error('Language is required for conversation save data');
		}

		return {
			id: sessionId,
			guestId: !userManager.isLoggedIn ? 'anonymous' : undefined,
			targetLanguageId: language.id,
			title: `${language.name} Conversation`,
			mode: 'realtime',
			isOnboarding: 'false', // Most conversations are not onboarding
			startedAt: startTime || new Date(),
			endedAt: endTime || new Date(),
			durationSeconds: durationSeconds || 0,
			audioSeconds: '0' // Could be calculated from actual audio data
		};
	}

	/**
	 * Prepare messages for database saving
	 */
	prepareMessagesForSave(messages: Message[]): Message[] {
		return messages
			.filter(message =>
				message.content &&
				message.content.trim().length > 0 &&
				!message.content.includes('[Speaking...]') &&
				!message.content.includes('[Transcribing...]')
			)
			.map((message, index) => ({
				...message,
				sequence: message.sequence || index + 1,
				timestamp: message.timestamp || new Date()
			}));
	}

	/**
	 * Save conversation with retry logic
	 */
	async saveConversationWithRetry(
		conversationData: ConversationSaveData,
		messages: Message[],
		maxRetries: number = 3
	): Promise<{ success: boolean; error?: string }> {
		let lastError: string | undefined;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			console.log(`💾 Attempt ${attempt}/${maxRetries} to save conversation ${conversationData.id}`);

			const result = await this.saveConversation(conversationData, messages);

			if (result.success) {
				return result;
			}

			lastError = result.error;

			if (attempt < maxRetries) {
				// Wait before retrying (exponential backoff)
				const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
				console.log(`⏱️ Retrying in ${delay}ms...`);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}

		return {
			success: false,
			error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`
		};
	}

	/**
	 * Queue conversation for background saving (for non-critical saves)
	 */
	private saveQueue: Array<{
		conversationData: ConversationSaveData;
		messages: Message[];
		timestamp: number;
	}> = [];

	private isProcessingQueue = false;

	queueSave(conversationData: ConversationSaveData, messages: Message[]): void {
		this.saveQueue.push({
			conversationData,
			messages,
			timestamp: Date.now()
		});

		// Process queue if not already processing
		if (!this.isProcessingQueue) {
			this.processQueue();
		}
	}

	private async processQueue(): Promise<void> {
		if (this.isProcessingQueue || this.saveQueue.length === 0) {
			return;
		}

		this.isProcessingQueue = true;

		while (this.saveQueue.length > 0) {
			const item = this.saveQueue.shift();
			if (!item) continue;

			// Skip items older than 5 minutes
			if (Date.now() - item.timestamp > 5 * 60 * 1000) {
				console.log('⏰ Skipping stale save request');
				continue;
			}

			await this.saveConversation(item.conversationData, item.messages);

			// Small delay between saves to avoid overwhelming the server
			await new Promise(resolve => setTimeout(resolve, 100));
		}

		this.isProcessingQueue = false;
	}
}

// Export singleton instance
export const conversationPersistenceService = new ConversationPersistenceService();