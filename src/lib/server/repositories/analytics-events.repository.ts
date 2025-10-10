import { eq, and, desc, asc, sql, count, gte, lte, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { analyticsEvents } from '$lib/server/db/schema';
import type { NewAnalyticsEvent, AnalyticsEvent } from '$lib/server/db/types';

export class AnalyticsEventsRepository {
	/**
	 * Create a new analytics event
	 */
	async createAnalyticsEvent(event: NewAnalyticsEvent): Promise<AnalyticsEvent> {
		const [created] = await db.insert(analyticsEvents).values(event).returning();
		return created;
	}

	/**
	 * Get an analytics event by ID
	 */
	async getAnalyticsEventById(id: string): Promise<AnalyticsEvent | null> {
		const result = await db
			.select()
			.from(analyticsEvents)
			.where(eq(analyticsEvents.id, id))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * Get all analytics events for a user
	 */
	async getAnalyticsEventsByUserId(userId: string): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.where(eq(analyticsEvents.userId, userId))
			.orderBy(desc(analyticsEvents.createdAt));
	}

	/**
	 * Get analytics events by event name
	 */
	async getAnalyticsEventsByEventName(eventName: string): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.where(eq(analyticsEvents.eventName, eventName))
			.orderBy(desc(analyticsEvents.createdAt));
	}

	/**
	 * Get analytics events for a user by event name
	 */
	async getAnalyticsEventsByUserAndEventName(
		userId: string,
		eventName: string
	): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.where(and(eq(analyticsEvents.userId, userId), eq(analyticsEvents.eventName, eventName)))
			.orderBy(desc(analyticsEvents.createdAt));
	}

	/**
	 * Get analytics events by session ID
	 */
	async getAnalyticsEventsBySessionId(sessionId: string): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.where(eq(analyticsEvents.sessionId, sessionId))
			.orderBy(asc(analyticsEvents.createdAt));
	}

	/**
	 * Get anonymous analytics events (no user ID)
	 */
	async getAnonymousAnalyticsEvents(): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.where(isNull(analyticsEvents.userId))
			.orderBy(desc(analyticsEvents.createdAt));
	}

	/**
	 * Get analytics events within a date range
	 */
	async getAnalyticsEventsInDateRange(
		startDate: Date,
		endDate: Date,
		userId?: string
	): Promise<AnalyticsEvent[]> {
		const conditions = [
			gte(analyticsEvents.createdAt, startDate),
			lte(analyticsEvents.createdAt, endDate)
		];

		if (userId) {
			conditions.push(eq(analyticsEvents.userId, userId));
		}

		return await db
			.select()
			.from(analyticsEvents)
			.where(and(...conditions))
			.orderBy(desc(analyticsEvents.createdAt));
	}

	/**
	 * Get analytics events by user agent
	 */
	async getAnalyticsEventsByUserAgent(userAgent: string): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.where(sql`${analyticsEvents.userAgent} ILIKE ${`%${userAgent}%`}`)
			.orderBy(desc(analyticsEvents.createdAt));
	}

	/**
	 * Get analytics events by referrer
	 */
	async getAnalyticsEventsByReferrer(referrer: string): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.where(sql`${analyticsEvents.referrer} ILIKE ${`%${referrer}%`}`)
			.orderBy(desc(analyticsEvents.createdAt));
	}

	/**
	 * Get analytics events by IP address
	 */
	async getAnalyticsEventsByIpAddress(ipAddress: string): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.where(eq(analyticsEvents.ipAddress, ipAddress))
			.orderBy(desc(analyticsEvents.createdAt));
	}

	/**
	 * Search analytics events by properties
	 */
	async searchAnalyticsEventsByProperties(
		searchTerm: string,
		limit: number = 100
	): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.where(sql`${analyticsEvents.properties}::text ILIKE ${`%${searchTerm}%`}`)
			.orderBy(desc(analyticsEvents.createdAt))
			.limit(limit);
	}

	/**
	 * Get recent analytics events
	 */
	async getRecentAnalyticsEvents(limit: number = 100): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.orderBy(desc(analyticsEvents.createdAt))
			.limit(limit);
	}

	/**
	 * Get recent analytics events for a user
	 */
	async getRecentAnalyticsEventsByUserId(
		userId: string,
		limit: number = 100
	): Promise<AnalyticsEvent[]> {
		return await db
			.select()
			.from(analyticsEvents)
			.where(eq(analyticsEvents.userId, userId))
			.orderBy(desc(analyticsEvents.createdAt))
			.limit(limit);
	}

	/**
	 * Update an analytics event
	 */
	async updateAnalyticsEvent(
		id: string,
		updates: Partial<NewAnalyticsEvent>
	): Promise<AnalyticsEvent | null> {
		const [updated] = await db
			.update(analyticsEvents)
			.set(updates)
			.where(eq(analyticsEvents.id, id))
			.returning();
		return updated || null;
	}

	/**
	 * Delete an analytics event
	 */
	async deleteAnalyticsEvent(id: string): Promise<boolean> {
		const result = await db
			.delete(analyticsEvents)
			.where(eq(analyticsEvents.id, id))
			.returning({ id: analyticsEvents.id });
		return result.length > 0;
	}

	/**
	 * Delete analytics events older than a certain date
	 */
	async deleteOldAnalyticsEvents(beforeDate: Date): Promise<number> {
		const result = await db
			.delete(analyticsEvents)
			.where(lte(analyticsEvents.createdAt, beforeDate))
			.returning({ id: analyticsEvents.id });
		return result.length;
	}

	/**
	 * Delete all analytics events for a user
	 */
	async deleteUserAnalyticsEvents(userId: string): Promise<number> {
		const result = await db
			.delete(analyticsEvents)
			.where(eq(analyticsEvents.userId, userId))
			.returning({ id: analyticsEvents.id });
		return result.length;
	}

	/**
	 * Get analytics event count for a user
	 */
	async getAnalyticsEventCountByUserId(userId: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(analyticsEvents)
			.where(eq(analyticsEvents.userId, userId));
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get analytics event count by event name
	 */
	async getAnalyticsEventCountByEventName(eventName: string): Promise<number> {
		const result = await db
			.select({ count: count() })
			.from(analyticsEvents)
			.where(eq(analyticsEvents.eventName, eventName));
		return Number(result[0]?.count) || 0;
	}

	/**
	 * Get unique event names
	 */
	async getUniqueEventNames(): Promise<string[]> {
		const result = await db
			.selectDistinct({ eventName: analyticsEvents.eventName })
			.from(analyticsEvents)
			.orderBy(asc(analyticsEvents.eventName));
		return result.map((row) => row.eventName);
	}

	/**
	 * Get analytics event statistics
	 */
	async getAnalyticsEventStatistics(): Promise<{
		totalEvents: number;
		uniqueUsers: number;
		uniqueSessions: number;
		anonymousEvents: number;
		mostCommonEvent: string;
	}> {
		const result = await db
			.select({
				totalEvents: count(),
				uniqueUsers: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})`,
				uniqueSessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
				anonymousEvents: sql<number>`COUNT(CASE WHEN ${analyticsEvents.userId} IS NULL THEN 1 END)`,
				mostCommonEvent: sql<string>`MODE() WITHIN GROUP (ORDER BY ${analyticsEvents.eventName})`
			})
			.from(analyticsEvents);

		const row = result[0];
		return {
			totalEvents: Number(row?.totalEvents) || 0,
			uniqueUsers: Number(row?.uniqueUsers) || 0,
			uniqueSessions: Number(row?.uniqueSessions) || 0,
			anonymousEvents: Number(row?.anonymousEvents) || 0,
			mostCommonEvent: row?.mostCommonEvent || ''
		};
	}

	/**
	 * Get analytics event statistics for a user
	 */
	async getUserAnalyticsEventStatistics(userId: string): Promise<{
		totalEvents: number;
		uniqueSessions: number;
		mostCommonEvent: string;
		firstEvent: Date | null;
		lastEvent: Date | null;
	}> {
		const result = await db
			.select({
				totalEvents: count(),
				uniqueSessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
				mostCommonEvent: sql<string>`MODE() WITHIN GROUP (ORDER BY ${analyticsEvents.eventName})`,
				firstEvent: sql<Date>`MIN(${analyticsEvents.createdAt})`,
				lastEvent: sql<Date>`MAX(${analyticsEvents.createdAt})`
			})
			.from(analyticsEvents)
			.where(eq(analyticsEvents.userId, userId));

		const row = result[0];
		return {
			totalEvents: Number(row?.totalEvents) || 0,
			uniqueSessions: Number(row?.uniqueSessions) || 0,
			mostCommonEvent: row?.mostCommonEvent || '',
			firstEvent: row?.firstEvent || null,
			lastEvent: row?.lastEvent || null
		};
	}

	/**
	 * Get event frequency by date range
	 */
	async getEventFrequencyByDateRange(
		startDate: Date,
		endDate: Date,
		eventName?: string
	): Promise<Array<{ date: string; count: number }>> {
		const conditions = [
			gte(analyticsEvents.createdAt, startDate),
			lte(analyticsEvents.createdAt, endDate)
		];

		if (eventName) {
			conditions.push(eq(analyticsEvents.eventName, eventName));
		}

		const result = await db
			.select({
				date: sql<string>`DATE(${analyticsEvents.createdAt})`,
				count: count()
			})
			.from(analyticsEvents)
			.where(and(...conditions))
			.groupBy(sql`DATE(${analyticsEvents.createdAt})`)
			.orderBy(sql`DATE(${analyticsEvents.createdAt})`);

		return result.map((row) => ({
			date: row.date,
			count: Number(row.count)
		}));
	}
}

// Export singleton instance
export const analyticsEventsRepository = new AnalyticsEventsRepository();
