import { eq, and, desc, asc, sql, count, gte, lte, lt } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { session } from '$lib/server/db/schema';
import type { NewSession, Session } from '$lib/server/db/types';

export class SessionRepository {
	/**
	 * Create a new session
	 */
	async createSession(newSession: NewSession): Promise<Session> {
		const [created] = await db.insert(session).values(newSession).returning();
		return created;
	}

	/**
	 * Get a session by ID
	 */
	async getSessionById(id: string): Promise<Session | null> {
		const result = await db.select().from(session).where(eq(session.id, id)).limit(1);
		return result[0] || null;
	}

	/**
	 * Get all sessions for a user
	 */
	async getSessionsByUserId(userId: string): Promise<Session[]> {
		return await db
			.select()
			.from(session)
			.where(eq(session.userId, userId))
			.orderBy(desc(session.expiresAt));
	}

	/**
	 * Get active sessions for a user (not expired)
	 */
	async getActiveSessionsByUserId(userId: string): Promise<Session[]> {
		const now = new Date();
		return await db
			.select()
			.from(session)
			.where(and(eq(session.userId, userId), gte(session.expiresAt, now)))
			.orderBy(desc(session.expiresAt));
	}

	/**
	 * Get expired sessions for a user
	 */
	async getExpiredSessionsByUserId(userId: string): Promise<Session[]> {
		const now = new Date();
		return await db
			.select()
			.from(session)
			.where(and(eq(session.userId, userId), lt(session.expiresAt, now)))
			.orderBy(desc(session.expiresAt));
	}

	/**
	 * Get all active sessions (not expired)
	 */
	async getAllActiveSessions(): Promise<Session[]> {
		const now = new Date();
		return await db
			.select()
			.from(session)
			.where(gte(session.expiresAt, now))
			.orderBy(desc(session.expiresAt));
	}

	/**
	 * Get all expired sessions
	 */
	async getAllExpiredSessions(): Promise<Session[]> {
		const now = new Date();
		return await db
			.select()
			.from(session)
			.where(lt(session.expiresAt, now))
			.orderBy(desc(session.expiresAt));
	}

	/**
	 * Get sessions expiring within a certain time period
	 */
	async getSessionsExpiringWithin(hours: number = 24): Promise<Session[]> {
		const now = new Date();
		const expirationThreshold = new Date(now.getTime() + hours * 60 * 60 * 1000);

		return await db
			.select()
			.from(session)
			.where(and(gte(session.expiresAt, now), lte(session.expiresAt, expirationThreshold)))
			.orderBy(asc(session.expiresAt));
	}

	/**
	 * Get sessions created within a date range
	 */
	async getSessionsInDateRange(
		startDate: Date,
		endDate: Date,
		userId?: string
	): Promise<Session[]> {
		const conditions = [gte(session.expiresAt, startDate), lte(session.expiresAt, endDate)];

		if (userId) {
			conditions.push(eq(session.userId, userId));
		}

		return await db
			.select()
			.from(session)
			.where(and(...conditions))
			.orderBy(desc(session.expiresAt));
	}

	/**
	 * Update a session
	 */
	async updateSession(id: string, updates: Partial<NewSession>): Promise<Session | null> {
		const [updated] = await db.update(session).set(updates).where(eq(session.id, id)).returning();
		return updated || null;
	}

