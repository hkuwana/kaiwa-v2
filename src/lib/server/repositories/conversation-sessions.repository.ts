import { eq, and, gte, lte, desc, sql, count, avg, sum, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { conversationSessions, messages } from '$lib/server/db/schema';
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
	 * Create or update a conversation session
	 */
	async upsertSession(session: NewConversationSession): Promise<ConversationSession> {
		const [record] = await db
			.insert(conversationSessions)
			.values(session)
			.onConflictDoUpdate({
				target: conversationSessions.id,
				set: {
					userId: session.userId,
					language: session.language,
					startTime: session.startTime,
					endTime: session.endTime,
					durationSeconds: session.durationSeconds,
					secondsConsumed: session.secondsConsumed,
					inputTokens: session.inputTokens ?? 0,
					wasExtended: session.wasExtended ?? false,
					extensionsUsed: session.extensionsUsed ?? 0,
					transcriptionMode: session.transcriptionMode ?? false,
					deviceType: session.deviceType ?? null
				}
			})
			.returning();

		return record;
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
		durationSeconds: number,
		secondsConsumed?: number
	): Promise<ConversationSession | null> {
		const updateData: Partial<NewConversationSession> = {
			endTime,
			durationSeconds
		};

		if (secondsConsumed !== undefined) {
			updateData.secondsConsumed = secondsConsumed;
		}

		const [updated] = await db
			.update(conversationSessions)
			.set(updateData)
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
		totalSeconds: number;
		averageSessionLengthSeconds: number;
		totalExtensions: number;
		mostUsedLanguage: string | null;
		deviceTypeBreakdown: Record<string, number>;
	}> {
		// Get basic stats
		const basicStats = await db
			.select({
				totalSessions: count(),
				totalSeconds: sum(conversationSessions.secondsConsumed),
				averageSessionLengthSeconds: avg(conversationSessions.durationSeconds),
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
			totalSeconds: Number(stats.totalSeconds) || 0,
			averageSessionLengthSeconds: Number(stats.averageSessionLengthSeconds) || 0,
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
			totalSeconds: number;
			averageSessionLengthSeconds: number;
			lastPracticeDate: Date | null;
		}[]
	> {
		const result = await db
			.select({
				language: conversationSessions.language,
				sessions: count(),
				totalSeconds: sum(conversationSessions.secondsConsumed),
				averageSessionLengthSeconds: avg(conversationSessions.durationSeconds),
				lastPracticeDate: sql<Date>`max(${conversationSessions.startTime})`
			})
			.from(conversationSessions)
			.where(eq(conversationSessions.userId, userId))
			.groupBy(conversationSessions.language)
			.orderBy(desc(sum(conversationSessions.secondsConsumed)));

		return result.map((row) => ({
			language: row.language,
			sessions: Number(row.sessions),
			totalSeconds: Number(row.totalSeconds || 0),
			averageSessionLengthSeconds: Number(row.averageSessionLengthSeconds || 0),
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
			seconds: number;
		}[]
	> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const result = await db
			.select({
				date: sql<string>`date(${conversationSessions.startTime})`,
				sessions: count(),
				seconds: sum(conversationSessions.secondsConsumed)
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
			seconds: Number(row.seconds || 0)
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

	/**
	 * Delete all sessions for a user
	 */
	async deleteUserSessions(userId: string): Promise<number> {
		const result = await db
			.delete(conversationSessions)
			.where(eq(conversationSessions.userId, userId))
			.returning({ id: conversationSessions.id });

		return result.length;
	}

	/**
	 * Get all sessions within a date range (for admin/analytics)
	 */
	async getAllSessionsInRange(startDate: Date, endDate: Date): Promise<ConversationSession[]> {
		return await db
			.select()
			.from(conversationSessions)
			.where(
				and(
					gte(conversationSessions.startTime, startDate),
					lte(conversationSessions.startTime, endDate)
				)
			)
			.orderBy(desc(conversationSessions.startTime));
	}

	/**
	 * Get user message stats for conversation sessions
	 */
	async getUserMessageStats(sessionIds: string[]): Promise<
		Map<
			string,
			{
				totalWords: number;
				totalCharacters: number;
				messageCount: number;
			}
		>
	> {
		if (sessionIds.length === 0) {
			return new Map();
		}

		// Get all user messages for these sessions
		const userMessages = await db
			.select({
				conversationId: messages.conversationId,
				content: messages.content
			})
			.from(messages)
			.where(and(inArray(messages.conversationId, sessionIds), eq(messages.role, 'user')));

		// Calculate stats per session
		const statsMap = new Map<
			string,
			{
				totalWords: number;
				totalCharacters: number;
				messageCount: number;
			}
		>();

		userMessages.forEach((msg) => {
			const stats = statsMap.get(msg.conversationId) || {
				totalWords: 0,
				totalCharacters: 0,
				messageCount: 0
			};

			const content = msg.content || '';
			const words = content.trim().split(/\s+/).filter((w) => w.length > 0).length;
			const characters = content.length;

			stats.totalWords += words;
			stats.totalCharacters += characters;
			stats.messageCount += 1;

			statsMap.set(msg.conversationId, stats);
		});

		return statsMap;
	}

	/**
	 * Get user rankings by activity for a given time period
	 */
	async getUserRankings(
		startDate: Date,
		endDate: Date,
		limit: number = 50
	): Promise<
		{
			userId: string;
			totalSessions: number;
			totalMinutes: number;
			totalSeconds: number;
			activeDays: number;
			mostUsedLanguage: string | null;
			totalWordsSpoken: number;
			totalCharactersSpoken: number;
			averageSessionMinutes: number;
		}[]
	> {
		// Get all sessions in the range
		const sessions = await this.getAllSessionsInRange(startDate, endDate);

		// Get message stats for all sessions
		const sessionIds = sessions.map((s) => s.id);
		const messageStatsMap = await this.getUserMessageStats(sessionIds);

		// Group by user and calculate stats
		const userStatsMap = new Map<
			string,
			{
				sessions: number;
				totalSeconds: number;
				languages: Map<string, number>;
				dates: Set<string>;
				totalWords: number;
				totalCharacters: number;
			}
		>();

		sessions.forEach((session) => {
			const stats = userStatsMap.get(session.userId) || {
				sessions: 0,
				totalSeconds: 0,
				languages: new Map(),
				dates: new Set(),
				totalWords: 0,
				totalCharacters: 0
			};

			stats.sessions++;
			stats.totalSeconds += session.secondsConsumed || 0;

			// Track language usage
			const langCount = stats.languages.get(session.language) || 0;
			stats.languages.set(session.language, langCount + 1);

			// Track unique active days
			const dateStr = session.startTime.toISOString().split('T')[0];
			stats.dates.add(dateStr);

			// Add message stats
			const messageStats = messageStatsMap.get(session.id);
			if (messageStats) {
				stats.totalWords += messageStats.totalWords;
				stats.totalCharacters += messageStats.totalCharacters;
			}

			userStatsMap.set(session.userId, stats);
		});

		// Convert to array and calculate derived stats
		const rankings = Array.from(userStatsMap.entries())
			.map(([userId, stats]) => {
				// Find most used language
				let mostUsedLanguage: string | null = null;
				let maxCount = 0;
				stats.languages.forEach((count, language) => {
					if (count > maxCount) {
						maxCount = count;
						mostUsedLanguage = language;
					}
				});

				const totalMinutes = Math.round(stats.totalSeconds / 60);
				const averageSessionMinutes =
					stats.sessions > 0 ? Math.round(totalMinutes / stats.sessions) : 0;

				return {
					userId,
					totalSessions: stats.sessions,
					totalMinutes,
					totalSeconds: stats.totalSeconds,
					activeDays: stats.dates.size,
					mostUsedLanguage,
					totalWordsSpoken: stats.totalWords,
					totalCharactersSpoken: stats.totalCharacters,
					averageSessionMinutes
				};
			})
			// Sort by total minutes (primary) and sessions (secondary)
			.sort((a, b) => {
				if (b.totalMinutes !== a.totalMinutes) {
					return b.totalMinutes - a.totalMinutes;
				}
				return b.totalSessions - a.totalSessions;
			})
			.slice(0, limit);

		return rankings;
	}

	/**
	 * Get weekly rankings (past 7 days)
	 */
	async getWeeklyUserRankings(limit: number = 50): Promise<
		{
			userId: string;
			totalSessions: number;
			totalMinutes: number;
			totalSeconds: number;
			activeDays: number;
			mostUsedLanguage: string | null;
			totalWordsSpoken: number;
			totalCharactersSpoken: number;
			averageSessionMinutes: number;
		}[]
	> {
		const now = new Date();
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		return this.getUserRankings(oneWeekAgo, now, limit);
	}

	/**
	 * Get global platform statistics for a time range
	 */
	async getPlatformStats(startDate: Date, endDate: Date): Promise<{
		totalSessions: number;
		totalUsers: number;
		totalMinutes: number;
		totalSeconds: number;
		averageSessionMinutes: number;
		languageBreakdown: { language: string; sessions: number; percentage: number }[];
		deviceBreakdown: { deviceType: string; sessions: number; percentage: number }[];
	}> {
		const sessions = await this.getAllSessionsInRange(startDate, endDate);

		const uniqueUsers = new Set(sessions.map((s) => s.userId));
		const totalSeconds = sessions.reduce((sum, s) => sum + (s.secondsConsumed || 0), 0);
		const totalMinutes = Math.round(totalSeconds / 60);
		const averageSessionMinutes = sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0;

		// Language breakdown
		const languageMap = new Map<string, number>();
		sessions.forEach((s) => {
			languageMap.set(s.language, (languageMap.get(s.language) || 0) + 1);
		});

		const languageBreakdown = Array.from(languageMap.entries())
			.map(([language, count]) => ({
				language,
				sessions: count,
				percentage: Math.round((count / sessions.length) * 100)
			}))
			.sort((a, b) => b.sessions - a.sessions);

		// Device breakdown
		const deviceMap = new Map<string, number>();
		sessions.forEach((s) => {
			if (s.deviceType) {
				deviceMap.set(s.deviceType, (deviceMap.get(s.deviceType) || 0) + 1);
			}
		});

		const deviceBreakdown = Array.from(deviceMap.entries())
			.map(([deviceType, count]) => ({
				deviceType,
				sessions: count,
				percentage: Math.round((count / sessions.length) * 100)
			}))
			.sort((a, b) => b.sessions - a.sessions);

		return {
			totalSessions: sessions.length,
			totalUsers: uniqueUsers.size,
			totalMinutes,
			totalSeconds,
			averageSessionMinutes,
			languageBreakdown,
			deviceBreakdown
		};
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
