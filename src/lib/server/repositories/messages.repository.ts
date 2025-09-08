import { eq, and, desc, asc, sql, count } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { messages } from '$lib/server/db/schema';
import type { NewMessage, Message } from '$lib/server/db/types';

export class MessagesRepository {
	/**
	 * Create a new message
	 */
	async createMessage(message: NewMessage): Promise<Message> {
		const [created] = await db.insert(messages).values(message).returning();
		return created;
	}

	/**
	 * Get a message by ID
	 */
	async getMessageById(id: string): Promise<Message | null> {
		const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);

		return result[0] || null;
	}

	/**
	 * Get all messages for a conversation
	 */
	async getConversationMessages(
		conversationId: string,
		limit: number = 100,
		offset: number = 0
	): Promise<Message[]> {
		return await db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, conversationId))
			.orderBy(asc(messages.timestamp))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * Get messages by role for a conversation
	 */
	async getConversationMessagesByRole(
		conversationId: string,
		role: 'assistant' | 'user' | 'system',
		limit: number = 50
	): Promise<Message[]> {
		return await db
			.select()
			.from(messages)
			.where(and(eq(messages.conversationId, conversationId), eq(messages.role, role)))
			.orderBy(desc(messages.timestamp))
			.limit(limit);
	}

	/**
	 * Get recent messages for a conversation
	 */
	async getRecentMessages(conversationId: string, count: number = 10): Promise<Message[]> {
		return await db
			.select()
			.from(messages)
			.where(eq(messages.conversationId, conversationId))
			.orderBy(desc(messages.timestamp))
			.limit(count);
	}

	/**
	 * Update a message
	 */
	async updateMessage(id: string, updates: Partial<NewMessage>): Promise<Message | null> {
		const [updated] = await db.update(messages).set(updates).where(eq(messages.id, id)).returning();

		return updated || null;
	}

	/**
	 * Delete a message
	 */
	async deleteMessage(id: string): Promise<boolean> {
		const result = await db
			.delete(messages)
			.where(eq(messages.id, id))
			.returning({ id: messages.id });

		return result.length > 0;
	}

	/**
	 * Delete all messages for a conversation
	 */
	async deleteConversationMessages(conversationId: string): Promise<number> {
		const result = await db
			.delete(messages)
			.where(eq(messages.conversationId, conversationId))
			.returning({ id: messages.id });

		return result.length;
	}

	/**
	 * Get message count for a conversation
	 */
	async getConversationMessageCount(conversationId: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(messages)
			.where(eq(messages.conversationId, conversationId));

		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get messages within a time range for a conversation
	 */
	async getMessagesInTimeRange(
		conversationId: string,
		startTime: Date,
		endTime: Date
	): Promise<Message[]> {
		return await db
			.select()
			.from(messages)
			.where(
				and(
					eq(messages.conversationId, conversationId),
					sql`${messages.timestamp} >= ${startTime}`,
					sql`${messages.timestamp} <= ${endTime}`
				)
			)
			.orderBy(asc(messages.timestamp));
	}

	/**
	 * Search messages by content
	 */
	async searchMessages(
		conversationId: string,
		searchTerm: string,
		limit: number = 20
	): Promise<Message[]> {
		return await db
			.select()
			.from(messages)
			.where(
				and(
					eq(messages.conversationId, conversationId),
					sql`${messages.content} ILIKE ${`%${searchTerm}%`}`
				)
			)
			.orderBy(desc(messages.timestamp))
			.limit(limit);
	}
}

// Export singleton instance
export const messagesRepository = new MessagesRepository();
