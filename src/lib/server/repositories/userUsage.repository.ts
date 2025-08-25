import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '$lib/server/db/index';
import { userUsage, tiers } from '$lib/server/db/schema';
import type { NewUserUsage, UserUsage } from '$lib/server/db/types';

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

		return await db
			.select()
			.from(userUsage)
			.where(and(eq(userUsage.userId, userId), sql`${userUsage.period} = ANY(${periods})`))
			.orderBy(desc(userUsage.period));
	}

	/**
	 * Create or update current month usage
	 */
	async upsertCurrentMonthUsage(
		userId: string,
		tierId: string,
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
					tierId,
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
			minutesUsed?: number;
			realtimeSessionsUsed?: number;
		}
	): Promise<UserUsage | null> {
		const current = await this.getCurrentMonthUsage(userId);
		if (!current) return null;

		const newValues = {
			conversationsUsed: (current.conversationsUsed || 0) + (updates.conversationsUsed || 0),
			minutesUsed: (current.minutesUsed || 0) + (updates.minutesUsed || 0),
			realtimeSessionsUsed:
				(current.realtimeSessionsUsed || 0) + (updates.realtimeSessionsUsed || 0)
		};

		return await this.upsertCurrentMonthUsage(userId, current.tierId, newValues);
	}

	/**
	 * Process monthly rollover (move unused minutes to next month)
	 */
	async processMonthlyRollover(userId: string): Promise<void> {
		const nextPeriod = this.getNextPeriod();

		// Get current month usage
		const currentUsage = await this.getCurrentMonthUsage(userId);
		if (!currentUsage) return;

		// Get tier info for banking limits
		const tier = await db.select().from(tiers).where(eq(tiers.id, currentUsage.tierId)).limit(1);

		if (!tier[0]?.sessionBankingEnabled) return;

		// Calculate unused minutes
		const monthlyMinutes = currentUsage.monthlyMinutes || 0;
		const usedMinutes = currentUsage.minutesUsed || 0;
		const unusedMinutes = Math.max(0, monthlyMinutes - usedMinutes);

		// Cap at max banked minutes
		const maxBanked = tier[0].maxBankedMinutes || 0;
		const bankedMinutes = Math.min(unusedMinutes, maxBanked);

		if (bankedMinutes > 0) {
			// Create next month's record with banked minutes
			await this.upsertCurrentMonthUsage(userId, currentUsage.tierId, {
				period: nextPeriod,
				bankedMinutes,
				monthlyMinutes: currentUsage.monthlyMinutes,
				maxBankedMinutes: currentUsage.maxBankedMinutes
			});
		}
	}

	/**
	 * Check if user can start a conversation
	 */
	async canStartConversation(
		userId: string,
		estimatedMinutes: number
	): Promise<{ canStart: boolean; remainingMinutes: number; reason?: string }> {
		const usage = await this.getCurrentMonthUsage(userId);
		if (!usage) {
			return { canStart: false, remainingMinutes: 0, reason: 'No usage record found' };
		}

		const monthlyMinutes = usage.monthlyMinutes || 0;
		const usedMinutes = usage.minutesUsed || 0;
		const bankedMinutes = usage.bankedMinutes || 0;
		const usedBankedMinutes = usage.bankedMinutesUsed || 0;

		const availableMinutes = monthlyMinutes - usedMinutes + (bankedMinutes - usedBankedMinutes);
		const canStart = availableMinutes >= estimatedMinutes;

		return {
			canStart,
			remainingMinutes: availableMinutes,
			reason: canStart
				? undefined
				: `Insufficient minutes. Need ${estimatedMinutes}, have ${availableMinutes}`
		};
	}

	/**
	 * Get usage statistics for admin dashboard
	 */
	async getUsageStats(period?: string): Promise<{
		totalUsers: number;
		totalMinutes: number;
		totalConversations: number;
		averageMinutesPerUser: number;
	}> {
		const targetPeriod = period || this.getCurrentPeriod();

		const result = await db
			.select({
				totalUsers: sql<number>`count(distinct ${userUsage.userId})`,
				totalMinutes: sql<number>`coalesce(sum(${userUsage.minutesUsed}), 0)`,
				totalConversations: sql<number>`coalesce(sum(${userUsage.conversationsUsed}), 0)`
			})
			.from(userUsage)
			.where(eq(userUsage.period, targetPeriod));

		const stats = result[0];
		const totalUsers = stats.totalUsers || 0;
		const totalMinutes = stats.totalMinutes || 0;
		const totalConversations = stats.totalConversations || 0;

		return {
			totalUsers,
			totalMinutes,
			totalConversations,
			averageMinutesPerUser: totalUsers > 0 ? Math.round(totalMinutes / totalUsers) : 0
		};
	}

	// Helper methods for period management
	private getCurrentPeriod(): string {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
	}

	private getNextPeriod(): string {
		const now = new Date();
		now.setMonth(now.getMonth() + 1);
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