	/**
	 * Extend a session (update expiration time)
	 */
	async extendSession(id: string, newExpirationTime: Date): Promise<Session | null> {
		const [updated] = await db
			.update(session)
			.set({ expiresAt: newExpirationTime })
			.where(eq(session.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * Delete a session
	 */
	async deleteSession(id: string): Promise<boolean> {
		const result = await db.delete(session).where(eq(session.id, id)).returning({ id: session.id });
		return result.length > 0;
	}

	/**
	 * Delete all sessions for a user
	 */
	async deleteAllSessionsForUser(userId: string): Promise<number> {
		const result = await db
			.delete(session)
			.where(eq(session.userId, userId))
			.returning({ id: session.id });
		return result.length;
	}

	/**
	 * Delete expired sessions
	 */
	async deleteExpiredSessions(): Promise<number> {
		const now = new Date();
		const result = await db
			.delete(session)
			.where(lt(session.expiresAt, now))
			.returning({ id: session.id });
		return result.length;
	}

	/**
	 * Delete sessions expiring before a certain date
	 */
	async deleteSessionsExpiringBefore(beforeDate: Date): Promise<number> {
		const result = await db
			.delete(session)
			.where(lt(session.expiresAt, beforeDate))
			.returning({ id: session.id });
		return result.length;
	}

	/**
	 * Get session count for a user
	 */
	async getSessionCountByUserId(userId: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(session)
			.where(eq(session.userId, userId));
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get active session count for a user
	 */
	async getActiveSessionCountByUserId(userId: string): Promise<number> {
		const now = new Date();
		const result = await db
			.select({ count: count() })
			.from(session)
			.where(and(eq(session.userId, userId), gte(session.expiresAt, now)));
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get total session count
	 */
	async getTotalSessionCount(): Promise<number> {
		const result = await db.select({ count: count() }).from(session);
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get active session count
	 */
	async getActiveSessionCount(): Promise<number> {
		const now = new Date();
		const result = await db
			.select({ count: count() })
			.from(session)
			.where(gte(session.expiresAt, now));
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get session statistics
	 */
	async getSessionStatistics(): Promise<{
		totalSessions: number;
		activeSessions: number;
		expiredSessions: number;
		uniqueUsers: number;
		averageSessionDuration: number;
	}> {
		const now = new Date();
		const result = await db
			.select({
				totalSessions: count(),
				activeSessions: sql<number>`COUNT(CASE WHEN ${session.expiresAt} >= ${now} THEN 1 END)`,
				expiredSessions: sql<number>`COUNT(CASE WHEN ${session.expiresAt} < ${now} THEN 1 END)`,
				uniqueUsers: sql<number>`COUNT(DISTINCT ${session.userId})`,
				averageSessionDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (${session.expiresAt} - NOW())))`
			})
			.from(session);

		const row = result[0];
		return {
			totalSessions: Number(row?.totalSessions) || 0,
			activeSessions: Number(row?.activeSessions) || 0,
			expiredSessions: Number(row?.expiredSessions) || 0,
			uniqueUsers: Number(row?.uniqueUsers) || 0,
			averageSessionDuration: Number(row?.averageSessionDuration) || 0
		};
	}

	/**
	 * Get user session statistics
	 */
	async getUserSessionStatistics(userId: string): Promise<{
		totalSessions: number;
		activeSessions: number;
		expiredSessions: number;
		firstSession: Date | null;
		lastSession: Date | null;
		averageSessionDuration: number;
	}> {
		const now = new Date();
		const result = await db
			.select({
				totalSessions: count(),
				activeSessions: sql<number>`COUNT(CASE WHEN ${session.expiresAt} >= ${now} THEN 1 END)`,
				expiredSessions: sql<number>`COUNT(CASE WHEN ${session.expiresAt} < ${now} THEN 1 END)`,
				firstSession: sql<Date>`MIN(${session.expiresAt})`,
				lastSession: sql<Date>`MAX(${session.expiresAt})`,
				averageSessionDuration: sql<number>`AVG(EXTRACT(EPOCH FROM (${session.expiresAt} - NOW())))`
			})
			.from(session)
			.where(eq(session.userId, userId));

		const row = result[0];
		return {
			totalSessions: Number(row?.totalSessions) || 0,
			activeSessions: Number(row?.activeSessions) || 0,
			expiredSessions: Number(row?.expiredSessions) || 0,
			firstSession: row?.firstSession || null,
			lastSession: row?.lastSession || null,
			averageSessionDuration: Number(row?.averageSessionDuration) || 0
		};
	}

	/**
	 * Check if a session is valid (exists and not expired)
	 */
	async isSessionValid(id: string): Promise<boolean> {
		const now = new Date();
		const result = await db
			.select({ id: session.id })
			.from(session)
			.where(and(eq(session.id, id), gte(session.expiresAt, now)))
			.limit(1);
		return result.length > 0;
	}

	/**
	 * Get the most recent session for a user
	 */
	async getMostRecentSessionByUserId(userId: string): Promise<Session | null> {
		const result = await db
			.select()
			.from(session)
			.where(eq(session.userId, userId))
			.orderBy(desc(session.expiresAt))
			.limit(1);
		return result[0] || null;
	}
}

// Export singleton instance
export const sessionRepository = new SessionRepository();
