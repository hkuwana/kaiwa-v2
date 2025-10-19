// src/lib/server/repositories/conversation.repository.ts

import { db } from '$lib/server/db/index';
import { conversations, messages } from '$lib/server/db/schema';
import type { NewConversation, NewMessage, Conversation, Message } from '$lib/server/db/types';
import { eq, desc, asc, count, inArray, and } from 'drizzle-orm';

export const conversationRepository = {
	// CREATE
	async createConversation(newConversation: NewConversation): Promise<Conversation> {
		const [createdConversation] = await db
			.insert(conversations)
			.values(newConversation)
			.returning();
		return createdConversation;
	},

	async createMessage(newMessage: NewMessage): Promise<Message> {
		const [createdMessage] = await db.insert(messages).values(newMessage).returning();
		return createdMessage;
	},

	// UPSERT
	async upsertConversation(conversationData: NewConversation): Promise<Conversation> {
		const [upserted] = await db
			.insert(conversations)
			.values(conversationData)
			.onConflictDoUpdate({
				target: conversations.id,
				set: {
					userId: conversationData.userId,
					guestId: conversationData.guestId,
					targetLanguageId: conversationData.targetLanguageId,
					title: conversationData.title,
					mode: conversationData.mode,
					voice: conversationData.voice,
					scenarioId: conversationData.scenarioId,
					isOnboarding: conversationData.isOnboarding,
					startedAt: conversationData.startedAt,
					endedAt: conversationData.endedAt,
					durationSeconds: conversationData.durationSeconds,
					messageCount: conversationData.messageCount,
					audioSeconds: conversationData.audioSeconds,
					comfortRating: conversationData.comfortRating,
					engagementLevel: conversationData.engagementLevel
				}
			})
			.returning();
		return upserted;
	},

	async upsertMessage(messageData: NewMessage): Promise<Message> {
		const [upserted] = await db
			.insert(messages)
			.values(messageData)
			.onConflictDoUpdate({
				target: messages.id,
				set: {
					conversationId: messageData.conversationId,
					role: messageData.role,
					content: messageData.content,
					timestamp: messageData.timestamp,
					sequenceId: messageData.sequenceId,
					translatedContent: messageData.translatedContent,
					sourceLanguage: messageData.sourceLanguage,
					targetLanguage: messageData.targetLanguage,
					userNativeLanguage: messageData.userNativeLanguage,
					romanization: messageData.romanization,
					hiragana: messageData.hiragana,
					otherScripts: messageData.otherScripts,
					translationConfidence: messageData.translationConfidence,
					translationProvider: messageData.translationProvider,
					translationNotes: messageData.translationNotes,
					isTranslated: messageData.isTranslated,
					grammarAnalysis: messageData.grammarAnalysis,
					vocabularyAnalysis: messageData.vocabularyAnalysis,
					pronunciationScore: messageData.pronunciationScore,
					audioUrl: messageData.audioUrl,
					audioDurationMs: messageData.audioDuration,
					difficultyLevel: messageData.difficultyLevel,
					learningTags: messageData.learningTags,
					conversationContext: messageData.conversationContext,
					messageIntent: messageData.messageIntent
				}
			})
			.returning();
		return upserted;
	},

	// READ
	async findConversationById(id: string): Promise<Conversation | undefined> {
		return db.query.conversations.findFirst({ where: eq(conversations.id, id) });
	},

	async findConversationsByUserId(
		userId: string,
		limit: number = 50,
		offset: number = 0
	): Promise<Conversation[]> {
		return db.query.conversations.findMany({
			where: eq(conversations.userId, userId),
			orderBy: [desc(conversations.startedAt)],
			limit,
			offset
		});
	},

	async findConversationsByLanguage(
		languageId: string,
		limit: number = 50,
		offset: number = 0
	): Promise<Conversation[]> {
		return db.query.conversations.findMany({
			where: eq(conversations.targetLanguageId, languageId),
			orderBy: [desc(conversations.startedAt)],
			limit,
			offset
		});
	},

	async findMessagesByConversationId(
		conversationId: string,
		limit: number = 100,
		offset: number = 0
	): Promise<Message[]> {
		return db.query.messages.findMany({
			where: eq(messages.conversationId, conversationId),
			orderBy: [asc(messages.timestamp)],
			limit,
			offset
		});
	},

	async findMessageById(id: string): Promise<Message | undefined> {
		return db.query.messages.findFirst({ where: eq(messages.id, id) });
	},

	async countConversationsByUserId(userId: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(conversations)
			.where(eq(conversations.userId, userId));
		return result[0]?.count ?? 0;
	},

	async findConversationsByIdsForUser(
		conversationIds: string[],
		userId: string
	): Promise<Conversation[]> {
		if (conversationIds.length === 0) {
			return [];
		}

		return db
			.select()
			.from(conversations)
			.where(and(eq(conversations.userId, userId), inArray(conversations.id, conversationIds)));
	},

	// UPDATE
	async updateConversation(
		id: string,
		data: Partial<NewConversation>
	): Promise<Conversation | undefined> {
		const [updatedConversation] = await db
			.update(conversations)
			.set(data)
			.where(eq(conversations.id, id))
			.returning();
		return updatedConversation;
	},

	async updateMessage(id: string, data: Partial<NewMessage>): Promise<Message | undefined> {
		const [updatedMessage] = await db
			.update(messages)
			.set(data)
			.where(eq(messages.id, id))
			.returning();
		return updatedMessage;
	},

	async endConversation(id: string, durationSeconds: number): Promise<Conversation | undefined> {
		const [updatedConversation] = await db
			.update(conversations)
			.set({
				endedAt: new Date(),
				durationSeconds
			})
			.where(eq(conversations.id, id))
			.returning();
		return updatedConversation;
	},

	async incrementMessageCount(id: string): Promise<Conversation | undefined> {
		const conversation = await this.findConversationById(id);
		if (!conversation) return undefined;

		const [updatedConversation] = await db
			.update(conversations)
			.set({ messageCount: (conversation.messageCount || 0) + 1 })
			.where(eq(conversations.id, id))
			.returning();
		return updatedConversation;
	},

	/**
	 * Transfer guest conversations to a user account
	 * Sets userId and nullifies guestId for all conversations with the given guestId
	 */
	async transferGuestConversations(guestId: string, userId: string): Promise<number> {
		const result = await db
			.update(conversations)
			.set({
				userId: userId,
				guestId: null
			})
			.where(eq(conversations.guestId, guestId))
			.returning({ id: conversations.id });

		return result.length;
	},

	// DELETE
	async deleteConversation(id: string): Promise<{ success: boolean }> {
		// First delete all messages for this conversation
		await db.delete(messages).where(eq(messages.conversationId, id));

		// Then delete the conversation
		const result = await db
			.delete(conversations)
			.where(eq(conversations.id, id))
			.returning({ id: conversations.id });
		return { success: result.length > 0 };
	},

	async deleteConversations(conversationIds: string[]): Promise<string[]> {
		if (conversationIds.length === 0) {
			return [];
		}

		await db.delete(messages).where(inArray(messages.conversationId, conversationIds));

		const deleted = await db
			.delete(conversations)
			.where(inArray(conversations.id, conversationIds))
			.returning({ id: conversations.id });

		return deleted.map((record) => record.id);
	},

	async deleteMessage(id: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(messages)
			.where(eq(messages.id, id))
			.returning({ id: messages.id });
		return { success: result.length > 0 };
	},

	async deleteUserConversations(userId: string): Promise<number> {
		// First get all conversation IDs for this user
		const userConversations = await db
			.select({ id: conversations.id })
			.from(conversations)
			.where(eq(conversations.userId, userId));

		const conversationIds = userConversations.map((c) => c.id);

		if (conversationIds.length === 0) {
			return 0;
		}

		// Delete all messages for these conversations
		await db.delete(messages).where(inArray(messages.conversationId, conversationIds));

		// Delete all conversations for this user
		const result = await db
			.delete(conversations)
			.where(eq(conversations.userId, userId))
			.returning({ id: conversations.id });

		return result.length;
	}
};
