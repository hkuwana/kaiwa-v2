// src/lib/server/repositories/conversation.repository.ts

import { db } from '$lib/server/db/index';
import { conversations, messages } from '$lib/server/db/schema';
import type { NewConversation, NewMessage, Conversation, Message } from '$lib/server/db/types';
import { eq, desc, asc, count } from 'drizzle-orm';

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

	async deleteMessage(id: string): Promise<{ success: boolean }> {
		const result = await db
			.delete(messages)
			.where(eq(messages.id, id))
			.returning({ id: messages.id });
		return { success: result.length > 0 };
	}
};
