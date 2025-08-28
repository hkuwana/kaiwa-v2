import { eq, and, gte, lte, desc, sql, count, avg, sum } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { conversationSessions } from '$lib/server/db/schema';
import type { NewConversationSession, ConversationSession } from '$lib/server/db/types';

export class ConversationSessionsRepository {
	/**
	 * Create a new conversation session
	 */
	async createSession(session: NewConversationSession): Promise<ConversationSession> {
		const [created] = await db.insert(conversationSessions).values(session).returning();

		return created;
	}

	/**
	 * Get a session by ID
	 */
	async getSessionById(id: string): Promise<ConversationSession | null> {
		const result = await db
			.select()
			.from(conversationSessions)
			.where(eq(conversationSessions.id, id))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Get all sessions for a user
	 */
	async getUserSessions(
		userId: string,
		limit: number = 50,
		offset: number = 0
	): Promise<ConversationSession[]> {
		return await db
			.select()
			.from(conversationSessions)
			.where(eq(conversationSessions.userId, userId))
			.orderBy(desc(conversationSessions.startTime))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * Get sessions for a user within a date range
	 */
	async getUserSessionsInRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<ConversationSession[]> {
		return await db
			.select()
			.from(conversationSessions)
			.where(
				and(
					eq(conversationSessions.userId, userId),
					gte(conversationSessions.startTime, startDate),
					lte(conversationSessions.startTime, endDate)
				)
			)
			.orderBy(desc(conversationSessions.startTime));
	}

	/**
	 * Update session end time and duration
	 */
	async endSession(
		id: string,
		endTime: Date,
		durationMinutes: number
	): Promise<ConversationSession | null> {
		const [updated] = await db
			.update(conversationSessions)
			.set({
				endTime,
				durationMinutes
			})
			.where(eq(conversationSessions.id, id))
			.returning();

		return updated || null;
	}

	/**
	 * Update session with extension information
	 */
	async updateSessionExtensions(
		id: string,
		extensionsUsed: number,
		wasExtended: boolean = true
	): Promise<ConversationSession | null> {
		const [updated] = await db
			.update(conversationSessions)
			.set({
				extensionsUsed,
				wasExtended
			})
			.where(eq(conversationSessions.id, id))
			.returning();

		return updated || null;
	}

	/**
	 * Get user's session statistics
	 */
	async getUserSessionStats(userId: string): Promise<{
		totalSessions: number;
		totalMinutes: number;
		averageSessionLength: number;
		totalExtensions: number;
		mostUsedLanguage: string | null;
		deviceTypeBreakdown: Record<string, number>;
	}> {
		// Get basic stats
		const basicStats = await db
			.select({
				totalSessions: count(),
				totalMinutes: sum(conversationSessions.minutesConsumed),
				averageSessionLength: avg(conversationSessions.durationMinutes),
				totalExtensions: sum(conversationSessions.extensionsUsed)
			})
			.from(conversationSessions)
			.where(eq(conversationSessions.userId, userId));

		// Get most used language
		const languageStats = await db
			.select({
				language: conversationSessions.language,
				count: count()
			})
			.from(conversationSessions)
			.where(eq(conversationSessions.userId, userId))
			.groupBy(conversationSessions.language)
			.orderBy(desc(count()))
			.limit(1);

		// Get device type breakdown
		const deviceStats = await db
			.select({
				deviceType: conversationSessions.deviceType,
				count: count()
			})
			.from(conversationSessions)
			.where(eq(conversationSessions.userId, userId))
			.groupBy(conversationSessions.deviceType);

		const deviceTypeBreakdown: Record<string, number> = {};
		deviceStats.forEach((stat) => {
			if (stat.deviceType) {
				deviceTypeBreakdown[stat.deviceType] = Number(stat.count);
			}
		});

		const stats = basicStats[0];
		return {
			totalSessions: Number(stats.totalSessions) || 0,
			totalMinutes: Number(stats.totalMinutes) || 0,
			averageSessionLength: Number(stats.averageSessionLength) || 0,
			totalExtensions: Number(stats.totalExtensions) || 0,
			mostUsedLanguage: languageStats[0]?.language || null,
			deviceTypeBreakdown
		};
	}

	/**
	 * Get language learning progress for a user
	 */
	async getUserLanguageProgress(userId: string): Promise<
		{
			language: string;
			sessions: number;
			totalMinutes: number;
			averageSessionLength: number;
			lastPracticeDate: Date | null;
		}[]
	> {
		const result = await db
			.select({
				language: conversationSessions.language,
				sessions: count(),
				totalMinutes: sum(conversationSessions.minutesConsumed),
				averageSessionLength: avg(conversationSessions.durationMinutes),
				lastPracticeDate: sql<Date>`max(${conversationSessions.startTime})`
			})
			.from(conversationSessions)
			.where(eq(conversationSessions.userId, userId))
			.groupBy(conversationSessions.language)
			.orderBy(desc(sum(conversationSessions.minutesConsumed)));

		return result.map((row) => ({
			language: row.language,
			sessions: Number(row.sessions),
			totalMinutes: Number(row.totalMinutes || 0),
			averageSessionLength: Number(row.averageSessionLength || 0),
			lastPracticeDate: row.lastPracticeDate
		}));
	}

	/**
	 * Get daily usage trends for a user
	 */
	async getUserDailyUsageTrends(
		userId: string,
		days: number = 30
	): Promise<
		{
			date: string;
			sessions: number;
			minutes: number;
		}[]
	> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const result = await db
			.select({
				date: sql<string>`date(${conversationSessions.startTime})`,
				sessions: count(),
				minutes: sum(conversationSessions.minutesConsumed)
			})
			.from(conversationSessions)
			.where(
				and(eq(conversationSessions.userId, userId), gte(conversationSessions.startTime, startDate))
			)
			.groupBy(sql<string>`date(${conversationSessions.startTime})`)
			.orderBy(sql<string>`date(${conversationSessions.startTime})`);

		return result.map((row) => ({
			date: row.date,
			sessions: Number(row.sessions),
			minutes: Number(row.minutes || 0)
		}));
	}

	/**
	 * Delete old sessions (cleanup for privacy)
	 */
	async deleteOldSessions(olderThanDays: number): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		const result = await db
			.delete(conversationSessions)
			.where(lte(conversationSessions.startTime, cutoffDate))
			.returning({ id: conversationSessions.id });

		return result.length;
	}

	// Helper methods for period management
	private getCurrentPeriod(): string {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	}

	private getPeriodStartDate(period: string): Date {
		const [year, month] = period.split('-').map(Number);
		return new Date(year, month - 1, 1);
	}

	private getPeriodEndDate(period: string): Date {
		const [year, month] = period.split('-').map(Number);
		return new Date(year, month, 0, 23, 59, 59, 999);
	}
}

// Export singleton instance
export const conversationSessionsRepository = new ConversationSessionsRepository();
