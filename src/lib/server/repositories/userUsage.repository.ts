import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { userUsage, dailyUsage } from '$lib/server/db/schema';
import type { NewUserUsage, UserUsage, DailyUsage } from '$lib/server/db/types';

export class UserUsageRepository {
	/**
	 * Get current month usage for a user
	 */
	async getCurrentMonthUsage(userId: string): Promise<UserUsage | null> {
		const currentPeriod = this.getCurrentPeriod();

		const result = await db
			.select()
			.from(userUsage)
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, currentPeriod)))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Get usage for a specific period
	 */
	async getUsageForPeriod(userId: string, period: string): Promise<UserUsage | null> {
		const result = await db
			.select()
			.from(userUsage)
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, period)))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Get usage history for a user (last 12 months)
	 */
	async getUsageHistory(userId: string, months: number = 12): Promise<UserUsage[]> {
		const periods = this.getLastNPeriods(months);

		// Use Drizzle's inArray operator for better compatibility
		return await db
			.select()
			.from(userUsage)
			.where(and(eq(userUsage.userId, userId), inArray(userUsage.period, periods)))
			.orderBy(desc(userUsage.period));
	}

	/**
	 * Create or update current month usage
	 */
	async upsertCurrentMonthUsage(
		userId: string,
		updates: Partial<NewUserUsage>
	): Promise<UserUsage> {
		const currentPeriod = this.getCurrentPeriod();

		// Try to get existing record
		const existing = await this.getCurrentMonthUsage(userId);

		if (existing) {
			// Update existing record
			const [updated] = await db
				.update(userUsage)
				.set({
					...updates,
					updatedAt: new Date()
				})
				.where(and(eq(userUsage.userId, userId), eq(userUsage.period, currentPeriod)))
				.returning();

			return updated;
		} else {
			// Create new record
			const [created] = await db
				.insert(userUsage)
				.values({
					userId,
					period: currentPeriod,
					...updates
				})
				.returning();

			return created;
		}
	}

	/**
	 * Increment usage for current month
	 */
	async incrementUsage(
		userId: string,
		updates: {
			conversationsUsed?: number;
			secondsUsed?: number;
			realtimeSessionsUsed?: number;
			ankiExportsUsed?: number;
			sessionExtensionsUsed?: number;
			advancedVoiceSeconds?: number;
			analysesUsed?: number;
			completedSessions?: number;
			longestSessionSeconds?: number;
			averageSessionSeconds?: number;
			overageSeconds?: number;
		}
	): Promise<UserUsage | null> {
		const current = await this.getCurrentMonthUsage(userId);

		if (!current) {
			// Create new record if none exists
			return await this.upsertCurrentMonthUsage(userId, updates);
		}

		// Build the update object dynamically
		const updateData: Partial<UserUsage> = {
			updatedAt: new Date()
		};

		if (updates.conversationsUsed !== undefined) {
			updateData.conversationsUsed = (current.conversationsUsed || 0) + updates.conversationsUsed;
		}
		if (updates.secondsUsed !== undefined) {
			updateData.secondsUsed = (current.secondsUsed || 0) + updates.secondsUsed;
		}
		if (updates.realtimeSessionsUsed !== undefined) {
			updateData.realtimeSessionsUsed =
				(current.realtimeSessionsUsed || 0) + updates.realtimeSessionsUsed;
		}
		if (updates.ankiExportsUsed !== undefined) {
			updateData.ankiExportsUsed = (current.ankiExportsUsed || 0) + updates.ankiExportsUsed;
		}
		if (updates.sessionExtensionsUsed !== undefined) {
			updateData.sessionExtensionsUsed =
				(current.sessionExtensionsUsed || 0) + updates.sessionExtensionsUsed;
		}
		if (updates.advancedVoiceSeconds !== undefined) {
			updateData.advancedVoiceSeconds =
				(current.advancedVoiceSeconds || 0) + updates.advancedVoiceSeconds;
		}
		if (updates.analysesUsed !== undefined) {
			updateData.analysesUsed = (current.analysesUsed || 0) + updates.analysesUsed;
		}
		if (updates.completedSessions !== undefined) {
			updateData.completedSessions = (current.completedSessions || 0) + updates.completedSessions;
		}
		if (updates.longestSessionSeconds !== undefined) {
			updateData.longestSessionSeconds = Math.max(
				current.longestSessionSeconds || 0,
				updates.longestSessionSeconds
			);
		}
		if (updates.averageSessionSeconds !== undefined) {
			updateData.averageSessionSeconds = updates.averageSessionSeconds; // Direct set for average
		}
		if (updates.overageSeconds !== undefined) {
			updateData.overageSeconds = (current.overageSeconds || 0) + updates.overageSeconds;
		}

		// Update existing record
		const [updated] = await db
			.update(userUsage)
			.set(updateData)
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, current.period)))
			.returning();

		return updated || null;
	}

	/**
	 * Update banking information
	 */
	async updateBanking(
		userId: string,
		bankedSeconds: number,
		bankedSecondsUsed: number = 0
	): Promise<UserUsage | null> {
		const current = await this.getCurrentMonthUsage(userId);

		if (!current) {
			// Create new record if none exists
			return await this.upsertCurrentMonthUsage(userId, {
				bankedSeconds,
				bankedSecondsUsed
			});
		}

		// Update existing record
		const [updated] = await db
			.update(userUsage)
			.set({
				bankedSeconds,
				bankedSecondsUsed,
				updatedAt: new Date()
			})
			.where(and(eq(userUsage.userId, userId), eq(userUsage.period, current.period)))
			.returning();

		return updated || null;
	}

	/**
	 * Get usage summary for a user
	 */
	async getUserUsageSummary(userId: string): Promise<{
		currentMonth: UserUsage | null;
		lastMonth: UserUsage | null;
		totalUsage: {
			conversations: number;
			seconds: number;
			realtimeSessions: number;
		};
	}> {
		const lastPeriod = this.getLastPeriod();

		const [currentMonth, lastMonth] = await Promise.all([
			this.getCurrentMonthUsage(userId),
			this.getUsageForPeriod(userId, lastPeriod)
		]);

		// Get total usage across all periods
		const totalUsage = await db
			.select({
				conversations: sql<number>`sum(${userUsage.conversationsUsed})`,
				seconds: sql<number>`sum(${userUsage.secondsUsed})`,
				realtimeSessions: sql<number>`sum(${userUsage.realtimeSessionsUsed})`
			})
			.from(userUsage)
			.where(eq(userUsage.userId, userId));

		return {
			currentMonth,
			lastMonth,
			totalUsage: {
				conversations: Number(totalUsage[0]?.conversations) || 0,
				seconds: Number(totalUsage[0]?.seconds) || 0,
				realtimeSessions: Number(totalUsage[0]?.realtimeSessions) || 0
			}
		};
	}

	/**
	 * Reset monthly usage (for new month)
	 */
	async resetMonthlyUsage(userId: string): Promise<UserUsage | null> {
		const currentPeriod = this.getCurrentPeriod();

		// Check if record already exists for current month
		const existing = await this.getCurrentMonthUsage(userId);
		if (existing) {
			return existing; // Already reset
		}

		// Get last month's usage for banking
		const lastPeriod = this.getLastPeriod();
		const lastMonthUsage = await this.getUsageForPeriod(userId, lastPeriod);

		// Create new month record with banking
		const [created] = await db
			.insert(userUsage)
			.values({
				userId,
				period: currentPeriod,
				conversationsUsed: 0,
				secondsUsed: 0,
				realtimeSessionsUsed: 0,
				bankedSeconds: lastMonthUsage?.bankedSeconds || 0,
				bankedSecondsUsed: 0
			})
			.returning();

		return created || null;
	}

	/**
	 * Get all users with usage in a period
	 */
	async getUsersWithUsageInPeriod(period: string): Promise<UserUsage[]> {
		return await db
			.select()
			.from(userUsage)
			.where(eq(userUsage.period, period))
			.orderBy(desc(userUsage.secondsUsed));
	}

	/**
	 * Daily usage methods for features with daily limits (e.g., free tier analysis)
	 */

	/**
	 * Get daily usage for a user
	 */
	async getDailyUsage(userId: string, date: string): Promise<DailyUsage | null> {
		const result = await db
			.select()
			.from(dailyUsage)
			.where(and(eq(dailyUsage.userId, userId), eq(dailyUsage.date, date)))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Create daily usage record
	 */
	async createDailyUsage(userId: string, date: string): Promise<DailyUsage> {
		const [created] = await db
			.insert(dailyUsage)
			.values({
				userId,
				date,
				analysesUsed: 0,
				conversationsStarted: 0,
				secondsUsed: 0,
				realtimeSecondsUsed: 0,
				advancedFeaturesUsed: 0
			})
			.returning();

		return created;
	}

	/**
	 * Increment daily usage
	 */
	async incrementDailyUsage(
		userId: string,
		date: string,
		updates: {
			analysesUsed?: number;
			conversationsStarted?: number;
			secondsUsed?: number;
			realtimeSecondsUsed?: number;
			advancedFeaturesUsed?: number;
		}
	): Promise<DailyUsage> {
		const current = await this.getDailyUsage(userId, date);

		if (!current) {
			// Create new record first
			await this.createDailyUsage(userId, date);
		}

		// Build the update object dynamically
		const updateData: Partial<DailyUsage> = {
			updatedAt: new Date()
		};

		const existing = current || await this.getDailyUsage(userId, date);

		if (updates.analysesUsed !== undefined) {
			updateData.analysesUsed = (existing?.analysesUsed || 0) + updates.analysesUsed;
		}
		if (updates.conversationsStarted !== undefined) {
			updateData.conversationsStarted = (existing?.conversationsStarted || 0) + updates.conversationsStarted;
		}
		if (updates.secondsUsed !== undefined) {
			updateData.secondsUsed = (existing?.secondsUsed || 0) + updates.secondsUsed;
		}
		if (updates.realtimeSecondsUsed !== undefined) {
			updateData.realtimeSecondsUsed = (existing?.realtimeSecondsUsed || 0) + updates.realtimeSecondsUsed;
		}
		if (updates.advancedFeaturesUsed !== undefined) {
			updateData.advancedFeaturesUsed = (existing?.advancedFeaturesUsed || 0) + updates.advancedFeaturesUsed;
		}

		const [updated] = await db
			.update(dailyUsage)
			.set(updateData)
			.where(and(eq(dailyUsage.userId, userId), eq(dailyUsage.date, date)))
			.returning();

		return updated;
	}

	// Helper methods for period management
	private getCurrentPeriod(): string {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	}

	private getLastPeriod(): string {
		const now = new Date();
		now.setMonth(now.getMonth() - 1);
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	}

	private getLastNPeriods(n: number): string[] {
		const periods: string[] = [];
		const now = new Date();

		for (let i = 0; i < n; i++) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			periods.push(period);
		}

		return periods;
	}
}

// Export singleton instance
export const userUsageRepository = new UserUsageRepository();
